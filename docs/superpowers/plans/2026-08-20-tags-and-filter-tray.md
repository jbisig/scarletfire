# Show Tags & Filter Tray Implementation Plan (Tagging PR 3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every show resolves to a set of tags across five categories (Era, Source, Venue Type, Instrumentation, Notable), the filter tray lets users combine them (OR within a category, AND between categories) with live per-tag counts, the old official-release *Series* filter becomes an "also on …" row badge, and opening a show from a source-filtered list carries that constraint to the recording resolver.

**Architecture:** A static tag registry (`src/constants/tags.ts`) plus small curated datasets (`src/data/eras.ts`, `venueTypes.ts` (generated from a committed TSV), `festivalDates.ts`, `instrumentation.ts`, `notableShows.ts`). A read-time `tagResolver` computes a show's tags from date + venue + catalog recordings, builds a lazy inverted index `Map<TagId, Set<date>>`, and exposes an entity-agnostic predicate builder, a date-list filter, faceted counts, and residency detection. The tray swaps `SeriesSection` for collapsible `TagCategorySection`s with counts; `HomeScreen`/`FavoritesScreen` filter dates through the resolver; `?tags=` replaces `?series=`.

**Tech Stack:** React Native / Expo 54, TypeScript strict, Jest (`jest-expo`, `react-test-renderer`), Node script for data generation.

**Spec:** `docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md` — Part 3. PR 1 (`51fc07f`) and PR 2 (`ccf3048`) are merged. Research inputs (committed on `main` at `3054dd9`): `docs/superpowers/research/2026-08-20-part3-curated-tags.md` (Pedal Steel 32 · Acoustic Set 89 · Historic Event 43 · Guest Sit-In 106 · Festival 23 rows, each with source + confidence) and `scripts/data/venue-types.tsv` (613 normalized venues → type/confidence/international).

## Global Constraints

- **Tag ids are permanent, URL-facing slugs.** Era: `primal livedead americana europe72 wallofsound hiatus return peakkeith brent vincebruce finalyears`. Source: `sbd aud matrix fm betty miller 16track lowgen` (unchanged from PR 1/2). Venue Type: `theater arena stadium amphitheater festival international residency`. Instrumentation: `pedalsteel acousticset`. Notable: `classic historic guest`.
- **Filter logic:** OR within a category, AND between categories; an empty category applies no constraint. Counts are faceted: a tag's count applies every *other* category's selection, ignores its own category's selection, and is computed against the caller's base set of dates (Home → all catalog dates; Favorites → favorite dates) after the Years filter.
- **No pruning.** Every tag appears in the menu.
- **Year filtering stays.** `YearsSection` is kept as-is functionally (year grid, era grouping now via `eraForYear`, select-all per era) and renders BELOW the five tag category sections in the tray. Only the official-release *Series* section is removed.
- **Era ranges are contiguous and exhaustive** (table in Task 2); every catalog date maps to exactly one era — tested against the real `shows.json`.
- **Venue matching key** = `normalizeVenue(show.venue)`: lowercase → non-`[A-Za-z0-9_\s]` chars replaced by spaces → whitespace collapsed → trimmed → leading `"the "` removed. This is EXACTLY how `scripts/data/venue-types.tsv` keys were produced (from `show.venue`, not `getVenueFromShow`). Never change one without the other.
- **International** comes from the curated venue flag (`international = yes` in the TSV), not a location regex (the regex misfires on "Mill Valley, California" and "Unknown").
- **Residency** = a run of ≥ 4 shows at the same `normalizeVenue` key where each show is within 10 days of the previous one in the run; every show in the run gets the tag.
- **Curated datasets** carry `{ date, note, source, confidence }`; only `high` and `medium` rows are exported as active data — `low` rows go in a separate `UNVERIFIED_*` export the resolver never reads. Dates that aren't in the catalog are allowed (no Archive recording exists); tests check `YYYY-MM-DD` format and non-empty `source`, not catalog membership.
- **Consensus Classic** = `TIER_1_SHOWS` from `src/data/classicShowsTiers.ts` (23 shows).
- **Series filter is removed** (`SeriesSection`, `selectedSeries`, `?series=`, `getYearsForAnySeries` usage in HomeScreen); the row badge reads *"also on {release}"* with `+N` when several, picking the first release by `DISPLAY_SERIES` order.
- **Session constraint hand-off:** navigating to a show from a filtered list passes `sourceConstraint` built from the selected Source tags (first selected format + all selected lineage tags — `SourceConstraint.format` is single-valued). Already plumbed: `showDetailParams(show, { sourceConstraint })`, `ShowDetailScreen` honours it.
- **Never key user state by `show.identifier`** (PR 2 rule) — this PR touches none of that, keep it so.
- Tests: `npx jest <path>` (Jest 29 rejects `-v`; use `--verbose`). Typecheck `npm run typecheck`; `typecheck:web` baseline is 50 errors (48 `expo-file-system` + `PlayerContext.tsx` ×2) — add none. Component tests use `react-test-renderer` in `act` with a `SafeAreaProvider` wrapper where `useSafeAreaInsets` is used; `findAllByProps(…, { deep: false })` for counts.
- Commit trailer: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Branch `feat/tags-filter-tray` off `main`, worktree OUTSIDE `.worktrees/`, copy `.env`/`.env.local`.

---

### Task 1: Tag registry

**Files:**
- Modify: `src/constants/tags.ts` (grow into the registry; keep every existing export)
- Modify: `src/constants/__tests__/tags.test.ts` (append)

**Interfaces:**
- Consumes: `RecordingFormat`, `LineageTag` from `src/types/show.types.ts`; existing `FORMAT_LABELS`, `LINEAGE_LABELS`, `SourceTagId`, `isSourceTagId`, `sourceTagLabel`.
- Produces:
  ```ts
  export type EraId = 'primal' | 'livedead' | 'americana' | 'europe72' | 'wallofsound' | 'hiatus' | 'return' | 'peakkeith' | 'brent' | 'vincebruce' | 'finalyears';
  export type VenueTypeTagId = 'theater' | 'arena' | 'stadium' | 'amphitheater' | 'festival' | 'international' | 'residency';
  export type VenuePhysicalType = 'theater' | 'arena' | 'stadium' | 'amphitheater';
  export type InstrumentationTagId = 'pedalsteel' | 'acousticset';
  export type NotableTagId = 'classic' | 'historic' | 'guest';
  export type TagId = EraId | SourceTagId | VenueTypeTagId | InstrumentationTagId | NotableTagId;
  export type TagCategoryId = 'era' | 'source' | 'venueType' | 'instrumentation' | 'notable';
  export type TagEntity = 'show' | 'recording' | 'song';
  export interface TagCategory { id: TagCategoryId; label: string; appliesTo: TagEntity }
  export interface TagDef { id: TagId; category: TagCategoryId; label: string; description?: string }
  export const TAG_CATEGORIES: readonly TagCategory[]     // menu order: era, source, venueType, instrumentation, notable
  export const TAG_DEFS: readonly TagDef[]                // menu order within each category
  export function isTagId(value: string): value is TagId
  export function tagLabel(id: TagId): string
  export function tagCategory(id: TagId): TagCategoryId
  export function tagsInCategory(category: TagCategoryId): readonly TagDef[]
  ```

- [ ] **Step 1: Append the failing tests**

```ts
// append to src/constants/__tests__/tags.test.ts
import { TAG_CATEGORIES, TAG_DEFS, isTagId, tagLabel, tagCategory, tagsInCategory } from '../tags';

describe('tag registry', () => {
  it('lists the five categories in menu order, all show-level except source', () => {
    expect(TAG_CATEGORIES.map(c => c.id)).toEqual(['era', 'source', 'venueType', 'instrumentation', 'notable']);
    expect(TAG_CATEGORIES.find(c => c.id === 'source')?.appliesTo).toBe('recording');
    TAG_CATEGORIES.filter(c => c.id !== 'source').forEach(c => expect(c.appliesTo).toBe('show'));
  });

  it('defines every tag id exactly once with a label and a known category', () => {
    const ids = TAG_DEFS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'primal', 'livedead', 'americana', 'europe72', 'wallofsound', 'hiatus', 'return', 'peakkeith', 'brent', 'vincebruce', 'finalyears',
      'sbd', 'aud', 'matrix', 'fm', 'betty', 'miller', '16track', 'lowgen',
      'theater', 'arena', 'stadium', 'amphitheater', 'festival', 'international', 'residency',
      'pedalsteel', 'acousticset',
      'classic', 'historic', 'guest',
    ]);
    const categoryIds = new Set(TAG_CATEGORIES.map(c => c.id));
    TAG_DEFS.forEach(t => { expect(categoryIds.has(t.category)).toBe(true); expect(t.label.length).toBeGreaterThan(0); });
  });

  it('source tag labels come from the PR-1 tables', () => {
    expect(tagLabel('sbd')).toBe('Soundboard');
    expect(tagLabel('betty')).toBe('Betty Board');
    expect(tagLabel('europe72')).toBe("Europe '72");
    expect(tagLabel('classic')).toBe('Consensus Classic');
    expect(tagLabel('guest')).toBe('Guest Sit-In');
  });

  it('validates ids, maps to categories, and lists a category in order', () => {
    expect(isTagId('arena')).toBe(true);
    expect(isTagId('unknown')).toBe(false);
    expect(isTagId('series')).toBe(false);
    expect(tagCategory('miller')).toBe('source');
    expect(tagCategory('residency')).toBe('venueType');
    expect(tagsInCategory('instrumentation').map(t => t.id)).toEqual(['pedalsteel', 'acousticset']);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx jest src/constants/__tests__/tags.test.ts` → FAIL (missing exports).

- [ ] **Step 3: Implement — append to `src/constants/tags.ts`**

```ts
// ---- Tag registry (PR 3) ---------------------------------------------------

export type EraId =
  | 'primal' | 'livedead' | 'americana' | 'europe72' | 'wallofsound' | 'hiatus'
  | 'return' | 'peakkeith' | 'brent' | 'vincebruce' | 'finalyears';
export type VenuePhysicalType = 'theater' | 'arena' | 'stadium' | 'amphitheater';
export type VenueTypeTagId = VenuePhysicalType | 'festival' | 'international' | 'residency';
export type InstrumentationTagId = 'pedalsteel' | 'acousticset';
export type NotableTagId = 'classic' | 'historic' | 'guest';
export type TagId = EraId | SourceTagId | VenueTypeTagId | InstrumentationTagId | NotableTagId;

export type TagCategoryId = 'era' | 'source' | 'venueType' | 'instrumentation' | 'notable';
/** What kind of thing a category describes. 'song' is reserved for the later song-tags spec. */
export type TagEntity = 'show' | 'recording' | 'song';

export interface TagCategory { id: TagCategoryId; label: string; appliesTo: TagEntity }
export interface TagDef { id: TagId; category: TagCategoryId; label: string; description?: string }

export const TAG_CATEGORIES: readonly TagCategory[] = [
  { id: 'era', label: 'Era', appliesTo: 'show' },
  { id: 'source', label: 'Source', appliesTo: 'recording' },
  { id: 'venueType', label: 'Venue', appliesTo: 'show' },
  { id: 'instrumentation', label: 'Instrumentation', appliesTo: 'show' },
  { id: 'notable', label: 'Notable', appliesTo: 'show' },
];

const ERA_DEFS: TagDef[] = [
  { id: 'primal', category: 'era', label: 'Primal Dead' },
  { id: 'livedead', category: 'era', label: 'Live/Dead' },
  { id: 'americana', category: 'era', label: 'Americana' },
  { id: 'europe72', category: 'era', label: "Europe '72" },
  { id: 'wallofsound', category: 'era', label: 'Wall of Sound' },
  { id: 'hiatus', category: 'era', label: 'Hiatus' },
  { id: 'return', category: 'era', label: 'Return' },
  { id: 'peakkeith', category: 'era', label: 'Peak Keith' },
  { id: 'brent', category: 'era', label: 'Brent Era' },
  { id: 'vincebruce', category: 'era', label: 'Vince & Bruce' },
  { id: 'finalyears', category: 'era', label: 'Final Years' },
];

const SOURCE_DEFS: TagDef[] = (['sbd', 'aud', 'matrix', 'fm'] as const)
  .map(id => ({ id, category: 'source' as const, label: FORMAT_LABELS[id] }))
  .concat((['betty', 'miller', '16track', 'lowgen'] as const)
    .map(id => ({ id, category: 'source' as const, label: LINEAGE_LABELS[id] })));

const VENUE_DEFS: TagDef[] = [
  { id: 'theater', category: 'venueType', label: 'Small Theater' },
  { id: 'arena', category: 'venueType', label: 'Arena' },
  { id: 'stadium', category: 'venueType', label: 'Stadium' },
  { id: 'amphitheater', category: 'venueType', label: 'Amphitheater' },
  { id: 'festival', category: 'venueType', label: 'Festival' },
  { id: 'international', category: 'venueType', label: 'International' },
  { id: 'residency', category: 'venueType', label: 'Residency' },
];

const INSTRUMENTATION_DEFS: TagDef[] = [
  { id: 'pedalsteel', category: 'instrumentation', label: 'Pedal Steel', description: 'Jerry on pedal steel during the Dead’s set' },
  { id: 'acousticset', category: 'instrumentation', label: 'Acoustic Set' },
];

const NOTABLE_DEFS: TagDef[] = [
  { id: 'classic', category: 'notable', label: 'Consensus Classic' },
  { id: 'historic', category: 'notable', label: 'Historic Event' },
  { id: 'guest', category: 'notable', label: 'Guest Sit-In' },
];

export const TAG_DEFS: readonly TagDef[] = [
  ...ERA_DEFS, ...SOURCE_DEFS, ...VENUE_DEFS, ...INSTRUMENTATION_DEFS, ...NOTABLE_DEFS,
];

const TAG_BY_ID: ReadonlyMap<string, TagDef> = new Map(TAG_DEFS.map(t => [t.id, t]));

export function isTagId(value: string): value is TagId {
  return TAG_BY_ID.has(value);
}

export function tagLabel(id: TagId): string {
  return TAG_BY_ID.get(id)!.label;
}

export function tagCategory(id: TagId): TagCategoryId {
  return TAG_BY_ID.get(id)!.category;
}

export function tagsInCategory(category: TagCategoryId): readonly TagDef[] {
  return TAG_DEFS.filter(t => t.category === category);
}
```

Also update the file's header comment to say it is now the full tag registry.

- [ ] **Step 4: Run, typecheck, commit**

`npx jest src/constants/__tests__/tags.test.ts` → PASS; `npm run typecheck` → clean.

```bash
git add src/constants/tags.ts src/constants/__tests__/tags.test.ts
git commit -m "feat(tags): tag registry — five categories, permanent ids, labels

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Eras (replaces both old taxonomies)

**Files:**
- Create: `src/data/eras.ts`
- Test: `src/data/__tests__/eras.test.ts`
- Modify: `src/constants/classicShows.ts` (delete `Era` + `ERAS`; keep the re-exports and `GRATEFUL_DEAD_101_DATES`)
- Delete: `src/components/EraPicker.tsx` (zero consumers)

**Interfaces:**
- Consumes: `EraId` (Task 1); `getAllShowsSorted` from `src/utils/showLookup.ts`.
- Produces:
  ```ts
  export interface EraDef { id: EraId; label: string; start: string; end: string }   // inclusive YYYY-MM-DD
  export const ERAS: readonly EraDef[]
  export function eraForDate(date: string): EraId          // date sliced to 10 chars; throws RangeError outside 1965-01-01..1995-12-31
  export function eraForYear(year: string | number): EraId // era containing the most catalog shows of that year; falls back to the era containing July 1
  export function groupYearsByEra(years: string[]): Array<{ era: EraDef; years: string[] }>  // preserves ERAS order, drops empty eras
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/__tests__/eras.test.ts
import { ERAS, eraForDate, eraForYear, groupYearsByEra } from '../eras';
import { tagLabel } from '../../constants/tags';
import showsData from '../shows.json';
import type { ShowsByYear } from '../../types/show.types';

describe('ERAS', () => {
  it('is contiguous, ordered, and covers 1965-01-01..1995-12-31', () => {
    expect(ERAS[0].start).toBe('1965-01-01');
    expect(ERAS[ERAS.length - 1].end).toBe('1995-12-31');
    for (let i = 1; i < ERAS.length; i++) {
      const prevEnd = new Date(ERAS[i - 1].end + 'T00:00:00Z').getTime();
      const start = new Date(ERAS[i].start + 'T00:00:00Z').getTime();
      expect(start - prevEnd).toBe(24 * 60 * 60 * 1000);
    }
  });

  it('matches the registry ids and labels', () => {
    ERAS.forEach(e => expect(tagLabel(e.id)).toBe(e.label));
    expect(ERAS.map(e => e.id)).toEqual([
      'primal', 'livedead', 'americana', 'europe72', 'wallofsound', 'hiatus', 'return', 'peakkeith', 'brent', 'vincebruce', 'finalyears',
    ]);
  });
});

describe('eraForDate', () => {
  it('lands on the spec boundaries', () => {
    expect(eraForDate('1967-12-31')).toBe('primal');
    expect(eraForDate('1968-01-01')).toBe('livedead');
    expect(eraForDate('1972-04-06')).toBe('americana');
    expect(eraForDate('1972-04-07')).toBe('europe72');
    expect(eraForDate('1973-01-01')).toBe('wallofsound');
    expect(eraForDate('1974-10-20')).toBe('wallofsound');
    expect(eraForDate('1974-10-21')).toBe('hiatus');
    expect(eraForDate('1976-06-03')).toBe('return');
    expect(eraForDate('1977-05-08T00:00:00Z')).toBe('peakkeith');
    expect(eraForDate('1979-02-17')).toBe('peakkeith');
    expect(eraForDate('1979-02-18')).toBe('brent');
    expect(eraForDate('1990-07-23')).toBe('brent');
    expect(eraForDate('1990-07-24')).toBe('vincebruce');
    expect(eraForDate('1992-03-24')).toBe('vincebruce');
    expect(eraForDate('1992-03-25')).toBe('finalyears');
    expect(eraForDate('1995-07-09')).toBe('finalyears');
  });

  it('throws outside the band’s span', () => {
    expect(() => eraForDate('1964-12-31')).toThrow(RangeError);
    expect(() => eraForDate('1996-01-01')).toThrow(RangeError);
  });

  it('gives every catalog show exactly one era', () => {
    const shows = Object.values(showsData as ShowsByYear).flat();
    const counts = new Map<string, number>();
    shows.forEach(s => { const e = eraForDate(s.date); counts.set(e, (counts.get(e) ?? 0) + 1); });
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(shows.length);
    expect(counts.size).toBe(ERAS.length);
  });
});

describe('eraForYear / groupYearsByEra', () => {
  it('picks the era with the most shows that year (1972 → europe72, 1974 → wallofsound, 1990 → brent)', () => {
    expect(eraForYear('1972')).toBe('europe72');
    expect(eraForYear(1974)).toBe('wallofsound');
    expect(eraForYear('1990')).toBe('brent');
    expect(eraForYear('1975')).toBe('hiatus');
  });

  it('groups years in era order and drops empty eras', () => {
    const groups = groupYearsByEra(['1977', '1965', '1978', '1995', '1976']);
    expect(groups.map(g => g.era.id)).toEqual(['primal', 'return', 'peakkeith', 'finalyears']);
    expect(groups.find(g => g.era.id === 'peakkeith')?.years).toEqual(['1977', '1978']);
  });
});
```

- [ ] **Step 2: Run to verify failure** → FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/data/eras.ts
/**
 * The single era taxonomy (replaces ShowsFilterTray FILTER_ERAS and
 * constants/classicShows ERAS). Ranges are inclusive, contiguous, and
 * exhaustive over the band's span, so every show date maps to exactly one
 * era (tested against the real catalog). Boundary calls: "Europe '72"
 * keeps the post-tour 1972 US dates; "Wall of Sound" starts with 1973
 * while the PA was being built.
 */
import type { EraId } from '../constants/tags';
import { getAllShowsSorted } from '../utils/showLookup';

export interface EraDef {
  id: EraId;
  label: string;
  /** inclusive, YYYY-MM-DD */
  start: string;
  /** inclusive, YYYY-MM-DD */
  end: string;
}

export const ERAS: readonly EraDef[] = [
  { id: 'primal', label: 'Primal Dead', start: '1965-01-01', end: '1967-12-31' },
  { id: 'livedead', label: 'Live/Dead', start: '1968-01-01', end: '1969-12-31' },
  { id: 'americana', label: 'Americana', start: '1970-01-01', end: '1972-04-06' },
  { id: 'europe72', label: "Europe '72", start: '1972-04-07', end: '1972-12-31' },
  { id: 'wallofsound', label: 'Wall of Sound', start: '1973-01-01', end: '1974-10-20' },
  { id: 'hiatus', label: 'Hiatus', start: '1974-10-21', end: '1976-06-02' },
  { id: 'return', label: 'Return', start: '1976-06-03', end: '1976-12-31' },
  { id: 'peakkeith', label: 'Peak Keith', start: '1977-01-01', end: '1979-02-17' },
  { id: 'brent', label: 'Brent Era', start: '1979-02-18', end: '1990-07-23' },
  { id: 'vincebruce', label: 'Vince & Bruce', start: '1990-07-24', end: '1992-03-24' },
  { id: 'finalyears', label: 'Final Years', start: '1992-03-25', end: '1995-12-31' },
];

export function eraForDate(date: string): EraId {
  const key = date.slice(0, 10);
  const era = ERAS.find(e => key >= e.start && key <= e.end);
  if (!era) throw new RangeError(`No era for date ${date}`);
  return era.id;
}

let eraByYear: Map<string, EraId> | null = null;

function buildEraByYear(): Map<string, EraId> {
  const tally = new Map<string, Map<EraId, number>>();
  for (const show of getAllShowsSorted()) {
    const year = show.date.slice(0, 4);
    const era = eraForDate(show.date);
    const perYear = tally.get(year) ?? new Map<EraId, number>();
    perYear.set(era, (perYear.get(era) ?? 0) + 1);
    tally.set(year, perYear);
  }
  const result = new Map<string, EraId>();
  for (const [year, perYear] of tally) {
    let best: EraId | null = null; let bestCount = -1;
    for (const [era, count] of perYear) if (count > bestCount) { best = era; bestCount = count; }
    if (best) result.set(year, best);
  }
  return result;
}

/** The era most of that year's catalog shows fall in (July 1 as the fallback for years with no shows). */
export function eraForYear(year: string | number): EraId {
  const key = String(year);
  if (!eraByYear) eraByYear = buildEraByYear();
  return eraByYear.get(key) ?? eraForDate(`${key}-07-01`);
}

export function groupYearsByEra(years: string[]): Array<{ era: EraDef; years: string[] }> {
  const byEra = new Map<EraId, string[]>();
  for (const year of [...years].sort()) {
    const era = eraForYear(year);
    byEra.set(era, [...(byEra.get(era) ?? []), year]);
  }
  return ERAS.filter(e => byEra.has(e.id)).map(era => ({ era, years: byEra.get(era.id)! }));
}
```

Then in `src/constants/classicShows.ts` delete the `Era` interface and `ERAS` array (lines ≈ 6–56), keeping the `getClassicTier`/`isClassicShow` re-exports and `GRATEFUL_DEAD_101_DATES`; `git rm src/components/EraPicker.tsx`.

- [ ] **Step 4: Run, typecheck, commit**

`npx jest src/data/__tests__/eras.test.ts` → PASS (if a boundary expectation fails, the table is wrong — fix the table, never the spec dates). `npm run typecheck` → clean; `grep -rn "EraPicker\|from '../constants/classicShows'" src | grep -i "ERAS\b"` → nothing.

```bash
git add src/data/eras.ts src/data/__tests__/eras.test.ts src/constants/classicShows.ts
git rm -q src/components/EraPicker.tsx
git commit -m "feat(tags): single contiguous era taxonomy; drop unused ERAS and EraPicker

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Venue normalization + generated venue types + festival dates

**Files:**
- Create: `src/utils/venueNormalization.ts`
- Create: `scripts/generateVenueTypes.js` (reads `scripts/data/venue-types.tsv`, writes `src/data/venueTypes.ts`)
- Generate: `src/data/venueTypes.ts`
- Create: `src/data/festivalDates.ts`
- Test: `src/utils/__tests__/venueNormalization.test.ts`, `src/data/__tests__/venueTypes.test.ts`
- Modify: `package.json` scripts (`"generate:venue-types": "node scripts/generateVenueTypes.js"`)

**Interfaces:**
- Produces:
  ```ts
  // src/utils/venueNormalization.ts
  export function normalizeVenue(venue: string | undefined): string
  // src/data/venueTypes.ts (generated)
  export interface VenueTypeEntry { type: VenuePhysicalType; confidence: 'high' | 'medium' | 'low' }
  export const VENUE_TYPES: Readonly<Record<string, VenueTypeEntry>>   // only venues with a physical type
  export const INTERNATIONAL_VENUES: ReadonlySet<string>
  // src/data/festivalDates.ts
  export interface CuratedShowEntry { date: string; note: string; source: string; confidence: 'high' | 'medium' }
  export const FESTIVAL_DATES: readonly CuratedShowEntry[]
  export const UNVERIFIED_FESTIVAL_DATES: readonly (Omit<CuratedShowEntry, 'confidence'> & { confidence: 'low' })[]
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/__tests__/venueNormalization.test.ts
import { normalizeVenue } from '../venueNormalization';

describe('normalizeVenue', () => {
  it('lowercases, strips punctuation to spaces, collapses whitespace, drops a leading "the"', () => {
    expect(normalizeVenue('The Spectrum')).toBe('spectrum');
    expect(normalizeVenue("Henry J. Kaiser Convention Center")).toBe('henry j kaiser convention center');
    expect(normalizeVenue('Oakland-Alameda County Coliseum')).toBe('oakland alameda county coliseum');
    expect(normalizeVenue('  Fillmore   West ')).toBe('fillmore west');
    expect(normalizeVenue("Winterland Arena")).toBe('winterland arena');
  });
  it('returns empty for missing venues', () => {
    expect(normalizeVenue(undefined)).toBe('');
    expect(normalizeVenue('')).toBe('');
  });
});
```

```ts
// src/data/__tests__/venueTypes.test.ts
import { VENUE_TYPES, INTERNATIONAL_VENUES } from '../venueTypes';
import { FESTIVAL_DATES, UNVERIFIED_FESTIVAL_DATES } from '../festivalDates';
import { normalizeVenue } from '../../utils/venueNormalization';
import showsData from '../shows.json';
import type { ShowsByYear } from '../../types/show.types';

const PHYSICAL = new Set(['theater', 'arena', 'stadium', 'amphitheater']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

describe('VENUE_TYPES (generated)', () => {
  it('keys are already-normalized venue strings and every entry is a known type', () => {
    for (const [key, entry] of Object.entries(VENUE_TYPES)) {
      expect(normalizeVenue(key)).toBe(key);
      expect(PHYSICAL.has(entry.type)).toBe(true);
      expect(['high', 'medium', 'low']).toContain(entry.confidence);
    }
  });

  it('covers the big rooms and most catalog shows', () => {
    expect(VENUE_TYPES['madison square garden'].type).toBe('arena');
    expect(VENUE_TYPES['winterland arena'].type).toBe('arena');
    expect(VENUE_TYPES['fillmore east'].type).toBe('theater');
    expect(VENUE_TYPES['red rocks amphitheatre'].type).toBe('amphitheater');
    expect(VENUE_TYPES['robert f kennedy stadium'].type).toBe('stadium');
    const shows = Object.values(showsData as ShowsByYear).flat();
    const typed = shows.filter(s => VENUE_TYPES[normalizeVenue(s.venue)]).length;
    expect(typed / shows.length).toBeGreaterThan(0.8);
  });

  it('flags international venues from the curated list', () => {
    expect(INTERNATIONAL_VENUES.has('wembley arena')).toBe(true);
    expect(INTERNATIONAL_VENUES.has('gizah sound and light theater')).toBe(true);
    expect(INTERNATIONAL_VENUES.has('madison square garden')).toBe(false);
    expect(INTERNATIONAL_VENUES.size).toBeGreaterThanOrEqual(40);
  });
});

describe('FESTIVAL_DATES', () => {
  it('has valid dates, sources, and only high/medium confidence', () => {
    expect(FESTIVAL_DATES.length).toBeGreaterThanOrEqual(15);
    const seen = new Set<string>();
    FESTIVAL_DATES.forEach(e => {
      expect(e.date).toMatch(DATE_RE);
      expect(seen.has(e.date)).toBe(false); seen.add(e.date);
      expect(e.source.length).toBeGreaterThan(3);
      expect(['high', 'medium']).toContain(e.confidence);
    });
    UNVERIFIED_FESTIVAL_DATES.forEach(e => expect(e.confidence).toBe('low'));
    expect(FESTIVAL_DATES.some(e => e.date === '1969-08-16')).toBe(true);   // Woodstock
    expect(FESTIVAL_DATES.some(e => e.date === '1973-07-28')).toBe(true);   // Watkins Glen
  });
});
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement normalization and the generator**

```ts
// src/utils/venueNormalization.ts
/**
 * Key used to look a show's venue up in the curated venue-type map. MUST stay
 * byte-identical to the normalization used to build
 * scripts/data/venue-types.tsv (from `show.venue`): lowercase, non-word
 * characters to spaces, whitespace collapsed, leading "the " dropped.
 */
export function normalizeVenue(venue: string | undefined): string {
  if (!venue) return '';
  return venue
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the /, '');
}
```

```js
// scripts/generateVenueTypes.js
/**
 * Regenerate src/data/venueTypes.ts from scripts/data/venue-types.tsv.
 * Edit the TSV (it is the source of truth), then: npm run generate:venue-types
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TSV = path.join(ROOT, 'scripts/data/venue-types.tsv');
const OUT = path.join(ROOT, 'src/data/venueTypes.ts');
const PHYSICAL = new Set(['theater', 'arena', 'stadium', 'amphitheater']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);

const lines = fs.readFileSync(TSV, 'utf8').split('\n').filter(Boolean);
const header = lines.shift().split('\t');
if (header.join(',') !== 'normalized_venue,type,confidence,international,note') {
  throw new Error(`Unexpected TSV header: ${header.join(',')}`);
}

const typed = [];
const international = [];
for (const line of lines) {
  const [venue, type, confidence, intl] = line.split('\t');
  if (!venue) continue;
  if (type) {
    if (!PHYSICAL.has(type)) throw new Error(`Bad type "${type}" for ${venue}`);
    if (!CONFIDENCE.has(confidence)) throw new Error(`Bad confidence "${confidence}" for ${venue}`);
    typed.push({ venue, type, confidence });
  }
  if (intl === 'yes') international.push(venue);
}

const q = s => JSON.stringify(s);
const body = [
  '// GENERATED FILE — do not edit. Source: scripts/data/venue-types.tsv',
  '// Regenerate with: npm run generate:venue-types',
  "import type { VenuePhysicalType } from '../constants/tags';",
  '',
  "export interface VenueTypeEntry { type: VenuePhysicalType; confidence: 'high' | 'medium' | 'low' }",
  '',
  '/** Keys are normalizeVenue(show.venue). Venues with no physical type (clubs, parks, unknowns) are absent. */',
  'export const VENUE_TYPES: Readonly<Record<string, VenueTypeEntry>> = {',
  ...typed.map(t => `  ${q(t.venue)}: { type: ${q(t.type)}, confidence: ${q(t.confidence)} },`),
  '};',
  '',
  'export const INTERNATIONAL_VENUES: ReadonlySet<string> = new Set<string>([',
  ...international.map(v => `  ${q(v)},`),
  ']);',
  '',
].join('\n');

fs.writeFileSync(OUT, body);
console.log(`Wrote ${OUT}: ${typed.length} typed venues, ${international.length} international`);
```

Add `"generate:venue-types": "node scripts/generateVenueTypes.js"` to `package.json` scripts and run it once (expected: 472 typed, 50 international).

- [ ] **Step 4: Festival dates**

Transcribe the **Festival** table from `docs/superpowers/research/2026-08-20-part3-curated-tags.md` into `src/data/festivalDates.ts`: every `high`/`medium` row → `FESTIVAL_DATES` (`{ date, note, source, confidence }`, note ≤ 120 chars, source = the URL or named reference from the table); `low` rows → `UNVERIFIED_FESTIVAL_DATES`. Skip Altamont `1969-12-06` entirely (the research marks it a non-performance) and say so in a comment. Define `CuratedShowEntry` here and re-export it from the later dataset files. File header must cite the research doc path.

- [ ] **Step 5: Run, typecheck, commit**

`npx jest src/utils/__tests__/venueNormalization.test.ts src/data/__tests__/venueTypes.test.ts` → PASS; `npm run typecheck` → clean.

```bash
git add src/utils/venueNormalization.ts src/utils/__tests__/venueNormalization.test.ts scripts/generateVenueTypes.js src/data/venueTypes.ts src/data/festivalDates.ts src/data/__tests__/venueTypes.test.ts package.json
git commit -m "feat(tags): venue normalization, generated venue types, festival dates

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Instrumentation and Notable datasets

**Files:**
- Create: `src/data/instrumentation.ts`, `src/data/notableShows.ts`
- Test: `src/data/__tests__/curatedTags.test.ts`

**Interfaces:**
- Consumes: `CuratedShowEntry` (Task 3); `TIER_1_SHOWS` from `src/data/classicShowsTiers.ts`.
- Produces:
  ```ts
  // instrumentation.ts
  export const PEDAL_STEEL_DATES: readonly CuratedShowEntry[]
  export const UNVERIFIED_PEDAL_STEEL_DATES: readonly CuratedShowEntry[]   // confidence 'low' rows, typed loosely
  export const ACOUSTIC_SET_DATES: readonly CuratedShowEntry[]
  export const UNVERIFIED_ACOUSTIC_SET_DATES: readonly CuratedShowEntry[]
  // notableShows.ts
  export const HISTORIC_EVENT_DATES: readonly CuratedShowEntry[]
  export const GUEST_SIT_IN_DATES: readonly CuratedShowEntry[]       // note = guest name(s)
  export function consensusClassicDates(): string[]                   // TIER_1_SHOWS dates
  ```
  (Type the `UNVERIFIED_*` arrays as `ReadonlyArray<Omit<CuratedShowEntry, 'confidence'> & { confidence: 'low' }>`.)

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/__tests__/curatedTags.test.ts
import { PEDAL_STEEL_DATES, ACOUSTIC_SET_DATES, UNVERIFIED_PEDAL_STEEL_DATES, UNVERIFIED_ACOUSTIC_SET_DATES } from '../instrumentation';
import { HISTORIC_EVENT_DATES, GUEST_SIT_IN_DATES, consensusClassicDates } from '../notableShows';
import { TIER_1_SHOWS } from '../classicShowsTiers';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const checkList = (list: ReadonlyArray<{ date: string; note: string; source: string; confidence: string }>, min: number) => {
  expect(list.length).toBeGreaterThanOrEqual(min);
  const seen = new Set<string>();
  list.forEach(e => {
    expect(e.date).toMatch(DATE_RE);
    expect(seen.has(e.date)).toBe(false); seen.add(e.date);
    expect(e.note.length).toBeGreaterThan(0);
    expect(e.source.length).toBeGreaterThan(3);
    expect(['high', 'medium']).toContain(e.confidence);
  });
};

describe('instrumentation datasets', () => {
  it('pedal steel: verified rows are well-formed and include Harpur College 5/2/70', () => {
    checkList(PEDAL_STEEL_DATES, 20);
    expect(PEDAL_STEEL_DATES.some(e => e.date === '1970-05-02')).toBe(true);
    PEDAL_STEEL_DATES.forEach(e => expect(e.date < '1975-01-01').toBe(true));
    UNVERIFIED_PEDAL_STEEL_DATES.forEach(e => expect(e.confidence).toBe('low'));
  });
  it('acoustic set: covers the 1970 and fall-1980 runs', () => {
    checkList(ACOUSTIC_SET_DATES, 60);
    expect(ACOUSTIC_SET_DATES.some(e => e.date === '1970-05-02')).toBe(true);
    expect(ACOUSTIC_SET_DATES.filter(e => e.date.startsWith('1980-10')).length).toBeGreaterThanOrEqual(10);
    UNVERIFIED_ACOUSTIC_SET_DATES.forEach(e => expect(e.confidence).toBe('low'));
  });
});

describe('notable datasets', () => {
  it('historic events are well-formed and include the last show', () => {
    checkList(HISTORIC_EVENT_DATES, 30);
    expect(HISTORIC_EVENT_DATES.some(e => e.date === '1995-07-09')).toBe(true);
    expect(HISTORIC_EVENT_DATES.some(e => e.date === '1969-12-06')).toBe(false);   // Altamont excluded (non-performance)
  });
  it('guest sit-ins name the guest', () => {
    checkList(GUEST_SIT_IN_DATES, 80);
    expect(GUEST_SIT_IN_DATES.find(e => e.date === '1990-03-29')?.note).toMatch(/Branford Marsalis/);
  });
  it('consensus classic = tier-1 dates', () => {
    expect(consensusClassicDates()).toEqual(TIER_1_SHOWS.map(s => s.date));
    expect(consensusClassicDates()).toContain('1977-05-08');
  });
});
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Transcribe the datasets**

From `docs/superpowers/research/2026-08-20-part3-curated-tags.md`:
- `PEDAL_STEEL_DATES` / `UNVERIFIED_PEDAL_STEEL_DATES` from section 1 (note = the song(s) named); `ACOUSTIC_SET_DATES` / `UNVERIFIED_ACOUSTIC_SET_DATES` from section 2.
- `HISTORIC_EVENT_DATES` from section 3 (exclude `1969-12-06` Altamont — it was not a performance; add a one-line comment), `GUEST_SIT_IN_DATES` from section 4 (note = guest names; the research says Guest Sit-In rows are all high confidence).
- `consensusClassicDates()` returns `TIER_1_SHOWS.map(s => s.date)`.
- Each file header cites the research doc and states "only high/medium rows are active; low rows live in UNVERIFIED_* and are never read by the resolver". Preserve the research's `source` text verbatim (URL or named reference). If a date in the research is duplicated within a section, keep one row and merge notes.

- [ ] **Step 4: Run, typecheck, commit**

`npx jest src/data/__tests__/curatedTags.test.ts` → PASS (if a minimum count fails because the research has fewer high/medium rows than the threshold, report the actual number — do NOT promote low rows). `npm run typecheck` → clean.

```bash
git add src/data/instrumentation.ts src/data/notableShows.ts src/data/__tests__/curatedTags.test.ts
git commit -m "feat(tags): curated instrumentation and notable-show datasets with sources

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `tagResolver` — show tags, inverted index, predicate, counts, residency, constraint hand-off

**Files:**
- Create: `src/services/tagResolver.ts`
- Test: `src/services/__tests__/tagResolver.test.ts`

**Interfaces:**
- Consumes: registry (Task 1), `eraForDate` (Task 2), `VENUE_TYPES`, `INTERNATIONAL_VENUES`, `FESTIVAL_DATES`, `normalizeVenue` (Task 3), datasets (Task 4), `getCatalogVersions` (`recordingCatalog`), `getAllShowsSorted`/`findShowByDate` (`showLookup`), `SourceConstraint` (`recordingResolver`).
- Produces:
  ```ts
  export function getShowTags(date: string): TagId[]                                 // memoized per YYYY-MM-DD; [] for unknown dates
  export function buildTagPredicate<T>(selected: TagId[], getTags: (item: T) => TagId[]): (item: T) => boolean   // pure; OR within / AND between
  export function makeShowTagFilter(selected: TagId[]): (date: string) => boolean    // predicate over dates via getShowTags
  export function applyTagFilter(dates: string[], selected: TagId[]): string[]
  export function getTagCounts(selected: TagId[], baseDates: string[]): Record<TagId, number>  // faceted
  export function sourceConstraintFromTags(selected: TagId[]): SourceConstraint | undefined
  export function getTagCoverage(): Array<{ id: TagId; shows: number; pct: number }>  // informational
  export function resetTagIndexForTests(): void
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/tagResolver.test.ts
jest.mock('../recordingCatalog', () => ({
  getCatalogVersions: (date: string) => mockCatalog[date.slice(0, 10)] ?? [],
}));
jest.mock('../../utils/showLookup', () => ({
  getAllShowsSorted: () => mockShows,
  findShowByDate: (date: string) => mockShows.find(s => s.date.slice(0, 10) === date.slice(0, 10)),
}));
jest.mock('../../data/venueTypes', () => ({
  VENUE_TYPES: { 'barton hall': { type: 'arena', confidence: 'high' }, 'winterland arena': { type: 'arena', confidence: 'high' }, 'wembley arena': { type: 'arena', confidence: 'high' } },
  INTERNATIONAL_VENUES: new Set(['wembley arena']),
}));
jest.mock('../../data/festivalDates', () => ({ FESTIVAL_DATES: [{ date: '1969-08-16', note: 'Woodstock', source: 's', confidence: 'high' }] }));
jest.mock('../../data/instrumentation', () => ({
  PEDAL_STEEL_DATES: [{ date: '1970-05-02', note: 'x', source: 's', confidence: 'high' }],
  ACOUSTIC_SET_DATES: [{ date: '1970-05-02', note: 'x', source: 's', confidence: 'high' }],
}));
jest.mock('../../data/notableShows', () => ({
  HISTORIC_EVENT_DATES: [{ date: '1969-08-16', note: 'x', source: 's', confidence: 'high' }],
  GUEST_SIT_IN_DATES: [{ date: '1990-03-29', note: 'Branford Marsalis', source: 's', confidence: 'high' }],
  consensusClassicDates: () => ['1977-05-08'],
}));

import {
  getShowTags, buildTagPredicate, makeShowTagFilter, applyTagFilter, getTagCounts,
  sourceConstraintFromTags, getTagCoverage, resetTagIndexForTests,
} from '../tagResolver';
import type { GratefulDeadShow, RecordingVersion } from '../../types/show.types';
import type { TagId } from '../../constants/tags';

const v = (identifier: string, over: Partial<RecordingVersion> = {}): RecordingVersion => ({ identifier, format: 'sbd', lineage: [], ...over });
const show = (date: string, venue: string): GratefulDeadShow => ({ date: `${date}T00:00:00Z`, year: date.slice(0, 4), venue, versions: [], primaryIdentifier: `id-${date}`, title: '' });

// Winterland 1978-12-27..31 = a 5-night residency; Barton Hall single night; Wembley international.
const mockShows: GratefulDeadShow[] = [
  show('1969-08-16', 'Woodstock'),
  show('1970-05-02', 'Harpur College'),
  show('1972-04-08', 'Wembley Arena'),
  show('1977-05-08', 'Barton Hall'),
  show('1978-12-27', 'Winterland Arena'), show('1978-12-28', 'Winterland Arena'),
  show('1978-12-30', 'Winterland Arena'), show('1978-12-31', 'Winterland Arena'),
  show('1990-03-29', 'Nassau Coliseum'),
];
const mockCatalog: Record<string, RecordingVersion[]> = {
  '1977-05-08': [v('mtx', { format: 'matrix' }), v('betty', { lineage: ['betty', 'lowgen'] }), v('aud', { format: 'aud' })],
  '1972-04-08': [v('e', { format: 'sbd', lineage: ['miller'] })],
  '1978-12-31': [v('w', { format: 'sbd' })],
  '1969-08-16': [v('unk', { format: 'unknown' })],
};
const DATES = mockShows.map(s => s.date.slice(0, 10));

beforeEach(() => resetTagIndexForTests());

describe('getShowTags', () => {
  it('unions era, source (from the catalog, excluding unknown), venue, instrumentation, notable', () => {
    expect(getShowTags('1977-05-08T00:00:00Z').sort()).toEqual(
      ['arena', 'aud', 'betty', 'classic', 'lowgen', 'matrix', 'peakkeith', 'sbd'].sort(),
    );
    expect(getShowTags('1972-04-08')).toEqual(expect.arrayContaining(['europe72', 'arena', 'international', 'sbd', 'miller']));
    expect(getShowTags('1969-08-16')).toEqual(expect.arrayContaining(['livedead', 'festival', 'historic']));
    expect(getShowTags('1969-08-16')).not.toContain('unknown');
    expect(getShowTags('1970-05-02')).toEqual(expect.arrayContaining(['americana', 'pedalsteel', 'acousticset']));
    expect(getShowTags('1990-03-29')).toEqual(expect.arrayContaining(['brent', 'guest']));
  });
  it('tags every night of a ≥4-show run within 10-day spacing as a residency, not a lone night', () => {
    ['1978-12-27', '1978-12-28', '1978-12-30', '1978-12-31'].forEach(d => expect(getShowTags(d)).toContain('residency'));
    expect(getShowTags('1977-05-08')).not.toContain('residency');
  });
  it('returns [] for a date not in the catalog and memoizes', () => {
    expect(getShowTags('2050-01-01')).toEqual([]);
    expect(getShowTags('1977-05-08')).toBe(getShowTags('1977-05-08'));
  });
});

describe('buildTagPredicate (entity-agnostic)', () => {
  // Items are plain objects; categories come from the real registry, so real ids are used.
  it('ORs within a category and ANDs across categories', () => {
    const getTags = (i: { tags: TagId[] }) => i.tags;
    const pred = buildTagPredicate(['arena', 'stadium', 'peakkeith'], getTags);
    expect(pred({ tags: ['arena', 'peakkeith'] })).toBe(true);
    expect(pred({ tags: ['stadium', 'peakkeith'] })).toBe(true);
    expect(pred({ tags: ['arena', 'brent'] })).toBe(false);
    expect(pred({ tags: ['peakkeith'] })).toBe(false);
    expect(buildTagPredicate([], getTags)({ tags: [] })).toBe(true);
  });
});

describe('applyTagFilter / makeShowTagFilter', () => {
  it('filters dates', () => {
    expect(applyTagFilter(DATES, ['international'])).toEqual(['1972-04-08']);
    expect(applyTagFilter(DATES, ['arena', 'international']).length).toBe(6);   // both venueType → OR
    expect(applyTagFilter(DATES, ['residency']).length).toBe(4);
    expect(applyTagFilter(DATES, ['arena', 'peakkeith'])).toEqual(['1977-05-08']);
    expect(makeShowTagFilter(['guest'])('1990-03-29')).toBe(true);
  });
});

describe('getTagCounts (faceted)', () => {
  it('ignores the tag’s own category but applies the others', () => {
    const counts = getTagCounts(['arena'], DATES);
    expect(counts.arena).toBe(6);            // Barton Hall + 4 Winterland + Wembley
    expect(counts.international).toBe(1);    // own category ignored → not narrowed by 'arena'
    expect(counts.peakkeith).toBe(1);        // era counts ARE narrowed by the arena selection
    expect(counts.brent).toBe(0);            // Nassau (no venue type) excluded by the arena selection
    const none = getTagCounts([], DATES);
    expect(none.brent).toBe(1);
    expect(none.sbd).toBe(3);
  });
  it('respects the caller’s base dates', () => {
    expect(getTagCounts([], ['1977-05-08']).arena).toBe(1);
    expect(getTagCounts([], ['1977-05-08']).international).toBe(0);
  });
});

describe('sourceConstraintFromTags', () => {
  it('takes the first selected format and all selected lineage tags; ignores other categories', () => {
    expect(sourceConstraintFromTags(['arena', 'betty', 'sbd', 'aud', 'lowgen'])).toEqual({ format: 'sbd', lineage: ['betty', 'lowgen'] });
    expect(sourceConstraintFromTags(['arena'])).toBeUndefined();
    expect(sourceConstraintFromTags(['miller'])).toEqual({ lineage: ['miller'] });
  });
});

describe('getTagCoverage', () => {
  it('reports show counts and percentages per tag over the catalog', () => {
    const cov = getTagCoverage();
    expect(cov.find(c => c.id === 'arena')).toEqual({ id: 'arena', shows: 6, pct: Math.round((6 / 9) * 100) });
    expect(cov.find(c => c.id === 'residency')?.shows).toBe(4);
  });
});
```

- [ ] **Step 2: Run to verify failure** → FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/services/tagResolver.ts
/**
 * Read-time show tags. A show's tags are derived on demand — era from the
 * date, venue type from the curated map, source as the UNION of its catalog
 * recordings' format + lineage tags, instrumentation/notable from curated
 * date lists — and memoized. A lazy inverted index Map<TagId, Set<date>>
 * makes filtering and faceted counts cheap (≈2k shows × ≈8 tags).
 *
 * buildTagPredicate is entity-agnostic (OR within a category, AND between)
 * so the later song-tags work reuses it unchanged.
 */
import { isTagId, TagCategoryId, tagCategory, TagId, TAG_DEFS, VenuePhysicalType } from '../constants/tags';
import { eraForDate } from '../data/eras';
import { VENUE_TYPES, INTERNATIONAL_VENUES } from '../data/venueTypes';
import { FESTIVAL_DATES } from '../data/festivalDates';
import { PEDAL_STEEL_DATES, ACOUSTIC_SET_DATES } from '../data/instrumentation';
import { HISTORIC_EVENT_DATES, GUEST_SIT_IN_DATES, consensusClassicDates } from '../data/notableShows';
import { normalizeVenue } from '../utils/venueNormalization';
import { getAllShowsSorted, findShowByDate } from '../utils/showLookup';
import { getCatalogVersions } from './recordingCatalog';
import type { SourceConstraint } from './recordingResolver';
import type { LineageTag, RecordingFormat } from '../types/show.types';

const RESIDENCY_MIN_SHOWS = 4;
const RESIDENCY_MAX_GAP_DAYS = 10;

const dateOnly = (d: string) => d.slice(0, 10);
const dateSet = (entries: ReadonlyArray<{ date: string }>) => new Set(entries.map(e => e.date));

let curated: {
  festival: Set<string>; pedalSteel: Set<string>; acoustic: Set<string>;
  historic: Set<string>; guest: Set<string>; classic: Set<string>; residency: Set<string>;
} | null = null;

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Every night of any run of ≥4 shows at one venue with ≤10 days between consecutive nights. */
function computeResidencies(): Set<string> {
  const result = new Set<string>();
  let run: string[] = [];
  let runVenue = '';
  const flush = () => { if (run.length >= RESIDENCY_MIN_SHOWS) run.forEach(d => result.add(d)); run = []; };
  for (const show of getAllShowsSorted()) {
    const date = dateOnly(show.date);
    const venue = normalizeVenue(show.venue);
    const continues = run.length > 0 && venue === runVenue && venue !== '' && daysBetween(run[run.length - 1], date) <= RESIDENCY_MAX_GAP_DAYS;
    if (!continues) { flush(); runVenue = venue; }
    run.push(date);
  }
  flush();
  return result;
}

function getCurated() {
  if (curated) return curated;
  curated = {
    festival: dateSet(FESTIVAL_DATES),
    pedalSteel: dateSet(PEDAL_STEEL_DATES),
    acoustic: dateSet(ACOUSTIC_SET_DATES),
    historic: dateSet(HISTORIC_EVENT_DATES),
    guest: dateSet(GUEST_SIT_IN_DATES),
    classic: new Set(consensusClassicDates()),
    residency: computeResidencies(),
  };
  return curated;
}

const tagCache = new Map<string, TagId[]>();

export function getShowTags(date: string): TagId[] {
  const key = dateOnly(date);
  const cached = tagCache.get(key);
  if (cached) return cached;

  const show = findShowByDate(key);
  if (!show) { tagCache.set(key, []); return tagCache.get(key)!; }

  const c = getCurated();
  const tags = new Set<TagId>();
  tags.add(eraForDate(key));

  for (const version of getCatalogVersions(key)) {
    if (version.format !== 'unknown') tags.add(version.format as Exclude<RecordingFormat, 'unknown'>);
    version.lineage.forEach((l: LineageTag) => tags.add(l));
  }

  const venueKey = normalizeVenue(show.venue);
  const physical = VENUE_TYPES[venueKey]?.type as VenuePhysicalType | undefined;
  if (physical) tags.add(physical);
  if (INTERNATIONAL_VENUES.has(venueKey)) tags.add('international');
  if (c.festival.has(key)) tags.add('festival');
  if (c.residency.has(key)) tags.add('residency');

  if (c.pedalSteel.has(key)) tags.add('pedalsteel');
  if (c.acoustic.has(key)) tags.add('acousticset');

  if (c.classic.has(key)) tags.add('classic');
  if (c.historic.has(key)) tags.add('historic');
  if (c.guest.has(key)) tags.add('guest');

  const list = [...tags];
  tagCache.set(key, list);
  return list;
}

function groupByCategory(selected: TagId[]): Map<TagCategoryId, TagId[]> {
  const groups = new Map<TagCategoryId, TagId[]>();
  for (const id of selected) {
    if (!isTagId(id)) continue;
    const cat = tagCategory(id);
    groups.set(cat, [...(groups.get(cat) ?? []), id]);
  }
  return groups;
}

/** OR within a category, AND between categories. Knows nothing about shows. */
export function buildTagPredicate<T>(selected: TagId[], getTags: (item: T) => TagId[]): (item: T) => boolean {
  const groups = [...groupByCategory(selected).values()];
  if (groups.length === 0) return () => true;
  return (item: T) => {
    const tags = new Set(getTags(item));
    return groups.every(group => group.some(id => tags.has(id)));
  };
}

export function makeShowTagFilter(selected: TagId[]): (date: string) => boolean {
  return buildTagPredicate<string>(selected, getShowTags);
}

export function applyTagFilter(dates: string[], selected: TagId[]): string[] {
  const keep = makeShowTagFilter(selected);
  return dates.filter(keep);
}

/**
 * Faceted counts over `baseDates`: for each tag, apply every OTHER category's
 * selection, ignore its own category's, then count dates carrying the tag.
 */
export function getTagCounts(selected: TagId[], baseDates: string[]): Record<TagId, number> {
  const groups = groupByCategory(selected);
  const tagsByDate = new Map<string, Set<TagId>>();
  for (const d of baseDates) tagsByDate.set(d, new Set(getShowTags(d)));

  const counts = {} as Record<TagId, number>;
  for (const def of TAG_DEFS) {
    const otherGroups = [...groups.entries()].filter(([cat]) => cat !== def.category).map(([, ids]) => ids);
    let n = 0;
    for (const [, tags] of tagsByDate) {
      if (!tags.has(def.id)) continue;
      if (otherGroups.every(group => group.some(id => tags.has(id)))) n++;
    }
    counts[def.id] = n;
  }
  return counts;
}

const FORMAT_IDS: ReadonlySet<string> = new Set(['sbd', 'aud', 'matrix', 'fm']);
const LINEAGE_IDS: ReadonlySet<string> = new Set(['betty', 'miller', '16track', 'lowgen']);

/** The recording-resolver constraint implied by the selected Source tags (format is single-valued). */
export function sourceConstraintFromTags(selected: TagId[]): SourceConstraint | undefined {
  const c: SourceConstraint = {};
  for (const id of selected) {
    if (FORMAT_IDS.has(id) && !c.format) c.format = id as RecordingFormat;
    else if (LINEAGE_IDS.has(id)) (c.lineage ??= []).push(id as LineageTag);
  }
  return c.format || c.lineage ? c : undefined;
}

/** Informational: how many catalog shows carry each tag. */
export function getTagCoverage(): Array<{ id: TagId; shows: number; pct: number }> {
  const dates = getAllShowsSorted().map(s => dateOnly(s.date));
  const counts = getTagCounts([], dates);
  return TAG_DEFS.map(def => ({ id: def.id, shows: counts[def.id], pct: Math.round((counts[def.id] / dates.length) * 100) }));
}

export function resetTagIndexForTests(): void {
  tagCache.clear();
  curated = null;
}
```

- [ ] **Step 4: Run, typecheck, commit**

`npx jest src/services/__tests__/tagResolver.test.ts` → PASS. `npm run typecheck` → clean. Then print the real coverage once for the record: `npx tsx -e "import { getTagCoverage } from './src/services/tagResolver'; console.table(getTagCoverage())"` and paste the table into the commit body.

```bash
git add src/services/tagResolver.ts src/services/__tests__/tagResolver.test.ts
git commit -m "feat(tags): read-time tag resolver with faceted counts, residency detection, and source-constraint hand-off

Catalog coverage:
<paste table>

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: "Also on …" release badge

**Files:**
- Modify: `src/data/officialReleases.ts` (add `getDisplayRelease`)
- Modify: `src/components/OfficialReleaseBadge.tsx` (`alsoOn` mode, longer truncation)
- Modify: `src/components/ShowCard.tsx:166,187`, `src/components/HorizontalShowCard.tsx:91`
- Test: `src/data/__tests__/officialReleases.display.test.ts`

**Interfaces:**
- Produces: `export function getDisplayRelease(date: string): { release: OfficialRelease; more: number } | null` — first release whose series is earliest in `DISPLAY_SERIES` order ("Others" covers `OTHER_SERIES`), `more = total - 1`. `OfficialReleaseBadge` gains `alsoOn?: boolean` and `more?: number`; when `alsoOn`, it renders `also on {title}` + ` +{more}` if `more > 0`, truncating the title at 30 chars.

- [ ] **Step 1: Write the failing test**

```ts
// src/data/__tests__/officialReleases.display.test.ts
import { getDisplayRelease, getOfficialReleasesForDate, DISPLAY_SERIES } from '../officialReleases';

describe('getDisplayRelease', () => {
  it('returns null when a date has no releases', () => {
    expect(getDisplayRelease('1966-01-08')).toBeNull();
  });
  it('prefers the earliest DISPLAY_SERIES series and counts the rest', () => {
    // 1977-05-08 has Cornell 5/8/77 (box / Others) and others; find a date with ≥2 releases to assert ordering generically
    const multi = ['1977-05-08', '1972-08-27', '1973-11-11', '1990-03-29'].find(d => getOfficialReleasesForDate(d).length >= 2)!;
    const picked = getDisplayRelease(multi)!;
    const all = getOfficialReleasesForDate(multi);
    const rank = (s: string) => { const i = DISPLAY_SERIES.indexOf(s); return i === -1 ? DISPLAY_SERIES.indexOf('Others') : i; };
    expect(Math.min(...all.map(r => rank(r.series)))).toBe(rank(picked.release.series));
    expect(picked.more).toBe(all.length - 1);
  });
});
```

- [ ] **Step 2: Run** → FAIL (no export).

- [ ] **Step 3: Implement**

Append to `src/data/officialReleases.ts`:
```ts
/** The release to name on a show row: earliest DISPLAY_SERIES series wins; `more` = how many others exist. */
export function getDisplayRelease(date: string): { release: OfficialRelease; more: number } | null {
  const releases = getOfficialReleasesForDate(date);
  if (releases.length === 0) return null;
  const rank = (series: string) => {
    const i = DISPLAY_SERIES.indexOf(series);
    return i === -1 ? DISPLAY_SERIES.indexOf('Others') : i;
  };
  const sorted = [...releases].sort((a, b) => rank(a.series) - rank(b.series));
  return { release: sorted[0], more: releases.length - 1 };
}
```

`OfficialReleaseBadge.tsx`: add props `alsoOn?: boolean; more?: number;`. Compute `const maxLen = alsoOn ? 30 : 25;` for the existing truncation; label = `alsoOn ? `also on ${truncated}${more ? ` +${more}` : ''}` : (existing behaviour)`. Keep the disc icon and styles; set `accessibilityLabel` to the full untruncated text.

`ShowCard.tsx` (both badge slots) and `HorizontalShowCard.tsx`: replace `releaseTitle={officialReleases[0].name}` with
```tsx
const display = useMemo(() => getDisplayRelease(show.date), [show.date]);
…
{display && (
  <View style={styles.officialReleaseBadgeWrapper}>
    <OfficialReleaseBadge onPress={handleBadgePress} compact alsoOn releaseTitle={display.release.name} more={display.more} />
  </View>
)}
```
(keep `officialReleases` for the modal's `releases` prop). `ShowDetailScreen`'s badge keeps its current copy.

- [ ] **Step 4: Run, typecheck, commit**

`npx jest src/data/__tests__/officialReleases.display.test.ts` → PASS; `npm run typecheck` → clean.

```bash
git add src/data/officialReleases.ts src/data/__tests__/officialReleases.display.test.ts src/components/OfficialReleaseBadge.tsx src/components/ShowCard.tsx src/components/HorizontalShowCard.tsx
git commit -m "feat(tags): 'also on …' release badge on show rows, ordered by series

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: `FilterPill` counts + `TagCategorySection`

**Files:**
- Modify: `src/components/ShowsFilterTray/FilterPill.tsx` (add `count?: number`)
- Create: `src/components/ShowsFilterTray/TagCategorySection.tsx`
- Test: `src/__tests__/components/TagCategorySection.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  interface TagCategorySectionProps {
    category: TagCategory;
    tags: readonly TagDef[];
    selected: TagId[];
    counts: Record<TagId, number>;
    expanded: boolean;
    onToggleExpanded: () => void;
    onToggleTag: (id: TagId) => void;
  }
  export function TagCategorySection(props: TagCategorySectionProps): JSX.Element
  ```
  Header row: category label, an active-count chip (`{n} selected`, hidden when 0), a chevron (`chevron-down`/`chevron-up`), `accessibilityRole="button"`, `accessibilityState={{ expanded }}`, `testID={`tag-section-${category.id}`}`. Body (only when expanded): a wrapping grid of `FilterPill`s with `count`, `isDisabled={count === 0 && !isSelected}`, `testID={`tag-pill-${id}`}`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/TagCategorySection.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TagCategorySection } from '../../components/ShowsFilterTray/TagCategorySection';
import { TAG_CATEGORIES, tagsInCategory, TagId } from '../../constants/tags';

const venue = TAG_CATEGORIES.find(c => c.id === 'venueType')!;
const tags = tagsInCategory('venueType');
const counts = Object.fromEntries(tags.map(t => [t.id, t.id === 'festival' ? 0 : 12])) as Record<TagId, number>;
const allText = (tree: TestRenderer.ReactTestRenderer) => tree.root.findAllByType(Text).map(t => React.Children.toArray(t.props.children).join(''));

const render = async (over: Partial<React.ComponentProps<typeof TagCategorySection>> = {}) => {
  const onToggleTag = jest.fn(); const onToggleExpanded = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <TagCategorySection category={venue} tags={tags} selected={['arena']} counts={counts} expanded onToggleExpanded={onToggleExpanded} onToggleTag={onToggleTag} {...over} />
      </SafeAreaProvider>,
    );
  });
  return { tree, onToggleTag, onToggleExpanded };
};

it('renders the header with an active count and the pills with counts when expanded', async () => {
  const { tree } = await render();
  const text = allText(tree);
  expect(text).toContain('Venue');
  expect(text.some(t => t.includes('1 selected'))).toBe(true);
  expect(tree.root.findAllByProps({ testID: 'tag-pill-arena' }, { deep: false })).toHaveLength(1);
  expect(text.some(t => t === '12' || t.includes('12'))).toBe(true);
});

it('disables zero-count unselected pills and reports toggles', async () => {
  const { tree, onToggleTag } = await render();
  const festival = tree.root.findByProps({ testID: 'tag-pill-festival' });
  expect(festival.props.disabled ?? festival.props.accessibilityState?.disabled).toBeTruthy();
  await act(async () => { tree.root.findByProps({ testID: 'tag-pill-stadium' }).props.onPress(); });
  expect(onToggleTag).toHaveBeenCalledWith('stadium');
});

it('hides the pills when collapsed and toggles via the header', async () => {
  const { tree, onToggleExpanded } = await render({ expanded: false });
  expect(tree.root.findAllByProps({ testID: 'tag-pill-arena' }, { deep: false })).toHaveLength(0);
  await act(async () => { tree.root.findByProps({ testID: 'tag-section-venueType' }).props.onPress(); });
  expect(onToggleExpanded).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement**

`FilterPill.tsx`: add `count?: number` to props; render after the label `{typeof count === 'number' && <Text style={[styles.count, isSelected && styles.countSelected]}>{count}</Text>}` with styles `count: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginLeft: SPACING.xs }`, `countSelected: { color: '#FFFFFF', opacity: 0.85 }`. Forward `testID` and set `accessibilityState={{ selected: isSelected, disabled: !!isDisabled }}` and `disabled={isDisabled}` on the `TouchableOpacity` (check the current file — add what's missing).

```tsx
// src/components/ShowsFilterTray/TagCategorySection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterPill } from './FilterPill';
import type { TagCategory, TagDef, TagId } from '../../constants/tags';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

interface TagCategorySectionProps {
  category: TagCategory;
  tags: readonly TagDef[];
  selected: TagId[];
  counts: Record<TagId, number>;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleTag: (id: TagId) => void;
}

export function TagCategorySection({ category, tags, selected, counts, expanded, onToggleExpanded, onToggleTag }: TagCategorySectionProps) {
  const activeCount = tags.filter(t => selected.includes(t.id)).length;
  return (
    <View style={styles.section}>
      <TouchableOpacity
        testID={`tag-section-${category.id}`}
        style={styles.header}
        onPress={onToggleExpanded}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${category.label} filters${activeCount ? `, ${activeCount} selected` : ''}`}
      >
        <Text style={styles.title}>{category.label}</Text>
        {activeCount > 0 && (
          <View style={styles.activeChip}><Text style={styles.activeChipText}>{activeCount} selected</Text></View>
        )}
        <View style={styles.spacer} />
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.pillsGrid}>
          {tags.map(tag => {
            const isSelected = selected.includes(tag.id);
            const count = counts[tag.id] ?? 0;
            return (
              <FilterPill
                key={tag.id}
                testID={`tag-pill-${tag.id}`}
                label={tag.label}
                count={count}
                isSelected={isSelected}
                isDisabled={count === 0 && !isSelected}
                onPress={() => onToggleTag(tag.id)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  title: { ...TYPOGRAPHY.label, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  activeChip: { marginLeft: SPACING.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: COLORS.accent },
  activeChipText: { ...TYPOGRAPHY.caption, color: '#FFFFFF', fontWeight: '600' },
  spacer: { flex: 1 },
  pillsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm },
});
```

- [ ] **Step 4: Run, typecheck, commit**

`npx jest src/__tests__/components/TagCategorySection.test.tsx` → PASS; `npm run typecheck` → clean.

```bash
git add src/components/ShowsFilterTray/FilterPill.tsx src/components/ShowsFilterTray/TagCategorySection.tsx src/__tests__/components/TagCategorySection.test.tsx
git commit -m "feat(tags): collapsible tag category section with per-tag counts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Filter tray rewrite (tags replace series; years grouped by the new eras)

**Files:**
- Modify: `src/components/ShowsFilterTray/types.ts`, `index.tsx`, `YearsSection.tsx`
- Delete: `src/components/ShowsFilterTray/SeriesSection.tsx`
- Test: `src/components/ShowsFilterTray/__tests__/types.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ShowsFilterState { selectedYears: string[]; selectedTags: TagId[] }
  export function hasActiveFilters(f): boolean
  export function countSelectedInCategory(f, category: TagCategoryId): number
  export function createEmptyFilterState(): ShowsFilterState
  // ShowsFilterTrayProps unchanged: { isOpen, onClose, appliedFilters, onApply, showsByYear }
  ```
  `FILTER_ERAS`, `FilterEra`, `getAllFilterYears`, `getFilterCount` are removed.

- [ ] **Step 1: Write the failing types test**

```ts
// src/components/ShowsFilterTray/__tests__/types.test.ts
import { createEmptyFilterState, hasActiveFilters, countSelectedInCategory } from '../types';

it('empty state has no active filters', () => {
  const s = createEmptyFilterState();
  expect(s).toEqual({ selectedYears: [], selectedTags: [] });
  expect(hasActiveFilters(s)).toBe(false);
});
it('years or tags make it active; per-category counts only count that category', () => {
  expect(hasActiveFilters({ selectedYears: ['1977'], selectedTags: [] })).toBe(true);
  const s = { selectedYears: [], selectedTags: ['arena', 'stadium', 'betty'] as const };
  expect(hasActiveFilters({ ...s, selectedTags: [...s.selectedTags] })).toBe(true);
  expect(countSelectedInCategory({ ...s, selectedTags: [...s.selectedTags] }, 'venueType')).toBe(2);
  expect(countSelectedInCategory({ ...s, selectedTags: [...s.selectedTags] }, 'source')).toBe(1);
  expect(countSelectedInCategory({ ...s, selectedTags: [...s.selectedTags] }, 'era')).toBe(0);
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Rewrite `types.ts`**

```ts
import { ShowsByYear } from '../../types/show.types';
import { TagCategoryId, tagCategory, TagId } from '../../constants/tags';

export type { ShowsByYear };

/** Filter state for the Shows filter tray. Tags: OR within a category, AND between. */
export interface ShowsFilterState {
  selectedYears: string[];   // "1972", "1977", …
  selectedTags: TagId[];
}

export interface ShowsFilterTrayProps {
  isOpen: boolean;
  onClose: () => void;
  appliedFilters: ShowsFilterState;
  onApply: (filters: ShowsFilterState) => void;
  showsByYear: ShowsByYear | null;
}

export function hasActiveFilters(filters: ShowsFilterState): boolean {
  return filters.selectedYears.length > 0 || filters.selectedTags.length > 0;
}

export function countSelectedInCategory(filters: ShowsFilterState, category: TagCategoryId): number {
  return filters.selectedTags.filter(id => tagCategory(id) === category).length;
}

export function createEmptyFilterState(): ShowsFilterState {
  return { selectedYears: [], selectedTags: [] };
}
```

- [ ] **Step 4: Rewrite `index.tsx` state and composition**

- Replace `pendingSeries` with `pendingTags: TagId[]` (seeded/re-seeded from `appliedFilters.selectedTags`); `handleToggleTag(id)`; `handleReset` → `{ selectedYears: [], selectedTags: [] }`; `handleApply` commits both.
- `expandedCategories` local state: `useState<Record<TagCategoryId, boolean>>({ era: true, source: true, venueType: false, instrumentation: false, notable: false })`, toggled per section; a category with any pending selection is forced open.
- Base dates for counts: `const allDates = useMemo(() => showsByYear ? Object.values(showsByYear).flat().map(s => s.date.slice(0, 10)) : [], [showsByYear]);` and `const yearDates = useMemo(() => pendingYears.length ? allDates.filter(d => pendingYears.includes(d.slice(0, 4))) : allDates, [allDates, pendingYears]);`
- `const counts = useMemo(() => getTagCounts(pendingTags, yearDates), [pendingTags, yearDates]);`
- `const matchingShowCount = useMemo(() => applyTagFilter(yearDates, pendingTags).length, [yearDates, pendingTags]);` (replaces the old series-aware count).
- Composition inside the `ScrollView` (tags first, then years — the user wants year filtering kept, under the tags): `TAG_CATEGORIES.map(category => <TagCategorySection key={category.id} category={category} tags={tagsInCategory(category.id)} selected={pendingTags} counts={counts} expanded={expanded[category.id] || countSelectedInCategory({ selectedYears: pendingYears, selectedTags: pendingTags }, category.id) > 0} onToggleExpanded={() => toggleExpanded(category.id)} onToggleTag={handleToggleTag} />)` followed by `<YearsSection selectedYears={pendingYears} showsByYear={showsByYear} onToggleYear={handleToggleYear} onSelectAllInEra={handleSelectAllInEra} />`.
- `handleSelectAllInEra(years: string[])` now takes the era's year list (from `groupYearsByEra`) and selects/deselects all that have shows.
- Remove every `SeriesSection`/`expandDisplaySeries`/`getOfficialReleasesForDate` import from the tray.

- [ ] **Step 5: Rewrite `YearsSection.tsx` grouping**

- Props: drop `selectedSeries`; `onSelectAllInEra: (years: string[]) => void`.
- `availableYears = showsByYear ? Object.keys(showsByYear).sort() : []`; `disabledYears` = years with zero shows (keep the memo, minus the series logic).
- Replace the `FILTER_ERAS.map(...)` block with `groupYearsByEra(availableYears).map(({ era, years }) => …)` using `era.label` for the header and `years` for the grid; pass `years` to `onSelectAllInEra`. Keep `YearButton` and its animation unchanged.

- [ ] **Step 6: Delete `SeriesSection.tsx`**, then run `npx jest src/components/ShowsFilterTray src/__tests__/components/TagCategorySection.test.tsx` and `npm run typecheck`. HomeScreen/FavoritesScreen will now fail to typecheck (they still reference `selectedSeries`) — that is expected and fixed in Task 9; to keep this commit green, do the minimal screen edits now: replace `selectedSeries` reads with `selectedTags: []`/remove the series blocks **only as far as needed to compile**, leaving the real wiring to Task 9. (Simplest: make this task's commit include Task 9's HomeScreen/FavoritesScreen filter-logic changes and let Task 9 own URL/nav. If you do that, say so in the report.)

- [ ] **Step 7: Commit**

```bash
git add -A src/components/ShowsFilterTray src/screens/HomeScreen.tsx src/screens/FavoritesScreen.tsx
git commit -m "feat(tags): filter tray uses tag categories with counts; years grouped by the new eras; series filter removed

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Screens, URL params, source-constraint hand-off

**Files:**
- Modify: `src/screens/HomeScreen.tsx:130-170, 199-268, 287-289`
- Modify: `src/screens/FavoritesScreen.tsx:214-230, 274-290, 343`
- Modify: `src/navigation/webLinking.ts:79-89`, `src/navigation/AppNavigator.tsx:113`
- Test: `src/navigation/__tests__/webLinkingTags.test.ts` (pure parse/stringify helpers extracted)

**Interfaces:**
- Produces in `webLinking.ts`: `export function parseTagsParam(raw: string | undefined): TagId[]` (decode with try/catch, split on `,`, keep `isTagId`, dedupe) and `export function stringifyTagsParam(tags: TagId[]): string | undefined`; `Home` params become `{ sort?: string; years?: string; tags?: string }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/navigation/__tests__/webLinkingTags.test.ts
import { parseTagsParam, stringifyTagsParam } from '../webLinking';

it('parses, sanitizes, and round-trips tag lists', () => {
  expect(parseTagsParam('europe72,betty,arena')).toEqual(['europe72', 'betty', 'arena']);
  expect(parseTagsParam('europe72,laser,,betty,betty')).toEqual(['europe72', 'betty']);
  expect(parseTagsParam('%E0%A4%A')).toEqual([]);          // malformed percent-encoding → no throw
  expect(parseTagsParam(undefined)).toEqual([]);
  expect(stringifyTagsParam(['europe72', 'betty'])).toBe('europe72,betty');
  expect(stringifyTagsParam([])).toBeUndefined();
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement**

`webLinking.ts`:
```ts
export function parseTagsParam(raw: string | undefined): TagId[] {
  if (!raw) return [];
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch (e) { if (!(e instanceof URIError)) throw e; return []; }
  const out: TagId[] = [];
  for (const token of decoded.split(',').map(t => t.trim().toLowerCase())) {
    if (isTagId(token) && !out.includes(token)) out.push(token);
  }
  return out;
}
export function stringifyTagsParam(tags: TagId[]): string | undefined {
  return tags.length ? tags.join(',') : undefined;
}
```
Replace the `series` entries in `homeParseConfig`/`homeStringifyConfig` with `tags: (tags: string) => parseTagsParam(tags).join(',')` / `tags: (tags: string) => encodeURIComponent(tags)`. `AppNavigator.tsx:113`: `Home: { sort?: string; years?: string; tags?: string } | undefined;`.

`HomeScreen.tsx`:
- init: `selectedTags: parseTagsParam(route.params?.tags)`; URL sync: `tags: stringifyTagsParam(appliedFilters.selectedTags)` (drop `series`).
- stage 1: `yearsToShow` = selected years ∩ available, else all (delete the `getYearsForAnySeries` branch); then `const keep = makeShowTagFilter(appliedFilters.selectedTags); shows = appliedFilters.selectedTags.length ? shows.filter(s => keep(s.date)) : shows;` — rename the memo `yearAndTagFiltered`.
- navigation (`:287`): `navigation.navigate('ShowDetail', showDetailParams(show, { sourceConstraint: sourceConstraintFromTags(appliedFilters.selectedTags) }))`.
- drop unused imports (`getYearsForAnySeries`, `expandDisplaySeries`, `getOfficialReleasesForDate` if no longer used by `filterShows` — it IS still used there for release-name search; keep it).

`FavoritesScreen.tsx`: replace both series blocks with the tag predicate (`song.showDate` / `show.date`); navigation at `:343` passes the constraint the same way; drop unused imports.

- [ ] **Step 4: Run, typecheck, manual check, commit**

`npx jest src/navigation src/components/ShowsFilterTray src/__tests__/components` → PASS; `npm run typecheck` → clean; `grep -rn "selectedSeries\|SeriesSection\|FILTER_ERAS\|getAllFilterYears" src` → nothing.
Manual (web, `npx expo start --web --port 8092`): open `/shows`, filter Era → Europe '72 + Source → Betty Board → counts update, list narrows; URL shows `?tags=europe72,betty`; reload keeps it; open a show → its pill shows a Betty Board recording (or the fallback note). Record what you saw.

```bash
git add src/screens/HomeScreen.tsx src/screens/FavoritesScreen.tsx src/navigation/webLinking.ts src/navigation/AppNavigator.tsx src/navigation/__tests__/webLinkingTags.test.ts
git commit -m "feat(tags): tag filtering on Home and Favorites, ?tags= URLs, source constraint hand-off to the show screen

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Verification, spec amendments

**Files:**
- Modify: `docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md` (Part 3)

- [ ] **Step 1: Spec amendments (Part 3)**
  - Venue Type: "International derives from the curated venue flag in `scripts/data/venue-types.tsv` (the location regex misfires on spelled-out states and 'Unknown'); the map covers 613 normalized venues, 472 with a physical type."
  - Datasets: "Entries carry `confidence`; only `high`/`medium` are active, `low` rows are exported as `UNVERIFIED_*` and never resolved. Research: `docs/superpowers/research/2026-08-20-part3-curated-tags.md`."
  - Filter tray: "Counts are computed against the dates surviving the Years filter within the caller's `showsByYear` (Favorites passes its own)."
  - Badges: "Implemented by extending the existing `OfficialReleaseBadge` (`alsoOn` mode) rather than a new component."
  - Append the coverage table from Task 5's commit under a "Measured coverage" heading.
- [ ] **Step 2: Full verification** — `npx jest` (all green), `npm run typecheck`, `npm run typecheck:web 2>&1 | grep "error TS" | grep -v expo-file-system` (exactly the two `PlayerContext.tsx` lines).
- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md
git commit -m "docs(tags): spec amendments for the shipped tag system

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Then the controller runs the final whole-branch review and `superpowers:finishing-a-development-branch`. Native needs an `eas update` after merge.
