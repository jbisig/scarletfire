import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../constants/registry';
import {
  UserStars,
  getUserRatings,
  getUserRatingsVersion,
  replaceUserRatings,
  setShowUserRating,
  resetShowUserRating,
  setPerformanceUserRating,
  resetPerformanceUserRating,
  subscribeUserRatings,
  mergeUserRatings,
  pruneTombstones,
} from '../services/userRatingsStore';
import { ResolvedRating, resolveShowRating, resolvePerformanceRating } from '../services/ratingResolver';
import { userRatingsCloudService } from '../services/userRatingsCloudService';
import { useDebouncedSync } from '../hooks/useDebouncedSync';
import { useSyncErrorToast } from '../hooks/useSyncErrorToast';
import { logger } from '../utils/logger';

const ratingsLogger = logger.create('UserRatings');

interface UserRatingsContextValue {
  setShowRating: (date: string, stars: UserStars) => void;
  resetShowRating: (date: string) => void;
  setPerformanceRating: (songTitle: string, date: string, stars: UserStars, showIdentifier?: string) => void;
  resetPerformanceRating: (songTitle: string, date: string) => void;
}

const UserRatingsContext = createContext<UserRatingsContextValue | null>(null);

/** Re-render subscriber for any store change. Safe outside the provider. */
export function useUserRatingsVersion(): number {
  return useSyncExternalStore(subscribeUserRatings, getUserRatingsVersion, getUserRatingsVersion);
}

export function useResolvedShowRating(date: string | undefined): ResolvedRating | null {
  const version = useUserRatingsVersion();
  return useMemo(
    () => (date ? resolveShowRating(date) : null),
    [date, version]
  );
}

export function useResolvedPerformanceRating(
  songTitle: string | undefined,
  date: string | undefined,
): ResolvedRating | null {
  const version = useUserRatingsVersion();
  return useMemo(
    () => (songTitle && date ? resolvePerformanceRating(songTitle, date) : null),
    [songTitle, date, version]
  );
}

/**
 * Owns persistence + sync for the user ratings store. Mirrors
 * FavoritesContext: local-first AsyncStorage, merge-on-login,
 * debounced cloud push, flush on logout/background.
 */
export function UserRatingsProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const showSyncErrorToast = useSyncErrorToast('Failed to sync ratings to cloud. Changes saved locally.');
  const isLoadedRef = useRef(false);

  const authStateRef = useRef(authState);
  useEffect(() => { authStateRef.current = authState; }, [authState]);

  const performSync = useCallback((): Promise<void> | undefined => {
    const auth = authStateRef.current;
    if (!auth.isAuthenticated || !auth.user) return undefined;
    return userRatingsCloudService
      .syncRatings(auth.user.id, getUserRatings())
      .catch((error) => {
        ratingsLogger.error('Failed to sync user ratings to cloud:', error);
        showSyncErrorToast();
      });
  }, [showSyncErrorToast]);

  const { schedule: scheduleSync, flush: flushSync } = useDebouncedSync(performSync);

  // Resolves once the initial AsyncStorage load below has applied (or
  // failed). The merge-on-login effect awaits this so it never races the
  // mount-time load — if a session is already restored at app launch, both
  // effects fire together, and without this the load could resolve second
  // and clobber the just-merged cloud data with stale local-only state.
  const loadCompleteRef = useRef<Promise<void> | null>(null);

  // Load from AsyncStorage on mount (prune stale tombstones as we load).
  useEffect(() => {
    loadCompleteRef.current = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_RATINGS);
        if (raw) {
          replaceUserRatings(pruneTombstones(JSON.parse(raw)));
        }
      } catch (error) {
        ratingsLogger.error('Failed to load user ratings:', error);
      } finally {
        isLoadedRef.current = true;
      }
    })();
  }, []);

  // Persist every store change locally; schedule a cloud push.
  // (The subscription also fires for replaceUserRatings during load/merge —
  // that's fine: rewriting the same blob is idempotent.)
  useEffect(() => {
    return subscribeUserRatings(() => {
      AsyncStorage.setItem(STORAGE_KEYS.USER_RATINGS, JSON.stringify(getUserRatings()))
        .catch(error => ratingsLogger.error('Failed to save user ratings:', error));
      if (isLoadedRef.current) scheduleSync();
    });
  }, [scheduleSync]);

  // Merge-on-login. Keyed off user id (see FavoritesContext for rationale).
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) return;
    const userId = authState.user.id;
    (async () => {
      try {
        if (loadCompleteRef.current) await loadCompleteRef.current;
        const cloud = await userRatingsCloudService.loadRatings(userId);
        const merged = pruneTombstones(mergeUserRatings(getUserRatings(), cloud));
        replaceUserRatings(merged);
        await userRatingsCloudService.syncRatings(userId, merged);
      } catch (error) {
        ratingsLogger.error('Failed to sync user ratings from cloud:', error);
      }
    })();
  }, [authState.isAuthenticated, authState.user?.id]);

  // Flush pending sync on logout (best-effort; see FavoritesContext race note).
  const wasAuthenticatedRef = useRef(authState.isAuthenticated);
  useEffect(() => {
    if (wasAuthenticatedRef.current && !authState.isAuthenticated) flushSync();
    wasAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated, flushSync]);

  const value = useMemo<UserRatingsContextValue>(() => ({
    setShowRating: setShowUserRating,
    resetShowRating: resetShowUserRating,
    setPerformanceRating: setPerformanceUserRating,
    resetPerformanceRating: resetPerformanceUserRating,
  }), []);

  return (
    <UserRatingsContext.Provider value={value}>
      {children}
    </UserRatingsContext.Provider>
  );
}

export function useUserRatings(): UserRatingsContextValue {
  const ctx = useContext(UserRatingsContext);
  if (!ctx) throw new Error('useUserRatings must be used inside a <UserRatingsProvider>');
  return ctx;
}
