// Web implementation of mmkvStorage using localStorage

// Cache versioning - must match native version
const CACHE_VERSION = 1;
const CACHE_KEYS = {
  SHOWS_BY_YEAR: `shows_by_year_v${CACHE_VERSION}`,
  CLASSIC_TIERS: `classic_tiers_v${CACHE_VERSION}`,
  SONG_RATINGS: `song_ratings_v${CACHE_VERSION}`,
  SONG_LIST: `song_list_v${CACHE_VERSION}`,
  CACHE_TIMESTAMP: 'cache_timestamp',
};

const PREFIX = 'gd_cache_';

export const storage = {
  getString: (key: string): string | undefined => {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value ?? undefined;
    } catch {
      return undefined;
    }
  },
  getNumber: (key: string): number | undefined => {
    try {
      const value = localStorage.getItem(PREFIX + key);
      if (value === null) return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    } catch {
      return undefined;
    }
  },
  getBoolean: (key: string): boolean | undefined => {
    try {
      const value = localStorage.getItem(PREFIX + key);
      if (value === null) return undefined;
      return value === 'true';
    } catch {
      return undefined;
    }
  },
  set: (key: string, value: string | number | boolean): void => {
    try {
      localStorage.setItem(PREFIX + key, String(value));
    } catch {
      // localStorage may be full or disabled
    }
  },
  delete: (key: string): void => {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // Ignore
    }
  },
  clearAll: (): void => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
      // Ignore
    }
  },
  contains: (key: string): boolean => {
    try {
      return localStorage.getItem(PREFIX + key) !== null;
    } catch {
      return false;
    }
  },
  getAllKeys: (): string[] => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) {
          keys.push(key.slice(PREFIX.length));
        }
      }
      return keys;
    } catch {
      return [];
    }
  },
};

// Cache invalidation: 7 days
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const mmkvStorage = {
  isCacheStale: (): boolean => {
    const timestamp = storage.getNumber(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return true;
    return Date.now() - timestamp > CACHE_EXPIRY_MS;
  },

  updateCacheTimestamp: () => {
    storage.set(CACHE_KEYS.CACHE_TIMESTAMP, Date.now());
  },

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

  clearCache: () => {
    storage.clearAll();
  },

  KEYS: CACHE_KEYS,
};
