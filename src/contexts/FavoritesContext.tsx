import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GratefulDeadShow, Track } from '../types/show.types';
import { useAuth } from './AuthContext';
import { favoritesCloudService } from '../services/favoritesCloudService';
import { getClassicTier } from '../data/classicShowsTiers';
import { STORAGE_KEYS } from '../constants/registry';
import { logger } from '../utils/logger';

const favoritesLogger = logger.create('Favorites');

export interface FavoriteSong {
  trackId: string;
  trackTitle: string;
  showIdentifier: string;
  showDate: string;
  venue?: string;
  streamUrl: string;
  savedAt?: number; // Unix timestamp when the song was saved
  deletedAt?: number; // Unix timestamp when soft-deleted (for sync conflict resolution)
}

/**
 * Tracks deleted favorites for sync conflict resolution.
 * When a favorite is removed locally, we record the deletion time.
 * During merge, if the deletion happened after the cloud save, honor the deletion.
 */
interface DeletionRecord {
  identifier: string; // show.primaryIdentifier or `${trackId}:${showIdentifier}` for songs
  deletedAt: number;
}

interface DeletionLog {
  shows: DeletionRecord[];
  songs: DeletionRecord[];
}

interface FavoritesContextType {
  favoriteShows: GratefulDeadShow[];
  favoriteSongs: FavoriteSong[];
  isShowFavorite: (identifier: string) => boolean;
  isSongFavorite: (trackId: string, showIdentifier: string) => boolean;
  addFavoriteShow: (show: GratefulDeadShow) => Promise<void>;
  removeFavoriteShow: (identifier: string) => Promise<void>;
  addFavoriteSong: (song: FavoriteSong) => Promise<void>;
  removeFavoriteSong: (trackId: string, showIdentifier: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Keep deletion records for 30 days to handle sync conflicts
const DELETION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteShows, setFavoriteShows] = useState<GratefulDeadShow[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<FavoriteSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state: authState } = useAuth();

  // Track deletions for sync conflict resolution (doesn't need to trigger re-renders)
  const deletionLogRef = useRef<DeletionLog>({ shows: [], songs: [] });

  // Refs to always have latest values for cloud sync (avoids race conditions)
  const favoriteShowsRef = useRef<GratefulDeadShow[]>(favoriteShows);
  const favoriteSongsRef = useRef<FavoriteSong[]>(favoriteSongs);

  // Helper function to enrich shows with classic tier data
  const enrichShowsWithTier = (shows: GratefulDeadShow[]): GratefulDeadShow[] => {
    return shows.map(show => {
      const tier = getClassicTier(show.date);
      return tier ? { ...show, classicTier: tier } : show;
    });
  };

  // Helper to check if a show was deleted locally after a given timestamp
  const wasShowDeletedAfter = (identifier: string, timestamp: number): boolean => {
    const record = deletionLogRef.current.shows.find(r => r.identifier === identifier);
    return record ? record.deletedAt > timestamp : false;
  };

  // Helper to check if a song was deleted locally after a given timestamp
  const wasSongDeletedAfter = (trackId: string, showIdentifier: string, timestamp: number): boolean => {
    const key = `${trackId}:${showIdentifier}`;
    const record = deletionLogRef.current.songs.find(r => r.identifier === key);
    return record ? record.deletedAt > timestamp : false;
  };

  // Record a show deletion
  const recordShowDeletion = async (identifier: string): Promise<void> => {
    const now = Date.now();
    // Remove old records first
    deletionLogRef.current.shows = deletionLogRef.current.shows
      .filter(r => now - r.deletedAt < DELETION_RETENTION_MS);
    // Add new record
    deletionLogRef.current.shows.push({ identifier, deletedAt: now });
    await saveDeletionLog();
  };

  // Record a song deletion
  const recordSongDeletion = async (trackId: string, showIdentifier: string): Promise<void> => {
    const now = Date.now();
    const key = `${trackId}:${showIdentifier}`;
    // Remove old records first
    deletionLogRef.current.songs = deletionLogRef.current.songs
      .filter(r => now - r.deletedAt < DELETION_RETENTION_MS);
    // Add new record
    deletionLogRef.current.songs.push({ identifier: key, deletedAt: now });
    await saveDeletionLog();
  };

  // Persist deletion log
  const saveDeletionLog = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITES_DELETIONS,
        JSON.stringify(deletionLogRef.current)
      );
    } catch (error) {
      favoritesLogger.error('Error saving deletion log:', error);
    }
  };

  // Load deletion log
  const loadDeletionLog = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES_DELETIONS);
      if (stored) {
        const parsed: DeletionLog = JSON.parse(stored);
        const now = Date.now();
        // Clean up old records on load
        deletionLogRef.current = {
          shows: parsed.shows.filter(r => now - r.deletedAt < DELETION_RETENTION_MS),
          songs: parsed.songs.filter(r => now - r.deletedAt < DELETION_RETENTION_MS),
        };
      }
    } catch (error) {
      favoritesLogger.error('Error loading deletion log:', error);
    }
  };

  // Load favorites and deletion log from AsyncStorage on mount
  useEffect(() => {
    loadDeletionLog().then(() => loadFavorites());
  }, []);

  // Sync favorites from cloud when user logs in
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !isLoading) {
      syncFavoritesFromCloud(authState.user.id);
    }
  }, [authState.isAuthenticated, authState.user, isLoading]);

  // Keep refs in sync with state (for race-condition-free cloud sync)
  useEffect(() => {
    favoriteShowsRef.current = favoriteShows;
    favoriteSongsRef.current = favoriteSongs;
  }, [favoriteShows, favoriteSongs]);

  const loadFavorites = async () => {
    try {
      // Migrate legacy favorites to new shows storage
      const legacyFavorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES_LEGACY);
      if (legacyFavorites) {
        const parsed = JSON.parse(legacyFavorites);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES_SHOWS, legacyFavorites);
        await AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES_LEGACY);
        const sorted = parsed.sort((a: GratefulDeadShow, b: GratefulDeadShow) =>
          a.date.localeCompare(b.date)
        );
        const enriched = enrichShowsWithTier(sorted);
        setFavoriteShows(enriched);
      } else {
        // Load shows from new storage
        const storedShows = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES_SHOWS);
        if (storedShows) {
          const parsed = JSON.parse(storedShows);
          const sorted = parsed.sort((a: GratefulDeadShow, b: GratefulDeadShow) =>
            a.date.localeCompare(b.date)
          );
          const enriched = enrichShowsWithTier(sorted);
          setFavoriteShows(enriched);
        }
      }

      // Load songs
      const storedSongs = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES_SONGS);
      if (storedSongs) {
        const parsed = JSON.parse(storedSongs);
        const sorted = parsed.sort((a: FavoriteSong, b: FavoriteSong) => {
          // First sort by track title alphabetically
          const titleCompare = a.trackTitle.localeCompare(b.trackTitle);
          if (titleCompare !== 0) return titleCompare;
          // Then by date ascending (oldest first)
          return a.showDate.localeCompare(b.showDate);
        });
        setFavoriteSongs(sorted);
      }
    } catch (error) {
      favoritesLogger.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavoriteShows = async (newFavorites: GratefulDeadShow[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES_SHOWS, JSON.stringify(newFavorites));
    } catch (error) {
      favoritesLogger.error('Error saving favorite shows:', error);
    }
  };

  const saveFavoriteSongs = async (newFavorites: FavoriteSong[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES_SONGS, JSON.stringify(newFavorites));
    } catch (error) {
      favoritesLogger.error('Error saving favorite songs:', error);
    }
  };

  const syncFavoritesFromCloud = async (userId: string) => {
    try {
      const cloudFavorites = await favoritesCloudService.loadFavorites(userId);

      // Use refs for current local state to avoid race conditions
      const localShows = favoriteShowsRef.current;
      const localSongs = favoriteSongsRef.current;

      // Merge cloud + local shows (deduplicate by identifier)
      // Also check if cloud items were deleted locally after they were saved
      const mergedShows = [
        ...localShows,
        ...cloudFavorites.shows.filter((cloudShow) => {
          // Skip if already exists locally
          if (localShows.some((localShow) => localShow.primaryIdentifier === cloudShow.primaryIdentifier)) {
            return false;
          }
          // Skip if was deleted locally after the cloud save
          const cloudSavedAt = (cloudShow as { savedAt?: number }).savedAt || 0;
          if (wasShowDeletedAfter(cloudShow.primaryIdentifier, cloudSavedAt)) {
            return false;
          }
          return true;
        }),
      ].sort((a, b) => a.date.localeCompare(b.date));

      // Enrich merged shows with classic tier data
      const enrichedShows = enrichShowsWithTier(mergedShows);

      // Merge cloud + local songs (deduplicate by trackId + showIdentifier)
      // Also check if cloud items were deleted locally after they were saved
      const mergedSongs = [
        ...localSongs,
        ...cloudFavorites.songs.filter((cloudSong) => {
          // Skip if already exists locally
          if (localSongs.some(
            (localSong) => localSong.trackId === cloudSong.trackId && localSong.showIdentifier === cloudSong.showIdentifier
          )) {
            return false;
          }
          // Skip if was deleted locally after the cloud save
          const cloudSavedAt = cloudSong.savedAt || 0;
          if (wasSongDeletedAfter(cloudSong.trackId, cloudSong.showIdentifier, cloudSavedAt)) {
            return false;
          }
          return true;
        }),
      ].sort((a, b) => {
        const titleCompare = a.trackTitle.localeCompare(b.trackTitle);
        if (titleCompare !== 0) return titleCompare;
        return a.showDate.localeCompare(b.showDate);
      });

      setFavoriteShows(enrichedShows);
      setFavoriteSongs(mergedSongs);

      // Save merged back to both local and cloud
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES_SHOWS, JSON.stringify(enrichedShows));
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES_SONGS, JSON.stringify(mergedSongs));
      await favoritesCloudService.syncFavorites(userId, enrichedShows, mergedSongs);
    } catch (error) {
      favoritesLogger.error('Failed to sync from cloud:', error);
    }
  };

  const isShowFavorite = useCallback((identifier: string) => {
    return favoriteShows.some(fav => fav.primaryIdentifier === identifier);
  }, [favoriteShows]);

  const isSongFavorite = useCallback((trackId: string, showIdentifier: string) => {
    return favoriteSongs.some(
      fav => fav.trackId === trackId && fav.showIdentifier === showIdentifier
    );
  }, [favoriteSongs]);

  const addFavoriteShow = async (show: GratefulDeadShow) => {
    // Add timestamp and enrich with tier data
    const tier = getClassicTier(show.date);
    const enrichedShow = tier ? { ...show, classicTier: tier } : show;
    const showWithTimestamp = { ...enrichedShow, savedAt: Date.now() };
    const newFavorites = [...favoriteShows, showWithTimestamp].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    setFavoriteShows(newFavorites);
    await saveFavoriteShows(newFavorites);

    // Sync to cloud if authenticated - use ref for songs to avoid race conditions
    if (authState.isAuthenticated && authState.user) {
      favoritesCloudService.syncFavorites(authState.user.id, newFavorites, favoriteSongsRef.current).catch((error) => {
        favoritesLogger.error('Failed to sync favorite show to cloud:', error);
        // Data is saved locally, cloud sync will retry on next change or app restart
      });
    }
  };

  const removeFavoriteShow = async (identifier: string) => {
    // Record deletion for sync conflict resolution
    await recordShowDeletion(identifier);

    const newFavorites = favoriteShows.filter(fav => fav.primaryIdentifier !== identifier);
    setFavoriteShows(newFavorites);
    await saveFavoriteShows(newFavorites);

    // Sync to cloud if authenticated - use ref for songs to avoid race conditions
    if (authState.isAuthenticated && authState.user) {
      favoritesCloudService.syncFavorites(authState.user.id, newFavorites, favoriteSongsRef.current).catch((error) => {
        favoritesLogger.error('Failed to sync favorite show removal to cloud:', error);
      });
    }
  };

  const addFavoriteSong = async (song: FavoriteSong) => {
    // Add timestamp when saving
    const songWithTimestamp = { ...song, savedAt: Date.now() };
    const newFavorites = [...favoriteSongs, songWithTimestamp].sort((a, b) => {
      // First sort by track title alphabetically
      const titleCompare = a.trackTitle.localeCompare(b.trackTitle);
      if (titleCompare !== 0) return titleCompare;
      // Then by date ascending (oldest first)
      return a.showDate.localeCompare(b.showDate);
    });
    setFavoriteSongs(newFavorites);
    await saveFavoriteSongs(newFavorites);

    // Sync to cloud if authenticated - use ref for shows to avoid race conditions
    if (authState.isAuthenticated && authState.user) {
      favoritesCloudService.syncFavorites(authState.user.id, favoriteShowsRef.current, newFavorites).catch((error) => {
        favoritesLogger.error('Failed to sync favorite song to cloud:', error);
      });
    }
  };

  const removeFavoriteSong = async (trackId: string, showIdentifier: string) => {
    // Record deletion for sync conflict resolution
    await recordSongDeletion(trackId, showIdentifier);

    const newFavorites = favoriteSongs.filter(
      fav => !(fav.trackId === trackId && fav.showIdentifier === showIdentifier)
    );
    setFavoriteSongs(newFavorites);
    await saveFavoriteSongs(newFavorites);

    // Sync to cloud if authenticated - use ref for shows to avoid race conditions
    if (authState.isAuthenticated && authState.user) {
      favoritesCloudService.syncFavorites(authState.user.id, favoriteShowsRef.current, newFavorites).catch((error) => {
        favoritesLogger.error('Failed to sync favorite song removal to cloud:', error);
      });
    }
  };

  const refreshFavorites = async () => {
    // Re-sync from cloud if authenticated
    if (authState.isAuthenticated && authState.user) {
      await syncFavoritesFromCloud(authState.user.id);
    } else {
      // Just reload from local storage
      await loadFavorites();
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteShows,
        favoriteSongs,
        isShowFavorite,
        isSongFavorite,
        addFavoriteShow,
        removeFavoriteShow,
        addFavoriteSong,
        removeFavoriteSong,
        refreshFavorites,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
