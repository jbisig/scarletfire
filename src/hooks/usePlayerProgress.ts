import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { PlaybackProgress } from '../types/player.types';

/** Sentinel so the interval-reset effect's dependency array can stay a fixed
 * length while call sites still opt in/out of a given reset trigger (see
 * `resyncOnDragToggle` / `resetKey` below). */
const DISABLED_TRIGGER = '__disabled__';

export interface UsePlayerProgressOptions {
  /** Ref from PlayerContext, mutated on every native progress tick — read, never subscribed to. */
  progressRef: React.MutableRefObject<PlaybackProgress>;
  progressAnim: Animated.Value;
  seekTo: (positionMs: number) => void;
  /** Fallback duration (ms) used until `progressRef.current.duration` reports a real value for the loaded track. */
  trackDurationMs: number;
  /**
   * Gates the 1s display-refresh interval. FullPlayer passes the tray's
   * `visible` prop so the interval doesn't tick while closed; PlayerBar has
   * no such gate and defaults to always-on.
   */
  enabled?: boolean;
  /**
   * Extra condition (checked every tick, alongside drag state) that
   * suppresses the interval's re-sync. FullPlayer uses this for its
   * swipe-to-dismiss gesture (`isInteractingRef`) — unrelated to seeking,
   * but the two gestures share the same progress bar. PlayerBar has none.
   */
  isPaused?: () => boolean;
  /**
   * Re-runs the reset effect (immediate resync + fresh interval) whenever
   * `isDragging` toggles — matches FullPlayer's original effect, which
   * listed `isDragging` in its dependency array. PlayerBar's original
   * effect did not depend on drag state. Default false (PlayerBar).
   */
  resyncOnDragToggle?: boolean;
  /**
   * Re-runs the reset effect whenever this value changes — PlayerBar passes
   * `trackId` so the displayed time jumps to the new track immediately
   * instead of waiting up to 1s for the next tick. FullPlayer's original
   * effect had no such key; passing none here preserves that (see Task 22
   * report for this divergence).
   */
  resetKey?: string | number;
  /**
   * Freezes the duration used for position math at the value seen when the
   * drag started, instead of recomputing on every move/release. Matches
   * PlayerBar's original `handleMouseDown`, which captured `durationMs`
   * once and reused it in `handleMouseMove`/`handleMouseUp`. FullPlayer's
   * original PanResponder handlers each called `getDurationMs()` fresh on
   * every grant/move/release, so it does not set this (default false).
   */
  freezeDurationForDrag?: boolean;
}

export interface UsePlayerProgressResult {
  /** Position (ms) to render — drag position while dragging, else the last synced playback position. */
  displayPosition: number;
  /** Duration (ms) to render — falls back to `trackDurationMs` until the real duration is known. */
  displayDuration: number;
  isDragging: boolean;
  /** Ready-to-use style value: drag percentage while dragging, else the native-driven interpolation. */
  progressWidth: `${number}%` | Animated.AnimatedInterpolation<string>;
  /** Same source as `progressWidth` so the thumb stays in sync with the fill bar. */
  thumbLeft: `${number}%` | Animated.AnimatedInterpolation<string>;
  /**
   * Begin a drag. `origin`/`size` are the bar's on-screen offset and length
   * in whatever coordinate space `x` uses (native: `pageX` + width from
   * `View.measure()`; web: `getBoundingClientRect().left`/`.width`) —
   * measuring stays platform-specific gesture wiring, done by the caller.
   */
  beginDrag: (x: number, origin: number, size: number) => void;
  /** Continue an in-progress drag to `x`. No-op if not currently dragging or `size` is 0 (not yet measured). */
  moveDrag: (x: number, origin: number, size: number) => void;
  /** Commit a drag: seeks to the position at `x`, then releases drag state after a short delay so playback catches up before the display switches back to the live position. `onSettled` fires once that delay elapses (e.g. PlayerBar clears its hover state there). */
  endDrag: (x: number, origin: number, size: number, onSettled?: () => void) => void;
  /** Abort a drag without seeking (e.g. gesture interrupted) — snaps back to the live position immediately. */
  cancelDrag: () => void;
}

/**
 * Shared progress/seek machinery for FullPlayer's progress bar and web
 * PlayerBar's `ProgressRow`. Both had ~150 lines of duplicated logic: a
 * `timeDisplayRef` + 1s interval (only forcing a re-render when position
 * moves by >=1000ms or duration changes), a duration fallback chain, drag
 * position-from-x math, and identical `progressAnim.interpolate` blocks.
 *
 * Deliberately ref-heavy: no per-tick re-renders. The returned drag
 * functions are referentially stable (`useCallback` with refs, not state,
 * as inputs) because FullPlayer wires them into a `PanResponder` created
 * once via `useRef(...).current` — if these functions changed identity,
 * that frozen PanResponder would keep calling stale closures forever.
 */
export function usePlayerProgress({
  progressRef,
  progressAnim,
  seekTo,
  trackDurationMs,
  enabled = true,
  isPaused,
  resyncOnDragToggle = false,
  resetKey,
  freezeDurationForDrag = false,
}: UsePlayerProgressOptions): UsePlayerProgressResult {
  const timeDisplayRef = useRef<PlaybackProgress>({ position: 0, duration: 0 });
  const [, forceTimeUpdate] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const isDraggingRef = useRef(false);
  const dragDurationMsRef = useRef(0);

  // Latest-ref plumbing so the stable callbacks below never read stale values.
  const trackDurationMsRef = useRef(trackDurationMs);
  useEffect(() => {
    trackDurationMsRef.current = trackDurationMs;
  }, [trackDurationMs]);

  const seekToRef = useRef(seekTo);
  useEffect(() => {
    seekToRef.current = seekTo;
  }, [seekTo]);

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Stable — deps never change identity (progressRef is a ref from context).
  const getDurationMs = useCallback(() => {
    const refDuration = progressRef.current.duration;
    return refDuration > 0 ? refDuration : trackDurationMsRef.current;
  }, [progressRef]);

  const calcPosition = useCallback((x: number, origin: number, size: number, durationMs: number): number => {
    if (size === 0) return 0;
    const pct = Math.max(0, Math.min(1, (x - origin) / size));
    return pct * durationMs;
  }, []);

  // Fixed-length dependency array: `dragToggleTrigger`/`resetTrigger` fall back to a
  // stable sentinel when the corresponding option isn't used, so each call site's
  // original re-run cadence is preserved without a conditionally-shaped deps array.
  const dragToggleTrigger = resyncOnDragToggle ? isDragging : DISABLED_TRIGGER;
  const resetTrigger = resetKey ?? DISABLED_TRIGGER;

  useEffect(() => {
    if (!enabled) return;

    // Sync immediately on (re)mount / trigger change.
    timeDisplayRef.current = { ...progressRef.current };
    forceTimeUpdate(n => n + 1);

    const interval = setInterval(() => {
      if (!isDraggingRef.current && !isPausedRef.current?.()) {
        const prev = timeDisplayRef.current;
        const next = progressRef.current;
        // Only force a re-render if position changed by at least 1 second (or duration changed).
        if (Math.abs(next.position - prev.position) >= 1000 || prev.duration !== next.duration) {
          timeDisplayRef.current = { ...next };
          forceTimeUpdate(n => n + 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, progressRef, dragToggleTrigger, resetTrigger]);

  const beginDrag = useCallback((x: number, origin: number, size: number) => {
    const durationMs = getDurationMs();
    dragDurationMsRef.current = durationMs;
    const position = calcPosition(x, origin, size, durationMs);
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragPosition(position);
  }, [getDurationMs, calcPosition]);

  const moveDrag = useCallback((x: number, origin: number, size: number) => {
    if (!isDraggingRef.current || size === 0) return;
    const durationMs = freezeDurationForDrag ? dragDurationMsRef.current : getDurationMs();
    setDragPosition(calcPosition(x, origin, size, durationMs));
  }, [getDurationMs, calcPosition, freezeDurationForDrag]);

  const endDrag = useCallback((x: number, origin: number, size: number, onSettled?: () => void) => {
    if (!isDraggingRef.current || size === 0) return;
    const durationMs = freezeDurationForDrag ? dragDurationMsRef.current : getDurationMs();
    const position = calcPosition(x, origin, size, durationMs);
    setDragPosition(position);
    seekToRef.current(position);
    // Update time display ref immediately after seek so the display doesn't
    // jump when isDragging flips back to false below.
    timeDisplayRef.current = { position, duration: durationMs };
    forceTimeUpdate(n => n + 1);
    setTimeout(() => {
      setIsDragging(false);
      isDraggingRef.current = false;
      onSettled?.();
    }, 200);
  }, [getDurationMs, calcPosition, freezeDurationForDrag]);

  const cancelDrag = useCallback(() => {
    setIsDragging(false);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }, []);

  const timeDisplay = timeDisplayRef.current;
  const displayDuration = timeDisplay.duration > 0 ? timeDisplay.duration : trackDurationMs;
  const displayPosition = isDragging ? dragPosition : timeDisplay.position;
  // Clamped defensively: dragPosition and displayDuration can momentarily come from
  // different duration sources (live progressRef vs. stale timeDisplayRef), so the
  // ratio isn't guaranteed to land in [0, 1] on every render.
  const dragProgress = displayDuration > 0 ? Math.max(0, Math.min(1, dragPosition / displayDuration)) : 0;

  const progressAnimPercent = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const dragPercent: `${number}%` = `${dragProgress * 100}%`;
  const progressWidth = isDragging ? dragPercent : progressAnimPercent;
  const thumbLeft = isDragging ? dragPercent : progressAnimPercent;

  return {
    displayPosition,
    displayDuration,
    isDragging,
    progressWidth,
    thumbLeft,
    beginDrag,
    moveDrag,
    endDrag,
    cancelDrag,
  };
}
