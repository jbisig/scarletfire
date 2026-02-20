// Type for MMKV instance
interface MMKVInstance {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  set(key: string, value: string | number | boolean): void;
  delete(key: string): void;
  clearAll(): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
}

// Type for MMKV constructor
type MMKVConstructor = new (options: { id: string; encryptionKey?: string }) => MMKVInstance;

// Lazy MMKV import and instance to avoid loading native module before it's ready
let _MMKV: MMKVConstructor | null = null;
let _storage: MMKVInstance | null = null;

function getMMKV(): MMKVConstructor {
  if (!_MMKV) {
    _MMKV = require('react-native-mmkv').MMKV;
  }
  return _MMKV!;
}

// Cache versioning - increment when data structure changes
const CACHE_VERSION = 1;
const CACHE_KEYS = {
  SHOWS_BY_YEAR: `shows_by_year_v${CACHE_VERSION}`,
  CLASSIC_TIERS: `classic_tiers_v${CACHE_VERSION}`,
  SONG_RATINGS: `song_ratings_v${CACHE_VERSION}`,
  SONG_LIST: `song_list_v${CACHE_VERSION}`,
  CACHE_TIMESTAMP: 'cache_timestamp',
};

// Lazy MMKV instance getter
function getStorage() {
  if (!_storage) {
    const MMKVClass = getMMKV();
    _storage = new MMKVClass({
      id: 'grateful-dead-cache',
      encryptionKey: undefined, // No encryption needed for public data
    });
  }
  return _storage;
}

// Export storage as a getter for backwards compatibility
export const storage = {
  getString: (key: string) => getStorage().getString(key),
  getNumber: (key: string) => getStorage().getNumber(key),
  getBoolean: (key: string) => getStorage().getBoolean(key),
  set: (key: string, value: string | number | boolean) => getStorage().set(key, value),
  delete: (key: string) => getStorage().delete(key),
  clearAll: () => getStorage().clearAll(),
  contains: (key: string) => getStorage().contains(key),
  getAllKeys: () => getStorage().getAllKeys(),
};

import { CACHE_EXPIRY_MS } from '../constants/registry';

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
