/**
 * Centralized constants registry
 *
 * All magic strings (storage keys, cache keys, etc.) should be defined here
 * for type safety and easy maintenance.
 */

/**
 * AsyncStorage keys for persisting local data
 */
export const STORAGE_KEYS = {
  /** User play counts for tracks */
  PLAY_COUNTS: '@grateful_dead_play_counts',
  /** Favorite shows */
  FAVORITES_SHOWS: '@grateful_dead_favorites_shows',
  /** Favorite songs */
  FAVORITES_SONGS: '@grateful_dead_favorites_songs',
  /** Legacy favorites (pre-split, for migration) */
  FAVORITES_LEGACY: '@grateful_dead_favorites',
  /** Whether user skipped auth/login */
  AUTH_SKIPPED: '@auth_skipped',
} as const;

/**
 * Cache keys for in-memory caching
 */
export const CACHE_KEYS = {
  /** Cached show details */
  SHOW_DETAILS: 'showDetails',
  /** Cached similarity calculations */
  SIMILARITY: 'similarity',
  /** Prefetched radio tracks */
  RADIO_PREFETCH: 'radioPrefetch',
} as const;

/**
 * Supabase table names
 */
export const SUPABASE_TABLES = {
  FAVORITES: 'favorites',
  PLAY_COUNTS: 'play_counts',
  PROFILES: 'profiles',
} as const;

// Type exports for consumers who need the key types
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];
export type SupabaseTable = typeof SUPABASE_TABLES[keyof typeof SUPABASE_TABLES];
