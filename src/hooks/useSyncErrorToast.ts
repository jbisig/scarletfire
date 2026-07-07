import { useCallback, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';

// Rate limit sync error toasts to avoid spamming the user.
export const SYNC_ERROR_TOAST_COOLDOWN_MS = 30000;

/**
 * Returns a stable callback that shows `message` as an error toast, rate
 * limited to at most once per `SYNC_ERROR_TOAST_COOLDOWN_MS`. Shared by
 * contexts that fire the same generic "cloud sync failed, saved locally"
 * message from multiple call sites.
 */
export function useSyncErrorToast(message: string): () => void {
  const { showToast } = useToast();
  const lastShownAtRef = useRef<number>(0);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastShownAtRef.current > SYNC_ERROR_TOAST_COOLDOWN_MS) {
      lastShownAtRef.current = now;
      showToast(message, 'error');
    }
  }, [showToast, message]);
}
