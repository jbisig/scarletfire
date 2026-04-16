// src/hooks/useUsernameAvailability.ts
import { useEffect, useState } from 'react';
import { profileService } from '../services/profileService';

export type UsernameStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'taken' }
  | { state: 'invalid'; message: string };

const DEBOUNCE_MS = 300;

function validate(value: string): string | null {
  if (value.length < 3) return 'Must be at least 3 characters';
  if (value.length > 20) return 'Must be 20 characters or less';
  if (!/^[a-z0-9_-]+$/.test(value)) return 'Use lowercase letters, numbers, _ and -';
  return null;
}

export function useUsernameAvailability(username: string): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>({ state: 'idle' });
  const trimmed = username.trim();

  useEffect(() => {
    if (!trimmed) {
      setStatus({ state: 'idle' });
      return;
    }
    const invalidMessage = validate(trimmed);
    if (invalidMessage) {
      setStatus({ state: 'invalid', message: invalidMessage });
      return;
    }

    setStatus({ state: 'checking' });
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const available = await profileService.checkUsernameAvailable(trimmed);
        if (!cancelled) setStatus({ state: available ? 'available' : 'taken' });
      } catch {
        // Network/transient error — revert to idle so the user can retry by typing.
        if (!cancelled) setStatus({ state: 'idle' });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [trimmed]);

  return status;
}
