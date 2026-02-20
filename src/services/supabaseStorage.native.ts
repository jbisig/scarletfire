import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

/**
 * Secure storage adapter for Supabase on native platforms.
 * Uses iOS Keychain / Android Keystore via expo-secure-store
 * to encrypt auth tokens (JWTs, refresh tokens) at rest.
 */
export const supabaseStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.auth.error('Error getting item from secure storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.auth.error('Error setting item in secure storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.auth.error('Error removing item from secure storage:', error);
    }
  },
};
