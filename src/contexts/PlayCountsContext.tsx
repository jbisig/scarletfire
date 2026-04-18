import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { playCountsCloudService } from '../services/playCountsCloudService';
import { activityService } from '../services/activityService';
import { STORAGE_KEYS } from '../constants/registry';
import { logger } from '../utils/logger';

const playCountsLogger = logger.create('PlayCounts');

// Rate limit sync error toasts to avoid spamming user
const SYNC_ERROR_TOAST_COOLDOWN = 30000; // 30 seconds

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

/**
 * Returns the set of show IDs that are in `next` but not in `prev`.
 * These are shows that just crossed the "listened" threshold during this render.
 */
export function diffNewlyListenedShows(
  prev: ReadonlySet<string>,
  next: ReadonlySet<string>,
): string[] {
  const newly: string[] = [];
  for (const id of next) {
    if (!prev.has(id)) newly.push(id);
  }
  return newly;
}

export function PlayCountsProvider({ children }: { children: React.ReactNode }) {
  // Use Map for O(1) lookups and stable callback references
  const [playCountsMap, setPlayCountsMap] = useState<Map<string, PlayCount>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { state: authState } = useAuth();
  const { showToast } = useToast();
  const lastSyncErrorToastRef = useRef<number>(0);

  // Show sync error toast with rate limiting
  const showSyncErrorToast = useCallback(() => {
    const now = Date.now();
    if (now - lastSyncErrorToastRef.current > SYNC_ERROR_TOAST_COOLDOWN) {
      lastSyncErrorToastRef.current = now;
      showToast('Failed to sync play history to cloud. Data saved locally.', 'error');
    }
  }, [showToast]);

  // Load play counts from AsyncStorage on mount
  useEffect(() => {
    loadPlayCounts();
  }, []);

  // Sync from cloud when user logs in
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !isLoading) {
      syncPlayCountsFromCloud(authState.user.id);
    }
  }, [authState.isAuthenticated, authState.user, isLoading]);

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

      // Re-arm the listened-show seed so the post-merge set is treated as the
      // new baseline, not as a delta to emit for historical shows.
      hasInitializedListenedRef.current = false;
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

  // Set of show IDs whose computeShowPlayCount is >= 1, using observed track
  // count as the totalTracks denominator (best available approximation).
  const listenedShowIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    for (const [showId, counts] of showPlayCountsIndex.entries()) {
      const observedTracks = counts.length;
      if (computeShowPlayCount(counts, observedTracks) >= 1) {
        ids.add(showId);
      }
    }
    return ids;
  }, [showPlayCountsIndex]);

  const prevListenedShowIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedListenedRef = useRef(false);

  useEffect(() => {
    // Guard against the initial cold-start cascade: the first time we observe
    // listenedShowIds after the context finishes loading, seed the ref with the
    // initial set rather than emitting for every historical listened show.
    if (!hasInitializedListenedRef.current) {
      if (!isLoading) {
        prevListenedShowIdsRef.current = listenedShowIds;
        hasInitializedListenedRef.current = true;
      }
      return;
    }

    const newlyListened = diffNewlyListenedShows(prevListenedShowIdsRef.current, listenedShowIds);
    if (newlyListened.length > 0) {
      for (const showId of newlyListened) {
        const counts = showPlayCountsIndex.get(showId);
        const showDate = counts && counts.length > 0 ? counts[0].showDate : undefined;
        activityService.emitEvent('listened_show', 'show', showId, {
          ...(showDate ? { date: showDate } : {}),
        }).catch(() => {});
      }
    }
    prevListenedShowIdsRef.current = listenedShowIds;
  }, [listenedShowIds, isLoading]);

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

  const recordTrackPlay = useCallback(async (
    trackTitle: string,
    showIdentifier: string,
    showDate: string,
    totalTracks: number,
  ) => {
    const now = Date.now();
    const key = `${trackTitle}:${showIdentifier}`;

    setPlayCountsMap(prev => {
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

      savePlayCounts(newMap);

      const auth = authStateRef.current;
      if (auth.isAuthenticated && auth.user) {
        const playCounts = Array.from(newMap.values());
        playCountsCloudService.syncPlayCounts(auth.user.id, playCounts).catch((error) => {
          playCountsLogger.error('Failed to sync play counts to cloud:', error);
          showSyncErrorToast();
        });
      }

      return newMap;
    });
  }, [showSyncErrorToast]);

  // Memoize array conversion so it only happens when map changes
  const playCountsArray = useMemo(() => Array.from(playCountsMap.values()), [playCountsMap]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    playCounts: playCountsArray,
    getPlayCount,
    recordTrackPlay,
    isLoading,
    hasShowBeenPlayed,
    getShowPlayCount,
  }), [playCountsArray, getPlayCount, recordTrackPlay, isLoading, hasShowBeenPlayed, getShowPlayCount]);

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
