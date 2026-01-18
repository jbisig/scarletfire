import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { playCountsCloudService } from '../services/playCountsCloudService';

const PLAY_COUNTS_STORAGE_KEY = '@grateful_dead_play_counts';

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
}

const PlayCountsContext = createContext<PlayCountsContextType | undefined>(undefined);

export function PlayCountsProvider({ children }: { children: React.ReactNode }) {
  const [playCounts, setPlayCounts] = useState<PlayCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state: authState } = useAuth();

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
      const stored = await AsyncStorage.getItem(PLAY_COUNTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPlayCounts(parsed);
      }
    } catch (error) {
      console.error('Error loading play counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlayCounts = async (counts: PlayCount[]) => {
    try {
      await AsyncStorage.setItem(PLAY_COUNTS_STORAGE_KEY, JSON.stringify(counts));
    } catch (error) {
      console.error('Error saving play counts:', error);
    }
  };

  const syncPlayCountsFromCloud = async (userId: string) => {
    try {
      const cloudCounts = await playCountsCloudService.loadPlayCounts(userId);

      // Merge local + cloud, taking the higher count for each track
      const mergedMap = new Map<string, PlayCount>();

      // Add local counts
      playCounts.forEach(pc => {
        const key = `${pc.trackTitle}:${pc.showIdentifier}`;
        mergedMap.set(key, pc);
      });

      // Merge cloud counts (take higher count)
      cloudCounts.forEach(cloudPc => {
        const key = `${cloudPc.trackTitle}:${cloudPc.showIdentifier}`;
        const localPc = mergedMap.get(key);

        if (!localPc || cloudPc.count > localPc.count) {
          mergedMap.set(key, cloudPc);
        }
      });

      const merged = Array.from(mergedMap.values());
      setPlayCounts(merged);

      // Save merged back to both local and cloud
      await savePlayCounts(merged);
      await playCountsCloudService.syncPlayCounts(userId, merged);
    } catch (error) {
      console.error('Failed to sync play counts from cloud:', error);
    }
  };

  const getPlayCount = useCallback((trackTitle: string, showIdentifier: string): number => {
    const found = playCounts.find(
      pc => pc.trackTitle === trackTitle && pc.showIdentifier === showIdentifier
    );
    return found ? found.count : 0;
  }, [playCounts]);

  const recordTrackPlay = async (trackTitle: string, showIdentifier: string, showDate: string) => {
    const now = Date.now();
    const existingIndex = playCounts.findIndex(
      pc => pc.trackTitle === trackTitle && pc.showIdentifier === showIdentifier
    );

    let newPlayCounts: PlayCount[];

    if (existingIndex >= 0) {
      // Increment existing count
      newPlayCounts = [...playCounts];
      newPlayCounts[existingIndex] = {
        ...newPlayCounts[existingIndex],
        count: newPlayCounts[existingIndex].count + 1,
        lastPlayedAt: now,
      };
    } else {
      // Create new entry
      newPlayCounts = [
        ...playCounts,
        {
          trackTitle,
          showIdentifier,
          showDate,
          count: 1,
          firstPlayedAt: now,
          lastPlayedAt: now,
        },
      ];
    }

    setPlayCounts(newPlayCounts);
    await savePlayCounts(newPlayCounts);

    // Sync to cloud if authenticated
    if (authState.isAuthenticated && authState.user) {
      try {
        await playCountsCloudService.incrementPlayCount(
          authState.user.id,
          trackTitle,
          showIdentifier,
          showDate
        );
      } catch (error) {
        console.error('Failed to sync play count to cloud:', error);
      }
    }
  };

  return (
    <PlayCountsContext.Provider
      value={{
        playCounts,
        getPlayCount,
        recordTrackPlay,
        isLoading,
      }}
    >
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
