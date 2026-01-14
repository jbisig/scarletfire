import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GratefulDeadShow } from '../types/show.types';

const FAVORITES_STORAGE_KEY = '@grateful_dead_favorites';

interface FavoritesContextType {
  favorites: GratefulDeadShow[];
  isFavorite: (identifier: string) => boolean;
  addFavorite: (show: GratefulDeadShow) => Promise<void>;
  removeFavorite: (identifier: string) => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<GratefulDeadShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by date ascending (oldest first)
        const sorted = parsed.sort((a: GratefulDeadShow, b: GratefulDeadShow) =>
          a.date.localeCompare(b.date)
        );
        setFavorites(sorted);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: GratefulDeadShow[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const isFavorite = useCallback((identifier: string) => {
    return favorites.some(fav => fav.primaryIdentifier === identifier);
  }, [favorites]);

  const addFavorite = async (show: GratefulDeadShow) => {
    const newFavorites = [...favorites, show].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const removeFavorite = async (identifier: string) => {
    const newFavorites = favorites.filter(fav => fav.primaryIdentifier !== identifier);
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
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
