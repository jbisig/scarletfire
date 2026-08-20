# Source Preference Engine Implementation Plan (Tagging PR 2 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every time the app picks a recording to play for a show, it picks the user's preferred kind (Most Popular / Soundboard / Audience / Matrix / FM), remembers per-show overrides as synced pins, explains any fallback, and offers once to make a repeated override the global default.

**Architecture:** A module-level `sourcePrefsStore` (preference + pins + nudge answers; subscribe/version/merge, mirroring `userRatingsStore`) wrapped by `SourcePrefsContext` (AsyncStorage + debounced Supabase blob in a new `user_preferences` table). A pure `recordingRanker` scores a show's recordings at read time; a pure `recordingResolver` applies pin → session constraint → preference → popular with a fallback ladder; a thin store-aware `sourceSelection` module is the single seam the play paths call (`showDetailParams`, `PlayerContext`, `ShowDetailScreen`). UI: a Settings "Playback" section, Default/Pinned markers + "Use default" + inline nudge in `VersionPicker`, and a fallback toast on the show screen.

**Tech Stack:** React Native / Expo 54, TypeScript strict, Jest (`jest-expo`; `react-test-renderer` for components), AsyncStorage, Supabase (JSONB row per user, RLS).

**Spec:** `docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md` — Part 2. PR 1 (catalog & parser) is merged at `51fc07f`; PR 3 (tags & filter tray) follows this one.

## Global Constraints

- **Preference values:** `SourcePreference = 'popular' | 'sbd' | 'aud' | 'matrix' | 'fm'`, default `'popular'`. Format ids reuse `RecordingFormat`; lineage ids reuse `LineageTag` (from PR 1).
- **Resolver precedence is fixed:** (1) active user pin for the date if its identifier exists in the catalog versions → (2) session constraint → (3) global preference as `{ format: preference }` → (4) unconstrained. At steps 2–4 the editorial pin (`editorialPins[date]` from `src/data/recordingOverrides.ts`) wins **only if it is among the remaining candidates**; otherwise the top-ranked candidate wins.
- **Fallback ladder order is fixed:** drop quality modifiers (`16track`, `lowgen`) → drop lineage identity (`betty`, `miller`) → drop format → unconstrained. Stop at the first non-empty candidate set; report `requested` and `relaxed`.
- **Ranker formula** (`RANK_WEIGHTS`, all in one object): `pop = log10(downloads+1) / max log10(downloads+1) within the show` (0 when every recording has 0 downloads); `rating = ((avgRating·numReviews) + 4.0·20) / (numReviews + 20) / 5` with a missing rating treated as `numReviews = 0`; `lineage = min(0.12, betty .08 + miller .04 + 16track .04 + lowgen .02)`; `score = 0.55·pop + 0.30·rating + lineage`. Ties: downloads desc, then identifier asc. (recalibrated in Task 12)
- **Pins are remembered** (`pins[date] = { identifier, format, pinnedAt, deletedAt? }`), synced, tombstoned on clear, pruned after 30 days. The pin stores the recording's `format` so the nudge never needs a catalog lookup.
- **Nudge rule:** the three most recent active pins (by `pinnedAt`) share format `F`, `F !== preference`, `F !== 'unknown'`, and `nudgeAnswers[F]` is unset → offer once; either answer is stored and the offer never returns for `F`.
- **Merge rules:** `preference` — newer `preferenceSetAt` wins (ties keep local); `pins` — per date, newer `max(pinnedAt, deletedAt)` wins; `nudgeAnswers` — union, `'yes'` wins a conflict.
- **Radio is untouched** (`radioService` keys on `perf.showIdentifier`). `ShowOfTheDayContext`'s two `primaryIdentifier` reads are identity comparisons and stay as they are. `HomeScreen.getPrimaryDownloads` stays.
- **Storage key:** `STORAGE_KEYS.SOURCE_PREFS = '@source_prefs'`. **Table:** `SUPABASE_TABLES.USER_PREFERENCES = 'user_preferences'` (the cloud service uses the constant).
- **Migration is a reviewable file only.** Do NOT run `supabase db push` from this plan — applying to production is the user's call; the final task leaves an apply note.
- **Route param** `sourceConstraint?: string` is a comma-separated list of tag ids (e.g. `matrix` or `sbd,betty`); parse/stringify live in `recordingResolver.ts`.
- Tests: `npx jest <path>` (Jest 29 rejects `-v`; use `--verbose`). Typecheck: `npm run typecheck`. Both must pass before each commit. `npm run typecheck:web` baseline is 50 errors (48 in `expo-file-system`'s shim + `PlayerContext.tsx:489/492`) — add none.
- Component tests use `react-test-renderer` inside `act`; wrap components that use `useSafeAreaInsets` in `SafeAreaProvider` with `initialMetrics`. Use `findByProps`/`findAllByProps(…, { deep: false })` for `testID` counts.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Work on branch `feat/source-preference` off `main` in a worktree OUTSIDE `.worktrees/` (Jest ignores that path); copy `.env` and `.env.local` into the worktree.

---

### Task 1: Types, constants, registry keys

**Files:**
- Create: `src/constants/sourcePreferences.ts`
- Modify: `src/constants/tags.ts` (add `SourceTagId`, `sourceTagLabel`)
- Modify: `src/constants/registry.ts:11-26, 43-47`
- Test: `src/constants/__tests__/sourcePreferences.test.ts`

**Interfaces:**
- Consumes: `RecordingFormat`, `LineageTag` from `src/types/show.types.ts`; `FORMAT_LABELS`, `LINEAGE_LABELS` from `src/constants/tags.ts`.
- Produces:
  - `export type SourcePreference = 'popular' | 'sbd' | 'aud' | 'matrix' | 'fm'`
  - `export const DEFAULT_SOURCE_PREFERENCE: SourcePreference = 'popular'`
  - `export const SOURCE_PREFERENCE_OPTIONS: ReadonlyArray<{ value: SourcePreference; label: string; description: string }>`
  - `export function sourcePreferenceLabel(p: SourcePreference): string`
  - from `tags.ts`: `export type SourceTagId = Exclude<RecordingFormat, 'unknown'> | LineageTag`, `export function sourceTagLabel(id: SourceTagId): string`, `export function isSourceTagId(value: string): value is SourceTagId`
  - `STORAGE_KEYS.SOURCE_PREFS`, `SUPABASE_TABLES.USER_PREFERENCES`

- [ ] **Step 1: Write the failing test**

```ts
// src/constants/__tests__/sourcePreferences.test.ts
import {
  DEFAULT_SOURCE_PREFERENCE,
  SOURCE_PREFERENCE_OPTIONS,
  sourcePreferenceLabel,
} from '../sourcePreferences';
import { sourceTagLabel, isSourceTagId } from '../tags';
import { STORAGE_KEYS, SUPABASE_TABLES } from '../registry';

describe('source preference constants', () => {
  it('defaults to Most Popular and lists the five options in spec order', () => {
    expect(DEFAULT_SOURCE_PREFERENCE).toBe('popular');
    expect(SOURCE_PREFERENCE_OPTIONS.map(o => o.value)).toEqual(['popular', 'sbd', 'aud', 'matrix', 'fm']);
    expect(SOURCE_PREFERENCE_OPTIONS.map(o => o.label)).toEqual([
      'Most Popular', 'Soundboard', 'Audience', 'Matrix', 'FM Broadcast',
    ]);
    SOURCE_PREFERENCE_OPTIONS.forEach(o => expect(o.description.length).toBeGreaterThan(10));
  });

  it('labels a preference', () => {
    expect(sourcePreferenceLabel('matrix')).toBe('Matrix');
    expect(sourcePreferenceLabel('popular')).toBe('Most Popular');
  });

  it('labels source tag ids from the format/lineage tables and validates ids', () => {
    expect(sourceTagLabel('sbd')).toBe('Soundboard');
    expect(sourceTagLabel('betty')).toBe('Betty Board');
    expect(isSourceTagId('matrix')).toBe(true);
    expect(isSourceTagId('lowgen')).toBe(true);
    expect(isSourceTagId('unknown')).toBe(false);
    expect(isSourceTagId('nope')).toBe(false);
  });

  it('registers the storage key and table name', () => {
    expect(STORAGE_KEYS.SOURCE_PREFS).toBe('@source_prefs');
    expect(SUPABASE_TABLES.USER_PREFERENCES).toBe('user_preferences');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest src/constants/__tests__/sourcePreferences.test.ts`
Expected: FAIL — `Cannot find module '../sourcePreferences'`.

- [ ] **Step 3: Implement**

```ts
// src/constants/sourcePreferences.ts
/**
 * The user's global recording preference. 'popular' = run the ranker
 * unconstrained; the others constrain candidates to one format first and
 * fall back (with a notice) when a show has none.
 */
export type SourcePreference = 'popular' | 'sbd' | 'aud' | 'matrix' | 'fm';

export const DEFAULT_SOURCE_PREFERENCE: SourcePreference = 'popular';

export const SOURCE_PREFERENCE_OPTIONS: ReadonlyArray<{
  value: SourcePreference;
  label: string;
  description: string;
}> = [
  { value: 'popular', label: 'Most Popular', description: 'The best-rated, most-played recording of each show' },
  { value: 'sbd', label: 'Soundboard', description: 'Straight from the board whenever one exists' },
  { value: 'aud', label: 'Audience', description: 'Room sound from the taper section' },
  { value: 'matrix', label: 'Matrix', description: 'Soundboard and audience blended together' },
  { value: 'fm', label: 'FM Broadcast', description: 'Radio simulcasts when a show has one' },
];

export function sourcePreferenceLabel(preference: SourcePreference): string {
  return SOURCE_PREFERENCE_OPTIONS.find(o => o.value === preference)?.label ?? 'Most Popular';
}
```

Append to `src/constants/tags.ts`:

```ts
/** A filterable/constrainable source tag: any real format or any lineage tag. */
export type SourceTagId = Exclude<RecordingFormat, 'unknown'> | LineageTag;

const SOURCE_TAG_IDS: ReadonlySet<string> = new Set<string>([
  'sbd', 'aud', 'matrix', 'fm', 'betty', 'miller', '16track', 'lowgen',
]);

export function isSourceTagId(value: string): value is SourceTagId {
  return SOURCE_TAG_IDS.has(value);
}

export function sourceTagLabel(id: SourceTagId): string {
  return id in FORMAT_LABELS
    ? FORMAT_LABELS[id as RecordingFormat]
    : LINEAGE_LABELS[id as LineageTag];
}
```

In `src/constants/registry.ts` add to `STORAGE_KEYS` (after `USER_RATINGS`):
```ts
  /** Global recording preference + per-show pins + nudge answers */
  SOURCE_PREFS: '@source_prefs',
```
and to `SUPABASE_TABLES`:
```ts
  USER_RATINGS: 'user_ratings',
  USER_PREFERENCES: 'user_preferences',
```

- [ ] **Step 4: Run the test, typecheck, commit**

Run: `npx jest src/constants/__tests__/sourcePreferences.test.ts` → PASS. `npm run typecheck` → clean.

```bash
git add src/constants/sourcePreferences.ts src/constants/tags.ts src/constants/registry.ts src/constants/__tests__/sourcePreferences.test.ts
git commit -m "feat(source-prefs): preference options, source tag ids, storage/table keys

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `sourcePrefsStore` (module-level store)

**Files:**
- Create: `src/services/sourcePrefsStore.ts`
- Test: `src/services/__tests__/sourcePrefsStore.test.ts`

**Interfaces:**
- Consumes: `SourcePreference`, `DEFAULT_SOURCE_PREFERENCE` (Task 1); `RecordingFormat`.
- Produces:
  ```ts
  export interface SourcePin { identifier: string; format: RecordingFormat; pinnedAt: number; deletedAt?: number }
  export type NudgeAnswer = 'yes' | 'no';
  export interface SourcePrefs {
    preference: SourcePreference; preferenceSetAt: number;
    pins: Record<string, SourcePin>;             // key: YYYY-MM-DD
    nudgeAnswers: Partial<Record<RecordingFormat, NudgeAnswer>>;
  }
  export const EMPTY_SOURCE_PREFS: SourcePrefs
  export function getSourcePrefs(): SourcePrefs
  export function getSourcePrefsVersion(): number
  export function replaceSourcePrefs(next: SourcePrefs): void
  export function setSourcePreference(p: SourcePreference, now?: number): void
  export function getActivePin(date: string): SourcePin | null
  export function setPin(date: string, identifier: string, format: RecordingFormat, now?: number): void
  export function clearPin(date: string, now?: number): void
  export function answerNudge(format: RecordingFormat, answer: NudgeAnswer): void
  export function getPendingNudge(prefs?: SourcePrefs): RecordingFormat | null
  export function subscribeSourcePrefs(listener: () => void): () => void
  export function mergeSourcePrefs(local: SourcePrefs, remote: SourcePrefs): SourcePrefs
  export function pruneSourcePrefsTombstones(prefs: SourcePrefs, now?: number): SourcePrefs
  export function normalizeSourcePrefs(input: unknown): SourcePrefs   // tolerant parse of stored/cloud JSON
  export function resetStoreForTests(): void
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/sourcePrefsStore.test.ts
import {
  EMPTY_SOURCE_PREFS,
  getSourcePrefs,
  getSourcePrefsVersion,
  replaceSourcePrefs,
  setSourcePreference,
  getActivePin,
  setPin,
  clearPin,
  answerNudge,
  getPendingNudge,
  subscribeSourcePrefs,
  mergeSourcePrefs,
  pruneSourcePrefsTombstones,
  normalizeSourcePrefs,
  resetStoreForTests,
  SourcePrefs,
} from '../sourcePrefsStore';

beforeEach(() => resetStoreForTests());

describe('preference', () => {
  it('defaults to popular and records when it was set', () => {
    expect(getSourcePrefs().preference).toBe('popular');
    setSourcePreference('matrix', 100);
    expect(getSourcePrefs().preference).toBe('matrix');
    expect(getSourcePrefs().preferenceSetAt).toBe(100);
  });
});

describe('pins', () => {
  it('stores an active pin keyed by date-only and reads it back with either date form', () => {
    setPin('1977-05-08T00:00:00Z', 'gd77.sbd.hicks', 'sbd', 10);
    expect(getActivePin('1977-05-08')).toEqual({ identifier: 'gd77.sbd.hicks', format: 'sbd', pinnedAt: 10 });
    expect(getActivePin('1977-05-08T00:00:00Z')?.identifier).toBe('gd77.sbd.hicks');
  });

  it('clearPin tombstones (inactive but kept for sync); re-pinning reactivates', () => {
    setPin('1977-05-08', 'a', 'sbd', 10);
    clearPin('1977-05-08', 20);
    expect(getActivePin('1977-05-08')).toBeNull();
    expect(getSourcePrefs().pins['1977-05-08']).toEqual({ identifier: 'a', format: 'sbd', pinnedAt: 10, deletedAt: 20 });
    setPin('1977-05-08', 'b', 'aud', 30);
    expect(getActivePin('1977-05-08')).toEqual({ identifier: 'b', format: 'aud', pinnedAt: 30 });
  });

  it('clearing a date with no pin is a no-op (no tombstone, no notify)', () => {
    const listener = jest.fn();
    subscribeSourcePrefs(listener);
    clearPin('1966-01-01', 5);
    expect(getSourcePrefs().pins).toEqual({});
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('subscribe/version', () => {
  it('notifies and bumps version on every mutation', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeSourcePrefs(listener);
    const v0 = getSourcePrefsVersion();
    setSourcePreference('aud', 1);
    setPin('1977-05-08', 'a', 'aud', 2);
    answerNudge('aud', 'no');
    expect(listener).toHaveBeenCalledTimes(3);
    expect(getSourcePrefsVersion()).toBe(v0 + 3);
    unsubscribe();
    clearPin('1977-05-08', 3);
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('nudge', () => {
  it('offers when the last three active pins share a format that differs from the preference', () => {
    setPin('1977-05-08', 'a', 'matrix', 1);
    setPin('1977-05-09', 'b', 'matrix', 2);
    expect(getPendingNudge()).toBeNull();
    setPin('1972-08-27', 'c', 'matrix', 3);
    expect(getPendingNudge()).toBe('matrix');
  });

  it('uses the three MOST RECENT pins, ignores tombstones, and never offers unknown or the current preference', () => {
    setPin('1977-05-08', 'a', 'sbd', 1);
    setPin('1977-05-09', 'b', 'matrix', 2);
    setPin('1972-08-27', 'c', 'matrix', 3);
    setPin('1973-02-09', 'd', 'matrix', 4);
    expect(getPendingNudge()).toBe('matrix');          // sbd pin is 4th most recent
    clearPin('1973-02-09', 5);
    expect(getPendingNudge()).toBeNull();              // now: matrix, matrix, sbd
    setPin('1973-02-09', 'e', 'unknown', 6);
    setPin('1974-06-28', 'f', 'unknown', 7);
    setPin('1974-06-26', 'g', 'unknown', 8);
    expect(getPendingNudge()).toBeNull();
    setSourcePreference('matrix', 9);
    setPin('1977-05-08', 'h', 'matrix', 10);
    setPin('1977-05-09', 'i', 'matrix', 11);
    setPin('1972-08-27', 'j', 'matrix', 12);
    expect(getPendingNudge()).toBeNull();              // already the preference
  });

  it('stops offering a format once answered, either way', () => {
    ['1977-05-08', '1977-05-09', '1972-08-27'].forEach((d, i) => setPin(d, `x${i}`, 'aud', i + 1));
    expect(getPendingNudge()).toBe('aud');
    answerNudge('aud', 'no');
    expect(getPendingNudge()).toBeNull();
    expect(getSourcePrefs().nudgeAnswers).toEqual({ aud: 'no' });
  });
});

describe('mergeSourcePrefs', () => {
  const base = (over: Partial<SourcePrefs>): SourcePrefs => ({ ...EMPTY_SOURCE_PREFS, ...over });

  it('newer preferenceSetAt wins; ties keep local', () => {
    expect(mergeSourcePrefs(base({ preference: 'sbd', preferenceSetAt: 5 }), base({ preference: 'aud', preferenceSetAt: 9 })).preference).toBe('aud');
    expect(mergeSourcePrefs(base({ preference: 'sbd', preferenceSetAt: 9 }), base({ preference: 'aud', preferenceSetAt: 5 })).preference).toBe('sbd');
    expect(mergeSourcePrefs(base({ preference: 'sbd', preferenceSetAt: 5 }), base({ preference: 'aud', preferenceSetAt: 5 })).preference).toBe('sbd');
  });

  it('pins merge latest-wins on max(pinnedAt, deletedAt) per date, unioning disjoint dates', () => {
    const local = base({ pins: { '1977-05-08': { identifier: 'a', format: 'sbd', pinnedAt: 10 }, '1972-08-27': { identifier: 'l', format: 'aud', pinnedAt: 1 } } });
    const remote = base({ pins: { '1977-05-08': { identifier: 'a', format: 'sbd', pinnedAt: 10, deletedAt: 12 }, '1977-05-09': { identifier: 'r', format: 'fm', pinnedAt: 3 } } });
    const merged = mergeSourcePrefs(local, remote);
    expect(merged.pins['1977-05-08'].deletedAt).toBe(12);
    expect(Object.keys(merged.pins).sort()).toEqual(['1972-08-27', '1977-05-08', '1977-05-09']);
  });

  it('nudge answers union and yes wins a conflict', () => {
    const merged = mergeSourcePrefs(base({ nudgeAnswers: { sbd: 'no', aud: 'yes' } }), base({ nudgeAnswers: { sbd: 'yes', matrix: 'no' } }));
    expect(merged.nudgeAnswers).toEqual({ sbd: 'yes', aud: 'yes', matrix: 'no' });
  });
});

describe('pruneSourcePrefsTombstones', () => {
  it('drops tombstones older than 30 days and keeps active pins', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const prefs = { ...EMPTY_SOURCE_PREFS, pins: {
      old: { identifier: 'a', format: 'sbd' as const, pinnedAt: 0, deletedAt: 1 },
      fresh: { identifier: 'b', format: 'sbd' as const, pinnedAt: 0, deletedAt: 40 * DAY },
      active: { identifier: 'c', format: 'sbd' as const, pinnedAt: 0 },
    } };
    expect(Object.keys(pruneSourcePrefsTombstones(prefs, 45 * DAY).pins).sort()).toEqual(['active', 'fresh']);
  });
});

describe('normalizeSourcePrefs', () => {
  it('fills defaults for missing/garbage fields and drops malformed pins', () => {
    expect(normalizeSourcePrefs(null)).toEqual(EMPTY_SOURCE_PREFS);
    expect(normalizeSourcePrefs({ preference: 'laser' })).toEqual(EMPTY_SOURCE_PREFS);
    expect(normalizeSourcePrefs({
      preference: 'aud', preferenceSetAt: 3,
      pins: { '1977-05-08': { identifier: 'a', format: 'aud', pinnedAt: 1 }, bad: { identifier: 1 } },
      nudgeAnswers: { aud: 'no', sbd: 'maybe' },
    })).toEqual({
      preference: 'aud', preferenceSetAt: 3,
      pins: { '1977-05-08': { identifier: 'a', format: 'aud', pinnedAt: 1 } },
      nudgeAnswers: { aud: 'no' },
    });
  });

  it('replaceSourcePrefs notifies subscribers', () => {
    const listener = jest.fn();
    subscribeSourcePrefs(listener);
    replaceSourcePrefs({ ...EMPTY_SOURCE_PREFS, preference: 'fm', preferenceSetAt: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getSourcePrefs().preference).toBe('fm');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/services/__tests__/sourcePrefsStore.test.ts` → FAIL, module not found.

- [ ] **Step 3: Implement the store**

```ts
// src/services/sourcePrefsStore.ts
/**
 * Module-level store for the user's recording-source preference, per-show
 * pins, and "prefer X everywhere?" answers. Deliberately NOT a React
 * context so non-React code (PlayerContext callbacks, nav-param builders)
 * can read it synchronously. SourcePrefsContext wraps it for persistence,
 * cloud sync, and React subscriptions (same split as userRatingsStore).
 */
import type { RecordingFormat } from '../types/show.types';
import { DEFAULT_SOURCE_PREFERENCE, SourcePreference } from '../constants/sourcePreferences';

export interface SourcePin {
  identifier: string;
  /** Format of the pinned recording at pin time — lets the nudge run without a catalog lookup. */
  format: RecordingFormat;
  pinnedAt: number;
  /** deletedAt >= pinnedAt marks a tombstone (cleared pin) kept for sync. */
  deletedAt?: number;
}

export type NudgeAnswer = 'yes' | 'no';

export interface SourcePrefs {
  preference: SourcePreference;
  preferenceSetAt: number;
  /** Keyed by YYYY-MM-DD. */
  pins: Record<string, SourcePin>;
  nudgeAnswers: Partial<Record<RecordingFormat, NudgeAnswer>>;
}

export const EMPTY_SOURCE_PREFS: SourcePrefs = {
  preference: DEFAULT_SOURCE_PREFERENCE,
  preferenceSetAt: 0,
  pins: {},
  nudgeAnswers: {},
};

const TOMBSTONE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const NUDGE_WINDOW = 3;
const PREFERENCES: ReadonlySet<string> = new Set(['popular', 'sbd', 'aud', 'matrix', 'fm']);
const FORMATS: ReadonlySet<string> = new Set(['sbd', 'aud', 'matrix', 'fm', 'unknown']);

let prefs: SourcePrefs = { ...EMPTY_SOURCE_PREFS };
let version = 0;
const listeners = new Set<() => void>();

function dateOnly(date: string): string {
  return date.slice(0, 10);
}

function isPinActive(pin: SourcePin): boolean {
  return pin.deletedAt === undefined || pin.deletedAt < pin.pinnedAt;
}

function notify(): void {
  version++;
  listeners.forEach(l => l());
}

export function getSourcePrefs(): SourcePrefs {
  return prefs;
}

export function getSourcePrefsVersion(): number {
  return version;
}

export function replaceSourcePrefs(next: SourcePrefs): void {
  prefs = next;
  notify();
}

export function setSourcePreference(preference: SourcePreference, now: number = Date.now()): void {
  prefs = { ...prefs, preference, preferenceSetAt: now };
  notify();
}

export function getActivePin(date: string): SourcePin | null {
  const pin = prefs.pins[dateOnly(date)];
  return pin && isPinActive(pin) ? pin : null;
}

export function setPin(date: string, identifier: string, format: RecordingFormat, now: number = Date.now()): void {
  prefs = { ...prefs, pins: { ...prefs.pins, [dateOnly(date)]: { identifier, format, pinnedAt: now } } };
  notify();
}

export function clearPin(date: string, now: number = Date.now()): void {
  const key = dateOnly(date);
  const existing = prefs.pins[key];
  if (!existing || !isPinActive(existing)) return;
  prefs = { ...prefs, pins: { ...prefs.pins, [key]: { ...existing, deletedAt: now } } };
  notify();
}

export function answerNudge(format: RecordingFormat, answer: NudgeAnswer): void {
  prefs = { ...prefs, nudgeAnswers: { ...prefs.nudgeAnswers, [format]: answer } };
  notify();
}

/**
 * The format to offer as the new global preference, or null. Looks at the
 * three most recent ACTIVE pins only.
 */
export function getPendingNudge(input: SourcePrefs = prefs): RecordingFormat | null {
  const recent = Object.values(input.pins)
    .filter(isPinActive)
    .sort((a, b) => b.pinnedAt - a.pinnedAt)
    .slice(0, NUDGE_WINDOW);
  if (recent.length < NUDGE_WINDOW) return null;
  const format = recent[0].format;
  if (!recent.every(p => p.format === format)) return null;
  if (format === 'unknown') return null;
  if (format === input.preference) return null;
  if (input.nudgeAnswers[format] !== undefined) return null;
  return format;
}

export function subscribeSourcePrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function pinTimestamp(pin: SourcePin): number {
  return Math.max(pin.pinnedAt, pin.deletedAt ?? 0);
}

/** Latest-wins per field; see Global Constraints for the exact rules. */
export function mergeSourcePrefs(local: SourcePrefs, remote: SourcePrefs): SourcePrefs {
  const preferenceFrom = remote.preferenceSetAt > local.preferenceSetAt ? remote : local;

  const pins: Record<string, SourcePin> = { ...local.pins };
  for (const [date, pin] of Object.entries(remote.pins)) {
    const existing = pins[date];
    if (!existing || pinTimestamp(pin) > pinTimestamp(existing)) pins[date] = pin;
  }

  const nudgeAnswers: SourcePrefs['nudgeAnswers'] = { ...local.nudgeAnswers };
  for (const [format, answer] of Object.entries(remote.nudgeAnswers) as [RecordingFormat, NudgeAnswer][]) {
    if (nudgeAnswers[format] === 'yes' || answer === undefined) continue;
    nudgeAnswers[format] = answer === 'yes' ? 'yes' : (nudgeAnswers[format] ?? answer);
  }

  return {
    preference: preferenceFrom.preference,
    preferenceSetAt: preferenceFrom.preferenceSetAt,
    pins,
    nudgeAnswers,
  };
}

export function pruneSourcePrefsTombstones(input: SourcePrefs, now: number = Date.now()): SourcePrefs {
  const pins = Object.fromEntries(
    Object.entries(input.pins).filter(([, pin]) =>
      isPinActive(pin) || now - (pin.deletedAt ?? 0) < TOMBSTONE_RETENTION_MS
    )
  );
  return { ...input, pins };
}

/** Tolerant parse of a stored/cloud blob: unknown fields dropped, bad values defaulted. */
export function normalizeSourcePrefs(input: unknown): SourcePrefs {
  if (!input || typeof input !== 'object') return { ...EMPTY_SOURCE_PREFS };
  const raw = input as Record<string, unknown>;

  const preference = typeof raw.preference === 'string' && PREFERENCES.has(raw.preference)
    ? (raw.preference as SourcePreference)
    : DEFAULT_SOURCE_PREFERENCE;
  const preferenceSetAt = typeof raw.preferenceSetAt === 'number' ? raw.preferenceSetAt : 0;

  const pins: Record<string, SourcePin> = {};
  if (raw.pins && typeof raw.pins === 'object') {
    for (const [date, value] of Object.entries(raw.pins as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const p = value as Record<string, unknown>;
      if (typeof p.identifier !== 'string' || typeof p.pinnedAt !== 'number') continue;
      if (typeof p.format !== 'string' || !FORMATS.has(p.format)) continue;
      const pin: SourcePin = { identifier: p.identifier, format: p.format as RecordingFormat, pinnedAt: p.pinnedAt };
      if (typeof p.deletedAt === 'number') pin.deletedAt = p.deletedAt;
      pins[date] = pin;
    }
  }

  const nudgeAnswers: SourcePrefs['nudgeAnswers'] = {};
  if (raw.nudgeAnswers && typeof raw.nudgeAnswers === 'object') {
    for (const [format, answer] of Object.entries(raw.nudgeAnswers as Record<string, unknown>)) {
      if (FORMATS.has(format) && (answer === 'yes' || answer === 'no')) {
        nudgeAnswers[format as RecordingFormat] = answer;
      }
    }
  }

  return { preference, preferenceSetAt, pins, nudgeAnswers };
}

export function resetStoreForTests(): void {
  prefs = { ...EMPTY_SOURCE_PREFS };
  version = 0;
  listeners.clear();
}
```

- [ ] **Step 4: Run tests, typecheck, commit**

Run: `npx jest src/services/__tests__/sourcePrefsStore.test.ts` → PASS. `npm run typecheck` → clean.

```bash
git add src/services/sourcePrefsStore.ts src/services/__tests__/sourcePrefsStore.test.ts
git commit -m "feat(source-prefs): module-level store with pins, nudge rule, and latest-wins merge

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: `recordingRanker` (pure)

**Files:**
- Create: `src/services/recordingRanker.ts`
- Test: `src/services/__tests__/recordingRanker.test.ts`

**Interfaces:**
- Consumes: `RecordingVersion`, `LineageTag`.
- Produces:
  ```ts
  export const RANK_WEIGHTS: { POP: number; RATING: number; PRIOR_MEAN: number; PRIOR_WEIGHT: number; LINEAGE_CAP: number; LINEAGE_BONUS: Record<LineageTag, number> }
  export function scoreRecordings(versions: RecordingVersion[]): Array<{ version: RecordingVersion; score: number }>
  export function rankRecordings(versions: RecordingVersion[]): RecordingVersion[]   // new array, best first
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/recordingRanker.test.ts
import { rankRecordings, scoreRecordings, RANK_WEIGHTS } from '../recordingRanker';
import type { RecordingVersion } from '../../types/show.types';

const v = (identifier: string, over: Partial<RecordingVersion> = {}): RecordingVersion => ({
  identifier, format: 'sbd', lineage: [], downloads: 1000, ...over,
});

describe('rankRecordings', () => {
  it('prefers more downloads when everything else is equal', () => {
    const out = rankRecordings([v('low', { downloads: 10 }), v('high', { downloads: 100000 })]);
    expect(out.map(x => x.identifier)).toEqual(['high', 'low']);
  });

  it('shrinks a single 5-star review toward the prior so forty 4.6-star reviews win', () => {
    const out = rankRecordings([
      v('one-review', { avgRating: 5, numReviews: 1 }),
      v('forty-reviews', { avgRating: 4.6, numReviews: 40 }),
    ]);
    expect(out[0].identifier).toBe('forty-reviews');
  });

  it('treats a missing rating as zero reviews (prior mean) rather than zero stars', () => {
    const [scored] = scoreRecordings([v('unrated')]);
    const ratingPart = (RANK_WEIGHTS.PRIOR_MEAN / 5) * RANK_WEIGHTS.RATING;
    expect(scored.score).toBeCloseTo(RANK_WEIGHTS.POP + ratingPart, 6);
  });

  it('caps the lineage bonus at LINEAGE_CAP', () => {
    const [capped, exact] = scoreRecordings([
      v('capped', { lineage: ['betty', 'miller', '16track', 'lowgen'] }),
      v('exact', { lineage: ['betty', 'miller'] }),
    ]);
    expect(capped.score).toBeCloseTo(exact.score, 6);
    expect(capped.score - scoreRecordings([v('plain')])[0].score).toBeCloseTo(RANK_WEIGHTS.LINEAGE_CAP, 6);
  });

  it('lets lineage outrank a modest download gap but not a huge one', () => {
    const modest = rankRecordings([v('betty', { lineage: ['betty'], downloads: 5000 }), v('plain', { downloads: 8000 })]);
    expect(modest[0].identifier).toBe('betty');
    const huge = rankRecordings([v('betty', { lineage: ['betty'], downloads: 50 }), v('plain', { downloads: 500000 })]);
    expect(huge[0].identifier).toBe('plain');
  });

  it('scores pop as 0 for every recording when no recording has downloads', () => {
    const scored = scoreRecordings([v('a', { downloads: 0 }), v('b', { downloads: undefined })]);
    scored.forEach(s => expect(s.score).toBeCloseTo((RANK_WEIGHTS.PRIOR_MEAN / 5) * RANK_WEIGHTS.RATING, 6));
  });

  it('breaks exact ties by downloads desc then identifier asc, and does not mutate the input', () => {
    const input = [v('b', { downloads: 0 }), v('a', { downloads: 0 })];
    const out = rankRecordings(input);
    expect(out.map(x => x.identifier)).toEqual(['a', 'b']);
    expect(input.map(x => x.identifier)).toEqual(['b', 'a']);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx jest src/services/__tests__/recordingRanker.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
// src/services/recordingRanker.ts
/**
 * Read-time "best recording" score for one show's recordings. Pure. Weights
 * live in RANK_WEIGHTS so tuning never needs a catalog regen.
 */
import type { LineageTag, RecordingVersion } from '../types/show.types';

export const RANK_WEIGHTS = {
  POP: 0.45,
  RATING: 0.35,
  /** Bayesian shrinkage toward a 4.0 average with the weight of 5 reviews. */
  PRIOR_MEAN: 4.0,
  PRIOR_WEIGHT: 5,
  LINEAGE_CAP: 0.30,
  LINEAGE_BONUS: { betty: 0.15, miller: 0.15, '16track': 0.10, lowgen: 0.05 } as Record<LineageTag, number>,
} as const;

function log10Plus1(downloads: number | undefined): number {
  return Math.log10((downloads ?? 0) + 1);
}

function ratingScore(version: RecordingVersion): number {
  const n = typeof version.avgRating === 'number' ? (version.numReviews ?? 0) : 0;
  const avg = typeof version.avgRating === 'number' ? version.avgRating : 0;
  const shrunk = (avg * n + RANK_WEIGHTS.PRIOR_MEAN * RANK_WEIGHTS.PRIOR_WEIGHT) / (n + RANK_WEIGHTS.PRIOR_WEIGHT);
  return shrunk / 5;
}

function lineageScore(version: RecordingVersion): number {
  const sum = version.lineage.reduce((acc, tag) => acc + (RANK_WEIGHTS.LINEAGE_BONUS[tag] ?? 0), 0);
  return Math.min(RANK_WEIGHTS.LINEAGE_CAP, sum);
}

export function scoreRecordings(versions: RecordingVersion[]): Array<{ version: RecordingVersion; score: number }> {
  const maxLog = versions.reduce((max, v) => Math.max(max, log10Plus1(v.downloads)), 0);
  return versions.map(version => {
    const pop = maxLog > 0 ? log10Plus1(version.downloads) / maxLog : 0;
    const score = RANK_WEIGHTS.POP * pop + RANK_WEIGHTS.RATING * ratingScore(version) + lineageScore(version);
    return { version, score };
  });
}

export function rankRecordings(versions: RecordingVersion[]): RecordingVersion[] {
  return scoreRecordings(versions)
    .sort((a, b) =>
      b.score - a.score
      || (b.version.downloads ?? 0) - (a.version.downloads ?? 0)
      || a.version.identifier.localeCompare(b.version.identifier))
    .map(s => s.version);
}
```

- [ ] **Step 4: Run tests, typecheck, commit**

Run: `npx jest src/services/__tests__/recordingRanker.test.ts` → PASS. If the "modest vs huge download gap" case fails, the fixture numbers are wrong, not the formula — report it with the two scores rather than changing weights.

```bash
git add src/services/recordingRanker.ts src/services/__tests__/recordingRanker.test.ts
git commit -m "feat(source-prefs): read-time recording ranker (popularity, shrunk rating, lineage bonus)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: `recordingResolver` (pure: precedence, fallback ladder, messages, constraint serialization)

**Files:**
- Create: `src/services/recordingResolver.ts`
- Test: `src/services/__tests__/recordingResolver.test.ts`

**Interfaces:**
- Consumes: `rankRecordings` (Task 3); `SourcePreference` (Task 1); `SourceTagId`, `sourceTagLabel`, `isSourceTagId` (Task 1); `RecordingVersion`, `RecordingFormat`, `LineageTag`.
- Produces:
  ```ts
  export interface SourceConstraint { format?: RecordingFormat; lineage?: LineageTag[] }
  export interface ResolveContext {
    preference: SourcePreference;
    userPinIdentifier?: string;
    editorialPinIdentifier?: string;
    sessionConstraint?: SourceConstraint;
  }
  export type ResolvedVia = 'user-pin' | 'editorial' | 'filter' | 'preference' | 'popular';
  export interface FallbackInfo { requested: SourceTagId[]; relaxed: SourceTagId[] }
  export interface ResolvedRecording { identifier: string; via: ResolvedVia; fallback?: FallbackInfo }
  export function resolveRecording(versions: RecordingVersion[], ctx: ResolveContext): ResolvedRecording | null  // null iff versions is empty
  export function describeFallback(fallback: FallbackInfo, chosen: RecordingVersion): string
  export function parseSourceConstraint(raw: string | undefined): SourceConstraint | undefined
  export function stringifySourceConstraint(c: SourceConstraint | undefined): string | undefined
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/recordingResolver.test.ts
import {
  resolveRecording,
  describeFallback,
  parseSourceConstraint,
  stringifySourceConstraint,
  ResolveContext,
} from '../recordingResolver';
import type { RecordingVersion } from '../../types/show.types';

const v = (identifier: string, over: Partial<RecordingVersion> = {}): RecordingVersion => ({
  identifier, format: 'sbd', lineage: [], downloads: 1000, ...over,
});

// 5/8/77-ish: a very popular matrix, a Betty soundboard, a plain soundboard, an audience tape.
const MATRIX = v('mtx', { format: 'matrix', downloads: 1_500_000, avgRating: 4.8, numReviews: 299 });
const BETTY = v('betty', { format: 'sbd', lineage: ['betty', 'lowgen'], downloads: 145_000, avgRating: 4.7, numReviews: 36 });
const SBD = v('sbd', { format: 'sbd', downloads: 90_000 });
const AUD = v('aud', { format: 'aud', downloads: 540_000, avgRating: 4.7, numReviews: 116 });
const SHOW = [MATRIX, BETTY, SBD, AUD];

const ctx = (over: Partial<ResolveContext> = {}): ResolveContext => ({ preference: 'popular', ...over });

describe('resolveRecording precedence', () => {
  it('returns null for a show with no recordings', () => {
    expect(resolveRecording([], ctx())).toBeNull();
  });

  it('popular = unconstrained ranker (the lineage-rich, well-rated Betty board edges the most-downloaded matrix)', () => {
    expect(resolveRecording(SHOW, ctx())).toEqual({ identifier: 'betty', via: 'popular' });
  });

  it('a user pin wins over everything when it is still in the catalog', () => {
    expect(resolveRecording(SHOW, ctx({ userPinIdentifier: 'sbd', sessionConstraint: { format: 'aud' }, preference: 'matrix' })))
      .toEqual({ identifier: 'sbd', via: 'user-pin' });
  });

  it('a stale pin (identifier gone) is ignored, not an error', () => {
    expect(resolveRecording(SHOW, ctx({ userPinIdentifier: 'vanished', preference: 'aud' })))
      .toEqual({ identifier: 'aud', via: 'preference' });
  });

  it('the session constraint beats the global preference', () => {
    expect(resolveRecording(SHOW, ctx({ preference: 'aud', sessionConstraint: { lineage: ['betty'] } })))
      .toEqual({ identifier: 'betty', via: 'filter' });
  });

  it('the global preference constrains by format and ranks within it', () => {
    expect(resolveRecording(SHOW, ctx({ preference: 'sbd' }))).toEqual({ identifier: 'betty', via: 'preference' });
  });

  it('an editorial pin wins only when it is among the candidates', () => {
    expect(resolveRecording(SHOW, ctx({ editorialPinIdentifier: 'sbd' }))).toEqual({ identifier: 'sbd', via: 'editorial' });
    expect(resolveRecording(SHOW, ctx({ editorialPinIdentifier: 'sbd', preference: 'aud' }))).toEqual({ identifier: 'aud', via: 'preference' });
    expect(resolveRecording(SHOW, ctx({ editorialPinIdentifier: 'betty', sessionConstraint: { format: 'sbd' } })))
      .toEqual({ identifier: 'betty', via: 'editorial' });
  });

  it('multiple lineage tags in a constraint must all be present', () => {
    expect(resolveRecording(SHOW, ctx({ sessionConstraint: { lineage: ['betty', 'lowgen'] } }))?.identifier).toBe('betty');
  });

  it('an empty constraint object is no constraint', () => {
    expect(resolveRecording(SHOW, ctx({ sessionConstraint: {} }))).toEqual({ identifier: 'betty', via: 'popular' });
  });
});

describe('fallback ladder', () => {
  const NO_MATRIX = [BETTY, SBD, AUD];

  it('preference with no match relaxes format and says so', () => {
    expect(resolveRecording(NO_MATRIX, ctx({ preference: 'matrix' }))).toEqual({
      identifier: 'betty',
      via: 'preference',
      fallback: { requested: ['matrix'], relaxed: ['matrix'] },
    });
  });

  it('drops quality modifiers first, then lineage identity, then format', () => {
    // requested: betty + lowgen + 16track soundboard. Only a plain Betty sbd exists (no 16track).
    const show = [v('betty', { lineage: ['betty'] }), AUD];
    expect(resolveRecording(show, ctx({ sessionConstraint: { format: 'sbd', lineage: ['betty', '16track', 'lowgen'] } }))).toEqual({
      identifier: 'betty', via: 'filter',
      fallback: { requested: ['sbd', 'betty', '16track', 'lowgen'], relaxed: ['16track', 'lowgen'] },
    });
    // No Betty at all: identity dropped too.
    expect(resolveRecording([SBD, AUD], ctx({ sessionConstraint: { format: 'sbd', lineage: ['betty'] } }))).toEqual({
      identifier: 'sbd', via: 'filter', fallback: { requested: ['sbd', 'betty'], relaxed: ['betty'] },
    });
    // No soundboard at all: format dropped last.
    expect(resolveRecording([AUD], ctx({ sessionConstraint: { format: 'sbd', lineage: ['betty'] } }))).toEqual({
      identifier: 'aud', via: 'filter', fallback: { requested: ['sbd', 'betty'], relaxed: ['sbd', 'betty'] },
    });
  });

  it('an editorial pin can still win at a relaxed rung', () => {
    expect(resolveRecording(NO_MATRIX, ctx({ preference: 'matrix', editorialPinIdentifier: 'sbd' }))).toEqual({
      identifier: 'sbd', via: 'editorial', fallback: { requested: ['matrix'], relaxed: ['matrix'] },
    });
  });
});

describe('describeFallback', () => {
  it('names what was asked for and what is playing', () => {
    expect(describeFallback({ requested: ['matrix'], relaxed: ['matrix'] }, BETTY))
      .toBe('No matrix from this night — playing the Betty Board soundboard instead.');
    expect(describeFallback({ requested: ['sbd', 'betty'], relaxed: ['sbd', 'betty'] }, AUD))
      .toBe('No Betty Board soundboard from this night — playing the audience recording instead.');
    expect(describeFallback({ requested: ['fm'], relaxed: ['fm'] }, v('u', { format: 'unknown' })))
      .toBe('No FM broadcast from this night — playing the recording instead.');
  });
});

describe('constraint serialization', () => {
  it('round-trips format and lineage as comma-separated tag ids', () => {
    expect(stringifySourceConstraint({ format: 'sbd', lineage: ['betty', 'lowgen'] })).toBe('sbd,betty,lowgen');
    expect(parseSourceConstraint('sbd,betty,lowgen')).toEqual({ format: 'sbd', lineage: ['betty', 'lowgen'] });
    expect(parseSourceConstraint('matrix')).toEqual({ format: 'matrix' });
    expect(parseSourceConstraint('betty')).toEqual({ lineage: ['betty'] });
  });

  it('ignores junk and yields undefined for nothing', () => {
    expect(parseSourceConstraint(undefined)).toBeUndefined();
    expect(parseSourceConstraint('')).toBeUndefined();
    expect(parseSourceConstraint('laser,unknown')).toBeUndefined();
    expect(parseSourceConstraint('aud,laser')).toEqual({ format: 'aud' });
    expect(stringifySourceConstraint(undefined)).toBeUndefined();
    expect(stringifySourceConstraint({})).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx jest src/services/__tests__/recordingResolver.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
// src/services/recordingResolver.ts
/**
 * Pure answer to "which recording of this show should play?". Precedence:
 * user pin → session constraint (active source filter) → global preference
 * → unconstrained. An editorial pin beats the ranker whenever it survives
 * the active constraint. When a constraint yields nothing we relax it in a
 * fixed order and report what was relaxed so the UI can say so.
 */
import type { LineageTag, RecordingFormat, RecordingVersion } from '../types/show.types';
import type { SourcePreference } from '../constants/sourcePreferences';
import { FORMAT_LABELS, LINEAGE_LABELS, isSourceTagId, SourceTagId } from '../constants/tags';
import { rankRecordings } from './recordingRanker';

export interface SourceConstraint {
  format?: RecordingFormat;
  lineage?: LineageTag[];
}

export interface ResolveContext {
  preference: SourcePreference;
  userPinIdentifier?: string;
  editorialPinIdentifier?: string;
  sessionConstraint?: SourceConstraint;
}

export type ResolvedVia = 'user-pin' | 'editorial' | 'filter' | 'preference' | 'popular';

export interface FallbackInfo {
  requested: SourceTagId[];
  relaxed: SourceTagId[];
}

export interface ResolvedRecording {
  identifier: string;
  via: ResolvedVia;
  fallback?: FallbackInfo;
}

const QUALITY_MODIFIERS: ReadonlySet<LineageTag> = new Set(['16track', 'lowgen']);

function isEmptyConstraint(c: SourceConstraint | undefined): c is undefined {
  return !c || (!c.format && (!c.lineage || c.lineage.length === 0));
}

function constraintTags(c: SourceConstraint): SourceTagId[] {
  const tags: SourceTagId[] = [];
  if (c.format && c.format !== 'unknown') tags.push(c.format);
  (c.lineage ?? []).forEach(t => tags.push(t));
  return tags;
}

function matches(version: RecordingVersion, c: SourceConstraint): boolean {
  if (c.format && version.format !== c.format) return false;
  return (c.lineage ?? []).every(tag => version.lineage.includes(tag));
}

/** The relaxation rungs, each derived from the ORIGINAL constraint. */
function ladder(c: SourceConstraint): SourceConstraint[] {
  const lineage = c.lineage ?? [];
  return [
    c,
    { format: c.format, lineage: lineage.filter(t => !QUALITY_MODIFIERS.has(t)) },
    { format: c.format, lineage: [] },
    { lineage: [] },
  ];
}

function pick(candidates: RecordingVersion[], editorialPinIdentifier: string | undefined): { version: RecordingVersion; editorial: boolean } {
  const editorial = editorialPinIdentifier ? candidates.find(v => v.identifier === editorialPinIdentifier) : undefined;
  if (editorial) return { version: editorial, editorial: true };
  return { version: rankRecordings(candidates)[0], editorial: false };
}

function resolveConstrained(
  versions: RecordingVersion[],
  constraint: SourceConstraint,
  via: Exclude<ResolvedVia, 'user-pin' | 'editorial' | 'popular'>,
  editorialPinIdentifier: string | undefined,
): ResolvedRecording {
  const requested = constraintTags(constraint);
  for (const rung of ladder(constraint)) {
    const candidates = versions.filter(v => matches(v, rung));
    if (candidates.length === 0) continue;
    const { version, editorial } = pick(candidates, editorialPinIdentifier);
    const kept = new Set(constraintTags(rung));
    const relaxed = requested.filter(t => !kept.has(t));
    const result: ResolvedRecording = { identifier: version.identifier, via: editorial ? 'editorial' : via };
    if (relaxed.length > 0) result.fallback = { requested, relaxed };
    return result;
  }
  // Unreachable: the last rung is unconstrained and versions is non-empty.
  const { version, editorial } = pick(versions, editorialPinIdentifier);
  return { identifier: version.identifier, via: editorial ? 'editorial' : via, fallback: { requested, relaxed: requested } };
}

export function resolveRecording(versions: RecordingVersion[], ctx: ResolveContext): ResolvedRecording | null {
  if (versions.length === 0) return null;

  if (ctx.userPinIdentifier && versions.some(v => v.identifier === ctx.userPinIdentifier)) {
    return { identifier: ctx.userPinIdentifier, via: 'user-pin' };
  }

  if (!isEmptyConstraint(ctx.sessionConstraint)) {
    return resolveConstrained(versions, ctx.sessionConstraint, 'filter', ctx.editorialPinIdentifier);
  }

  if (ctx.preference !== 'popular') {
    return resolveConstrained(versions, { format: ctx.preference }, 'preference', ctx.editorialPinIdentifier);
  }

  const { version, editorial } = pick(versions, ctx.editorialPinIdentifier);
  return { identifier: version.identifier, via: editorial ? 'editorial' : 'popular' };
}

const FORMAT_NOUN: Record<RecordingFormat, string> = {
  sbd: 'soundboard',
  aud: 'audience recording',
  matrix: 'matrix',
  fm: 'FM broadcast',
  unknown: 'recording',
};

function describe(format: RecordingFormat | undefined, lineage: LineageTag[]): string {
  const parts = lineage.filter(t => !QUALITY_MODIFIERS.has(t)).map(t => LINEAGE_LABELS[t]);
  parts.push(FORMAT_NOUN[format ?? 'unknown']);
  return parts.join(' ');
}

export function describeFallback(fallback: FallbackInfo, chosen: RecordingVersion): string {
  const requestedFormat = fallback.requested.find((t): t is Exclude<RecordingFormat, 'unknown'> => t in FORMAT_LABELS);
  const requestedLineage = fallback.requested.filter((t): t is LineageTag => t in LINEAGE_LABELS);
  return `No ${describe(requestedFormat, requestedLineage)} from this night — playing the ${describe(chosen.format, chosen.lineage)} instead.`;
}

export function parseSourceConstraint(raw: string | undefined): SourceConstraint | undefined {
  if (!raw) return undefined;
  const c: SourceConstraint = {};
  for (const token of raw.split(',').map(t => t.trim()).filter(isSourceTagId)) {
    if (token in FORMAT_LABELS) {
      if (!c.format) c.format = token as RecordingFormat;
    } else {
      (c.lineage ??= []).push(token as LineageTag);
    }
  }
  return isEmptyConstraint(c) ? undefined : c;
}

export function stringifySourceConstraint(c: SourceConstraint | undefined): string | undefined {
  if (isEmptyConstraint(c)) return undefined;
  return constraintTags(c).join(',');
}
```

- [ ] **Step 4: Run tests, typecheck, commit**

Run: `npx jest src/services/__tests__/recordingResolver.test.ts src/services/__tests__/recordingRanker.test.ts` → PASS. `npm run typecheck` → clean.

```bash
git add src/services/recordingResolver.ts src/services/__tests__/recordingResolver.test.ts
git commit -m "feat(source-prefs): pure recording resolver with fallback ladder and notices

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `sourceSelection` — the store-aware seam the app calls

**Files:**
- Create: `src/services/sourceSelection.ts`
- Test: `src/services/__tests__/sourceSelection.test.ts`

**Interfaces:**
- Consumes: `getSourcePrefs`, `getActivePin` (Task 2); `resolveRecording`, `SourceConstraint`, `ResolvedRecording` (Task 4); `getCatalogVersions` (`src/services/recordingCatalog.ts`); `editorialPins` (`src/data/recordingOverrides.ts`); `findShowByDate` (`src/utils/showLookup.ts`).
- Produces:
  ```ts
  export interface SelectionOptions { sessionConstraint?: SourceConstraint; fallbackIdentifier?: string; ignoreUserPin?: boolean }
  export function resolveForDate(date: string, opts?: SelectionOptions): ResolvedRecording | null
  export function resolveShowIdentifier(show: GratefulDeadShow, sessionConstraint?: SourceConstraint): string
  export function resolveRouteIdentifier(idOrDate: string, sessionConstraint?: SourceConstraint): string
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/sourceSelection.test.ts
jest.mock('../recordingCatalog', () => ({
  getCatalogVersions: (date: string) => mockCatalog[date.slice(0, 10)] ?? [],
}));
jest.mock('../../data/recordingOverrides', () => ({
  tagFixes: {},
  editorialPins: { '1972-08-27': 'veneta-editorial' },
}));
jest.mock('../../utils/showLookup', () => ({
  findShowByDate: (date: string) => mockShows[date.slice(0, 10)],
}));

import { resolveForDate, resolveShowIdentifier, resolveRouteIdentifier } from '../sourceSelection';
import { resetStoreForTests, setSourcePreference, setPin } from '../sourcePrefsStore';
import type { GratefulDeadShow, RecordingVersion } from '../../types/show.types';

const v = (identifier: string, over: Partial<RecordingVersion> = {}): RecordingVersion => ({
  identifier, format: 'sbd', lineage: [], downloads: 1000, ...over,
});

const mockCatalog: Record<string, RecordingVersion[]> = {
  '1977-05-08': [v('mtx', { format: 'matrix', downloads: 1_000_000 }), v('betty', { lineage: ['betty'] }), v('aud', { format: 'aud' })],
  '1972-08-27': [v('veneta-sbd', { downloads: 90_000 }), v('veneta-editorial', { downloads: 10 })],
};
const mockShows: Record<string, GratefulDeadShow> = {
  '1977-05-08': { date: '1977-05-08T00:00:00Z', year: '1977', versions: mockCatalog['1977-05-08'], primaryIdentifier: 'mtx', title: 'Cornell' },
};

beforeEach(() => resetStoreForTests());

describe('resolveForDate', () => {
  it('resolves through preference, pins, and editorial pins from the stores', () => {
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'mtx', via: 'popular' });
    setSourcePreference('sbd', 1);
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'betty', via: 'preference' });
    setPin('1977-05-08', 'aud', 'aud', 2);
    expect(resolveForDate('1977-05-08T00:00:00Z')).toEqual({ identifier: 'aud', via: 'user-pin' });
    expect(resolveForDate('1972-08-27')).toEqual({ identifier: 'veneta-editorial', via: 'editorial' });
  });

  it('can ignore the user pin (to show what the default WOULD be)', () => {
    setSourcePreference('sbd', 1);
    setPin('1977-05-08', 'aud', 'aud', 2);
    expect(resolveForDate('1977-05-08', { ignoreUserPin: true })).toEqual({ identifier: 'betty', via: 'preference' });
  });

  it('honours a session constraint and reports fallback', () => {
    expect(resolveForDate('1977-05-08', { sessionConstraint: { format: 'fm' } })).toEqual({
      identifier: 'mtx', via: 'filter', fallback: { requested: ['fm'], relaxed: ['fm'] },
    });
  });

  it('returns the fallback identifier when the date is not in the catalog, else null', () => {
    expect(resolveForDate('1966-01-01')).toBeNull();
    expect(resolveForDate('1966-01-01', { fallbackIdentifier: 'gd66.xyz' })).toEqual({ identifier: 'gd66.xyz', via: 'popular' });
  });
});

describe('resolveShowIdentifier', () => {
  it('uses the catalog for the show date and falls back to primaryIdentifier off-catalog', () => {
    setSourcePreference('aud', 1);
    expect(resolveShowIdentifier(mockShows['1977-05-08'])).toBe('aud');
    const offCatalog: GratefulDeadShow = { date: '1966-01-01', year: '1966', versions: [], primaryIdentifier: 'gd66.fav', title: 'x' };
    expect(resolveShowIdentifier(offCatalog)).toBe('gd66.fav');
  });
});

describe('resolveRouteIdentifier', () => {
  it('resolves a YYYY-MM-DD route id to the preferred recording and passes identifiers through', () => {
    setSourcePreference('sbd', 1);
    expect(resolveRouteIdentifier('1977-05-08')).toBe('betty');
    expect(resolveRouteIdentifier('1977-05-08', { format: 'aud' })).toBe('aud');
    expect(resolveRouteIdentifier('gd1977-05-08.mtx.seamons')).toBe('gd1977-05-08.mtx.seamons');
    expect(resolveRouteIdentifier('1966-01-01')).toBe('1966-01-01');
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/services/sourceSelection.ts
/**
 * The ONE seam app code uses to turn a show into the recording to play.
 * Reads the source-prefs store, the editorial pins, and the bundled catalog
 * synchronously, so it works from nav-param builders and PlayerContext
 * callbacks alike. Pure logic lives in recordingResolver.
 */
import type { GratefulDeadShow } from '../types/show.types';
import { getActivePin, getSourcePrefs } from './sourcePrefsStore';
import { resolveRecording, ResolvedRecording, SourceConstraint } from './recordingResolver';
import { getCatalogVersions } from './recordingCatalog';
import { editorialPins } from '../data/recordingOverrides';
import { findShowByDate } from '../utils/showLookup';

export interface SelectionOptions {
  sessionConstraint?: SourceConstraint;
  /** Returned (as 'popular') when the date has no catalog recordings. */
  fallbackIdentifier?: string;
  /** Resolve as if no pin existed — used to label the "Default" recording while a pin is active. */
  ignoreUserPin?: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveForDate(date: string, opts: SelectionOptions = {}): ResolvedRecording | null {
  const key = date.slice(0, 10);
  const versions = getCatalogVersions(key);
  if (versions.length === 0) {
    return opts.fallbackIdentifier ? { identifier: opts.fallbackIdentifier, via: 'popular' } : null;
  }
  return resolveRecording(versions, {
    preference: getSourcePrefs().preference,
    userPinIdentifier: opts.ignoreUserPin ? undefined : getActivePin(key)?.identifier,
    editorialPinIdentifier: editorialPins[key],
    sessionConstraint: opts.sessionConstraint,
  });
}

export function resolveShowIdentifier(show: GratefulDeadShow, sessionConstraint?: SourceConstraint): string {
  return resolveForDate(show.date, { sessionConstraint, fallbackIdentifier: show.primaryIdentifier })!.identifier;
}

/** Route ids may be a date (clean web URLs) or an Archive identifier. */
export function resolveRouteIdentifier(idOrDate: string, sessionConstraint?: SourceConstraint): string {
  if (!DATE_RE.test(idOrDate)) return idOrDate;
  const show = findShowByDate(idOrDate);
  if (!show) return idOrDate;
  return resolveShowIdentifier(show, sessionConstraint);
}
```

- [ ] **Step 4: Run tests, typecheck, commit**

Run: `npx jest src/services/__tests__/sourceSelection.test.ts` → PASS. `npm run typecheck` → clean.

```bash
git add src/services/sourceSelection.ts src/services/__tests__/sourceSelection.test.ts
git commit -m "feat(source-prefs): store-aware selection seam (resolveForDate / show / route)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: `user_preferences` migration + cloud service

**Files:**
- Create: `supabase/migrations/20260820120000_user_preferences_table.sql`
- Create: `src/services/userPreferencesCloudService.ts`
- Test: `src/services/__tests__/userPreferencesCloudService.test.ts`

**Interfaces:**
- Consumes: `SourcePrefs`, `EMPTY_SOURCE_PREFS`, `normalizeSourcePrefs` (Task 2); `SUPABASE_TABLES.USER_PREFERENCES` (Task 1); `authService.getClient()`.
- Produces: `export const userPreferencesCloudService: { syncPrefs(userId: string, prefs: SourcePrefs): Promise<void>; loadPrefs(userId: string): Promise<SourcePrefs> }`. Row shape: `{ user_id, prefs: { preference, preferenceSetAt, nudgeAnswers }, pins, updated_at }`.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260820120000_user_preferences_table.sql
--
-- WHAT: Creates public.user_preferences — one JSONB row per user holding
--   playback preferences. Written by src/services/userPreferencesCloudService.ts
--   (whole-blob upsert keyed on user_id, same pattern as user_ratings).
--
-- SHAPE:
--   prefs: { preference: 'popular'|'sbd'|'aud'|'matrix'|'fm',
--            preferenceSetAt: epoch-ms,
--            nudgeAnswers: { "<format>": 'yes'|'no' } }
--   pins:  { "YYYY-MM-DD": { identifier, format, pinnedAt, deletedAt? } }
--   deletedAt >= pinnedAt marks a tombstone (cleared pin), pruned
--   client-side after 30 days. Named `prefs` (not `source_prefs`) so future
--   settings have a home in the same row.
--
-- SIZE: serialized-text caps as a server-side backstop against oversized
--   blobs pushed straight at the API. A pin is ~120 bytes; 256 KB allows
--   ~2k pinned shows — the whole catalog is ~2k shows.
--
-- DELETION: user_id references auth.users ON DELETE CASCADE, so the
--   existing delete_user() function cleans this table up automatically.
--
-- RLS: policies wrap auth.uid() in a scalar subquery so it is evaluated
--   once per statement rather than per row.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. Apply with `supabase db push --linked`.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  pins jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_preferences_prefs_size
    check (octet_length(prefs::text) <= 16384),        -- 16 KB
  constraint user_preferences_pins_size
    check (octet_length(pins::text) <= 262144)         -- 256 KB
);

alter table public.user_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences'
      and policyname = 'Users can read own preferences'
  ) then
    create policy "Users can read own preferences"
      on public.user_preferences for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences'
      and policyname = 'Users can insert own preferences'
  ) then
    create policy "Users can insert own preferences"
      on public.user_preferences for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences'
      and policyname = 'Users can update own preferences'
  ) then
    create policy "Users can update own preferences"
      on public.user_preferences for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences'
      and policyname = 'Users can delete own preferences'
  ) then
    create policy "Users can delete own preferences"
      on public.user_preferences for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;
```

- [ ] **Step 2: Write the failing cloud-service test**

```ts
// src/services/__tests__/userPreferencesCloudService.test.ts
import type { SourcePrefs } from '../sourcePrefsStore';

const mockGetSession = jest.fn();
const mockUpsert = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

jest.mock('../authService', () => ({
  authService: {
    getClient: () => ({
      auth: { getSession: mockGetSession },
      from: (table: string) => {
        mockFrom(table);
        return {
          upsert: mockUpsert,
          select: () => ({ eq: () => ({ single: mockSingle }) }),
        };
      },
    }),
  },
}));

import { userPreferencesCloudService } from '../userPreferencesCloudService';

const PREFS: SourcePrefs = {
  preference: 'matrix',
  preferenceSetAt: 5,
  pins: { '1977-05-08': { identifier: 'mtx', format: 'matrix', pinnedAt: 1 } },
  nudgeAnswers: { matrix: 'yes' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  mockUpsert.mockResolvedValue({ error: null });
});

describe('syncPrefs', () => {
  it('upserts prefs and pins as two JSONB columns keyed on user_id', async () => {
    await userPreferencesCloudService.syncPrefs('u1', PREFS);
    expect(mockFrom).toHaveBeenCalledWith('user_preferences');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: 'u1',
        prefs: { preference: 'matrix', preferenceSetAt: 5, nudgeAnswers: { matrix: 'yes' } },
        pins: PREFS.pins,
        updated_at: expect.any(String),
      },
      { onConflict: 'user_id' },
    );
  });

  it('no-ops without a session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await userPreferencesCloudService.syncPrefs('u1', PREFS);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('throws on upsert error', async () => {
    mockUpsert.mockResolvedValue({ error: new Error('boom') });
    await expect(userPreferencesCloudService.syncPrefs('u1', PREFS)).rejects.toThrow('boom');
  });
});

describe('loadPrefs', () => {
  it('recomposes the stored row into SourcePrefs, normalizing junk', async () => {
    mockSingle.mockResolvedValue({
      data: { prefs: { preference: 'matrix', preferenceSetAt: 5, nudgeAnswers: { matrix: 'yes', sbd: 'maybe' } }, pins: PREFS.pins },
      error: null,
    });
    expect(await userPreferencesCloudService.loadPrefs('u1')).toEqual(PREFS);
  });

  it('returns empty prefs when no row exists (PGRST116)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    expect(await userPreferencesCloudService.loadPrefs('u1')).toEqual({
      preference: 'popular', preferenceSetAt: 0, pins: {}, nudgeAnswers: {},
    });
  });

  it('throws on other errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'XX', message: 'nope' } });
    await expect(userPreferencesCloudService.loadPrefs('u1')).rejects.toEqual({ code: 'XX', message: 'nope' });
  });
});
```

- [ ] **Step 3: Run to verify failure** — FAIL, module not found.

- [ ] **Step 4: Implement the cloud service**

```ts
// src/services/userPreferencesCloudService.ts
import { authService } from './authService';
import { SUPABASE_TABLES } from '../constants/registry';
import { normalizeSourcePrefs, SourcePrefs } from './sourcePrefsStore';

class UserPreferencesCloudService {
  private get supabase() {
    return authService.getClient();
  }

  /** Whole-blob upsert; the row is the unit of sync (merge happens client-side). */
  async syncPrefs(userId: string, prefs: SourcePrefs): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) return;

    const { error } = await this.supabase
      .from(SUPABASE_TABLES.USER_PREFERENCES)
      .upsert({
        user_id: userId,
        prefs: {
          preference: prefs.preference,
          preferenceSetAt: prefs.preferenceSetAt,
          nudgeAnswers: prefs.nudgeAnswers,
        },
        pins: prefs.pins,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;
  }

  async loadPrefs(userId: string): Promise<SourcePrefs> {
    const { data, error } = await this.supabase
      .from(SUPABASE_TABLES.USER_PREFERENCES)
      .select('prefs, pins')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return normalizeSourcePrefs(null);
      throw error;
    }

    return normalizeSourcePrefs({ ...(data?.prefs ?? {}), pins: data?.pins ?? {} });
  }
}

export const userPreferencesCloudService = new UserPreferencesCloudService();
```

- [ ] **Step 5: Run tests, typecheck, commit**

Run: `npx jest src/services/__tests__/userPreferencesCloudService.test.ts` → PASS. `npm run typecheck` → clean. Do **not** apply the migration.

```bash
git add supabase/migrations/20260820120000_user_preferences_table.sql src/services/userPreferencesCloudService.ts src/services/__tests__/userPreferencesCloudService.test.ts
git commit -m "feat(source-prefs): user_preferences table migration and cloud service

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: `SourcePrefsContext` (persistence, sync, hooks) + provider in `App.tsx`

**Files:**
- Create: `src/contexts/SourcePrefsContext.tsx`
- Modify: `App.tsx:114-115` (wrap inside `UserRatingsProvider`)
- Test: `src/contexts/__tests__/SourcePrefsContext.test.tsx`

**Interfaces:**
- Consumes: store (Task 2), cloud service (Task 6), `useAuth`, `useDebouncedSync`, `useSyncErrorToast`, `STORAGE_KEYS.SOURCE_PREFS`, `logger`.
- Produces:
  ```ts
  export function SourcePrefsProvider({ children }): JSX.Element
  export function useSourcePrefsVersion(): number
  export function useSourcePreference(): SourcePreference
  export function usePendingNudge(): RecordingFormat | null
  export function useActivePin(date: string | undefined): SourcePin | null
  export function useSourcePrefs(): { setPreference(p: SourcePreference): void; pin(date: string, identifier: string, format: RecordingFormat): void; clearPin(date: string): void; answerNudge(format: RecordingFormat, answer: NudgeAnswer): void }
  ```

- [ ] **Step 1: Write the failing tests**

```tsx
// src/contexts/__tests__/SourcePrefsContext.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockUseAuth = jest.fn();
jest.mock('../AuthContext', () => ({ useAuth: () => mockUseAuth() }));

const mockLoadPrefs = jest.fn();
const mockSyncPrefs = jest.fn();
jest.mock('../../services/userPreferencesCloudService', () => ({
  userPreferencesCloudService: {
    loadPrefs: (...args: unknown[]) => mockLoadPrefs(...args),
    syncPrefs: (...args: unknown[]) => mockSyncPrefs(...args),
  },
}));
jest.mock('../../hooks/useSyncErrorToast', () => ({ useSyncErrorToast: () => jest.fn() }));

import { SourcePrefsProvider, useSourcePrefs, useSourcePreference, usePendingNudge, useActivePin } from '../SourcePrefsContext';
import { resetStoreForTests, getSourcePrefs, EMPTY_SOURCE_PREFS } from '../../services/sourcePrefsStore';
import { STORAGE_KEYS } from '../../constants/registry';

const loggedOut = { state: { isAuthenticated: false, user: null, isLoading: false } };
const loggedIn = { state: { isAuthenticated: true, user: { id: 'u1' }, isLoading: false } };

let api: ReturnType<typeof useSourcePrefs>;
let preference: ReturnType<typeof useSourcePreference>;
let nudge: ReturnType<typeof usePendingNudge>;
let pin: ReturnType<typeof useActivePin>;
function Harness({ date }: { date: string }) {
  api = useSourcePrefs();
  preference = useSourcePreference();
  nudge = usePendingNudge();
  pin = useActivePin(date);
  return null;
}

const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(async () => {
  resetStoreForTests();
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue(loggedOut);
  mockLoadPrefs.mockResolvedValue(EMPTY_SOURCE_PREFS);
  mockSyncPrefs.mockResolvedValue(undefined);
});

it('loads persisted prefs from AsyncStorage on mount (normalizing)', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.SOURCE_PREFS, JSON.stringify({ preference: 'aud', preferenceSetAt: 1, pins: {}, nudgeAnswers: { sbd: 'maybe' } }));
  await act(async () => { TestRenderer.create(<SourcePrefsProvider><Harness date="1977-05-08" /></SourcePrefsProvider>); });
  await flush();
  expect(preference).toBe('aud');
  expect(getSourcePrefs().nudgeAnswers).toEqual({});
});

it('setPreference / pin update hooks and persist to AsyncStorage', async () => {
  await act(async () => { TestRenderer.create(<SourcePrefsProvider><Harness date="1977-05-08" /></SourcePrefsProvider>); });
  await flush();
  await act(async () => { api.setPreference('matrix'); api.pin('1977-05-08', 'mtx', 'matrix'); });
  await flush();
  expect(preference).toBe('matrix');
  expect(pin?.identifier).toBe('mtx');
  const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.SOURCE_PREFS))!);
  expect(stored.preference).toBe('matrix');
  expect(stored.pins['1977-05-08'].identifier).toBe('mtx');
  await act(async () => { api.clearPin('1977-05-08'); });
  expect(pin).toBeNull();
});

it('exposes the pending nudge and clears it when answered', async () => {
  await act(async () => { TestRenderer.create(<SourcePrefsProvider><Harness date="1977-05-08" /></SourcePrefsProvider>); });
  await flush();
  await act(async () => {
    api.pin('1977-05-08', 'a', 'aud');
    api.pin('1977-05-09', 'b', 'aud');
    api.pin('1972-08-27', 'c', 'aud');
  });
  expect(nudge).toBe('aud');
  await act(async () => { api.answerNudge('aud', 'yes'); api.setPreference('aud'); });
  expect(nudge).toBeNull();
  expect(preference).toBe('aud');
});

it('merges cloud prefs on login (newer wins) and pushes the merged result', async () => {
  mockUseAuth.mockReturnValue(loggedIn);
  mockLoadPrefs.mockResolvedValue({
    preference: 'fm', preferenceSetAt: 50,
    pins: { '1977-05-08': { identifier: 'cloud', format: 'fm', pinnedAt: 50 } },
    nudgeAnswers: {},
  });
  await AsyncStorage.setItem(STORAGE_KEYS.SOURCE_PREFS, JSON.stringify({
    preference: 'sbd', preferenceSetAt: 10,
    pins: { '1977-05-08': { identifier: 'local', format: 'sbd', pinnedAt: 10 }, '1972-08-27': { identifier: 'l2', format: 'sbd', pinnedAt: 20 } },
    nudgeAnswers: {},
  }));
  await act(async () => { TestRenderer.create(<SourcePrefsProvider><Harness date="1977-05-08" /></SourcePrefsProvider>); });
  await flush(); await flush(); await flush();
  expect(mockLoadPrefs).toHaveBeenCalledWith('u1');
  expect(preference).toBe('fm');
  expect(pin?.identifier).toBe('cloud');
  expect(getSourcePrefs().pins['1972-08-27'].identifier).toBe('l2');
  expect(mockSyncPrefs).toHaveBeenCalledWith('u1', expect.objectContaining({ preference: 'fm' }));
});
```

- [ ] **Step 2: Run to verify failure** — FAIL, module not found.

- [ ] **Step 3: Implement the context**

```tsx
// src/contexts/SourcePrefsContext.tsx
/**
 * React wrapper around sourcePrefsStore: AsyncStorage persistence, debounced
 * Supabase sync, merge-on-login, and subscription hooks. Mirrors
 * UserRatingsContext line for line where it can — read that file's comments
 * for the load/merge race rationale.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useDebouncedSync } from '../hooks/useDebouncedSync';
import { useSyncErrorToast } from '../hooks/useSyncErrorToast';
import { STORAGE_KEYS } from '../constants/registry';
import { logger } from '../utils/logger';
import type { RecordingFormat } from '../types/show.types';
import type { SourcePreference } from '../constants/sourcePreferences';
import {
  answerNudge as storeAnswerNudge,
  clearPin as storeClearPin,
  getActivePin,
  getPendingNudge,
  getSourcePrefs,
  getSourcePrefsVersion,
  mergeSourcePrefs,
  normalizeSourcePrefs,
  NudgeAnswer,
  pruneSourcePrefsTombstones,
  replaceSourcePrefs,
  setPin as storeSetPin,
  setSourcePreference,
  SourcePin,
  subscribeSourcePrefs,
} from '../services/sourcePrefsStore';
import { userPreferencesCloudService } from '../services/userPreferencesCloudService';

const prefsLogger = logger.profile;

interface SourcePrefsContextValue {
  setPreference: (preference: SourcePreference) => void;
  pin: (date: string, identifier: string, format: RecordingFormat) => void;
  clearPin: (date: string) => void;
  answerNudge: (format: RecordingFormat, answer: NudgeAnswer) => void;
}

const SourcePrefsContext = createContext<SourcePrefsContextValue | undefined>(undefined);

export function useSourcePrefsVersion(): number {
  return useSyncExternalStore(subscribeSourcePrefs, getSourcePrefsVersion, getSourcePrefsVersion);
}

export function useSourcePreference(): SourcePreference {
  const version = useSourcePrefsVersion();
  return useMemo(() => getSourcePrefs().preference, [version]);
}

export function usePendingNudge(): RecordingFormat | null {
  const version = useSourcePrefsVersion();
  return useMemo(() => getPendingNudge(), [version]);
}

export function useActivePin(date: string | undefined): SourcePin | null {
  const version = useSourcePrefsVersion();
  return useMemo(() => (date ? getActivePin(date) : null), [date, version]);
}

export function SourcePrefsProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const showSyncErrorToast = useSyncErrorToast('Failed to sync playback settings to cloud. Changes saved locally.');
  const isLoadedRef = useRef(false);

  const authStateRef = useRef(authState);
  useEffect(() => { authStateRef.current = authState; }, [authState]);

  const performSync = useCallback((): Promise<void> | undefined => {
    const auth = authStateRef.current;
    if (!auth.isAuthenticated || !auth.user) return undefined;
    return userPreferencesCloudService
      .syncPrefs(auth.user.id, getSourcePrefs())
      .catch((error) => {
        prefsLogger.error('Failed to sync source prefs to cloud:', error);
        showSyncErrorToast();
      });
  }, [showSyncErrorToast]);

  const { schedule: scheduleSync, flush: flushSync } = useDebouncedSync(performSync);

  // See UserRatingsContext for why the merge-on-login effect awaits this.
  const loadCompleteRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    loadCompleteRef.current = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.SOURCE_PREFS);
        if (raw) replaceSourcePrefs(pruneSourcePrefsTombstones(normalizeSourcePrefs(JSON.parse(raw))));
      } catch (error) {
        prefsLogger.error('Failed to load source prefs:', error);
      } finally {
        isLoadedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    return subscribeSourcePrefs(() => {
      AsyncStorage.setItem(STORAGE_KEYS.SOURCE_PREFS, JSON.stringify(getSourcePrefs()))
        .catch(error => prefsLogger.error('Failed to save source prefs:', error));
      if (isLoadedRef.current) scheduleSync();
    });
  }, [scheduleSync]);

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) return;
    const userId = authState.user.id;
    (async () => {
      try {
        if (loadCompleteRef.current) await loadCompleteRef.current;
        const cloud = await userPreferencesCloudService.loadPrefs(userId);
        const merged = pruneSourcePrefsTombstones(mergeSourcePrefs(getSourcePrefs(), cloud));
        replaceSourcePrefs(merged);
        await userPreferencesCloudService.syncPrefs(userId, merged);
      } catch (error) {
        prefsLogger.error('Failed to sync source prefs from cloud:', error);
      }
    })();
  }, [authState.isAuthenticated, authState.user?.id]);

  const wasAuthenticatedRef = useRef(authState.isAuthenticated);
  useEffect(() => {
    if (wasAuthenticatedRef.current && !authState.isAuthenticated) flushSync();
    wasAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated, flushSync]);

  const value = useMemo<SourcePrefsContextValue>(() => ({
    setPreference: (preference) => setSourcePreference(preference),
    pin: (date, identifier, format) => storeSetPin(date, identifier, format),
    clearPin: (date) => storeClearPin(date),
    answerNudge: (format, answer) => storeAnswerNudge(format, answer),
  }), []);

  return <SourcePrefsContext.Provider value={value}>{children}</SourcePrefsContext.Provider>;
}

export function useSourcePrefs(): SourcePrefsContextValue {
  const ctx = useContext(SourcePrefsContext);
  if (!ctx) throw new Error('useSourcePrefs must be used inside a <SourcePrefsProvider>');
  return ctx;
}
```

Check `logger` has a `profile` channel (it does — `ratingsLogger` in `UserRatingsContext` uses one of `logger.*`; copy whichever channel that file uses if `profile` doesn't exist).

- [ ] **Step 4: Mount the provider**

In `App.tsx`, directly inside `<UserRatingsProvider>` add `<SourcePrefsProvider>` (import from `./src/contexts/SourcePrefsContext`) and close it directly before `</UserRatingsProvider>`. It must be above `ShowsProvider` and `PlayerProvider` (they don't consume it, but the screens under `AppNavigator` do).

- [ ] **Step 5: Run tests, typecheck, commit**

Run: `npx jest src/contexts/__tests__/SourcePrefsContext.test.tsx` → PASS, no act() warnings. `npm run typecheck` → clean.

```bash
git add src/contexts/SourcePrefsContext.tsx src/contexts/__tests__/SourcePrefsContext.test.tsx App.tsx
git commit -m "feat(source-prefs): SourcePrefsContext with AsyncStorage + cloud sync; mount provider

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Route the play seams through the resolver

**Files:**
- Modify: `src/utils/showDetailParams.ts`
- Modify: `src/utils/__tests__/showDetailParams.test.ts`
- Modify: `src/contexts/PlayerContext.tsx:620, 1014`
- Modify: `src/contexts/__tests__/PlayerContext.loadShuffleShow.test.tsx` (+ any other PlayerContext test that drives `startShuffleShows`/`playNextShow`)
- Modify: `src/navigation/AppNavigator.tsx:114` (`sourceConstraint?: string`)
- Modify: `src/navigation/webLinking.ts:4-13, 51-60` (identifier→date map covers every recording; `sourceConstraint` param)

**Interfaces:**
- Consumes: `resolveShowIdentifier` (Task 5); `SourceConstraint`, `stringifySourceConstraint` (Task 4).
- Produces: `showDetailParams(show: GratefulDeadShow, opts?: { sourceConstraint?: SourceConstraint }): ShowDetailParams` where `ShowDetailParams` gains `sourceConstraint?: string`. `RootStackParamList['ShowDetail']` gains `sourceConstraint?: string`.

- [ ] **Step 1: Update the `showDetailParams` test first**

Replace the file body's two identifier assertions with resolver-aware ones:

```ts
// add at top, before imports of the module under test
const mockResolveShowIdentifier = jest.fn();
jest.mock('../../services/sourceSelection', () => ({
  resolveShowIdentifier: (...args: unknown[]) => mockResolveShowIdentifier(...args),
}));
```
and inside `describe('showDetailParams')`:
```ts
  beforeEach(() => {
    mockResolveShowIdentifier.mockImplementation((show: GratefulDeadShow) => show.primaryIdentifier);
  });

  it('resolves the identifier through sourceSelection (preference / pins), not primaryIdentifier blindly', () => {
    mockResolveShowIdentifier.mockReturnValue('gd77-05-08.aud.preferred');
    const show = makeShow();
    expect(showDetailParams(show).identifier).toBe('gd77-05-08.aud.preferred');
    expect(mockResolveShowIdentifier).toHaveBeenCalledWith(show, undefined);
  });

  it('passes a session constraint through and serializes it as a route param', () => {
    const show = makeShow();
    const params = showDetailParams(show, { sourceConstraint: { format: 'sbd', lineage: ['betty'] } });
    expect(mockResolveShowIdentifier).toHaveBeenCalledWith(show, { format: 'sbd', lineage: ['betty'] });
    expect(params.sourceConstraint).toBe('sbd,betty');
  });
```
Keep the existing "maps a GratefulDeadShow into the full bundle" test but add `sourceConstraint: undefined` to its expected object; replace the "uses primaryIdentifier" test with the resolver test above. Run → FAIL.

- [ ] **Step 2: Implement `showDetailParams`**

```ts
import { GratefulDeadShow } from '../types/show.types';
import { resolveShowIdentifier } from '../services/sourceSelection';
import { SourceConstraint, stringifySourceConstraint } from '../services/recordingResolver';

export interface ShowDetailParams {
  identifier: string;
  venue?: string;
  date: string;
  location?: string;
  classicTier?: 1 | 2 | 3;
  /** Serialized SourceConstraint (see recordingResolver) — honoured for this visit only. */
  sourceConstraint?: string;
}

export function showDetailParams(
  show: GratefulDeadShow,
  opts: { sourceConstraint?: SourceConstraint } = {},
): ShowDetailParams {
  return {
    identifier: resolveShowIdentifier(show, opts.sourceConstraint),
    venue: show.venue,
    date: show.date,
    location: show.location,
    classicTier: show.classicTier,
    sourceConstraint: stringifySourceConstraint(opts.sourceConstraint),
  };
}
```
Keep the existing doc comment; add one line: "The identifier is the user's preferred recording for the show, not `primaryIdentifier`."

- [ ] **Step 3: Navigation types + web linking**

`src/navigation/AppNavigator.tsx:114` — add `sourceConstraint?: string;` to the `ShowDetail` params.

`src/navigation/webLinking.ts`:
- Build `identifierToDate` from **every** recording, so a preferred non-primary recording still gets a clean `/show/YYYY-MM-DD` URL:
```ts
Object.values(showsData).forEach((yearShows: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  yearShows.forEach(show => {
    if (!show.date) return;
    const date = show.date.substring(0, 10);
    if (show.primaryIdentifier) identifierToDate[show.primaryIdentifier] = date;
    (show.versions ?? []).forEach((v: { identifier?: string }) => {
      if (v.identifier) identifierToDate[v.identifier] = date;
    });
  });
});
```
- In `showDetailRoute`, add `sourceConstraint` to `parse` and `stringify` so it survives as `?sourceConstraint=sbd,betty`:
```ts
  parse: {
    identifier: sanitizeIdentifier,
    trackTitle: parseTrackSlug,
    sourceConstraint: (s: string) => decodeURIComponent(s).replace(/[^a-z0-9,]/gi, ''),
  },
  stringify: {
    identifier: (id: string) => identifierToDate[id] || id,
    trackTitle: stringifyTrackTitle,
    sourceConstraint: (s: string) => encodeURIComponent(s),
  },
```
(React Navigation puts non-path params in the query string automatically.)

- [ ] **Step 4: PlayerContext seams**

Add `import { resolveShowIdentifier } from '../services/sourceSelection';` and change:
- `playNextShow` (≈ L620): `archiveApi.getShowDetail(nextShow.primaryIdentifier)` → `archiveApi.getShowDetail(resolveShowIdentifier(nextShow))`.
- `loadShuffleShow` (≈ L1014): `archiveApi.getShowDetail(show.primaryIdentifier)` → `const identifier = resolveShowIdentifier(show); const showDetail = await archiveApi.getShowDetail(identifier);` and use `identifier` in the two log lines that follow (≈ L1025, L1054) instead of `show.primaryIdentifier`.

Then in every PlayerContext test that drives `startShuffleShows` or `playNextShow` with hand-built shows (run `grep -ln "startShuffleShows\|playNextShow\|makeShow(" src/contexts/__tests__/PlayerContext*.test.tsx`), add next to the existing `archiveApi` mock:
```ts
// The resolver would consult the real bundled catalog for 1977-05-08 and
// pick a real identifier; these tests key everything off the fake one.
jest.mock('../../services/sourceSelection', () => ({
  resolveShowIdentifier: (show: { primaryIdentifier: string }) => show.primaryIdentifier,
}));
```

- [ ] **Step 5: Run the affected tests, typecheck, commit**

Run: `npx jest src/utils/__tests__/showDetailParams.test.ts src/contexts/__tests__ src/navigation` → PASS. `npm run typecheck` → clean. Manually confirm `grep -n "primaryIdentifier" src/contexts/PlayerContext.tsx` shows no remaining `getShowDetail(…primaryIdentifier)` call.

```bash
git add src/utils/showDetailParams.ts src/utils/__tests__/showDetailParams.test.ts src/contexts/PlayerContext.tsx src/contexts/__tests__ src/navigation/AppNavigator.tsx src/navigation/webLinking.ts
git commit -m "feat(source-prefs): route show navigation and auto-play through the recording resolver

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Show screen — pins on switch, "Use default", fallback notice, session constraint; `VersionPicker` markers + nudge

**Files:**
- Modify: `src/components/VersionPicker.tsx`
- Modify: `src/__tests__/components/VersionPicker.test.tsx`
- Modify: `src/screens/ShowDetailScreen.tsx:69-85, 177-201, 244-300, 583-591, 695-701`

**Interfaces:**
- Consumes: `useSourcePrefs`, `usePendingNudge`, `useActivePin` (Task 7); `resolveForDate`, `resolveRouteIdentifier` (Task 5); `describeFallback`, `parseSourceConstraint` (Task 4); `formatLabel` (`tags.ts`); `useToast`.
- Produces: `VersionPicker` props gain
  ```ts
  defaultIdentifier?: string;      // resolver's pick for this show (marked "Default")
  pinnedIdentifier?: string;       // user's pin (marked "Pinned"); enables the "Use default" row
  onUseDefault?: () => void;
  nudge?: { format: RecordingFormat; onAnswer: (accept: boolean) => void };
  ```

- [ ] **Step 1: Extend the VersionPicker test**

Append to `src/__tests__/components/VersionPicker.test.tsx` (the existing `render` helper accepts prop overrides):

```tsx
it('marks the default and pinned recordings and offers "Use default" only when pinned', async () => {
  const onUseDefault = jest.fn();
  const { tree } = await render({ defaultIdentifier: VERSIONS[1].identifier, pinnedIdentifier: VERSIONS[0].identifier, onUseDefault });
  await openPicker(tree);
  const text = allText(tree);
  expect(text).toContain('Default');
  expect(text).toContain('Pinned');
  const useDefault = tree.root.findByProps({ testID: 'version-use-default' });
  await act(async () => { useDefault.props.onPress(); });
  expect(onUseDefault).toHaveBeenCalledTimes(1);
});

it('hides "Use default" when nothing is pinned', async () => {
  const { tree } = await render({ defaultIdentifier: VERSIONS[0].identifier });
  await openPicker(tree);
  expect(tree.root.findAllByProps({ testID: 'version-use-default' }, { deep: false })).toHaveLength(0);
});

it('shows the nudge and reports the answer', async () => {
  const onAnswer = jest.fn();
  const { tree } = await render({ nudge: { format: 'matrix', onAnswer } });
  await openPicker(tree);
  expect(allText(tree).some(t => t.includes('Prefer Matrix everywhere?'))).toBe(true);
  await act(async () => { tree.root.findByProps({ testID: 'nudge-yes' }).props.onPress(); });
  expect(onAnswer).toHaveBeenCalledWith(true);
  await act(async () => { tree.root.findByProps({ testID: 'nudge-no' }).props.onPress(); });
  expect(onAnswer).toHaveBeenCalledWith(false);
});
```
Run → FAIL.

- [ ] **Step 2: Implement the VersionPicker additions**

In `src/components/VersionPicker.tsx`:
1. Extend the props interface with the four optional props above and destructure them.
2. In `renderVersionOptions`, inside `styles.tagRow` after the lineage chips, add:
```tsx
              {version.identifier === defaultIdentifier && (
                <View style={[styles.lineageChip, styles.markerChip]}><Text style={styles.markerChipText}>Default</Text></View>
              )}
              {version.identifier === pinnedIdentifier && (
                <View style={[styles.lineageChip, styles.markerChip]}><Text style={styles.markerChipText}>Pinned</Text></View>
              )}
```
3. Add a `renderHeaderExtras()` used by BOTH modal branches directly under the `modalHeader` view:
```tsx
  const renderHeaderExtras = () => (
    <>
      {nudge && (
        <View style={styles.nudgeRow} testID="nudge-row">
          <Text style={styles.nudgeText}>Prefer {formatLabel(nudge.format)} everywhere?</Text>
          <View style={styles.nudgeButtons}>
            <TouchableOpacity testID="nudge-yes" style={styles.nudgeButtonPrimary} onPress={() => nudge.onAnswer(true)} accessibilityRole="button">
              <Text style={styles.nudgeButtonPrimaryText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="nudge-no" style={styles.nudgeButton} onPress={() => nudge.onAnswer(false)} accessibilityRole="button">
              <Text style={styles.nudgeButtonText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {pinnedIdentifier && onUseDefault && (
        <TouchableOpacity
          testID="version-use-default"
          style={styles.option}
          onPress={() => { onUseDefault(); setIsOpen(false); }}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <View style={styles.optionInfo}>
            <Text style={styles.optionSource}>Use default</Text>
            <Text style={styles.optionDownloads}>Forget the pin for this show and follow your playback setting</Text>
          </View>
          <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </>
  );
```
   Render `{renderHeaderExtras()}` as the first child of each `ScrollView style={styles.optionsList}`.
4. Styles:
```ts
  markerChip: { borderColor: COLORS.accent },
  markerChipText: { ...TYPOGRAPHY.caption, color: COLORS.accent, fontWeight: '600' },
  nudgeRow: {
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  nudgeText: { ...TYPOGRAPHY.body, fontWeight: '600', marginBottom: SPACING.sm },
  nudgeButtons: { flexDirection: 'row', gap: SPACING.sm },
  nudgeButtonPrimary: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, backgroundColor: COLORS.accent },
  nudgeButtonPrimaryText: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFF', fontWeight: '600' },
  nudgeButton: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  nudgeButtonText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
```
Run the VersionPicker tests → PASS.

- [ ] **Step 3: Wire the show screen**

In `src/screens/ShowDetailScreen.tsx`:

1. Imports:
```ts
import { useSourcePrefs, usePendingNudge, useActivePin, useSourcePrefsVersion } from '../contexts/SourcePrefsContext';
import { resolveForDate, resolveRouteIdentifier } from '../services/sourceSelection';
import { rankRecordings } from '../services/recordingRanker';
import { describeFallback, parseSourceConstraint } from '../services/recordingResolver';
import { useToast } from '../contexts/ToastContext';
```
2. Route params: add `sourceConstraint: sourceConstraintParam` to the destructure at ≈ L76 and `const sessionConstraint = useMemo(() => parseSourceConstraint(sourceConstraintParam), [sourceConstraintParam]);`.
3. Replace `resolveIdentifier` (≈ L177–180) with:
```ts
  const resolveIdentifier = useCallback(
    (id: string) => resolveRouteIdentifier(id, sessionConstraint),
    [sessionConstraint],
  );
```
(`resolveIdentifierFromDate` import can be dropped if now unused.)
4. Hooks near the other context hooks: `const { pin, clearPin, setPreference, answerNudge } = useSourcePrefs();`, `const pendingNudge = usePendingNudge();`, `const sourcePrefsVersion = useSourcePrefsVersion();`, `const showDate = previewDate ?? show?.date;` (already exists at ≈ L104 — reuse), `const activePin = useActivePin(showDate);`, `const { showToast } = useToast();`, `const [fallbackNote, setFallbackNote] = useState<string | null>(null);`, `const fallbackNoticeForRef = useRef<string | null>(null);`.
5. In `loadShowDetail`, the picker lists recordings best-first (spec: "sorted by score"): change the versions line to `const versions = withCurrentRecording(rankRecordings(getCatalogVersions(previewDate ?? detail.date ?? '')), identifier);` (import `rankRecordings`). Then, after `setSelectedVersion(identifier);`:
```ts
      // Explain a fallback once per loaded recording: the resolver picked
      // this identifier because the preferred kind doesn't exist tonight.
      const resolved = resolveForDate(previewDate ?? detail.date ?? '', { sessionConstraint, fallbackIdentifier: identifier });
      const chosen = versions.find(v => v.identifier === identifier);
      if (resolved?.fallback && resolved.identifier === identifier && chosen) {
        const note = describeFallback(resolved.fallback, chosen);
        setFallbackNote(note);
        if (fallbackNoticeForRef.current !== identifier) {
          fallbackNoticeForRef.current = identifier;
          showToast(note, 'info');
        }
      } else {
        setFallbackNote(null);
      }
```
6. `handleVersionChange`:
```ts
  const handleVersionChange = async (versionIdentifier: string) => {
    if (versionIdentifier === selectedVersion) return;
    const date = previewDate ?? show?.date;
    const chosen = show?.allVersions?.find(v => v.identifier === versionIdentifier);
    if (date && chosen) pin(date, versionIdentifier, chosen.format);
    await loadShowDetail(versionIdentifier);
  };

  const handleUseDefault = async () => {
    const date = previewDate ?? show?.date;
    if (!date) return;
    clearPin(date);
    const next = resolveForDate(date, { sessionConstraint, fallbackIdentifier: selectedVersion });
    if (next && next.identifier !== selectedVersion) await loadShowDetail(next.identifier);
  };
```
7. Resolver's default for the markers (what would play with no pin): `const defaultIdentifier = useMemo(() => (showDate ? resolveForDate(showDate, { sessionConstraint, ignoreUserPin: true })?.identifier : undefined), [showDate, sessionConstraint, sourcePrefsVersion]);` — `sourcePrefsVersion` comes from `useSourcePrefsVersion()` (step 4) so this recomputes when prefs change.
8. Nudge object:
```ts
  const nudge = pendingNudge
    ? {
        format: pendingNudge,
        onAnswer: (accept: boolean) => {
          answerNudge(pendingNudge, accept ? 'yes' : 'no');
          if (accept) setPreference(pendingNudge);
        },
      }
    : undefined;
```
9. Both `<VersionPicker …/>` sites get `defaultIdentifier={defaultIdentifier} pinnedIdentifier={activePin?.identifier} onUseDefault={handleUseDefault} nudge={nudge}`.
10. Fallback note under the pill: directly below each `VersionPicker`/static pill block, `{fallbackNote && <Text style={styles.fallbackNote}>{fallbackNote}</Text>}` with `fallbackNote: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xs }` (reuse an existing caption style if one fits the surrounding block).

- [ ] **Step 4: Run, typecheck, eyeball, commit**

Run: `npx jest src/__tests__/components/VersionPicker.test.tsx src/services/__tests__/sourceSelection.test.ts src/screens` → PASS. `npm run typecheck` → clean.
Manual check (web, `npx expo start --web --port 8090`): open `/show/1977-05-08`; switch to the Betty Board → reload the page → it's still the Betty Board and marked "Pinned"; "Use default" returns to the matrix; set Settings → Playback to FM (after Task 10) and open `/show/1977-05-08` → toast "No FM broadcast from this night — playing the … instead." Record what you saw in the report.

```bash
git add src/components/VersionPicker.tsx src/__tests__/components/VersionPicker.test.tsx src/screens/ShowDetailScreen.tsx
git commit -m "feat(source-prefs): pins on switch, Use default, fallback notice, nudge, session constraint on the show screen

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Settings → Playback section

**Files:**
- Create: `src/components/SourcePreferencePicker.tsx`
- Test: `src/__tests__/components/SourcePreferencePicker.test.tsx`
- Modify: `src/screens/SettingsScreen.tsx:469` (insert a "Playback" section above "Public Profile")

**Interfaces:**
- Consumes: `SOURCE_PREFERENCE_OPTIONS`, `SourcePreference` (Task 1); `useSourcePreference`, `useSourcePrefs` (Task 7).
- Produces: `export function SourcePreferencePicker({ value, onChange }: { value: SourcePreference; onChange: (v: SourcePreference) => void })` — a vertical list of five rows, each `accessibilityRole="radio"` with `accessibilityState={{ selected }}` and `testID={`source-pref-${value}`}`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/SourcePreferencePicker.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SourcePreferencePicker } from '../../components/SourcePreferencePicker';

it('renders the five options with labels and descriptions and marks the selected one', async () => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => { tree = TestRenderer.create(<SourcePreferencePicker value="matrix" onChange={jest.fn()} />); });
  const radios = tree.root.findAllByProps({ accessibilityRole: 'radio' }, { deep: false });
  expect(radios).toHaveLength(5);
  expect(radios.map(r => r.props.accessibilityState.selected)).toEqual([false, false, false, true, false]);
  const text = tree.root.findAllByType(Text).map(t => React.Children.toArray(t.props.children).join(''));
  expect(text).toContain('Most Popular');
  expect(text).toContain('Soundboard and audience blended together');
});

it('reports the tapped value', async () => {
  const onChange = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => { tree = TestRenderer.create(<SourcePreferencePicker value="popular" onChange={onChange} />); });
  await act(async () => { tree.root.findByProps({ testID: 'source-pref-fm' }).props.onPress(); });
  expect(onChange).toHaveBeenCalledWith('fm');
});
```
Run → FAIL.

- [ ] **Step 2: Implement the component**

```tsx
// src/components/SourcePreferencePicker.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SOURCE_PREFERENCE_OPTIONS, SourcePreference } from '../constants/sourcePreferences';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface SourcePreferencePickerProps {
  value: SourcePreference;
  onChange: (value: SourcePreference) => void;
}

export function SourcePreferencePicker({ value, onChange }: SourcePreferencePickerProps) {
  return (
    <View accessibilityRole="radiogroup">
      {SOURCE_PREFERENCE_OPTIONS.map(option => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            testID={`source-pref-${option.value}`}
            style={styles.row}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            accessibilityHint={option.description}
          >
            <View style={styles.info}>
              <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
              <Text style={styles.hint}>{option.description}</Text>
            </View>
            <Ionicons
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={selected ? COLORS.accent : COLORS.textTertiary}
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
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  info: { flex: 1, marginRight: SPACING.lg },
  label: { ...TYPOGRAPHY.body, fontWeight: '600' },
  labelSelected: { color: COLORS.accent },
  hint: { ...TYPOGRAPHY.captionSmall, color: COLORS.textSecondary, marginTop: 2 },
});
```
(`COLORS.textTertiary` exists — `VersionPicker` uses it. If `TYPOGRAPHY.captionSmall` doesn't exist, use `TYPOGRAPHY.caption`; `SettingsScreen.toggleHint` uses `captionSmall`, so it should.)

- [ ] **Step 3: Add the Settings section**

In `src/screens/SettingsScreen.tsx`: import `SourcePreferencePicker`, `useSourcePreference`, `useSourcePrefs`; inside the component `const sourcePreference = useSourcePreference(); const { setPreference } = useSourcePrefs();`. Insert immediately before the `{/* Public Profile Section */}` comment (≈ L469), at the same nesting level and regardless of auth state:

```tsx
      {/* Playback Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Playback</Text>
        <Text style={styles.toggleHint}>
          Which recording to play when a show has more than one. Picking a recording on a show's page pins it for that show only.
        </Text>
        <SourcePreferencePicker value={sourcePreference} onChange={setPreference} />
      </View>
```
If the Settings screen early-returns for signed-out users before this point, move the section so it renders in both states (the preference is device-local until sign-in).

- [ ] **Step 4: Run, typecheck, commit**

Run: `npx jest src/__tests__/components/SourcePreferencePicker.test.tsx` → PASS. `npm run typecheck` → clean. Manual: Settings shows the Playback list; selecting Matrix then opening a show with a matrix plays it.

```bash
git add src/components/SourcePreferencePicker.tsx src/__tests__/components/SourcePreferencePicker.test.tsx src/screens/SettingsScreen.tsx
git commit -m "feat(source-prefs): Playback section in Settings with the recording preference picker

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Verification, spec amendments, apply note

**Files:**
- Modify: `docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md` (Part 2 amendments)
- Modify: `supabase/migrations/README.md` (pending-apply note)

- [ ] **Step 1: Spec amendments (Part 2)**

In the "User store" section, change `SourcePin` to `{ identifier: string; format: RecordingFormat; pinnedAt: number; deletedAt?: number }` and add: "`format` is stored at pin time so the nudge needs no catalog lookup." In "Resolver", note: "Implemented as pure `recordingResolver` + store-aware `sourceSelection` (`resolveForDate` / `resolveShowIdentifier` / `resolveRouteIdentifier`); `showDetailParams` resolves the identifier for every navigation, and web URLs map any recording identifier back to its date." In "Filter precedence", note the param name `sourceConstraint` and its comma-separated encoding. In "UI → Nudge", note the prompt lives in the picker's modal header.

- [ ] **Step 2: Apply note**

Append to `supabase/migrations/README.md` under the apply log:
```md
**Pending — not yet applied:** `20260820120000_user_preferences_table` (source preference engine). Apply with `supabase db push --linked` from the personal Supabase account (see the 2026-07 note about the wrong-org login), then verify: table shape (user_id/prefs/pins/updated_at), RLS enabled, four per-user policies using `(select auth.uid())`, both size constraints, FK cascade. Until applied, the app syncs nothing for this feature (the cloud service's upsert will fail and surface the "saved locally" toast once per 30 s while signed in).
```

- [ ] **Step 3: Full verification**

Run: `npx jest` (full, ≥10 min timeout) → all suites pass. `npm run typecheck` → clean. `npm run typecheck:web 2>&1 | grep "error TS" | grep -v expo-file-system` → exactly the two pre-existing `PlayerContext.tsx` lines.
Run: `grep -rn "getShowDetail(.*primaryIdentifier" src` → nothing.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md supabase/migrations/README.md
git commit -m "docs(source-prefs): spec amendments and migration apply note

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Then the controller runs the final whole-branch review and `superpowers:finishing-a-development-branch`. The PR body must state that the migration is **not yet applied** and that native needs an `eas update`.
