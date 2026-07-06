import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { playCountsCloudService } from '../services/playCountsCloudService';
import { activityService } from '../services/activityService';
import { STORAGE_KEYS } from '../constants/registry';
import { logger } from '../utils/logger';
import { useDebouncedSync } from '../hooks/useDebouncedSync';
import { useSyncErrorToast } from '../hooks/useSyncErrorToast';

const playCountsLogger = logger.create('PlayCounts');

export interface PlayCount {
  trackTitle: string;      // Song name
  showIdentifier: string;  // Archive.org identifier
  showDate: string;        // YYYY-MM-DD format
  count: number;
  lastPlayedAt: number;    // Unix timestamp
  firstPlayedAt: number;   // Unix timestamp
}

interface PlayCountsContextType {
  playCounts: PlayCount[];
  getPlayCount: (trackTitle: string, showIdentifier: string) => number;
  /**
   * Identity-stable variant of `getPlayCount` — reads the latest counts via a
   * ref instead of closing over `playCountsMap`, so its reference never
   * changes. Use this inside memoized `renderItem`/callback deps for large
   * lists where depending on `getPlayCount` (which gets a new identity on
   * every play, anywhere in the app) would defeat the memoization and force
   * a full list re-render for an unrelated play count change.
   */
  getPlayCountStable: (trackTitle: string, showIdentifier: string) => number;
  recordTrackPlay: (
    trackTitle: string,
    showIdentifier: string,
    showDate: string,
    totalTracks: number,
  ) => Promise<void>;
  isLoading: boolean;
  hasShowBeenPlayed: (showIdentifier: string) => boolean;
  getShowPlayCount: (showIdentifier: string, totalTracks: number) => number;
}

const PlayCountsContext = createContext<PlayCountsContextType | undefined>(undefined);

export function computeShowPlayCount(
  showPlayCounts: PlayCount[],
  totalTracks: number,
): number {
  if (totalTracks === 0 || showPlayCounts.length === 0) return 0;
  const threshold = Math.ceil(totalTracks * 0.5);
  const maxCount = Math.max(...showPlayCounts.map(pc => pc.count));
  for (let n = maxCount; n >= 1; n--) {
    const tracksWithCountN = showPlayCounts.filter(pc => pc.count >= n).length;
    if (tracksWithCountN >= threshold) return n;
  }
  return 0;
}

export function shouldEmitListenedShow(prev: number, next: number): boolean {
  return next > prev;
}

export function PlayCountsProvider({ children }: { children: React.ReactNode }) {
  // Use Map for O(1) lookups and stable callback references
  const [playCountsMap, setPlayCountsMap] = useState<Map<string, PlayCount>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { state: authState } = useAuth();

  // Show sync error toast with rate limiting
  const showSyncErrorToast = useSyncErrorToast('Failed to sync play history to cloud. Data saved locally.');

  // Load play counts from AsyncStorage on mount
  useEffect(() => {
    loadPlayCounts();
  }, []);

  // Sync from cloud when user logs in.
  // Keyed off `authState.user?.id` (not the `user` object reference) — the
  // auth listener dispatches AUTH_STATE_CHANGED for every Supabase event
  // (token refresh, USER_UPDATED, etc.), each producing a new `user` object
  // with the same id. Keying off the id avoids re-running this sync for
  // those no-op identity changes.
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !isLoading) {
      syncPlayCountsFromCloud(authState.user.id);
    }
  }, [authState.isAuthenticated, authState.user?.id, isLoading]);

  const loadPlayCounts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PLAY_COUNTS);
      if (stored) {
        const parsed: PlayCount[] = JSON.parse(stored);
        // Convert array to Map with keys "trackTitle:showIdentifier"
        const map = new Map(parsed.map(pc => [`${pc.trackTitle}:${pc.showIdentifier}`, pc]));
        setPlayCountsMap(map);
      }
    } catch (error) {
      playCountsLogger.error('Error loading play counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlayCounts = async (map: Map<string, PlayCount>) => {
    try {
      // Convert Map to array before saving
      const array = Array.from(map.values());
      await AsyncStorage.setItem(STORAGE_KEYS.PLAY_COUNTS, JSON.stringify(array));
    } catch (error) {
      playCountsLogger.error('Error saving play counts:', error);
    }
  };

  const syncPlayCountsFromCloud = async (userId: string) => {
    try {
      const cloudCounts = await playCountsCloudService.loadPlayCounts(userId);

      // Merge local + cloud, taking the higher count for each track
      const mergedMap = new Map<string, PlayCount>(playCountsMap);

      // Merge cloud counts (take higher count)
      cloudCounts.forEach(cloudPc => {
        const key = `${cloudPc.trackTitle}:${cloudPc.showIdentifier}`;
        const localPc = mergedMap.get(key);

        if (!localPc || cloudPc.count > localPc.count) {
          mergedMap.set(key, cloudPc);
        }
      });

      setPlayCountsMap(mergedMap);

      // Save merged back to both local and cloud
      await savePlayCounts(mergedMap);
      const mergedArray = Array.from(mergedMap.values());
      await playCountsCloudService.syncPlayCounts(userId, mergedArray);
    } catch (error) {
      playCountsLogger.error('Failed to sync play counts from cloud:', error);
    }
  };

  const getPlayCount = useCallback((trackTitle: string, showIdentifier: string): number => {
    const key = `${trackTitle}:${showIdentifier}`;
    return playCountsMap.get(key)?.count || 0;
  }, [playCountsMap]);

  // Ref mirror of playCountsMap so getPlayCountStable can read the latest
  // counts without depending on (and changing identity with) playCountsMap.
  const playCountsMapRef = useRef(playCountsMap);
  useEffect(() => {
    playCountsMapRef.current = playCountsMap;
  }, [playCountsMap]);

  const getPlayCountStable = useCallback((trackTitle: string, showIdentifier: string): number => {
    const key = `${trackTitle}:${showIdentifier}`;
    return playCountsMapRef.current.get(key)?.count || 0;
  }, []);

  // Pre-compute show-level index for O(1) lookups
  // This is recalculated only when playCountsMap changes
  const showPlayCountsIndex = useMemo(() => {
    const index = new Map<string, PlayCount[]>();
    for (const pc of playCountsMap.values()) {
      if (!index.has(pc.showIdentifier)) {
        index.set(pc.showIdentifier, []);
      }
      index.get(pc.showIdentifier)!.push(pc);
    }
    return index;
  }, [playCountsMap]);

  const hasShowBeenPlayed = useCallback((showIdentifier: string): boolean => {
    return showPlayCountsIndex.has(showIdentifier);
  }, [showPlayCountsIndex]);

  const getShowPlayCount = useCallback((showIdentifier: string, totalTracks: number): number => {
    const showPlayCounts = showPlayCountsIndex.get(showIdentifier) ?? [];
    return computeShowPlayCount(showPlayCounts, totalTracks);
  }, [showPlayCountsIndex]);

  // Keep auth state in a ref so recordTrackPlay doesn't need authState as a dependency
  const authStateRef = useRef(authState);
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  // Debounced cloud sync: coalesces rapid plays (any track past 50%) into a
  // single upsert of the full play-counts blob, 30s after the last change.
  // Reads the current map from playCountsMapRef so it always sends the
  // latest state regardless of when it actually fires.
  const performPlayCountsSync = useCallback((): Promise<void> | undefined => {
    const auth = authStateRef.current;
    if (!auth.isAuthenticated || !auth.user) return undefined;
    const playCounts = Array.from(playCountsMapRef.current.values());
    return playCountsCloudService.syncPlayCounts(auth.user.id, playCounts).catch((error) => {
      playCountsLogger.error('Failed to sync play counts to cloud:', error);
      showSyncErrorToast();
    });
  }, [showSyncErrorToast]);

  const { schedule: schedulePlayCountsSync, flush: flushPlayCountsSync } = useDebouncedSync(performPlayCountsSync);

  // Flush any pending debounced sync as soon as the user logs out.
  //
  // Race note: AuthContext.logout() calls authService.logout() (which does
  // supabase.auth.signOut(), invalidating the session both locally and on
  // the server) BEFORE dispatching the LOGOUT action. By the time
  // `authState.isAuthenticated` flips to false here, the session is
  // already gone, so playCountsCloudService.syncPlayCounts()'s own
  // `getSession()` guard will usually make this flush a silent no-op. The
  // same is true for other paths that clear the session before we observe
  // it (cross-tab sign-out, expiry). We flush anyway as best-effort — it's
  // harmless — but this cannot reliably beat token teardown from inside
  // this context. See task-11 report for the full analysis.
  const wasAuthenticatedRef = useRef(authState.isAuthenticated);
  useEffect(() => {
    if (wasAuthenticatedRef.current && !authState.isAuthenticated) {
      flushPlayCountsSync();
    }
    wasAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated, flushPlayCountsSync]);

  const recordTrackPlay = useCallback(async (
    trackTitle: string,
    showIdentifier: string,
    showDate: string,
    totalTracks: number,
  ) => {
    const now = Date.now();
    const key = `${trackTitle}:${showIdentifier}`;

    // Compute the next map from the ref (always the latest committed state)
    // BEFORE touching the setter, then set the ref synchronously so
    // back-to-back calls in the same tick see each other's writes. Side
    // effects (storage write + debounced cloud sync + activity event) run
    // after, outside of setState entirely — not inside an updater callback,
    // which could double-fire them under StrictMode.
    const prev = playCountsMapRef.current;
    const existing = prev.get(key);
    const newMap = new Map(prev);

    if (existing) {
      newMap.set(key, { ...existing, count: existing.count + 1, lastPlayedAt: now });
    } else {
      newMap.set(key, {
        trackTitle, showIdentifier, showDate,
        count: 1, firstPlayedAt: now, lastPlayedAt: now,
      });
    }

    // Compute show-level count BEFORE and AFTER this increment.
    const prevShowCounts = Array.from(prev.values()).filter(pc => pc.showIdentifier === showIdentifier);
    const nextShowCounts = Array.from(newMap.values()).filter(pc => pc.showIdentifier === showIdentifier);
    const prevShowCount = computeShowPlayCount(prevShowCounts, totalTracks);
    const nextShowCount = computeShowPlayCount(nextShowCounts, totalTracks);

    playCountsMapRef.current = newMap;
    setPlayCountsMap(newMap);

    if (shouldEmitListenedShow(prevShowCount, nextShowCount)) {
      activityService.emitEvent('listened_show', 'show', showIdentifier, {
        date: showDate,
      }).catch(() => {});
    }

    savePlayCounts(newMap);
    schedulePlayCountsSync();
  }, [schedulePlayCountsSync]);

  // Memoize array conversion so it only happens when map changes
  const playCountsArray = useMemo(() => Array.from(playCountsMap.values()), [playCountsMap]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    playCounts: playCountsArray,
    getPlayCount,
    getPlayCountStable,
    recordTrackPlay,
    isLoading,
    hasShowBeenPlayed,
    getShowPlayCount,
  }), [playCountsArray, getPlayCount, getPlayCountStable, recordTrackPlay, isLoading, hasShowBeenPlayed, getShowPlayCount]);

  return (
    <PlayCountsContext.Provider value={contextValue}>
      {children}
    </PlayCountsContext.Provider>
  );
}

export function usePlayCounts() {
  const context = useContext(PlayCountsContext);
  if (!context) {
    throw new Error('usePlayCounts must be used within PlayCountsProvider');
  }
  return context;
}
