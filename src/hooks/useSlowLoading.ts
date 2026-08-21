import { useEffect, useState } from 'react';

/**
 * True once `isLoading` has been continuously true for `delayMs`.
 *
 * archive.org cold starts routinely take 1–4 s; a spinner alone stops being
 * reassuring after about three. Surfaces use this to swap in "Still loading
 * from archive.org…" so a slow stream reads as slow, not broken. Resets the
 * moment loading ends.
 */
export function useSlowLoading(isLoading: boolean, delayMs: number = 3000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return slow;
}
