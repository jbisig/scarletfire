import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GratefulDeadShow, Track } from '../types/show.types';
import { useAuth } from './AuthContext';
import { favoritesCloudService } from '../services/favoritesCloudService';
import { getClassicTier } from '../data/classicShowsTiers';
import { STORAGE_KEYS } from '../constants/registry';
import { logger } from '../utils/logger';
import { activityService } from '../services/activityService';
import { useDebouncedSync } from '../hooks/useDebouncedSync';
import { useSyncErrorToast } from '../hooks/useSyncErrorToast';

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

  // Show sync error toast with rate limiting
  const showSyncErrorToast = useSyncErrorToast('Failed to sync favorites to cloud. Changes saved locally.');

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
    loadDeletionLog()
      .catch(error => favoritesLogger.error('Failed to load deletion log:', error))
      .then(() => loadFavorites());
  }, []);

  // Sync favorites from cloud when user logs in.
  // Keyed off `authState.user?.id` (not the `user` object reference) — the
  // auth listener dispatches AUTH_STATE_CHANGED for every Supabase event
  // (token refresh, USER_UPDATED, etc.), each producing a new `user` object
  // with the same id. Keying off the id avoids re-running this sync for
  // those no-op identity changes.
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !isLoading) {
      syncFavoritesFromCloud(authState.user.id);
    }
  }, [authState.isAuthenticated, authState.user?.id, isLoading]);

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

  // O(1) lookup sets — rebuilt when favorites change
  const favoriteShowIds = useMemo(
    () => new Set(favoriteShows.map(fav => fav.primaryIdentifier)),
    [favoriteShows]
  );
  const favoriteSongKeys = useMemo(
    () => new Set(favoriteSongs.map(fav => `${fav.trackId}:${fav.showIdentifier}`)),
    [favoriteSongs]
  );

  const isShowFavorite = useCallback((identifier: string) => {
    return favoriteShowIds.has(identifier);
  }, [favoriteShowIds]);

  const isSongFavorite = useCallback((trackId: string, showIdentifier: string) => {
    return favoriteSongKeys.has(`${trackId}:${showIdentifier}`);
  }, [favoriteSongKeys]);

  // Keep auth state in a ref so callbacks don't need authState as a dependency
  const authStateRef = useRef(authState);
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  // Debounced cloud sync: coalesces rapid favorite/unfavorite actions into a
  // single upsert of the full favorites blob, 30s after the last change.
  // Reads current shows/songs from the refs (kept in sync above) so it
  // always sends the latest state regardless of when it actually fires.
  const performFavoritesSync = useCallback((): Promise<void> | undefined => {
    const auth = authStateRef.current;
    if (!auth.isAuthenticated || !auth.user) return undefined;
    return favoritesCloudService
      .syncFavorites(auth.user.id, favoriteShowsRef.current, favoriteSongsRef.current)
      .catch((error) => {
        favoritesLogger.error('Failed to sync favorites to cloud:', error);
        showSyncErrorToast();
      });
  }, [showSyncErrorToast]);

  const { schedule: scheduleFavoritesSync, flush: flushFavoritesSync } = useDebouncedSync(performFavoritesSync);

  // Flush any pending debounced sync as soon as the user logs out.
  //
  // Race note: AuthContext.logout() calls authService.logout() (which does
  // supabase.auth.signOut(), invalidating the session both locally and on
  // the server) BEFORE dispatching the LOGOUT action. By the time
  // `authState.isAuthenticated` flips to false here, the session is
  // already gone, so favoritesCloudService.syncFavorites()'s own
  // `getSession()` guard will usually make this flush a silent no-op. The
  // same is true for other paths that clear the session before we observe
  // it (cross-tab sign-out, expiry). We flush anyway as best-effort — it's
  // harmless — but this cannot reliably beat token teardown from inside
  // this context. See task-11 report for the full analysis.
  const wasAuthenticatedRef = useRef(authState.isAuthenticated);
  useEffect(() => {
    if (wasAuthenticatedRef.current && !authState.isAuthenticated) {
      flushFavoritesSync();
    }
    wasAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated, flushFavoritesSync]);

  const addFavoriteShow = useCallback(async (show: GratefulDeadShow) => {
    // Add timestamp and enrich with tier data
    const tier = getClassicTier(show.date);
    const enrichedShow = tier ? { ...show, classicTier: tier } : show;
    const showWithTimestamp = { ...enrichedShow, savedAt: Date.now() };

    // Compute the next value from the ref (always the latest committed
    // state — see the ref-sync effect above) BEFORE touching the setter,
    // then set the ref synchronously so back-to-back calls in the same
    // tick see each other's writes. Side effects (storage write + debounced
    // cloud sync) run after, outside of setState entirely — not inside an
    // updater callback, which could double-fire them under StrictMode.
    const newFavorites = [...favoriteShowsRef.current, showWithTimestamp]
      .sort((a, b) => a.date.localeCompare(b.date));
    favoriteShowsRef.current = newFavorites;
    setFavoriteShows(newFavorites);

    saveFavoriteShows(newFavorites);
    scheduleFavoritesSync();

    activityService.emitEvent('favorited_show', 'show', show.primaryIdentifier, {
      date: show.date,
      venue: show.venue,
    }).catch(() => {});
  }, [scheduleFavoritesSync]);

  const removeFavoriteShow = useCallback(async (identifier: string) => {
    // Record deletion for sync conflict resolution
    await recordShowDeletion(identifier);

    const newFavorites = favoriteShowsRef.current.filter(fav => fav.primaryIdentifier !== identifier);
    favoriteShowsRef.current = newFavorites;
    setFavoriteShows(newFavorites);

    saveFavoriteShows(newFavorites);
    scheduleFavoritesSync();
  }, [scheduleFavoritesSync]);

  const addFavoriteSong = useCallback(async (song: FavoriteSong) => {
    // Add timestamp when saving
    const songWithTimestamp = { ...song, savedAt: Date.now() };

    const newFavorites = [...favoriteSongsRef.current, songWithTimestamp].sort((a, b) => {
      const titleCompare = a.trackTitle.localeCompare(b.trackTitle);
      if (titleCompare !== 0) return titleCompare;
      return a.showDate.localeCompare(b.showDate);
    });
    favoriteSongsRef.current = newFavorites;
    setFavoriteSongs(newFavorites);

    saveFavoriteSongs(newFavorites);
    scheduleFavoritesSync();
  }, [scheduleFavoritesSync]);

  const removeFavoriteSong = useCallback(async (trackId: string, showIdentifier: string) => {
    // Record deletion for sync conflict resolution
    await recordSongDeletion(trackId, showIdentifier);

    const newFavorites = favoriteSongsRef.current.filter(
      fav => !(fav.trackId === trackId && fav.showIdentifier === showIdentifier)
    );
    favoriteSongsRef.current = newFavorites;
    setFavoriteSongs(newFavorites);

    saveFavoriteSongs(newFavorites);
    scheduleFavoritesSync();
  }, [scheduleFavoritesSync]);

  const refreshFavorites = useCallback(async () => {
    // Re-sync from cloud if authenticated
    const auth = authStateRef.current;
    if (auth.isAuthenticated && auth.user) {
      await syncFavoritesFromCloud(auth.user.id);
    } else {
      // Just reload from local storage
      await loadFavorites();
    }
  }, []);

  const contextValue = useMemo(() => ({
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
  }), [favoriteShows, favoriteSongs, isShowFavorite, isSongFavorite, addFavoriteShow, removeFavoriteShow, addFavoriteSong, removeFavoriteSong, refreshFavorites, isLoading]);

  return (
    <FavoritesContext.Provider value={contextValue}>
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
