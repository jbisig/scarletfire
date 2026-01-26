import { MMKV } from 'react-native-mmkv';

// Cache versioning - increment when data structure changes
const CACHE_VERSION = 1;
const CACHE_KEYS = {
  SHOWS_BY_YEAR: `shows_by_year_v${CACHE_VERSION}`,
  CLASSIC_TIERS: `classic_tiers_v${CACHE_VERSION}`,
  SONG_RATINGS: `song_ratings_v${CACHE_VERSION}`,
  SONG_LIST: `song_list_v${CACHE_VERSION}`,
  CACHE_TIMESTAMP: 'cache_timestamp',
};

// Create MMKV instance
export const storage = new MMKV({
  id: 'grateful-dead-cache',
  encryptionKey: undefined, // No encryption needed for public data
});

// Cache invalidation: 7 days
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const mmkvStorage = {
  // Check if cache is stale
  isCacheStale: (): boolean => {
    const timestamp = storage.getNumber(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return true;
    return Date.now() - timestamp > CACHE_EXPIRY_MS;
  },

  // Update cache timestamp
  updateCacheTimestamp: () => {
    storage.set(CACHE_KEYS.CACHE_TIMESTAMP, Date.now());
  },

  // Generic get/set with JSON parsing
  getJSON: <T>(key: string): T | null => {
    const data = storage.getString(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  setJSON: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  // Clear all cache
  clearCache: () => {
    storage.clearAll();
  },

  KEYS: CACHE_KEYS,
};
