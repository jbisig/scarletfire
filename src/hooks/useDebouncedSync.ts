import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const DEFAULT_SYNC_DEBOUNCE_MS = 30000;

export interface DebouncedSync {
  /** Reset the trailing timer; fires `syncFn` once `delayMs` after the last call. */
  schedule: () => void;
  /** Fire `syncFn` immediately and cancel any pending timer. No-op if nothing is pending. */
  flush: () => void;
}

/**
 * Coalesces frequent calls to `schedule()` into a single trailing-edge
 * invocation of `syncFn`, `delayMs` after the last call (default 30s).
 *
 * Beyond the trailing debounce, a pending sync is also flushed immediately:
 *  - when the app backgrounds or becomes inactive (AppState), and
 *  - when the component using this hook unmounts.
 *
 * `syncFn` is read from a ref on every fire, so `schedule`/`flush` keep a
 * stable identity across renders while always invoking the latest closure
 * (avoids stale-closure bugs without forcing callers to memoize `syncFn`).
 */
export function useDebouncedSync(
  syncFn: () => void | Promise<void>,
  delayMs: number = DEFAULT_SYNC_DEBOUNCE_MS,
): DebouncedSync {
  const syncFnRef = useRef(syncFn);
  useEffect(() => {
    syncFnRef.current = syncFn;
  }, [syncFn]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runSync = useCallback(() => {
    pendingRef.current = false;
    clearPendingTimer();
    // Wrap in Promise.resolve so both sync and async syncFns are handled
    // uniformly; errors are expected to be caught inside syncFn itself
    // (e.g. to surface a rate-limited toast), this is just a safety net
    // against unhandled rejections.
    Promise.resolve(syncFnRef.current()).catch(() => {});
  }, [clearPendingTimer]);

  const flush = useCallback(() => {
    if (pendingRef.current) {
      runSync();
    }
  }, [runSync]);

  const schedule = useCallback(() => {
    pendingRef.current = true;
    clearPendingTimer();
    timerRef.current = setTimeout(runSync, delayMs);
  }, [clearPendingTimer, delayMs, runSync]);

  // Flush immediately when the app goes to background/inactive so pending
  // changes aren't lost if the process gets suspended or killed.
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        flush();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [flush]);

  // Flush any pending sync on unmount so nothing is silently dropped.
  useEffect(() => {
    return () => {
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { schedule, flush };
}
