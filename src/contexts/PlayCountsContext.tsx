import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { playCountsCloudService } from '../services/playCountsCloudService';
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
  recordTrackPlay: (trackTitle: string, showIdentifier: string, showDate: string) => Promise<void>;
  isLoading: boolean;
  hasShowBeenPlayed: (showIdentifier: string) => boolean;
  getShowPlayCount: (showIdentifier: string, totalTracks: number) => number;
}

const PlayCountsContext = createContext<PlayCountsContextType | undefined>(undefined);

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

  const hasShowBeenPlayed = useCallback((showIdentifier: string): boolean => {
    return showPlayCountsIndex.has(showIdentifier);
  }, [showPlayCountsIndex]);

  const getShowPlayCount = useCallback((showIdentifier: string, totalTracks: number): number => {
    if (totalTracks === 0) return 0;

    // Use pre-computed index for O(1) lookup
    const showPlayCounts = showPlayCountsIndex.get(showIdentifier);
    if (!showPlayCounts || showPlayCounts.length === 0) return 0;

    // Calculate threshold (50% of tracks)
    const threshold = Math.ceil(totalTracks * 0.5);

    // Find maximum N where at least 50% of tracks have count >= N
    let maxPlayCount = 0;
    const maxCount = Math.max(...showPlayCounts.map(pc => pc.count));

    for (let n = maxCount; n >= 1; n--) {
      const tracksWithCountN = showPlayCounts.filter(pc => pc.count >= n).length;
      if (tracksWithCountN >= threshold) {
        maxPlayCount = n;
        break;
      }
    }

    return maxPlayCount;
  }, [showPlayCountsIndex]);

  // Keep auth state in a ref so recordTrackPlay doesn't need authState as a dependency
  const authStateRef = useRef(authState);
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  const recordTrackPlay = useCallback(async (trackTitle: string, showIdentifier: string, showDate: string) => {
    const now = Date.now();
    const key = `${trackTitle}:${showIdentifier}`;

    setPlayCountsMap(prev => {
      const existing = prev.get(key);
      const newMap = new Map(prev);

      if (existing) {
        newMap.set(key, {
          ...existing,
          count: existing.count + 1,
          lastPlayedAt: now,
        });
      } else {
        newMap.set(key, {
          trackTitle,
          showIdentifier,
          showDate,
          count: 1,
          firstPlayedAt: now,
          lastPlayedAt: now,
        });
      }

      savePlayCounts(newMap);

      // Sync to cloud if authenticated
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
