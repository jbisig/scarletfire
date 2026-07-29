/**
 * Module-level store for user rating overrides.
 *
 * Deliberately NOT a React context: radioService and Show of the Day
 * selection read it synchronously outside the tree. UserRatingsContext
 * (src/contexts/UserRatingsContext.tsx) wraps this store to add
 * AsyncStorage persistence and Supabase sync, and React components
 * subscribe via useSyncExternalStore on the version counter.
 *
 * Entry semantics: an entry is ACTIVE unless `deletedAt >= ratedAt`
 * (tombstone). Tombstones are kept so a reset made offline wins over a
 * stale cloud rating during merge, then pruned after 30 days.
 */
import { normalizeSongTitleForLookup } from '../data/songPerformanceRatings';

export type UserStars = 0 | 1 | 2 | 3;

export interface UserRatingEntry {
  stars: UserStars;
  ratedAt: number;
  deletedAt?: number;
  songTitle?: string;
  showIdentifier?: string;
}

export interface UserRatings {
  shows: Record<string, UserRatingEntry>;
  performances: Record<string, UserRatingEntry>;
}

export const EMPTY_USER_RATINGS: UserRatings = { shows: {}, performances: {} };

const TOMBSTONE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

let ratings: UserRatings = { shows: {}, performances: {} };
let version = 0;
const listeners = new Set<() => void>();

function notify(): void {
  version++;
  listeners.forEach(l => l());
}

function dateOnly(date: string): string {
  return date.split('T')[0];
}

export function performanceRatingKey(songTitle: string, date: string): string {
  return `${normalizeSongTitleForLookup(songTitle)}|${dateOnly(date)}`;
}

export function getUserRatings(): UserRatings {
  return ratings;
}

export function getUserRatingsVersion(): number {
  return version;
}

export function replaceUserRatings(next: UserRatings): void {
  ratings = next;
  notify();
}

function isEntryActive(entry: UserRatingEntry): boolean {
  return !(entry.deletedAt !== undefined && entry.deletedAt >= entry.ratedAt);
}

function isActive(entry: UserRatingEntry | undefined): entry is UserRatingEntry {
  return !!entry && isEntryActive(entry);
}

export function getActiveShowRating(date: string): UserRatingEntry | null {
  const entry = ratings.shows[dateOnly(date)];
  return isActive(entry) ? entry : null;
}

export function getActivePerformanceRating(songTitle: string, date: string): UserRatingEntry | null {
  const entry = ratings.performances[performanceRatingKey(songTitle, date)];
  return isActive(entry) ? entry : null;
}

export function setShowUserRating(date: string, stars: UserStars): void {
  ratings = {
    ...ratings,
    shows: { ...ratings.shows, [dateOnly(date)]: { stars, ratedAt: Date.now() } },
  };
  notify();
}

export function resetShowUserRating(date: string): void {
  const key = dateOnly(date);
  const existing = ratings.shows[key];
  if (!existing) return;
  ratings = {
    ...ratings,
    shows: { ...ratings.shows, [key]: { ...existing, deletedAt: Date.now() } },
  };
  notify();
}

export function setPerformanceUserRating(
  songTitle: string,
  date: string,
  stars: UserStars,
  showIdentifier?: string,
): void {
  const key = performanceRatingKey(songTitle, date);
  const entry: UserRatingEntry = {
    stars,
    ratedAt: Date.now(),
    songTitle,
    ...(showIdentifier ? { showIdentifier } : {}),
  };
  ratings = { ...ratings, performances: { ...ratings.performances, [key]: entry } };
  notify();
}

export function resetPerformanceUserRating(songTitle: string, date: string): void {
  const key = performanceRatingKey(songTitle, date);
  const existing = ratings.performances[key];
  if (!existing) return;
  ratings = {
    ...ratings,
    performances: { ...ratings.performances, [key]: { ...existing, deletedAt: Date.now() } },
  };
  notify();
}

export function subscribeUserRatings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function entryTimestamp(entry: UserRatingEntry): number {
  return Math.max(entry.ratedAt, entry.deletedAt ?? 0);
}

function mergeMaps(
  a: Record<string, UserRatingEntry>,
  b: Record<string, UserRatingEntry>,
): Record<string, UserRatingEntry> {
  const merged: Record<string, UserRatingEntry> = { ...a };
  for (const [key, entry] of Object.entries(b)) {
    const existing = merged[key];
    if (!existing || entryTimestamp(entry) > entryTimestamp(existing)) {
      merged[key] = entry;
    }
  }
  return merged;
}

/** Latest-wins per entry: max(ratedAt, deletedAt) decides. Symmetric. */
export function mergeUserRatings(a: UserRatings, b: UserRatings): UserRatings {
  return {
    shows: mergeMaps(a.shows, b.shows),
    performances: mergeMaps(a.performances, b.performances),
  };
}

/** Drop tombstones older than 30 days (both sides have converged by then). */
export function pruneTombstones(input: UserRatings, now: number = Date.now()): UserRatings {
  const prune = (map: Record<string, UserRatingEntry>) =>
    Object.fromEntries(
      Object.entries(map).filter(([, entry]) =>
        isEntryActive(entry) || now - (entry.deletedAt ?? 0) < TOMBSTONE_RETENTION_MS
      )
    );
  return { shows: prune(input.shows), performances: prune(input.performances) };
}

export function resetStoreForTests(): void {
  ratings = { shows: {}, performances: {} };
  version = 0;
  listeners.clear();
}
