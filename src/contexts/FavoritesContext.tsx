import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GratefulDeadShow, Track } from '../types/show.types';
import { useAuth } from './AuthContext';
import { favoritesCloudService } from '../services/favoritesCloudService';
import { getClassicTier } from '../data/classicShowsTiers';

const FAVORITES_SHOWS_STORAGE_KEY = '@grateful_dead_favorites_shows';
const FAVORITES_SONGS_STORAGE_KEY = '@grateful_dead_favorites_songs';
const LEGACY_FAVORITES_STORAGE_KEY = '@grateful_dead_favorites'; // For migration

export interface FavoriteSong {
  trackId: string;
  trackTitle: string;
  showIdentifier: string;
  showDate: string;
  venue?: string;
  streamUrl: string;
  savedAt?: number; // Unix timestamp when the song was saved
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
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteShows, setFavoriteShows] = useState<GratefulDeadShow[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<FavoriteSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state: authState } = useAuth();

  // Helper function to enrich shows with classic tier data
  const enrichShowsWithTier = (shows: GratefulDeadShow[]): GratefulDeadShow[] => {
    return shows.map(show => {
      const tier = getClassicTier(show.date);
      return tier ? { ...show, classicTier: tier } : show;
    });
  };

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  // Sync favorites from cloud when user logs in
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !isLoading) {
      syncFavoritesFromCloud(authState.user.id);
    }
  }, [authState.isAuthenticated, authState.user, isLoading]);

  const loadFavorites = async () => {
    try {
      // Migrate legacy favorites to new shows storage
      const legacyFavorites = await AsyncStorage.getItem(LEGACY_FAVORITES_STORAGE_KEY);
      if (legacyFavorites) {
        const parsed = JSON.parse(legacyFavorites);
        await AsyncStorage.setItem(FAVORITES_SHOWS_STORAGE_KEY, legacyFavorites);
        await AsyncStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
        const sorted = parsed.sort((a: GratefulDeadShow, b: GratefulDeadShow) =>
          a.date.localeCompare(b.date)
        );
        const enriched = enrichShowsWithTier(sorted);
        setFavoriteShows(enriched);
      } else {
        // Load shows from new storage
        const storedShows = await AsyncStorage.getItem(FAVORITES_SHOWS_STORAGE_KEY);
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
      const storedSongs = await AsyncStorage.getItem(FAVORITES_SONGS_STORAGE_KEY);
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
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavoriteShows = async (newFavorites: GratefulDeadShow[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_SHOWS_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorite shows:', error);
    }
  };

  const saveFavoriteSongs = async (newFavorites: FavoriteSong[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_SONGS_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorite songs:', error);
    }
  };

  const syncFavoritesFromCloud = async (userId: string) => {
    try {
      const cloudFavorites = await favoritesCloudService.loadFavorites(userId);

      // Merge cloud + local shows (deduplicate by identifier)
      const mergedShows = [
        ...favoriteShows,
        ...cloudFavorites.shows.filter(
          (cloudShow) => !favoriteShows.some((localShow) => localShow.primaryIdentifier === cloudShow.primaryIdentifier)
        ),
      ].sort((a, b) => a.date.localeCompare(b.date));

      // Enrich merged shows with classic tier data
      const enrichedShows = enrichShowsWithTier(mergedShows);

      // Merge cloud + local songs (deduplicate by trackId + showIdentifier)
      const mergedSongs = [
        ...favoriteSongs,
        ...cloudFavorites.songs.filter(
          (cloudSong) => !favoriteSongs.some(
            (localSong) => localSong.trackId === cloudSong.trackId && localSong.showIdentifier === cloudSong.showIdentifier
          )
        ),
      ].sort((a, b) => {
        const titleCompare = a.trackTitle.localeCompare(b.trackTitle);
        if (titleCompare !== 0) return titleCompare;
        return a.showDate.localeCompare(b.showDate);
      });

      setFavoriteShows(enrichedShows);
      setFavoriteSongs(mergedSongs);

      // Save merged back to both local and cloud
      await AsyncStorage.setItem(FAVORITES_SHOWS_STORAGE_KEY, JSON.stringify(enrichedShows));
      await AsyncStorage.setItem(FAVORITES_SONGS_STORAGE_KEY, JSON.stringify(mergedSongs));
      await favoritesCloudService.syncFavorites(userId, enrichedShows, mergedSongs);
    } catch (error) {
      console.error('Failed to sync from cloud:', error);
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

    // Sync to cloud if authenticated - pass the already-updated list directly
    if (authState.isAuthenticated && authState.user) {
      favoritesCloudService.syncFavorites(authState.user.id, newFavorites, favoriteSongs).catch((error) => {
        console.error('Failed to sync favorite show to cloud:', error);
        // Data is saved locally, cloud sync will retry on next change or app restart
      });
    }
  };

  const removeFavoriteShow = async (identifier: string) => {
    const newFavorites = favoriteShows.filter(fav => fav.primaryIdentifier !== identifier);
    setFavoriteShows(newFavorites);
    await saveFavoriteShows(newFavorites);

    // Sync to cloud if authenticated - pass the already-updated list directly
    if (authState.isAuthenticated && authState.user) {
      favoritesCloudService.syncFavorites(authState.user.id, newFavorites, favoriteSongs).catch((error) => {
        console.error('Failed to sync favorite show removal to cloud:', error);
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

    // Sync to cloud if authenticated - pass the already-updated list directly
    if (authState.isAuthenticated && authState.user) {
      favoritesCloudService.syncFavorites(authState.user.id, favoriteShows, newFavorites).catch((error) => {
        console.error('Failed to sync favorite song to cloud:', error);
      });
    }
  };

  const removeFavoriteSong = async (trackId: string, showIdentifier: string) => {
    const newFavorites = favoriteSongs.filter(
      fav => !(fav.trackId === trackId && fav.showIdentifier === showIdentifier)
    );
    setFavoriteSongs(newFavorites);
    await saveFavoriteSongs(newFavorites);

    // Sync to cloud if authenticated - pass the already-updated list directly
    if (authState.isAuthenticated && authState.user) {
      favoritesCloudService.syncFavorites(authState.user.id, favoriteShows, newFavorites).catch((error) => {
        console.error('Failed to sync favorite song removal to cloud:', error);
      });
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
