import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GratefulDeadShow, Track } from '../types/show.types';

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

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

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
        setFavoriteShows(sorted);
      } else {
        // Load shows from new storage
        const storedShows = await AsyncStorage.getItem(FAVORITES_SHOWS_STORAGE_KEY);
        if (storedShows) {
          const parsed = JSON.parse(storedShows);
          const sorted = parsed.sort((a: GratefulDeadShow, b: GratefulDeadShow) =>
            a.date.localeCompare(b.date)
          );
          setFavoriteShows(sorted);
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

  const isShowFavorite = useCallback((identifier: string) => {
    return favoriteShows.some(fav => fav.primaryIdentifier === identifier);
  }, [favoriteShows]);

  const isSongFavorite = useCallback((trackId: string, showIdentifier: string) => {
    return favoriteSongs.some(
      fav => fav.trackId === trackId && fav.showIdentifier === showIdentifier
    );
  }, [favoriteSongs]);

  const addFavoriteShow = async (show: GratefulDeadShow) => {
    const newFavorites = [...favoriteShows, show].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    setFavoriteShows(newFavorites);
    await saveFavoriteShows(newFavorites);
  };

  const removeFavoriteShow = async (identifier: string) => {
    const newFavorites = favoriteShows.filter(fav => fav.primaryIdentifier !== identifier);
    setFavoriteShows(newFavorites);
    await saveFavoriteShows(newFavorites);
  };

  const addFavoriteSong = async (song: FavoriteSong) => {
    const newFavorites = [...favoriteSongs, song].sort((a, b) => {
      // First sort by track title alphabetically
      const titleCompare = a.trackTitle.localeCompare(b.trackTitle);
      if (titleCompare !== 0) return titleCompare;
      // Then by date ascending (oldest first)
      return a.showDate.localeCompare(b.showDate);
    });
    setFavoriteSongs(newFavorites);
    await saveFavoriteSongs(newFavorites);
  };

  const removeFavoriteSong = async (trackId: string, showIdentifier: string) => {
    const newFavorites = favoriteSongs.filter(
      fav => !(fav.trackId === trackId && fav.showIdentifier === showIdentifier)
    );
    setFavoriteSongs(newFavorites);
    await saveFavoriteSongs(newFavorites);
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
