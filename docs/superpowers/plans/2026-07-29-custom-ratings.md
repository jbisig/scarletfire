# Custom Show/Performance Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users can override the app's curated system ratings (red stars) with their own 0–3 star ratings (gold stars) via a full-screen overlay, affecting display, sorting, the Classic Shows rail, Radio, and Show of the Day, with local-first persistence and Supabase sync.

**Architecture:** A module-level `userRatingsStore` (subscribe API, usable outside React) is the single source of truth for overrides. Two resolver functions (`resolveShowRating`, `resolvePerformanceRating`) merge user overrides with the existing system ratings at read time. A `UserRatingsContext` handles AsyncStorage persistence + debounced Supabase sync (mirroring `FavoritesContext`). A provider-owned full-screen `RatingOverlay` (mirroring `ShareSheetContext`) is opened from detail surfaces.

**Tech Stack:** React Native / Expo, TypeScript, AsyncStorage, Supabase (JSONB row per user), Jest (jest-expo preset, react-test-renderer — there is NO @testing-library/react-native in this repo).

**Spec:** `docs/superpowers/specs/2026-07-29-custom-ratings-design.md`

## Global Constraints

- **Scale:** user ratings are stored as **stars** `0 | 1 | 2 | 3`. System ratings use inverted tiers where `stars = 4 - tier`. Convert exactly once, in the resolver.
- **0 stars is a real rating** — it suppresses the system rating and renders a single gold outline star. Reset (tombstone) is a separate action.
- **Gold color:** `COLORS.userRating = '#E5B44C'`. System red stays `COLORS.accent = '#E54C4F'`.
- **Show key:** date `YYYY-MM-DD` — always `.split('T')[0]` (shows.json dates carry `T00:00:00Z`).
- **Performance key:** `` `${normalizeSongTitleForLookup(title)}|${dateOnly}` `` — same normalizer the system lookup uses.
- **Storage key:** `STORAGE_KEYS.USER_RATINGS = '@user_ratings'`. **Supabase table:** `user_ratings`.
- **Tap targets on detail surfaces only:** ShowDetail hero, ShowDetail track rows, FullPlayer, SongPerformances list rows. Browse cards are display-only (but show gold when overridden).
- Run tests with `npx jest <path> -v`; typecheck with `npm run typecheck`. Both must pass before each commit.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Component tests use `react-test-renderer` (`TestRenderer.create` inside `act`) — do NOT import @testing-library/react-native, it is not installed.

---

### Task 1: Foundations — normalizer export, gold color, storage key

**Files:**
- Modify: `src/data/songPerformanceRatings.ts` (bottom of file, ~line 22085: `function normalizeSongTitleForLookup`)
- Modify: `src/constants/theme.ts:18-20` (COLORS primary block)
- Modify: `src/constants/registry.ts:11-24` (STORAGE_KEYS)
- Test: `src/data/__tests__/normalizeSongTitle.test.ts` (create; note `src/data/__tests__/` may not exist yet — create the directory)

**Interfaces:**
- Consumes: nothing new.
- Produces: `export function normalizeSongTitleForLookup(title: string): string` from `src/data/songPerformanceRatings.ts`; `COLORS.userRating: '#E5B44C'`; `STORAGE_KEYS.USER_RATINGS: '@user_ratings'`.

- [ ] **Step 1: Write the failing test**

```ts
// src/data/__tests__/normalizeSongTitle.test.ts
import { normalizeSongTitleForLookup } from '../songPerformanceRatings';
import { COLORS } from '../../constants/theme';
import { STORAGE_KEYS } from '../../constants/registry';

describe('normalizeSongTitleForLookup (exported)', () => {
  it('strips the Grateful Dead prefix and lowercases', () => {
    expect(normalizeSongTitleForLookup('Grateful Dead - Playing In The Band')).toBe(
      'playing in the band'
    );
  });

  it('produces identical keys for archive-style and heady-style titles', () => {
    expect(normalizeSongTitleForLookup("Playin' In The Band")).toBe(
      normalizeSongTitleForLookup('Grateful Dead - Playing In The Band')
    );
  });
});

describe('foundation constants', () => {
  it('defines the gold user-rating color', () => {
    expect(COLORS.userRating).toBe('#E5B44C');
  });

  it('registers the user ratings storage key', () => {
    expect(STORAGE_KEYS.USER_RATINGS).toBe('@user_ratings');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/data/__tests__/normalizeSongTitle.test.ts -v`
Expected: FAIL — `normalizeSongTitleForLookup` is not exported; `COLORS.userRating` undefined; `STORAGE_KEYS.USER_RATINGS` undefined.

- [ ] **Step 3: Make the three edits**

In `src/data/songPerformanceRatings.ts`, change the function declaration (keep the body identical):

```ts
/**
 * Normalize song titles for consistent lookups.
 * Exported so user rating overrides key performances identically
 * to the system rating index (see src/services/userRatingsStore.ts).
 */
export function normalizeSongTitleForLookup(title: string): string {
```

In `src/constants/theme.ts`, after `accentTransparent` (line 20):

```ts
  /** Gold for user-override star ratings (system ratings stay `accent` red) */
  userRating: '#E5B44C',
```

In `src/constants/registry.ts`, inside `STORAGE_KEYS` after `AUTH_SKIPPED`:

```ts
  /** User rating overrides for shows and song performances */
  USER_RATINGS: '@user_ratings',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/data/__tests__/normalizeSongTitle.test.ts -v` — Expected: PASS.
Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/data/songPerformanceRatings.ts src/constants/theme.ts src/constants/registry.ts src/data/__tests__/normalizeSongTitle.test.ts
git commit -m "feat(ratings): export title normalizer, add gold color and storage key

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: userRatingsStore — module-level override store with merge

**Files:**
- Create: `src/services/userRatingsStore.ts`
- Test: `src/services/__tests__/userRatingsStore.test.ts`

**Interfaces:**
- Consumes: `normalizeSongTitleForLookup` (Task 1).
- Produces (all exported from `src/services/userRatingsStore.ts`):

```ts
export interface UserRatingEntry {
  stars: 0 | 1 | 2 | 3;
  ratedAt: number;          // epoch ms
  deletedAt?: number;       // tombstone; entry is inactive when deletedAt >= ratedAt
  songTitle?: string;       // performances only: original display title (radio/share)
  showIdentifier?: string;  // performances only: archive identifier (radio resolution)
}
export interface UserRatings {
  shows: Record<string, UserRatingEntry>;
  performances: Record<string, UserRatingEntry>;
}
export type UserStars = 0 | 1 | 2 | 3;
export function performanceRatingKey(songTitle: string, date: string): string;
export function getUserRatings(): UserRatings;
export function getUserRatingsVersion(): number;
export function replaceUserRatings(next: UserRatings): void;
export function setShowUserRating(date: string, stars: UserStars): void;
export function resetShowUserRating(date: string): void;
export function setPerformanceUserRating(songTitle: string, date: string, stars: UserStars, showIdentifier?: string): void;
export function resetPerformanceUserRating(songTitle: string, date: string): void;
export function getActiveShowRating(date: string): UserRatingEntry | null;
export function getActivePerformanceRating(songTitle: string, date: string): UserRatingEntry | null;
export function subscribeUserRatings(listener: () => void): () => void;
export function mergeUserRatings(a: UserRatings, b: UserRatings): UserRatings;
export function pruneTombstones(ratings: UserRatings, now?: number): UserRatings;
export const EMPTY_USER_RATINGS: UserRatings;
export function resetStoreForTests(): void;
```

- [ ] **Step 1: Write the failing test**

```ts
// src/services/__tests__/userRatingsStore.test.ts
import {
  performanceRatingKey,
  getUserRatings,
  getUserRatingsVersion,
  replaceUserRatings,
  setShowUserRating,
  resetShowUserRating,
  setPerformanceUserRating,
  resetPerformanceUserRating,
  getActiveShowRating,
  getActivePerformanceRating,
  subscribeUserRatings,
  mergeUserRatings,
  pruneTombstones,
  resetStoreForTests,
  UserRatings,
} from '../userRatingsStore';

beforeEach(() => resetStoreForTests());

describe('performanceRatingKey', () => {
  it('normalizes title and strips time from date', () => {
    expect(performanceRatingKey('Grateful Dead - Playing In The Band', '1972-08-27T00:00:00Z'))
      .toBe('playing in the band|1972-08-27');
  });
});

describe('set/reset show ratings', () => {
  it('stores an active rating keyed by date-only', () => {
    setShowUserRating('1977-05-08T00:00:00Z', 3);
    const entry = getActiveShowRating('1977-05-08');
    expect(entry).not.toBeNull();
    expect(entry!.stars).toBe(3);
  });

  it('stores an explicit 0-star rating as active', () => {
    setShowUserRating('1977-05-08', 0);
    expect(getActiveShowRating('1977-05-08')!.stars).toBe(0);
  });

  it('reset tombstones the entry (inactive but kept for sync)', () => {
    setShowUserRating('1977-05-08', 2);
    resetShowUserRating('1977-05-08');
    expect(getActiveShowRating('1977-05-08')).toBeNull();
    expect(getUserRatings().shows['1977-05-08'].deletedAt).toBeDefined();
  });

  it('re-rating after reset reactivates the entry', () => {
    setShowUserRating('1977-05-08', 2);
    resetShowUserRating('1977-05-08');
    setShowUserRating('1977-05-08', 1);
    expect(getActiveShowRating('1977-05-08')!.stars).toBe(1);
  });
});

describe('performance ratings', () => {
  it('stores title/identifier metadata and resolves via either title form', () => {
    setPerformanceUserRating('Playin In The Band', '1972-08-27', 3, 'gd1972-08-27.sbd');
    const entry = getActivePerformanceRating('Grateful Dead - Playing In The Band', '1972-08-27');
    expect(entry).not.toBeNull();
    expect(entry!.stars).toBe(3);
    expect(entry!.showIdentifier).toBe('gd1972-08-27.sbd');
    expect(entry!.songTitle).toBe('Playin In The Band');
  });

  it('reset tombstones a performance rating', () => {
    setPerformanceUserRating('Dark Star', '1969-02-27', 3);
    resetPerformanceUserRating('Dark Star', '1969-02-27');
    expect(getActivePerformanceRating('Dark Star', '1969-02-27')).toBeNull();
  });
});

describe('subscribe/version', () => {
  it('notifies listeners and bumps version on every mutation', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeUserRatings(listener);
    const v0 = getUserRatingsVersion();
    setShowUserRating('1977-05-08', 3);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getUserRatingsVersion()).toBe(v0 + 1);
    unsubscribe();
    resetShowUserRating('1977-05-08');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('mergeUserRatings', () => {
  const entry = (stars: 0 | 1 | 2 | 3, ratedAt: number, deletedAt?: number) =>
    ({ stars, ratedAt, ...(deletedAt ? { deletedAt } : {}) });

  it('takes the newer entry per key (latest-wins on max(ratedAt, deletedAt))', () => {
    const a: UserRatings = { shows: { d: entry(1, 100) }, performances: {} };
    const b: UserRatings = { shows: { d: entry(3, 200) }, performances: {} };
    expect(mergeUserRatings(a, b).shows['d'].stars).toBe(3);
    expect(mergeUserRatings(b, a).shows['d'].stars).toBe(3);
  });

  it('a newer tombstone beats an older rating', () => {
    const a: UserRatings = { shows: { d: entry(2, 100, 300) }, performances: {} };
    const b: UserRatings = { shows: { d: entry(3, 200) }, performances: {} };
    const merged = mergeUserRatings(a, b);
    expect(merged.shows['d'].deletedAt).toBe(300);
  });

  it('unions disjoint keys across both maps', () => {
    const a: UserRatings = { shows: { x: entry(1, 1) }, performances: { p1: entry(3, 1) } };
    const b: UserRatings = { shows: { y: entry(2, 2) }, performances: {} };
    const merged = mergeUserRatings(a, b);
    expect(Object.keys(merged.shows).sort()).toEqual(['x', 'y']);
    expect(Object.keys(merged.performances)).toEqual(['p1']);
  });
});

describe('pruneTombstones', () => {
  it('drops tombstones older than 30 days, keeps active entries', () => {
    const now = Date.now();
    const old = now - 31 * 24 * 60 * 60 * 1000;
    const ratings: UserRatings = {
      shows: {
        stale: { stars: 1, ratedAt: old - 1, deletedAt: old },
        fresh: { stars: 2, ratedAt: now - 1, deletedAt: now },
        active: { stars: 3, ratedAt: old },
      },
      performances: {},
    };
    const pruned = pruneTombstones(ratings, now);
    expect(pruned.shows['stale']).toBeUndefined();
    expect(pruned.shows['fresh']).toBeDefined();
    expect(pruned.shows['active']).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/__tests__/userRatingsStore.test.ts -v`
Expected: FAIL — module `../userRatingsStore` not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/services/userRatingsStore.ts
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

function isActive(entry: UserRatingEntry | undefined): entry is UserRatingEntry {
  return !!entry && !(entry.deletedAt !== undefined && entry.deletedAt >= entry.ratedAt);
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
        isActive(entry) || now - (entry.deletedAt ?? 0) < TOMBSTONE_RETENTION_MS
      )
    );
  return { shows: prune(input.shows), performances: prune(input.performances) };
}

export function resetStoreForTests(): void {
  ratings = { shows: {}, performances: {} };
  version = 0;
  listeners.clear();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/__tests__/userRatingsStore.test.ts -v` — Expected: PASS.
Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/services/userRatingsStore.ts src/services/__tests__/userRatingsStore.test.ts
git commit -m "feat(ratings): user ratings store with tombstones and latest-wins merge

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: ratingResolver — user-over-system resolution

**Files:**
- Create: `src/services/ratingResolver.ts`
- Test: `src/services/__tests__/ratingResolver.test.ts`

**Interfaces:**
- Consumes: store getters (Task 2); `getClassicTier` from `src/data/classicShowsTiers.ts`; `getSongPerformanceRating` from `src/data/songPerformanceRatings.ts`; `findSongByTitle` from `src/utils/songLookup.ts`.
- Produces (exported from `src/services/ratingResolver.ts`):

```ts
export interface ResolvedRating { stars: 0 | 1 | 2 | 3; isUserRating: boolean; }
export function tierToStars(tier: 1 | 2 | 3): 1 | 2 | 3;          // 4 - tier
export function resolveShowRating(date: string): ResolvedRating | null;
export function resolvePerformanceRating(songTitle: string, showDate: string): ResolvedRating | null;
```

System fallback for performances checks `getSongPerformanceRating(title, date)` first, then the baked catalog (`findSongByTitle(title)?.performances.find(p => p.date === dateOnly)?.rating`) — this unifies the two system sources so every surface resolves identically.

- [ ] **Step 1: Write the failing test**

```ts
// src/services/__tests__/ratingResolver.test.ts
import { resolveShowRating, resolvePerformanceRating, tierToStars } from '../ratingResolver';
import {
  setShowUserRating,
  resetShowUserRating,
  setPerformanceUserRating,
  resetStoreForTests,
} from '../userRatingsStore';
import { getClassicTier } from '../../data/classicShowsTiers';
import { getSongPerformanceRating } from '../../data/songPerformanceRatings';

beforeEach(() => resetStoreForTests());

// Real fixture dates from the static data — verified in the test itself so
// the test fails loudly if the curated data ever changes.
const CLASSIC_DATE = '1977-05-08';       // Cornell — tier 1 in TIER_1_SHOWS
const UNRATED_DATE = '1966-01-08';       // no classic tier

describe('tierToStars', () => {
  it('inverts the tier scale', () => {
    expect(tierToStars(1)).toBe(3);
    expect(tierToStars(2)).toBe(2);
    expect(tierToStars(3)).toBe(1);
  });
});

describe('resolveShowRating', () => {
  it('falls back to the system classic tier when no override', () => {
    const tier = getClassicTier(CLASSIC_DATE);
    expect(tier).toBe(1); // fixture guard
    expect(resolveShowRating(CLASSIC_DATE)).toEqual({ stars: 3, isUserRating: false });
  });

  it('returns null when neither user nor system rating exists', () => {
    expect(getClassicTier(UNRATED_DATE)).toBeNull(); // fixture guard
    expect(resolveShowRating(UNRATED_DATE)).toBeNull();
  });

  it('user rating wins over system rating', () => {
    setShowUserRating(CLASSIC_DATE, 1);
    expect(resolveShowRating(CLASSIC_DATE)).toEqual({ stars: 1, isUserRating: true });
  });

  it('a 0-star override suppresses the system rating', () => {
    setShowUserRating(CLASSIC_DATE, 0);
    expect(resolveShowRating(CLASSIC_DATE)).toEqual({ stars: 0, isUserRating: true });
  });

  it('reset falls back to the system rating', () => {
    setShowUserRating(CLASSIC_DATE, 0);
    resetShowUserRating(CLASSIC_DATE);
    expect(resolveShowRating(CLASSIC_DATE)).toEqual({ stars: 3, isUserRating: false });
  });

  it('handles ISO timestamps in the date', () => {
    expect(resolveShowRating(`${CLASSIC_DATE}T00:00:00Z`)).toEqual({ stars: 3, isUserRating: false });
  });
});

describe('resolvePerformanceRating', () => {
  // Find a real system-rated performance so the test is stable against data.
  const SYSTEM_TITLE = 'Grateful Dead - Playing In The Band';
  const SYSTEM_DATE = '1972-08-27';

  it('falls back to system performance rating when no override', () => {
    const systemTier = getSongPerformanceRating(SYSTEM_TITLE, SYSTEM_DATE);
    expect(systemTier).not.toBeNull(); // fixture guard — a famous tier-1 version
    expect(resolvePerformanceRating(SYSTEM_TITLE, SYSTEM_DATE)).toEqual({
      stars: tierToStars(systemTier!),
      isUserRating: false,
    });
  });

  it('user rating wins, keyed identically across title variants', () => {
    setPerformanceUserRating("Playin' In The Band", SYSTEM_DATE, 2);
    expect(resolvePerformanceRating(SYSTEM_TITLE, SYSTEM_DATE)).toEqual({
      stars: 2,
      isUserRating: true,
    });
  });

  it('returns null for an unrated performance', () => {
    expect(resolvePerformanceRating('Not A Real Song Title XYZ', '1970-01-01')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/__tests__/ratingResolver.test.ts -v`
Expected: FAIL — module not found. (If a fixture-guard assertion fails instead after implementation, pick a different date/title from `src/data/classicShowsTiers.ts` / `src/data/songPerformanceRatings.ts` and update the constant — the guards exist exactly for this.)

- [ ] **Step 3: Write the implementation**

```ts
// src/services/ratingResolver.ts
/**
 * Single source of truth for "what rating does this show/performance have,
 * and whose is it?". User overrides (userRatingsStore) win over system
 * ratings; a 0-star override suppresses the system rating entirely.
 */
import { getClassicTier } from '../data/classicShowsTiers';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { findSongByTitle } from '../utils/songLookup';
import { getActiveShowRating, getActivePerformanceRating } from './userRatingsStore';

export interface ResolvedRating {
  stars: 0 | 1 | 2 | 3;
  isUserRating: boolean;
}

export function tierToStars(tier: 1 | 2 | 3): 1 | 2 | 3 {
  return (4 - tier) as 1 | 2 | 3;
}

export function resolveShowRating(date: string): ResolvedRating | null {
  const user = getActiveShowRating(date);
  if (user) return { stars: user.stars, isUserRating: true };
  const tier = getClassicTier(date);
  return tier ? { stars: tierToStars(tier), isUserRating: false } : null;
}

export function resolvePerformanceRating(songTitle: string, showDate: string): ResolvedRating | null {
  const user = getActivePerformanceRating(songTitle, showDate);
  if (user) return { stars: user.stars, isUserRating: true };

  const tier = getSongPerformanceRating(songTitle, showDate);
  if (tier) return { stars: tierToStars(tier), isUserRating: false };

  // Baked catalog fallback (songs.generated.ts) — some surfaces (ShowDetail
  // track rows, usePerformanceRating) historically read this source.
  const dateOnly = showDate.split('T')[0];
  const catalogTier = findSongByTitle(songTitle)?.performances.find(
    p => p.date.split('T')[0] === dateOnly
  )?.rating;
  return catalogTier ? { stars: tierToStars(catalogTier), isUserRating: false } : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/__tests__/ratingResolver.test.ts -v` — Expected: PASS.
Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/services/ratingResolver.ts src/services/__tests__/ratingResolver.test.ts
git commit -m "feat(ratings): resolver merging user overrides with system ratings

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: userRatingsCloudService — Supabase load/save

**Files:**
- Create: `src/services/userRatingsCloudService.ts`
- Test: `src/services/__tests__/userRatingsCloudService.test.ts`

**Interfaces:**
- Consumes: `authService.getClient()` (existing, `src/services/authService`); `UserRatings` type (Task 2).
- Produces: `userRatingsCloudService` singleton with `syncRatings(userId: string, ratings: UserRatings): Promise<void>` and `loadRatings(userId: string): Promise<UserRatings>`. `loadRatings` returns `EMPTY_USER_RATINGS`-shaped `{ shows: {}, performances: {} }` on PostgREST `PGRST116` (no row yet). `syncRatings` silently no-ops when there is no session (logged-out).

- [ ] **Step 1: Write the failing test**

Follow the mocking style of `src/services/__tests__/collectionsService.duplicate.test.ts` (mock `../authService` module):

```ts
// src/services/__tests__/userRatingsCloudService.test.ts
import type { UserRatings } from '../userRatingsStore';

const mockGetSession = jest.fn();
const mockUpsert = jest.fn();
const mockSingle = jest.fn();

jest.mock('../authService', () => ({
  authService: {
    getClient: () => ({
      auth: { getSession: mockGetSession },
      from: (table: string) => ({
        upsert: mockUpsert,
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      }),
    }),
  },
}));

import { userRatingsCloudService } from '../userRatingsCloudService';

const RATINGS: UserRatings = {
  shows: { '1977-05-08': { stars: 3, ratedAt: 1 } },
  performances: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  mockUpsert.mockResolvedValue({ error: null });
});

describe('syncRatings', () => {
  it('upserts the full blob keyed on user_id', async () => {
    await userRatingsCloudService.syncRatings('u1', RATINGS);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        shows: RATINGS.shows,
        performances: RATINGS.performances,
      }),
      { onConflict: 'user_id' }
    );
  });

  it('no-ops without a session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await userRatingsCloudService.syncRatings('u1', RATINGS);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('throws on upsert error', async () => {
    mockUpsert.mockResolvedValue({ error: new Error('boom') });
    await expect(userRatingsCloudService.syncRatings('u1', RATINGS)).rejects.toThrow('boom');
  });
});

describe('loadRatings', () => {
  it('returns the stored blob', async () => {
    mockSingle.mockResolvedValue({ data: { shows: RATINGS.shows, performances: {} }, error: null });
    const result = await userRatingsCloudService.loadRatings('u1');
    expect(result.shows['1977-05-08'].stars).toBe(3);
  });

  it('returns empty ratings when no row exists (PGRST116)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const result = await userRatingsCloudService.loadRatings('u1');
    expect(result).toEqual({ shows: {}, performances: {} });
  });

  it('throws on other errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'x' } });
    await expect(userRatingsCloudService.loadRatings('u1')).rejects.toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/__tests__/userRatingsCloudService.test.ts -v`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation** (mirror `favoritesCloudService.ts` exactly)

```ts
// src/services/userRatingsCloudService.ts
import { authService } from './authService';
import type { UserRatings } from './userRatingsStore';

class UserRatingsCloudService {
  private get supabase() {
    return authService.getClient();
  }

  /** Upsert the complete ratings blob for a user. No-op when logged out. */
  async syncRatings(userId: string, ratings: UserRatings): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) return;

    const { error } = await this.supabase
      .from('user_ratings')
      .upsert({
        user_id: userId,
        shows: ratings.shows,
        performances: ratings.performances,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }

  /** Load ratings from cloud; empty ratings if the user has no row yet. */
  async loadRatings(userId: string): Promise<UserRatings> {
    const { data, error } = await this.supabase
      .from('user_ratings')
      .select('shows, performances')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { shows: {}, performances: {} };
      }
      throw error;
    }

    return {
      shows: data?.shows || {},
      performances: data?.performances || {},
    };
  }
}

export const userRatingsCloudService = new UserRatingsCloudService();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/__tests__/userRatingsCloudService.test.ts -v` — Expected: PASS.
Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/services/userRatingsCloudService.ts src/services/__tests__/userRatingsCloudService.test.ts
git commit -m "feat(ratings): supabase cloud service for user ratings

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: UserRatingsContext — persistence, sync, React hooks

**Files:**
- Create: `src/contexts/UserRatingsContext.tsx`
- Modify: `App.tsx` (provider tree, imports at top; nest `UserRatingsProvider` directly inside `AuthProvider`'s subtree, alongside `FavoritesProvider` — it needs `useAuth`)
- Test: `src/contexts/__tests__/UserRatingsContext.test.tsx`

**Interfaces:**
- Consumes: store (Task 2), resolvers (Task 3), cloud service (Task 4), `useAuth` from `src/contexts/AuthContext`, `useDebouncedSync` from `src/hooks/useDebouncedSync`, `useSyncErrorToast` from `src/hooks/useSyncErrorToast`, `STORAGE_KEYS.USER_RATINGS` (Task 1).
- Produces (exported from `src/contexts/UserRatingsContext.tsx`):

```ts
export function UserRatingsProvider({ children }: { children: React.ReactNode }): JSX.Element;
export function useUserRatings(): {
  setShowRating: (date: string, stars: UserStars) => void;
  resetShowRating: (date: string) => void;
  setPerformanceRating: (songTitle: string, date: string, stars: UserStars, showIdentifier?: string) => void;
  resetPerformanceRating: (songTitle: string, date: string) => void;
};
export function useUserRatingsVersion(): number;                     // useSyncExternalStore on the store
export function useResolvedShowRating(date: string | undefined): ResolvedRating | null;
export function useResolvedPerformanceRating(songTitle: string | undefined, date: string | undefined): ResolvedRating | null;
```

`useUserRatingsVersion` works even outside the provider (it only touches the store) — display components rely on this so tests that render a card in isolation don't need the provider.

- [ ] **Step 1: Write the failing test**

```tsx
// src/contexts/__tests__/UserRatingsContext.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockUseAuth = jest.fn();
jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockLoadRatings = jest.fn();
const mockSyncRatings = jest.fn();
jest.mock('../../services/userRatingsCloudService', () => ({
  userRatingsCloudService: {
    loadRatings: (...args: unknown[]) => mockLoadRatings(...args),
    syncRatings: (...args: unknown[]) => mockSyncRatings(...args),
  },
}));

jest.mock('../../hooks/useSyncErrorToast', () => ({
  useSyncErrorToast: () => jest.fn(),
}));

import { UserRatingsProvider, useUserRatings, useResolvedShowRating } from '../UserRatingsContext';
import { resetStoreForTests, getUserRatings } from '../../services/userRatingsStore';
import { STORAGE_KEYS } from '../../constants/registry';

const loggedOut = { state: { isAuthenticated: false, user: null, isLoading: false } };
const loggedIn = { state: { isAuthenticated: true, user: { id: 'u1' }, isLoading: false } };

// Test harness component exposing the context API + a resolved rating
let api: ReturnType<typeof useUserRatings>;
let resolved: ReturnType<typeof useResolvedShowRating>;
function Harness({ date }: { date: string }) {
  api = useUserRatings();
  resolved = useResolvedShowRating(date);
  return null;
}

const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  jest.clearAllMocks();
  resetStoreForTests();
  (AsyncStorage.clear as jest.Mock)?.mockClear?.();
  mockUseAuth.mockReturnValue(loggedOut);
  mockLoadRatings.mockResolvedValue({ shows: {}, performances: {} });
  mockSyncRatings.mockResolvedValue(undefined);
});

it('loads persisted ratings from AsyncStorage on mount', async () => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.USER_RATINGS,
    JSON.stringify({ shows: { '1966-01-08': { stars: 2, ratedAt: 1 } }, performances: {} })
  );
  await act(async () => {
    TestRenderer.create(
      <UserRatingsProvider><Harness date="1966-01-08" /></UserRatingsProvider>
    );
  });
  await flush();
  expect(resolved).toEqual({ stars: 2, isUserRating: true });
});

it('setShowRating updates resolution and persists to AsyncStorage', async () => {
  await act(async () => {
    TestRenderer.create(
      <UserRatingsProvider><Harness date="1966-01-08" /></UserRatingsProvider>
    );
  });
  await act(async () => { api.setShowRating('1966-01-08', 3); });
  await flush();
  expect(resolved).toEqual({ stars: 3, isUserRating: true });
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_RATINGS);
  expect(JSON.parse(stored!).shows['1966-01-08'].stars).toBe(3);
});

it('merges cloud ratings on login and pushes the merged result', async () => {
  mockUseAuth.mockReturnValue(loggedIn);
  mockLoadRatings.mockResolvedValue({
    shows: { '1977-05-08': { stars: 1, ratedAt: 100 } },
    performances: {},
  });
  await act(async () => {
    TestRenderer.create(
      <UserRatingsProvider><Harness date="1977-05-08" /></UserRatingsProvider>
    );
  });
  await flush();
  expect(mockLoadRatings).toHaveBeenCalledWith('u1');
  expect(getUserRatings().shows['1977-05-08'].stars).toBe(1);
  expect(mockSyncRatings).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/contexts/__tests__/UserRatingsContext.test.tsx -v`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// src/contexts/UserRatingsContext.tsx
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../constants/registry';
import {
  UserStars,
  getUserRatings,
  getUserRatingsVersion,
  replaceUserRatings,
  setShowUserRating,
  resetShowUserRating,
  setPerformanceUserRating,
  resetPerformanceUserRating,
  subscribeUserRatings,
  mergeUserRatings,
  pruneTombstones,
} from '../services/userRatingsStore';
import { ResolvedRating, resolveShowRating, resolvePerformanceRating } from '../services/ratingResolver';
import { userRatingsCloudService } from '../services/userRatingsCloudService';
import { useDebouncedSync } from '../hooks/useDebouncedSync';
import { useSyncErrorToast } from '../hooks/useSyncErrorToast';
import { logger } from '../utils/logger';

interface UserRatingsContextValue {
  setShowRating: (date: string, stars: UserStars) => void;
  resetShowRating: (date: string) => void;
  setPerformanceRating: (songTitle: string, date: string, stars: UserStars, showIdentifier?: string) => void;
  resetPerformanceRating: (songTitle: string, date: string) => void;
}

const UserRatingsContext = createContext<UserRatingsContextValue | null>(null);

/** Re-render subscriber for any store change. Safe outside the provider. */
export function useUserRatingsVersion(): number {
  return useSyncExternalStore(subscribeUserRatings, getUserRatingsVersion, getUserRatingsVersion);
}

export function useResolvedShowRating(date: string | undefined): ResolvedRating | null {
  const version = useUserRatingsVersion();
  return useMemo(
    () => (date ? resolveShowRating(date) : null),
    [date, version]
  );
}

export function useResolvedPerformanceRating(
  songTitle: string | undefined,
  date: string | undefined,
): ResolvedRating | null {
  const version = useUserRatingsVersion();
  return useMemo(
    () => (songTitle && date ? resolvePerformanceRating(songTitle, date) : null),
    [songTitle, date, version]
  );
}

/**
 * Owns persistence + sync for the user ratings store. Mirrors
 * FavoritesContext: local-first AsyncStorage, merge-on-login,
 * debounced cloud push, flush on logout/background.
 */
export function UserRatingsProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const showSyncErrorToast = useSyncErrorToast();
  const isLoadedRef = useRef(false);

  const authStateRef = useRef(authState);
  useEffect(() => { authStateRef.current = authState; }, [authState]);

  const performSync = useCallback((): Promise<void> | undefined => {
    const auth = authStateRef.current;
    if (!auth.isAuthenticated || !auth.user) return undefined;
    return userRatingsCloudService
      .syncRatings(auth.user.id, getUserRatings())
      .catch((error) => {
        logger.storage?.error?.('Failed to sync user ratings to cloud:', error);
        showSyncErrorToast();
      });
  }, [showSyncErrorToast]);

  const { schedule: scheduleSync, flush: flushSync } = useDebouncedSync(performSync);

  // Load from AsyncStorage on mount (prune stale tombstones as we load).
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_RATINGS);
        if (raw) {
          replaceUserRatings(pruneTombstones(JSON.parse(raw)));
        }
      } catch (error) {
        logger.storage?.error?.('Failed to load user ratings:', error);
      } finally {
        isLoadedRef.current = true;
      }
    })();
  }, []);

  // Persist every store change locally; schedule a cloud push.
  // (The subscription also fires for replaceUserRatings during load/merge —
  // that's fine: rewriting the same blob is idempotent.)
  useEffect(() => {
    return subscribeUserRatings(() => {
      AsyncStorage.setItem(STORAGE_KEYS.USER_RATINGS, JSON.stringify(getUserRatings()))
        .catch(error => logger.storage?.error?.('Failed to save user ratings:', error));
      if (isLoadedRef.current) scheduleSync();
    });
  }, [scheduleSync]);

  // Merge-on-login. Keyed off user id (see FavoritesContext for rationale).
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) return;
    const userId = authState.user.id;
    (async () => {
      try {
        const cloud = await userRatingsCloudService.loadRatings(userId);
        const merged = pruneTombstones(mergeUserRatings(getUserRatings(), cloud));
        replaceUserRatings(merged);
        await userRatingsCloudService.syncRatings(userId, merged);
      } catch (error) {
        logger.storage?.error?.('Failed to sync user ratings from cloud:', error);
      }
    })();
  }, [authState.isAuthenticated, authState.user?.id]);

  // Flush pending sync on logout (best-effort; see FavoritesContext race note).
  const wasAuthenticatedRef = useRef(authState.isAuthenticated);
  useEffect(() => {
    if (wasAuthenticatedRef.current && !authState.isAuthenticated) flushSync();
    wasAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated, flushSync]);

  const value = useMemo<UserRatingsContextValue>(() => ({
    setShowRating: setShowUserRating,
    resetShowRating: resetShowUserRating,
    setPerformanceRating: setPerformanceUserRating,
    resetPerformanceRating: resetPerformanceUserRating,
  }), []);

  return (
    <UserRatingsContext.Provider value={value}>
      {children}
    </UserRatingsContext.Provider>
  );
}

export function useUserRatings(): UserRatingsContextValue {
  const ctx = useContext(UserRatingsContext);
  if (!ctx) throw new Error('useUserRatings must be used inside a <UserRatingsProvider>');
  return ctx;
}
```

Note: check `src/utils/logger.ts` for the correct namespace — if `logger.storage` doesn't exist, use the namespace FavoritesContext uses (`favoritesLogger` pattern) or `logger.app`; match the existing convention, don't invent one.

- [ ] **Step 4: Mount the provider in `App.tsx`**

Add the import, then wrap at the same level as `FavoritesProvider` (inside `AuthProvider`). Find the provider nesting in App.tsx's return and insert `<UserRatingsProvider>` directly inside `<AuthProvider>`'s first child position (it has no dependency on Shows/Player):

```tsx
import { UserRatingsProvider } from './src/contexts/UserRatingsContext';
// In the JSX tree, immediately inside <AuthProvider>:
<AuthProvider>
  <UserRatingsProvider>
    {/* existing children unchanged */}
  </UserRatingsProvider>
</AuthProvider>
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/contexts/__tests__/UserRatingsContext.test.tsx -v` — Expected: PASS.
Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/contexts/UserRatingsContext.tsx src/contexts/__tests__/UserRatingsContext.test.tsx App.tsx
git commit -m "feat(ratings): UserRatingsContext with local persistence and cloud sync

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: StarRating — resolved variant (gold/red/zero/placeholder)

**Files:**
- Modify: `src/components/StarRating.tsx` (whole file, 57 lines)
- Test: `src/__tests__/components/StarRating.test.tsx` (create; `src/__tests__/components/` already exists)

**Interfaces:**
- Consumes: `ResolvedRating` (Task 3), `COLORS.userRating` (Task 1).
- Produces: extended props — existing call sites passing `tier` keep working unchanged:

```ts
interface StarRatingProps {
  tier?: 1 | 2 | 3;                    // legacy system-tier path (red)
  rating?: ResolvedRating | null;      // new path; takes precedence over tier
  showPlaceholder?: boolean;           // when rating is null: 3 dim outline stars
  size?: number;
  color?: string;
  style?: object;
}
```

Render rules: `rating` non-null → `rating.stars` filled stars, gold when `isUserRating` else red; `rating.stars === 0` → single gold `star-outline`. `rating` null + `showPlaceholder` → 3 `star-outline` in `COLORS.textMuted`. `rating` null without placeholder → render nothing (`null`). `rating` undefined → legacy `tier` behavior, unchanged.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/StarRating.test.tsx
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from '../../components/StarRating';
import { COLORS } from '../../constants/theme';

const icons = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root.findAllByType(Ionicons).map(i => ({ name: i.props.name, color: i.props.color }));

describe('legacy tier path', () => {
  it('tier 1 renders 3 red filled stars', () => {
    const tree = TestRenderer.create(<StarRating tier={1} />);
    expect(icons(tree)).toEqual(Array(3).fill({ name: 'star', color: COLORS.accent }));
  });
});

describe('resolved rating path', () => {
  it('system rating renders red filled stars', () => {
    const tree = TestRenderer.create(<StarRating rating={{ stars: 2, isUserRating: false }} />);
    expect(icons(tree)).toEqual(Array(2).fill({ name: 'star', color: COLORS.accent }));
  });

  it('user rating renders gold filled stars', () => {
    const tree = TestRenderer.create(<StarRating rating={{ stars: 3, isUserRating: true }} />);
    expect(icons(tree)).toEqual(Array(3).fill({ name: 'star', color: COLORS.userRating }));
  });

  it('0-star user rating renders one gold outline star', () => {
    const tree = TestRenderer.create(<StarRating rating={{ stars: 0, isUserRating: true }} />);
    expect(icons(tree)).toEqual([{ name: 'star-outline', color: COLORS.userRating }]);
  });

  it('null rating renders nothing by default', () => {
    const tree = TestRenderer.create(<StarRating rating={null} />);
    expect(tree.root.findAllByType(Ionicons)).toHaveLength(0);
  });

  it('null rating with placeholder renders 3 dim outline stars', () => {
    const tree = TestRenderer.create(<StarRating rating={null} showPlaceholder />);
    expect(icons(tree)).toEqual(Array(3).fill({ name: 'star-outline', color: COLORS.textMuted }));
  });

  it('labels user ratings for accessibility', () => {
    const tree = TestRenderer.create(<StarRating rating={{ stars: 2, isUserRating: true }} />);
    const view = tree.root.findByProps({ accessibilityRole: 'text' });
    expect(view.props.accessibilityLabel).toBe('Your rating: 2 stars');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/components/StarRating.test.tsx -v`
Expected: FAIL — new props not supported (TS/type errors or wrong render output).

- [ ] **Step 3: Rewrite `src/components/StarRating.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import type { ResolvedRating } from '../services/ratingResolver';

export type PerformanceRatingTier = 1 | 2 | 3;

interface StarRatingProps {
  /** Legacy system-tier path (red stars). Ignored when `rating` is set. */
  tier?: PerformanceRatingTier;
  /** Resolved rating: gold when the user's, red when the system's,
   *  single gold outline star for an explicit 0-star override. */
  rating?: ResolvedRating | null;
  /** When `rating` is null, render 3 dim outline stars (tap target hint). */
  showPlaceholder?: boolean;
  size?: number;
  color?: string;
  style?: object;
}

/**
 * Renders star rating. Two modes:
 * - `tier` (legacy): tier 1 → 3 stars, tier 2 → 2, tier 3 → 1, in `color`.
 * - `rating` (resolved): user overrides render gold, system red.
 * Memoized to prevent unnecessary re-renders.
 */
export const StarRating = React.memo<StarRatingProps>(function StarRating({
  tier,
  rating,
  showPlaceholder = false,
  size = 16,
  color = COLORS.accent,
  style
}) {
  let iconName: 'star' | 'star-outline' = 'star';
  let starCount: number;
  let starColor: string;
  let ratingLabel: string;

  if (rating !== undefined) {
    if (rating === null) {
      if (!showPlaceholder) return null;
      iconName = 'star-outline';
      starCount = 3;
      starColor = COLORS.textMuted;
      ratingLabel = 'Not rated. Tap to rate';
    } else if (rating.stars === 0) {
      iconName = 'star-outline';
      starCount = 1;
      starColor = COLORS.userRating;
      ratingLabel = 'Your rating: 0 stars';
    } else {
      starCount = rating.stars;
      starColor = rating.isUserRating ? COLORS.userRating : COLORS.accent;
      ratingLabel = rating.isUserRating
        ? `Your rating: ${rating.stars} ${rating.stars === 1 ? 'star' : 'stars'}`
        : `${rating.stars} star rating`;
    }
  } else {
    if (!tier) return null;
    starCount = 4 - tier; // Tier 1 → 3 stars, Tier 2 → 2 stars, Tier 3 → 1 star
    starColor = color;
    ratingLabel = starCount === 1 ? '1 star rating' : `${starCount} star rating`;
  }

  return (
    <View
      style={[styles.starsContainer, style]}
      accessibilityRole="text"
      accessibilityLabel={ratingLabel}
    >
      {Array.from({ length: starCount }, (_, i) => (
        <Ionicons
          key={i}
          name={iconName}
          size={size}
          color={starColor}
          style={{ marginRight: i < starCount - 1 ? 2 : 0 }}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
```

- [ ] **Step 4: Run test + full suite to verify no legacy call site broke**

Run: `npx jest src/__tests__/components/StarRating.test.tsx -v` — Expected: PASS.
Run: `npm run typecheck` — Expected: clean (`tier` became optional; existing call sites all pass it).

- [ ] **Step 5: Commit**

```bash
git add src/components/StarRating.tsx src/__tests__/components/StarRating.test.tsx
git commit -m "feat(ratings): StarRating gold/zero/placeholder variants for resolved ratings

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: StarPicker + RatingOverlay + RatingOverlayContext

**Files:**
- Create: `src/components/StarPicker.tsx`
- Create: `src/components/RatingOverlay.tsx`
- Create: `src/contexts/RatingOverlayContext.tsx`
- Modify: `App.tsx` (mount `RatingOverlayProvider` inside `UserRatingsProvider`)
- Test: `src/__tests__/components/StarPicker.test.tsx`, `src/__tests__/components/RatingOverlay.test.tsx`

**Interfaces:**
- Consumes: `useUserRatings`, `useResolvedShowRating`, `useResolvedPerformanceRating` (Task 5); `StarRating` (Task 6); `getClassicTier`; `getSongPerformanceRating`; `tierToStars` (Task 3); `BlurBackground` from `src/components/shared/BlurBackground`; `haptics` from `src/services/hapticService`; `formatDate` from `src/utils/formatters`.
- Produces:

```ts
// src/components/StarPicker.tsx
interface StarPickerProps {
  value: 0 | 1 | 2 | 3 | null;             // current user rating; null = none
  onSelect: (stars: 0 | 1 | 2 | 3) => void;
}
export function StarPicker(props: StarPickerProps): JSX.Element;

// src/contexts/RatingOverlayContext.tsx
export type RatingItem =
  | { kind: 'show'; date: string; venue?: string; location?: string }
  | { kind: 'performance'; songTitle: string; date: string; venue?: string; showIdentifier?: string };
export function RatingOverlayProvider({ children }: { children: React.ReactNode }): JSX.Element;
export function useRatingOverlay(): { openRatingOverlay: (item: RatingItem) => void; closeRatingOverlay: () => void };

// src/components/RatingOverlay.tsx
interface RatingOverlayProps { item: RatingItem | null; onClose: () => void; }
export function RatingOverlay(props: RatingOverlayProps): JSX.Element | null;
```

- [ ] **Step 1: Write the failing StarPicker test**

```tsx
// src/__tests__/components/StarPicker.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { StarPicker } from '../../components/StarPicker';

it('renders 3 star buttons plus a zero button', () => {
  const tree = TestRenderer.create(<StarPicker value={null} onSelect={jest.fn()} />);
  expect(tree.root.findByProps({ accessibilityLabel: 'Rate 1 star' })).toBeTruthy();
  expect(tree.root.findByProps({ accessibilityLabel: 'Rate 2 stars' })).toBeTruthy();
  expect(tree.root.findByProps({ accessibilityLabel: 'Rate 3 stars' })).toBeTruthy();
  expect(tree.root.findByProps({ accessibilityLabel: 'Rate 0 stars' })).toBeTruthy();
});

it('tapping a star selects that count', () => {
  const onSelect = jest.fn();
  const tree = TestRenderer.create(<StarPicker value={null} onSelect={onSelect} />);
  act(() => { tree.root.findByProps({ accessibilityLabel: 'Rate 2 stars' }).props.onPress(); });
  expect(onSelect).toHaveBeenCalledWith(2);
});

it('tapping zero selects 0', () => {
  const onSelect = jest.fn();
  const tree = TestRenderer.create(<StarPicker value={3} onSelect={onSelect} />);
  act(() => { tree.root.findByProps({ accessibilityLabel: 'Rate 0 stars' }).props.onPress(); });
  expect(onSelect).toHaveBeenCalledWith(0);
});

it('marks the current value as selected', () => {
  const tree = TestRenderer.create(<StarPicker value={2} onSelect={jest.fn()} />);
  const btn = tree.root.findByProps({ accessibilityLabel: 'Rate 2 stars' });
  expect(btn.props.accessibilityState).toEqual({ selected: true });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/__tests__/components/StarPicker.test.tsx -v` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement StarPicker**

```tsx
// src/components/StarPicker.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { haptics } from '../services/hapticService';

interface StarPickerProps {
  value: 0 | 1 | 2 | 3 | null;
  onSelect: (stars: 0 | 1 | 2 | 3) => void;
}

/**
 * 0–3 star picker for the rating overlay. Tapping star N rates N stars;
 * the leading circle button rates 0 (an explicit "no stars" rating).
 */
export function StarPicker({ value, onSelect }: StarPickerProps) {
  const handleSelect = (stars: 0 | 1 | 2 | 3) => {
    haptics.light();
    onSelect(stars);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.zeroButton, value === 0 && styles.zeroButtonSelected]}
        onPress={() => handleSelect(0)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Rate 0 stars"
        accessibilityState={{ selected: value === 0 }}
      >
        <Text style={[styles.zeroText, value === 0 && styles.zeroTextSelected]}>0</Text>
      </TouchableOpacity>
      {([1, 2, 3] as const).map(stars => {
        const filled = value !== null && value >= stars;
        return (
          <TouchableOpacity
            key={stars}
            style={styles.starButton}
            onPress={() => handleSelect(stars)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${stars} ${stars === 1 ? 'star' : 'stars'}`}
            accessibilityState={{ selected: value === stars }}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={44}
              color={filled ? COLORS.userRating : COLORS.textSecondary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  starButton: {
    padding: SPACING.xs,
  },
  zeroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  zeroButtonSelected: {
    borderColor: COLORS.userRating,
  },
  zeroText: {
    ...TYPOGRAPHY.heading4,
    color: COLORS.textSecondary,
  },
  zeroTextSelected: {
    color: COLORS.userRating,
  },
});
```

Run: `npx jest src/__tests__/components/StarPicker.test.tsx -v` — Expected: PASS.

- [ ] **Step 4: Write the failing RatingOverlay test**

```tsx
// src/__tests__/components/RatingOverlay.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { RatingOverlay } from '../../components/RatingOverlay';
import { UserRatingsProvider } from '../../contexts/UserRatingsContext';
import { resetStoreForTests, getActiveShowRating, setShowUserRating } from '../../services/userRatingsStore';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ state: { isAuthenticated: false, user: null, isLoading: false } }),
}));
jest.mock('../../hooks/useSyncErrorToast', () => ({ useSyncErrorToast: () => jest.fn() }));

const SHOW_ITEM = { kind: 'show', date: '1977-05-08', venue: 'Barton Hall', location: 'Ithaca, NY' } as const;

const render = async (item: typeof SHOW_ITEM | null, onClose = jest.fn()) => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(
      <UserRatingsProvider>
        <RatingOverlay item={item} onClose={onClose} />
      </UserRatingsProvider>
    );
  });
  return { tree, onClose };
};

beforeEach(() => resetStoreForTests());

it('renders nothing when item is null', async () => {
  const { tree } = await render(null);
  expect(tree.root.findAllByProps({ testID: 'rating-overlay' })).toHaveLength(0);
});

it('shows the community rating for a system-rated show', async () => {
  const { tree } = await render(SHOW_ITEM);
  // Cornell '77 is tier 1 → "Community rating" label present
  expect(
    tree.root.findAllByProps({ testID: 'community-rating-row' }).length
  ).toBeGreaterThan(0);
});

it('selecting stars saves the user rating', async () => {
  const { tree } = await render(SHOW_ITEM);
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: 'Rate 1 star' }).props.onPress();
  });
  expect(getActiveShowRating('1977-05-08')!.stars).toBe(1);
});

it('reset button appears only with an override and tombstones it', async () => {
  const { tree: before } = await render(SHOW_ITEM);
  expect(before.root.findAllByProps({ testID: 'reset-rating-button' })).toHaveLength(0);

  setShowUserRating('1977-05-08', 2);
  const { tree } = await render(SHOW_ITEM);
  const resets = tree.root.findAllByProps({ testID: 'reset-rating-button' });
  expect(resets.length).toBeGreaterThan(0);
  await act(async () => { resets[0].props.onPress(); });
  expect(getActiveShowRating('1977-05-08')).toBeNull();
});
```

Run: `npx jest src/__tests__/components/RatingOverlay.test.tsx -v` — Expected: FAIL, module not found.

- [ ] **Step 5: Implement RatingOverlay and RatingOverlayContext**

```tsx
// src/components/RatingOverlay.tsx
import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurBackground } from './shared/BlurBackground';
import { StarRating } from './StarRating';
import { StarPicker } from './StarPicker';
import { useUserRatings, useUserRatingsVersion } from '../contexts/UserRatingsContext';
import {
  getActiveShowRating,
  getActivePerformanceRating,
} from '../services/userRatingsStore';
import { getClassicTier } from '../data/classicShowsTiers';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { tierToStars } from '../services/ratingResolver';
import type { RatingItem } from '../contexts/RatingOverlayContext';
import { formatDate } from '../utils/formatters';
import { haptics } from '../services/hapticService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface RatingOverlayProps {
  item: RatingItem | null;
  onClose: () => void;
}

/**
 * Full-screen rating overlay (provider-owned, one instance near the root —
 * see RatingOverlayContext). Shows the show/performance info, the community
 * rating for reference, a 0–3 star picker (saves immediately), and a reset
 * button when a user override exists.
 */
export function RatingOverlay({ item, onClose }: RatingOverlayProps) {
  const version = useUserRatingsVersion();
  const { setShowRating, setPerformanceRating, resetShowRating, resetPerformanceRating } = useUserRatings();

  const userEntry = useMemo(() => {
    if (!item) return null;
    return item.kind === 'show'
      ? getActiveShowRating(item.date)
      : getActivePerformanceRating(item.songTitle, item.date);
  }, [item, version]);

  const systemStars = useMemo(() => {
    if (!item) return null;
    const tier = item.kind === 'show'
      ? getClassicTier(item.date)
      : getSongPerformanceRating(item.songTitle, item.date);
    return tier ? tierToStars(tier) : null;
  }, [item]);

  if (!item) return null;

  const title = item.kind === 'show' ? (item.venue ?? 'Show') : item.songTitle;
  const subtitle = item.kind === 'show'
    ? [formatDate(item.date), item.location].filter(Boolean).join(' · ')
    : [formatDate(item.date), item.venue].filter(Boolean).join(' · ');

  const handleSelect = (stars: 0 | 1 | 2 | 3) => {
    if (item.kind === 'show') {
      setShowRating(item.date, stars);
    } else {
      setPerformanceRating(item.songTitle, item.date, stars, item.showIdentifier);
    }
  };

  const handleReset = () => {
    haptics.light();
    if (item.kind === 'show') {
      resetShowRating(item.date);
    } else {
      resetPerformanceRating(item.songTitle, item.date);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container} testID="rating-overlay">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill}>
            <BlurBackground intensity={40} tint="dark" />
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close rating overlay"
          >
            <Ionicons name="close" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.kicker}>
            {item.kind === 'show' ? 'RATE THIS SHOW' : 'RATE THIS PERFORMANCE'}
          </Text>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}

          {systemStars !== null && (
            <View style={styles.communityRow} testID="community-rating-row">
              <Text style={styles.communityLabel}>Community rating</Text>
              <StarRating rating={{ stars: systemStars, isUserRating: false }} size={14} />
            </View>
          )}

          <View style={styles.pickerSection}>
            <StarPicker value={userEntry ? userEntry.stars : null} onSelect={handleSelect} />
          </View>

          {userEntry && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
              testID="reset-rating-button"
              accessibilityRole="button"
              accessibilityLabel="Reset to community rating"
            >
              <Text style={styles.resetText}>Reset to community rating</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS?.lg ?? 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.xs,
    zIndex: 1,
  },
  kicker: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  communityLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  pickerSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  resetButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  resetText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.accent,
  },
});
```

Check `src/constants/theme.ts` for the actual `TYPOGRAPHY` keys (`heading3`, `heading4`, `bodySmall`, `label` are used elsewhere in this plan's excerpts — verify names, and check whether `RADIUS` exports an `lg`; use a literal `16` if not).

```tsx
// src/contexts/RatingOverlayContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { RatingOverlay } from '../components/RatingOverlay';

export type RatingItem =
  | { kind: 'show'; date: string; venue?: string; location?: string }
  | { kind: 'performance'; songTitle: string; date: string; venue?: string; showIdentifier?: string };

interface RatingOverlayContextValue {
  openRatingOverlay: (item: RatingItem) => void;
  closeRatingOverlay: () => void;
}

const RatingOverlayContext = createContext<RatingOverlayContextValue | null>(null);

/**
 * Provider for the global rating overlay. Mount once near the app root
 * (inside UserRatingsProvider) so any detail surface can call
 * openRatingOverlay() — same pattern as ShareSheetContext.
 */
export function RatingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<RatingItem | null>(null);

  const openRatingOverlay = useCallback((item: RatingItem) => setCurrent(item), []);
  const closeRatingOverlay = useCallback(() => setCurrent(null), []);

  const value = useMemo(
    () => ({ openRatingOverlay, closeRatingOverlay }),
    [openRatingOverlay, closeRatingOverlay]
  );

  return (
    <RatingOverlayContext.Provider value={value}>
      {children}
      <RatingOverlay item={current} onClose={closeRatingOverlay} />
    </RatingOverlayContext.Provider>
  );
}

export function useRatingOverlay(): RatingOverlayContextValue {
  const ctx = useContext(RatingOverlayContext);
  if (!ctx) throw new Error('useRatingOverlay must be used inside a <RatingOverlayProvider>');
  return ctx;
}
```

- [ ] **Step 6: Mount in App.tsx**

```tsx
import { RatingOverlayProvider } from './src/contexts/RatingOverlayContext';
// Directly inside <UserRatingsProvider>:
<UserRatingsProvider>
  <RatingOverlayProvider>
    {/* existing children unchanged */}
  </RatingOverlayProvider>
</UserRatingsProvider>
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx jest src/__tests__/components/StarPicker.test.tsx src/__tests__/components/RatingOverlay.test.tsx -v` — Expected: PASS.
Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/StarPicker.tsx src/components/RatingOverlay.tsx src/contexts/RatingOverlayContext.tsx App.tsx src/__tests__/components/StarPicker.test.tsx src/__tests__/components/RatingOverlay.test.tsx
git commit -m "feat(ratings): full-screen rating overlay with 0-3 star picker

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: ShowDetailScreen + TrackItem — tappable ratings on the detail surface

**Files:**
- Modify: `src/components/TrackItem.tsx` (props at lines 10-32, rating render at ~82-88)
- Modify: `src/screens/ShowDetailScreen.tsx` (classicTier memo ~87-95; trackRatings memo ~126-139; web hero stars ~470; native hero stars ~604; TrackItem render ~684-696)
- Test: `src/__tests__/components/TrackItem.rating.test.tsx`

**Interfaces:**
- Consumes: `ResolvedRating`, `useResolvedShowRating`, `useUserRatingsVersion`, `resolvePerformanceRating`, `useRatingOverlay`, `StarRating` new props.
- Produces: `TrackItem` prop change — `rating?: 1|2|3|null` **becomes** `rating?: ResolvedRating | null`, plus new `onRatingPress?: (track: Track) => void`. ShowDetailScreen's `trackRatings` becomes `Record<string, ResolvedRating | null>`.

- [ ] **Step 1: Write the failing TrackItem test**

```tsx
// src/__tests__/components/TrackItem.rating.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TrackItem } from '../../components/TrackItem';
import { Track } from '../../types/show.types';

const track: Track = {
  id: 't1', title: 'Scarlet Begonias', format: 'mp3', streamUrl: 'https://x/t1.mp3',
};
const base = { track, isPlaying: false, onPress: jest.fn() };

it('renders a resolved user rating and fires onRatingPress on tap', () => {
  const onRatingPress = jest.fn();
  const tree = TestRenderer.create(
    <TrackItem {...base} rating={{ stars: 2, isUserRating: true }} onRatingPress={onRatingPress} />
  );
  const btn = tree.root.findByProps({ testID: 'track-rating-button' });
  act(() => { btn.props.onPress({ stopPropagation: jest.fn() }); });
  expect(onRatingPress).toHaveBeenCalledWith(track);
});

it('renders the placeholder when unrated but tappable', () => {
  const tree = TestRenderer.create(
    <TrackItem {...base} rating={null} onRatingPress={jest.fn()} />
  );
  expect(tree.root.findAllByProps({ testID: 'track-rating-button' }).length).toBeGreaterThan(0);
});

it('renders nothing in the rating slot when unrated and not tappable', () => {
  const tree = TestRenderer.create(<TrackItem {...base} rating={null} />);
  expect(tree.root.findAllByProps({ testID: 'track-rating-button' })).toHaveLength(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/__tests__/components/TrackItem.rating.test.tsx -v` — Expected: FAIL (type mismatch / no testID).

- [ ] **Step 3: Modify TrackItem**

In `src/components/TrackItem.tsx`:
1. Change import: `import { StarRating } from './StarRating';` stays; add `import type { ResolvedRating } from '../services/ratingResolver';`
2. Change prop: `rating?: 1 | 2 | 3 | null;` → `rating?: ResolvedRating | null;` and add `/** Opens the rating overlay for this track's performance */ onRatingPress?: (track: Track) => void;`
3. Update the accessibility text (line ~42): `const ratingText = rating ? \`${4 - rating} star performance\` : '';` → 
```ts
  const ratingText = rating
    ? rating.isUserRating
      ? `Your rating: ${rating.stars} ${rating.stars === 1 ? 'star' : 'stars'}`
      : `${rating.stars} star performance`
    : '';
```
4. Replace the rating render block (~lines 82-88):

```tsx
          {onRatingPress ? (
            <TouchableOpacity
              style={styles.ratingContainer}
              testID="track-rating-button"
              onPress={(e: any) => {
                e?.stopPropagation?.();
                onRatingPress(track);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={rating ? 'Change your rating' : 'Rate this performance'}
            >
              <StarRating rating={rating ?? null} showPlaceholder size={14} />
            </TouchableOpacity>
          ) : (
            rating && (
              <View style={styles.ratingContainer}>
                <StarRating rating={rating} size={14} />
              </View>
            )
          )}
```
5. Add `onRatingPress` to the `React.memo` destructure list.

- [ ] **Step 4: Run TrackItem test**

Run: `npx jest src/__tests__/components/TrackItem.rating.test.tsx -v` — Expected: PASS.

- [ ] **Step 5: Modify ShowDetailScreen**

In `src/screens/ShowDetailScreen.tsx`:

1. Add imports:
```ts
import { useResolvedShowRating, useUserRatingsVersion } from '../contexts/UserRatingsContext';
import { resolvePerformanceRating, ResolvedRating } from '../services/ratingResolver';
import { useRatingOverlay } from '../contexts/RatingOverlayContext';
```
2. Replace the `classicTier` memo (~87-95). Keep the tier lookup for nav-param passthrough, but derive the *displayed* rating from the resolver so overrides win and re-render on change:
```ts
  const showDate = previewDate ?? show?.date;
  const resolvedShowRating = useResolvedShowRating(showDate);
```
   Keep the existing `classicTier` memo untouched (it still feeds nav params / share). Add `const { openRatingOverlay } = useRatingOverlay();`
3. Replace `trackRatings` memo (~126-139):
```ts
  const ratingsVersion = useUserRatingsVersion();
  // Pre-compute resolved track ratings (user override > system) for the show
  const trackRatings = useMemo(() => {
    if (!show) return {};
    const ratings: Record<string, ResolvedRating | null> = {};
    show.tracks.forEach(track => {
      ratings[track.id] = resolvePerformanceRating(track.title, show.date);
    });
    return ratings;
  }, [show?.identifier, show?.date, ratingsVersion]);
```
4. Web hero (~470) — replace:
```tsx
                      {classicTier && (
                        <StarRating tier={classicTier} size={20} />
                      )}
```
with:
```tsx
                      <TouchableOpacity
                        onPress={() => openRatingOverlay({
                          kind: 'show',
                          date: displayShow.date,
                          venue: getVenueFromShow(displayShow),
                          location: displayShow.location,
                        })}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Rate this show"
                      >
                        <StarRating rating={resolvedShowRating} showPlaceholder size={20} />
                      </TouchableOpacity>
```
5. Native hero (~604): same replacement with `size={16}`.
6. TrackItem render (~684-696): `rating={trackRatings[track.id]}` stays (type changed), add:
```tsx
            onRatingPress={(t) => openRatingOverlay({
              kind: 'performance',
              songTitle: t.title,
              date: show.date,
              venue: getVenueFromShow(displayShow),
              showIdentifier: show.identifier,
            })}
```

- [ ] **Step 6: Typecheck + run full test suite**

Run: `npm run typecheck` — fix any missed `rating` prop call sites of TrackItem it surfaces (grep: `rg -n "<TrackItem" src/` — update each to pass a `ResolvedRating | null`; other screens that pass tier values must switch to `resolvePerformanceRating(...)`).
Run: `npx jest -v` — Expected: all suites PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/TrackItem.tsx src/screens/ShowDetailScreen.tsx src/__tests__/components/TrackItem.rating.test.tsx
git commit -m "feat(ratings): tappable resolved ratings on show detail and track rows

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: usePerformanceRating + FullPlayer + MiniPlayer cleanup

**Files:**
- Modify: `src/hooks/usePerformanceRating.ts` (whole file, 28 lines)
- Modify: `src/components/FullPlayer.tsx` (hook usage ~168; star render ~470-473)
- Modify: `src/components/MiniPlayer.tsx` (~42-43: remove dead `performanceRating`)
- Test: `src/hooks/__tests__/usePerformanceRating.test.tsx`

**Interfaces:**
- Consumes: `resolvePerformanceRating`, `tierToStars` (Task 3), `useUserRatingsVersion` (Task 5), `usePlayer` (existing).
- Produces: `usePerformanceRating(): ResolvedRating | null` — **return type changes** from `1|2|3|null`. FullPlayer is the only remaining consumer after MiniPlayer cleanup.

- [ ] **Step 1: Write the failing test**

```tsx
// src/hooks/__tests__/usePerformanceRating.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockUsePlayer = jest.fn();
jest.mock('../../contexts/PlayerContext', () => ({
  usePlayer: () => mockUsePlayer(),
}));

import { usePerformanceRating } from '../usePerformanceRating';
import { setPerformanceUserRating, resetStoreForTests } from '../../services/userRatingsStore';

let result: ReturnType<typeof usePerformanceRating>;
function Harness() {
  result = usePerformanceRating();
  return null;
}

beforeEach(() => {
  resetStoreForTests();
  jest.clearAllMocks();
});

it('resolves the system rating for the current track', () => {
  mockUsePlayer.mockReturnValue({
    isRadioMode: false,
    currentRadioTrack: null,
    state: {
      currentTrack: { id: 't1', title: 'Playing In The Band' },
      currentShow: { identifier: 'gd72', date: '1972-08-27' },
    },
  });
  act(() => { TestRenderer.create(<Harness />); });
  expect(result).toEqual({ stars: 3, isUserRating: false }); // famous tier-1 version
});

it('user override wins and re-renders on change', () => {
  mockUsePlayer.mockReturnValue({
    isRadioMode: false,
    currentRadioTrack: null,
    state: {
      currentTrack: { id: 't1', title: 'Playing In The Band' },
      currentShow: { identifier: 'gd72', date: '1972-08-27' },
    },
  });
  act(() => { TestRenderer.create(<Harness />); });
  act(() => { setPerformanceUserRating('Playing In The Band', '1972-08-27', 1); });
  expect(result).toEqual({ stars: 1, isUserRating: true });
});

it('radio mode resolves via the radio track performance (user override applies)', () => {
  mockUsePlayer.mockReturnValue({
    isRadioMode: true,
    currentRadioTrack: {
      performance: { songTitle: 'Grateful Dead - Dark Star', showDate: '1969-02-27', showIdentifier: 'x', tier: 1 },
    },
    state: { currentTrack: null, currentShow: null },
  });
  act(() => { TestRenderer.create(<Harness />); });
  expect(result).toEqual({ stars: 3, isUserRating: false });
  act(() => { setPerformanceUserRating('Dark Star', '1969-02-27', 0); });
  expect(result).toEqual({ stars: 0, isUserRating: true });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/hooks/__tests__/usePerformanceRating.test.tsx -v` — Expected: FAIL (returns tier numbers, no re-render on store change).

- [ ] **Step 3: Rewrite the hook**

```ts
// src/hooks/usePerformanceRating.ts
import { useMemo } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { ResolvedRating, resolvePerformanceRating, tierToStars } from '../services/ratingResolver';
import { useUserRatingsVersion } from '../contexts/UserRatingsContext';

/**
 * Resolved rating (user override > system) for the currently playing track.
 * Used by FullPlayer; gold vs red is decided by ResolvedRating.isUserRating.
 */
export function usePerformanceRating(): ResolvedRating | null {
  const { state, isRadioMode, currentRadioTrack } = usePlayer();
  const version = useUserRatingsVersion();

  return useMemo(() => {
    if (isRadioMode && currentRadioTrack) {
      const perf = currentRadioTrack.performance;
      return (
        resolvePerformanceRating(perf.songTitle, perf.showDate) ??
        { stars: tierToStars(perf.tier), isUserRating: false }
      );
    }

    if (!state.currentTrack || !state.currentShow) return null;
    return resolvePerformanceRating(state.currentTrack.title, state.currentShow.date);
  }, [state.currentTrack?.id, state.currentShow?.date, isRadioMode, currentRadioTrack, version]);
}
```

- [ ] **Step 4: Update FullPlayer + MiniPlayer**

`src/components/FullPlayer.tsx` (~470-473) — replace:
```tsx
                  {performanceRating && (
                    <StarRating tier={performanceRating} size={16} />
                  )}
```
with a tappable resolved rating (FullPlayer is a detail surface; the star sits inside the show-link touchable, so stop propagation):
```tsx
                  <TouchableOpacity
                    onPress={(e: any) => {
                      e?.stopPropagation?.();
                      if (!state.currentTrack || !state.currentShow) return;
                      openRatingOverlay({
                        kind: 'performance',
                        songTitle: state.currentTrack.title,
                        date: state.currentShow.date,
                        venue: getVenueFromShow(state.currentShow),
                        showIdentifier: state.currentShow.identifier,
                      });
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Rate this performance"
                  >
                    <StarRating rating={performanceRating} showPlaceholder size={16} />
                  </TouchableOpacity>
```
Add near the other hooks at the top of the component: `const { openRatingOverlay } = useRatingOverlay();` and the import `import { useRatingOverlay } from '../contexts/RatingOverlayContext';`. (`getVenueFromShow` is already imported in FullPlayer — verify, it's used at ~line 460.)

`src/components/MiniPlayer.tsx` (~42-43) — delete the dead code:
```ts
  // Get performance rating from shared hook
  const performanceRating = usePerformanceRating();
```
and remove the now-unused `usePerformanceRating` import.

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/hooks/__tests__/usePerformanceRating.test.tsx -v` — Expected: PASS.
Run: `npm run typecheck` — Expected: clean.
Run: `npx jest -v` — Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePerformanceRating.ts src/components/FullPlayer.tsx src/components/MiniPlayer.tsx src/hooks/__tests__/usePerformanceRating.test.tsx
git commit -m "feat(ratings): resolved tappable rating in FullPlayer, drop MiniPlayer dead code

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Browse cards + SongPerformancesScreen (display gold, sort resolved, tappable rows)

**Files:**
- Modify: `src/components/ShowCard.tsx` (props 19-30; displayRating ~74; a11y label ~94; star render ~127-129)
- Modify: `src/components/HorizontalShowCard.tsx` (star render ~73-76)
- Modify: `src/components/SongCard.tsx` (rating lookup ~46; star render ~74)
- Modify: `src/screens/SongPerformancesScreen.tsx` (sort ~134-149; renderPerformanceItem ~201-229)
- Test: `src/__tests__/utils/performanceSort.test.ts` + extracted comparator in `src/utils/performanceSort.ts` (create both)

**Interfaces:**
- Consumes: `useResolvedShowRating`, `useResolvedPerformanceRating`, `useUserRatingsVersion` (Task 5); `resolvePerformanceRating` (Task 3); `useRatingOverlay` (Task 7).
- Produces:
  - `ShowCard` props: `overrideRating?: 1|2|3|null` **becomes** `overrideResolvedRating?: ResolvedRating | null` (undefined = "resolve the show rating internally"; a value or null = use it verbatim). New `onRatingPress?: () => void` — when set, the star slot is a tap target with placeholder.
  - `src/utils/performanceSort.ts`: `export function compareByResolvedRating(a: {date: string; stars: number | null}, b: {date: string; stars: number | null}, compareByDate: (a: string, b: string, dir: 'oldest') => number): number` — higher stars first, null last, date-oldest tie-break.

- [ ] **Step 1: Write the failing comparator test**

```ts
// src/__tests__/utils/performanceSort.test.ts
import { compareByResolvedRating } from '../../utils/performanceSort';
import { compareByDate } from '../../utils/sortComparators';
// NOTE: verify the compareByDate import path — SongPerformancesScreen imports it
// (grep `compareByDate` in src/). Adjust the import to the real module.

const p = (date: string, stars: number | null) => ({ date, stars });
const cmp = (a: ReturnType<typeof p>, b: ReturnType<typeof p>) =>
  compareByResolvedRating(a, b, compareByDate);

it('higher stars sort first', () => {
  expect(cmp(p('1970-01-01', 3), p('1971-01-01', 1))).toBeLessThan(0);
  expect(cmp(p('1970-01-01', 1), p('1971-01-01', 3))).toBeGreaterThan(0);
});

it('0-star overrides sort below 1 star but above unrated', () => {
  expect(cmp(p('1970-01-01', 0), p('1971-01-01', 1))).toBeGreaterThan(0);
  expect(cmp(p('1970-01-01', 0), p('1971-01-01', null))).toBeLessThan(0);
});

it('unrated sorts last; ties fall back to oldest date first', () => {
  expect(cmp(p('1970-01-01', null), p('1971-01-01', 2))).toBeGreaterThan(0);
  expect(cmp(p('1972-01-01', 2), p('1970-01-01', 2))).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run to verify it fails, then implement**

Run: `npx jest src/__tests__/utils/performanceSort.test.ts -v` — FAIL, module not found. (First check where `compareByDate` actually lives: `rg -n "export function compareByDate" src/` — fix the test import accordingly.)

```ts
// src/utils/performanceSort.ts
/**
 * Comparator for the "Rating (Highest First)" sort using resolved stars
 * (user overrides included). Higher stars first; explicit 0-star overrides
 * above unrated; unrated last; ties break by performance date, oldest first.
 */
export function compareByResolvedRating(
  a: { date: string; stars: number | null },
  b: { date: string; stars: number | null },
  compareByDate: (a: string, b: string, dir: 'oldest') => number,
): number {
  if (a.stars === null && b.stars === null) return compareByDate(a.date, b.date, 'oldest');
  if (a.stars === null) return 1;
  if (b.stars === null) return -1;
  if (a.stars !== b.stars) return b.stars - a.stars;
  return compareByDate(a.date, b.date, 'oldest');
}
```

Run: `npx jest src/__tests__/utils/performanceSort.test.ts -v` — Expected: PASS.

- [ ] **Step 3: Update ShowCard**

In `src/components/ShowCard.tsx`:
1. Imports: add `import type { ResolvedRating } from '../services/ratingResolver';` and `import { useResolvedShowRating } from '../contexts/UserRatingsContext';`
2. Props: replace `overrideRating?: 1 | 2 | 3 | null;` with:
```ts
  /** Override the resolved star rating (e.g. show a performance rating
   *  instead of the show rating). undefined = resolve internally. */
  overrideResolvedRating?: ResolvedRating | null;
  /** When set, the star slot becomes a tap target (with placeholder)
   *  that calls this — used on the SongPerformances detail surface. */
  onRatingPress?: () => void;
```
3. Replace line ~74:
```ts
  const resolvedShowRating = useResolvedShowRating(show.date);
  const displayRating = overrideResolvedRating !== undefined ? overrideResolvedRating : resolvedShowRating;
```
4. Accessibility label (~94): `const rating = displayRating ? \`${4 - displayRating} star rating\` : '';` → 
```ts
    const rating = displayRating
      ? displayRating.isUserRating
        ? `Your rating: ${displayRating.stars} stars`
        : `${displayRating.stars} star rating`
      : '';
```
5. Star render (~127-129) — replace:
```tsx
                {onRatingPress ? (
                  <TouchableOpacity
                    onPress={(e: any) => { e?.stopPropagation?.(); onRatingPress(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Rate this performance"
                  >
                    <StarRating rating={displayRating} showPlaceholder size={14} />
                  </TouchableOpacity>
                ) : (
                  displayRating && <StarRating rating={displayRating} size={14} />
                )}
```
6. Update the `React.memo` destructure (`overrideRating` → `overrideResolvedRating`, add `onRatingPress`).

- [ ] **Step 4: Update HorizontalShowCard and SongCard (display-only gold)**

`src/components/HorizontalShowCard.tsx` — add `import { useResolvedShowRating } from '../contexts/UserRatingsContext';`, add `const resolvedRating = useResolvedShowRating(show.date);` in the component body, replace (~73-76):
```tsx
              {show.classicTier && (
                <StarRating tier={show.classicTier} size={12} />
              )}
```
with:
```tsx
              {resolvedRating && <StarRating rating={resolvedRating} size={12} />}
```

`src/components/SongCard.tsx` — replace the import of `getSongPerformanceRating` with `import { useResolvedPerformanceRating } from '../contexts/UserRatingsContext';`, replace (~46):
```ts
  const performanceRating = getSongPerformanceRating(song.trackTitle, song.showDate);
```
with:
```ts
  const performanceRating = useResolvedPerformanceRating(song.trackTitle, song.showDate);
```
and the render (~74): `{performanceRating && <StarRating tier={performanceRating} size={14} />}` → `{performanceRating && <StarRating rating={performanceRating} size={14} />}`.

- [ ] **Step 5: Update SongPerformancesScreen**

1. Imports: `import { useUserRatingsVersion } from '../contexts/UserRatingsContext';`, `import { resolvePerformanceRating } from '../services/ratingResolver';`, `import { useRatingOverlay } from '../contexts/RatingOverlayContext';`, `import { compareByResolvedRating } from '../utils/performanceSort';`
2. In the component: `const ratingsVersion = useUserRatingsVersion();` and `const { openRatingOverlay } = useRatingOverlay();`
3. Replace the `ratingHighest` case (~134-149):
```ts
      case 'ratingHighest':
        // Resolved stars (user overrides win). Missing ratings sort last;
        // ties fall back to performance date, oldest first.
        return sorted
          .map(perf => ({
            perf,
            stars: resolvePerformanceRating(songTitle, perf.date)?.stars ?? null,
          }))
          .sort((a, b) => compareByResolvedRating(
            { date: a.perf.date, stars: a.stars },
            { date: b.perf.date, stars: b.stars },
            compareByDate,
          ))
          .map(({ perf }) => perf);
```
   Add `ratingsVersion` and `songTitle` to the `sortedPerformances` useMemo dependency array.
4. In `renderPerformanceItem` (~209-218), replace `overrideRating={item.rating}` with:
```tsx
        <ShowCard
          show={show}
          onPress={onPress}
          overrideResolvedRating={resolvePerformanceRating(songTitle, item.date)}
          overridePlayCount={songPlayCount}
          onRatingPress={() => openRatingOverlay({
            kind: 'performance',
            songTitle,
            date: item.date,
            venue: item.venue,
            showIdentifier: item.identifier,
          })}
        />
```
   Add `openRatingOverlay` and `ratingsVersion` to `renderPerformanceItem`'s useCallback deps (the version dep forces row refresh after rating).

- [ ] **Step 6: Typecheck, fix stragglers, full suite**

Run: `npm run typecheck` — grep any remaining `overrideRating` usages (`rg -n "overrideRating" src/`) and fix.
Run: `npx jest -v` — Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ShowCard.tsx src/components/HorizontalShowCard.tsx src/components/SongCard.tsx src/screens/SongPerformancesScreen.tsx src/utils/performanceSort.ts src/__tests__/utils/performanceSort.test.ts
git commit -m "feat(ratings): resolved ratings on browse cards, sorted performances, tappable rows

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Discover Classic Shows rail + Show of the Day use resolved ratings

**Files:**
- Modify: `src/screens/DiscoverLandingScreen.tsx` (classicShows memo ~145-177; SOTD tile stars ~281-283; Classic Shows rail cards)
- Modify: `src/contexts/ShowOfTheDayContext.tsx` (classic pool effect ~26-60)
- Create: `src/utils/classicShowsPool.ts`
- Test: `src/__tests__/utils/classicShowsPool.test.ts`

**Interfaces:**
- Consumes: `resolveShowRating` (Task 3), `useUserRatingsVersion` (Task 5), `subscribeUserRatings` (Task 2).
- Produces: `src/utils/classicShowsPool.ts`:

```ts
import { GratefulDeadShow } from '../types/show.types';
/** True when the show's RESOLVED rating (user override > system) is > 0 stars. */
export function isResolvedClassic(date: string): boolean;
/** All shows from showsByYear whose resolved rating is > 0 stars, deduped by primaryIdentifier. */
export function collectResolvedClassics(showsByYear: Record<string, GratefulDeadShow[]>): GratefulDeadShow[];
```

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/utils/classicShowsPool.test.ts
import { isResolvedClassic, collectResolvedClassics } from '../../utils/classicShowsPool';
import { setShowUserRating, resetStoreForTests } from '../../services/userRatingsStore';
import { GratefulDeadShow } from '../../types/show.types';

const show = (date: string, id: string, classicTier?: 1 | 2 | 3): GratefulDeadShow => ({
  date, year: date.slice(0, 4), versions: [], primaryIdentifier: id, title: id,
  ...(classicTier ? { classicTier } : {}),
});

beforeEach(() => resetStoreForTests());

describe('isResolvedClassic', () => {
  it('true for system classics (Cornell 77)', () => {
    expect(isResolvedClassic('1977-05-08')).toBe(true);
  });
  it('false for unrated shows', () => {
    expect(isResolvedClassic('1966-01-08')).toBe(false);
  });
  it('user rating adds a show to the classic pool', () => {
    setShowUserRating('1966-01-08', 2);
    expect(isResolvedClassic('1966-01-08')).toBe(true);
  });
  it('0-star override ejects a system classic', () => {
    setShowUserRating('1977-05-08', 0);
    expect(isResolvedClassic('1977-05-08')).toBe(false);
  });
});

describe('collectResolvedClassics', () => {
  it('collects by resolved rating, deduped', () => {
    setShowUserRating('1966-01-08', 3);
    const byYear = {
      '1966': [show('1966-01-08T00:00:00Z', 'a')],
      '1977': [show('1977-05-08T00:00:00Z', 'b', 1), show('1977-05-08T00:00:00Z', 'b', 1)],
    };
    const result = collectResolvedClassics(byYear);
    expect(result.map(s => s.primaryIdentifier).sort()).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run to verify it fails, then implement**

Run: `npx jest src/__tests__/utils/classicShowsPool.test.ts -v` — FAIL, module not found.

```ts
// src/utils/classicShowsPool.ts
import { GratefulDeadShow } from '../types/show.types';
import { resolveShowRating } from '../services/ratingResolver';

/** True when the show's RESOLVED rating (user override > system) is > 0 stars. */
export function isResolvedClassic(date: string): boolean {
  const resolved = resolveShowRating(date);
  return !!resolved && resolved.stars > 0;
}

/** All shows whose resolved rating is > 0 stars, deduped by primaryIdentifier. */
export function collectResolvedClassics(
  showsByYear: Record<string, GratefulDeadShow[]>,
): GratefulDeadShow[] {
  const result: GratefulDeadShow[] = [];
  const seen = new Set<string>();
  for (const yearShows of Object.values(showsByYear)) {
    for (const s of yearShows) {
      if (!seen.has(s.primaryIdentifier) && isResolvedClassic(s.date)) {
        result.push(s);
        seen.add(s.primaryIdentifier);
      }
    }
  }
  return result;
}
```

Run: `npx jest src/__tests__/utils/classicShowsPool.test.ts -v` — Expected: PASS.

- [ ] **Step 3: Update DiscoverLandingScreen**

1. Imports: `import { useUserRatingsVersion, useResolvedShowRating } from '../contexts/UserRatingsContext';`, `import { collectResolvedClassics } from '../utils/classicShowsPool';`
2. `const ratingsVersion = useUserRatingsVersion();`
3. In the `classicShows` memo (~145-177): replace the first collection loop (`if (s.classicTier && !seen.has(...))`) with `collectResolvedClassics(showsByYear)` seeding `allClassics`/`seen`, keep the GRATEFUL_DEAD_101 merge and download-sort unchanged:
```ts
  const classicShows = useMemo(() => {
    const allClassics: GratefulDeadShow[] = collectResolvedClassics(showsByYear);
    const seen = new Set<string>(allClassics.map(s => s.primaryIdentifier));
    // ... existing GRATEFUL_DEAD_101_DATES loop and sort, unchanged ...
  }, [showsByYear, ratingsVersion]);
```
4. SOTD tile (~281-283): the tile renders `show.classicTier` directly. Extract the date first (the component has `show` from `useShowOfTheDay()`): add `const sotdResolvedRating = useResolvedShowRating(show?.date);` near the other hooks, then replace:
```tsx
                      {show.classicTier && (
                        <StarRating tier={show.classicTier} size={12} />
                      )}
```
with:
```tsx
                      {sotdResolvedRating && <StarRating rating={sotdResolvedRating} size={12} />}
```

- [ ] **Step 4: Update ShowOfTheDayContext**

In `src/contexts/ShowOfTheDayContext.tsx`, replace the classic-pool effect body (~27-60). Change the membership test from `classicDates.has(normalizeDate(show.date))` to `isResolvedClassic(show.date)`, drop the `ALL_CLASSIC_SHOWS` import, and re-run the effect when ratings change:

```ts
import { isResolvedClassic } from '../utils/classicShowsPool';
import { useUserRatingsVersion } from './UserRatingsContext';
// inside the provider:
  const ratingsVersion = useUserRatingsVersion();
  useEffect(() => {
    if (!showsByYear || showsLoading) return;

    const matchedShows: GratefulDeadShow[] = [];
    Object.values(showsByYear).forEach(yearShows => {
      yearShows.forEach(show => {
        if (isResolvedClassic(show.date)) {
          matchedShows.push(show);
        }
      });
    });

    if (matchedShows.length === 0) {
      setError('No classic shows available');
      setIsLoading(false);
      return;
    }

    setClassicShows(matchedShows);

    // Keep the current pick if it's still in the pool (don't churn SOTD on
    // every rating change); otherwise select a random one.
    setShow(prev => {
      if (prev && matchedShows.some(s => s.primaryIdentifier === prev.primaryIdentifier)) {
        return prev;
      }
      return matchedShows[Math.floor(Math.random() * matchedShows.length)];
    });
    setIsLoading(false);
  }, [showsByYear, showsLoading, ratingsVersion]);
```

IMPORTANT ORDERING: `ShowOfTheDayProvider` now calls `useUserRatingsVersion()`, which touches only the module store — no provider dependency, so App.tsx provider order does not matter for it.

- [ ] **Step 5: Typecheck + full suite**

Run: `npm run typecheck` && `npx jest -v` — Expected: clean/PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/classicShowsPool.ts src/__tests__/utils/classicShowsPool.test.ts src/screens/DiscoverLandingScreen.tsx src/contexts/ShowOfTheDayContext.tsx
git commit -m "feat(ratings): classic rail and show-of-the-day honor user overrides

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Radio pool honors user ratings

**Files:**
- Create: `src/services/radioPool.ts`
- Modify: `src/services/radioService.ts` (refillQueue ~116-130; getTotalPerformances ~346-348; add ratings-change subscription)
- Test: `src/services/__tests__/radioPool.test.ts`

**Interfaces:**
- Consumes: `TIER_1_SONG_PERFORMANCES`, `RatedSongPerformance` from `src/data/songPerformanceRatings.ts`; `getUserRatings`, `subscribeUserRatings` (Task 2); `resolvePerformanceRating` (Task 3).
- Produces: `src/services/radioPool.ts`:

```ts
import { RatedSongPerformance } from '../data/songPerformanceRatings';
/**
 * Radio pool = performances whose RESOLVED stars === 3:
 * system tier-1 entries not downgraded by the user, plus user 3-star
 * performances that carry a showIdentifier (needed to resolve audio).
 */
export function buildRadioPool(): RatedSongPerformance[];
```

- [ ] **Step 1: Write the failing test**

```ts
// src/services/__tests__/radioPool.test.ts
import { buildRadioPool } from '../radioPool';
import { TIER_1_SONG_PERFORMANCES } from '../../data/songPerformanceRatings';
import { setPerformanceUserRating, resetStoreForTests } from '../../services/userRatingsStore';

beforeEach(() => resetStoreForTests());

it('with no overrides, pool equals the system tier-1 list', () => {
  expect(buildRadioPool()).toHaveLength(TIER_1_SONG_PERFORMANCES.length);
});

it('downgrading a system tier-1 performance removes it from the pool', () => {
  const victim = TIER_1_SONG_PERFORMANCES[0];
  setPerformanceUserRating(victim.songTitle, victim.showDate, 1);
  const pool = buildRadioPool();
  expect(pool).toHaveLength(TIER_1_SONG_PERFORMANCES.length - 1);
  expect(pool.find(p => p.songTitle === victim.songTitle && p.showDate === victim.showDate)).toBeUndefined();
});

it('a user 3-star rating with an identifier joins the pool as tier 1', () => {
  setPerformanceUserRating('My Sleeper Jam', '1980-05-01', 3, 'gd1980-05-01.sbd');
  const pool = buildRadioPool();
  const added = pool.find(p => p.songTitle === 'My Sleeper Jam');
  expect(added).toBeDefined();
  expect(added!.tier).toBe(1);
  expect(added!.showIdentifier).toBe('gd1980-05-01.sbd');
});

it('a user 3-star rating WITHOUT an identifier is excluded (cannot resolve audio)', () => {
  setPerformanceUserRating('Mystery Jam', '1980-05-02', 3);
  expect(buildRadioPool().find(p => p.songTitle === 'Mystery Jam')).toBeUndefined();
});

it('re-rating a system tier-1 as 3 stars does not duplicate it', () => {
  const perf = TIER_1_SONG_PERFORMANCES[0];
  setPerformanceUserRating(perf.songTitle, perf.showDate, 3, perf.showIdentifier);
  expect(buildRadioPool()).toHaveLength(TIER_1_SONG_PERFORMANCES.length);
});
```

- [ ] **Step 2: Run to verify it fails, then implement**

Run: `npx jest src/services/__tests__/radioPool.test.ts -v` — FAIL, module not found.

```ts
// src/services/radioPool.ts
import {
  RatedSongPerformance,
  TIER_1_SONG_PERFORMANCES,
} from '../data/songPerformanceRatings';
import {
  getUserRatings,
  getActivePerformanceRating,
  performanceRatingKey,
} from './userRatingsStore';

/**
 * Radio pool = performances whose RESOLVED stars === 3.
 * - System tier-1 entries stay unless the user rated them below 3 stars.
 * - User 3-star ratings join as synthetic tier-1 entries, but only when
 *   they carry a showIdentifier (radio must fetch the recording); entries
 *   rated from surfaces without an identifier are display-only.
 */
export function buildRadioPool(): RatedSongPerformance[] {
  const systemKeys = new Set(
    TIER_1_SONG_PERFORMANCES.map(p => performanceRatingKey(p.songTitle, p.showDate))
  );

  const pool = TIER_1_SONG_PERFORMANCES.filter(perf => {
    const override = getActivePerformanceRating(perf.songTitle, perf.showDate);
    return !override || override.stars === 3;
  });

  const { performances } = getUserRatings();
  for (const [key, entry] of Object.entries(performances)) {
    const isTombstoned = entry.deletedAt !== undefined && entry.deletedAt >= entry.ratedAt;
    if (isTombstoned || entry.stars !== 3) continue;
    if (!entry.showIdentifier || !entry.songTitle) continue;
    if (systemKeys.has(key)) continue; // already in pool via the system list
    pool.push({
      songTitle: entry.songTitle,
      showDate: key.split('|')[1],
      showIdentifier: entry.showIdentifier,
      tier: 1,
      notes: 'Your 3-star rating',
    });
  }

  return pool;
}
```

Run: `npx jest src/services/__tests__/radioPool.test.ts -v` — Expected: PASS.

- [ ] **Step 3: Wire into radioService**

In `src/services/radioService.ts`:
1. Imports: remove `TIER_1_SONG_PERFORMANCES` from the import (keep `RatedSongPerformance`), add:
```ts
import { buildRadioPool } from './radioPool';
import { subscribeUserRatings } from './userRatingsStore';
```
2. `refillQueue()` (~116-130) — replace both uses of `TIER_1_SONG_PERFORMANCES` with a fresh pool:
```ts
  private refillQueue(): void {
    const pool = buildRadioPool();
    // Filter out already-played performances
    const available = pool.filter(
      perf => !this.playedPerformances.has(this.getPerformanceKey(perf))
    );

    if (available.length === 0) {
      // All played - reset and start over
      this.playedPerformances.clear();
      this.shuffledQueue = shuffleArray(pool);
    } else {
      this.shuffledQueue = shuffleArray(available);
    }
    this.queueIndex = 0;
  }
```
3. `getTotalPerformances()` (~346-348): `return buildRadioPool().length;`
4. In the constructor area (top of the class body — add a constructor), drop stale queue/prefetch state when ratings change so downgraded tracks stop playing next:
```ts
  constructor() {
    // Rating overrides change the tier-1 pool; rebuild lazily on next pull.
    // Keep playedPerformances so the session's no-repeat behavior survives.
    subscribeUserRatings(() => {
      this.shuffledQueue = [];
      this.queueIndex = 0;
      this.prefetchedTracks = [];
    });
  }
```

- [ ] **Step 4: Typecheck + full suite**

Run: `npm run typecheck` && `npx jest -v` — Expected: clean/PASS. (`resetSession` and the prefetch paths compile unchanged; they operate on the queue, which now derives from the pool.)

- [ ] **Step 5: Commit**

```bash
git add src/services/radioPool.ts src/services/radioService.ts src/services/__tests__/radioPool.test.ts
git commit -m "feat(ratings): radio pool includes user 3-star picks, drops downgraded tier-1s

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: Share cards use resolved ratings

**Files:**
- Modify: `src/services/shareService.ts` (ShareItem `show`/`song` variants, ~lines 12-30)
- Modify: `src/components/share/ShareCard.tsx` (star render ~59)
- Modify: every ShareItem construction site — find them with `rg -n "kind: 'show'|kind: 'song'" src/ --type tsx --type ts | grep -v shareService` (known: `src/components/FullPlayer.tsx` handleShare ~175; ShowDetailScreen's share handler; check ShareTray/ShareCard fixtures and any screen constructing ShareItems)
- Test: covered by typecheck + existing share tests (`src/services/__tests__/shareService.collection.test.ts` must keep passing)

**Interfaces:**
- Consumes: `resolveShowRating` / `resolvePerformanceRating` (Task 3).
- Produces: `ShareItem` show/song variants gain `isUserRating?: boolean` (default false). `tier`/`rating` fields keep their `1|2|3|null` type (tier scale) so the server-side OG path is untouched — a 0-star override shares as `null` (no stars on the card). **Known limitation (spec):** server-rendered OG images keep system ratings.

- [ ] **Step 1: Extend the ShareItem type**

In `src/services/shareService.ts`, add to the `show` variant after `tier`:
```ts
      isUserRating?: boolean;     // tier came from the user's override (gold on local card)
```
and to the `song` variant after `rating`:
```ts
      isUserRating?: boolean;     // rating came from the user's override (gold on local card)
```

- [ ] **Step 2: Update ShareCard**

In `src/components/share/ShareCard.tsx` (~59), the card currently renders `{tier !== null && <StarRating tier={tier} size={14} />}` (where `tier` is derived from `item.tier` or `item.rating` — read the top of the file for the exact local name). Replace with:
```tsx
              {tier !== null && (
                <StarRating
                  rating={{ stars: (4 - tier) as 1 | 2 | 3, isUserRating: item.isUserRating ?? false }}
                  size={14}
                />
              )}
```
(If the local derivation names differ, adapt — the rule: stars = `4 - tier`, gold iff `isUserRating`.)

- [ ] **Step 3: Update ShareItem constructors to pass resolved values**

For each construction site found by the grep, apply this transformation (imports: `resolveShowRating`, `resolvePerformanceRating` from `../services/ratingResolver` — adjust relative path):

For `kind: 'show'` items (was `tier: classicTier` or similar):
```ts
      const resolved = resolveShowRating(show.date);
      // in the item literal:
      tier: resolved && resolved.stars > 0 ? ((4 - resolved.stars) as 1 | 2 | 3) : null,
      isUserRating: resolved?.isUserRating ?? false,
```
For `kind: 'song'` items (was `rating: performanceRating` or a tier fallback):
```ts
      const resolved = resolvePerformanceRating(track.title, show.date);
      // in the item literal:
      rating: resolved && resolved.stars > 0 ? ((4 - resolved.stars) as 1 | 2 | 3) : null,
      isUserRating: resolved?.isUserRating ?? false,
```
In FullPlayer's `handleShare`, `performanceRating` is now already a `ResolvedRating | null` (Task 9) — use it directly instead of re-resolving.

- [ ] **Step 4: Typecheck + full suite**

Run: `npm run typecheck` && `npx jest -v` — Expected: clean/PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/shareService.ts src/components/share/ShareCard.tsx src/components/FullPlayer.tsx $(git diff --name-only)
git commit -m "feat(ratings): share cards render resolved ratings, gold for user overrides

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: Supabase migration for user_ratings

**Files:**
- Create: `supabase/migrations/20260729120000_user_ratings_table.sql`
- Test: none (SQL reviewed, applied manually per project workflow — migrations in this repo are reviewable deliverables, see `supabase/migrations/README.md`)

**Interfaces:**
- Consumes: nothing from code.
- Produces: table `public.user_ratings` matching `userRatingsCloudService` (Task 4): columns `user_id`, `shows`, `performances`, `updated_at`.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260729120000_user_ratings_table.sql
--
-- WHAT: Creates public.user_ratings — one JSONB row per user holding their
--   personal star-rating overrides for shows and song performances.
--   Written by src/services/userRatingsCloudService.ts (whole-blob upsert
--   keyed on user_id, same pattern as user_favorites / user_play_counts).
--
-- SHAPE: shows/performances are maps of key -> entry:
--   shows:        { "YYYY-MM-DD": { stars, ratedAt, deletedAt? } }
--   performances: { "<normalized title>|YYYY-MM-DD":
--                   { stars, ratedAt, deletedAt?, songTitle?, showIdentifier? } }
--   stars is 0..3 (0 = explicit zero rating suppressing the system rating);
--   deletedAt >= ratedAt marks a tombstone (reset), pruned client-side
--   after 30 days.
--
-- SIZE: jsonb size checks are a server-side backstop against oversized
--   blobs pushed straight at the anon/authed API (mirrors the
--   support_requests limits rationale). ~100 bytes/entry means the caps
--   below allow roughly 2.5k show + 10k performance overrides — far beyond
--   plausible use.
--
-- DELETION: user_id references auth.users ON DELETE CASCADE, so the
--   existing delete_user() SECURITY DEFINER function (which deletes the
--   auth.users row) cleans this table up automatically — no function
--   change needed.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. This file has not been run against any database; it
-- is a reviewable deliverable applied manually.

create table if not exists public.user_ratings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  shows jsonb not null default '{}'::jsonb,
  performances jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_ratings_shows_size
    check (pg_column_size(shows) <= 262144),        -- 256 KB
  constraint user_ratings_performances_size
    check (pg_column_size(performances) <= 1048576) -- 1 MB
);

alter table public.user_ratings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_ratings'
      and policyname = 'Users can read own ratings'
  ) then
    create policy "Users can read own ratings"
      on public.user_ratings for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_ratings'
      and policyname = 'Users can insert own ratings'
  ) then
    create policy "Users can insert own ratings"
      on public.user_ratings for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_ratings'
      and policyname = 'Users can update own ratings'
  ) then
    create policy "Users can update own ratings"
      on public.user_ratings for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_ratings'
      and policyname = 'Users can delete own ratings'
  ) then
    create policy "Users can delete own ratings"
      on public.user_ratings for delete
      using (auth.uid() = user_id);
  end if;
end $$;
```

Before finalizing, open one existing table-creation SQL (`supabase/create_collections_tables.sql`) and confirm the policy/trigger house style matches (e.g. if they add an `updated_at` trigger function, mirror it; the cloud service sets `updated_at` explicitly so a trigger is optional — follow the house style).

- [ ] **Step 2: Verify SQL syntax locally if possible**

If the Supabase CLI is available (`supabase --version`), run `supabase db lint` or at minimum re-read the file for typos. Do NOT apply it — migrations are applied manually by the user (per project memory: "migrations pending manual apply").

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260729120000_user_ratings_table.sql
git commit -m "feat(ratings): user_ratings table migration (manual apply)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 15: Final verification sweep

**Files:** none new.

- [ ] **Step 1: Full test suite + both typechecks**

Run: `npx jest -v` — Expected: ALL suites pass.
Run: `npm run typecheck && npm run typecheck:web` — Expected: clean.

- [ ] **Step 2: Grep for leftovers**

```bash
rg -n "overrideRating[^R]" src/          # must be empty (renamed in Task 10)
rg -n "StarRating tier=" src/            # remaining legacy call sites — each must be intentional
```
Remaining legal `tier=` call sites after this plan: none in components/screens (all converted); `StarRating`'s internal legacy path stays for safety. If the grep shows a converted-surface straggler, fix it with the matching `useResolved*` hook.

- [ ] **Step 3: Manual smoke test (launch the app)**

Run: `npm run web` and verify in the browser:
1. Open a classic show (e.g. 1977-05-08) → red stars in hero; tap → overlay opens showing "Community rating"; pick 1 star → hero turns gold with 1 star; Classic Shows rail still contains it.
2. Set 0 stars → hero shows single gold outline star; the show disappears from the Classic Shows rail on Discover.
3. Reset → red system stars return; rail membership returns.
4. Open an unrated show → 3 dim placeholder stars in hero; rate it 2 → gold; it appears in the Classic Shows rail.
5. Track row: tap a track's stars/placeholder → overlay shows song title; rate → row turns gold; "Rating (Highest First)" sort on a SongPerformances screen reflects it.
6. Reload the page → ratings persist (AsyncStorage/localStorage).

- [ ] **Step 4: Commit any smoke-test fixes, then hand off**

Use the superpowers:finishing-a-development-branch skill (or report completion if executing inline).

---

## Self-Review Notes (already applied)

- **Spec coverage:** data model + semantics (Tasks 2-3), display (Task 6), overlay (Task 7), detail-surface tap targets (Tasks 8-10), sorting (Task 10), classic rail + SOTD (Task 11), radio (Task 12), share cards + OG limitation (Task 13), persistence + sync + merge (Tasks 4-5), migration + account deletion note (Task 14), tests throughout.
- **Type consistency:** `ResolvedRating {stars, isUserRating}` defined once in Task 3, consumed by Tasks 6-13. `UserStars = 0|1|2|3` from Task 2. `performanceRatingKey` used by store, radio pool.
- **Deliberate deviations from earlier exploration notes:** `delete_user_function.sql` needs NO change (it deletes `auth.users` and relies on `on delete cascade`, which the new FK provides — documented in the migration header). `ShowCard.overrideRating` is renamed, not preserved, because its type must change; Task 10 updates its single call site.
```
