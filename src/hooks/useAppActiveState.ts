import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

/**
 * Tracks whether the app is in the foreground so video backgrounds can pause
 * while backgrounded (saves battery). Native only — web has no `AppState`
 * concept, so it's pinned to `'active'` there.
 *
 * Shared by FullPlayer, MiniPlayer, and DiscoverLandingScreen, which each
 * had an identical `useState` + `AppState.addEventListener` trio.
 */
export function useAppActiveState(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(
    Platform.OS !== 'web' ? AppState.currentState : 'active'
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  return appState;
}
