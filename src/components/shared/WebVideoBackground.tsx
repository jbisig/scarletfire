import React, { useCallback, useRef } from 'react';

interface WebVideoBackgroundProps {
  /** Resolved HTML5 video src URL (see src/utils/resolveVideoUri.ts). */
  uri: string;
  /** Identifies the current video source; used as the React key so the element remounts on change. */
  videoId: string;
  onError?: () => void;
  /** Defaults to 0.5 — all web video surfaces (header, SOTD card, player bar, full/mini player) play at half speed. */
  playbackRate?: number;
  style?: React.CSSProperties;
}

const DEFAULT_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

/**
 * HTML5 `<video>` background shared by every web-only video surface (desktop header,
 * show-of-the-day card, player bar, full player, mini player). Rendered via
 * `React.createElement` for React Native Web compatibility — call sites must guard
 * with `Platform.OS === 'web'` before rendering this.
 */
export function WebVideoBackground({ uri, videoId, onError, playbackRate = 0.5, style }: WebVideoBackgroundProps) {
  // Tracks the pending 5s readyState-check timeout so it can be cleared not
  // just on `onloadeddata`, but also if the ref callback runs again with
  // `null` (unmount, or remount via the `key` change below) before the
  // video ever loads — otherwise the timeout fires after teardown and can
  // call `onError` for a video element that's already gone.
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = () => {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  };

  const refCallback = useCallback((el: HTMLVideoElement | null) => {
    clearPendingTimeout();
    if (!el) return;
    el.playbackRate = playbackRate;
    if (onError) {
      el.onerror = () => onError();
      pendingTimeoutRef.current = setTimeout(() => { if (el.readyState === 0) onError(); }, 5000);
      el.onloadeddata = () => clearPendingTimeout();
    }
  }, [onError, playbackRate]);

  return React.createElement('video', {
    key: `video-${videoId}`,
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    ref: refCallback,
    style: style ?? DEFAULT_STYLE,
  });
}
