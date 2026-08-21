# Tagging & Source Selection — Design

**Date:** 2026-08-20
**Status:** Approved

## Overview

Three pieces of work that share one data foundation:

1. **Recording data pipeline** — regenerate the bundled show catalog with the
   Archive's per-recording `source`, `taper`, `transferer`, `lineage`,
   `avg_rating`, and `num_reviews` fields, parse each recording's **format**
   (Soundboard / Audience / Matrix / FM Broadcast) and **lineage** tags
   (Betty Board / Charlie Miller / 16-Track / Low Generation), and drop the
   5-recordings-per-show cap.
2. **Source preference engine** — a user setting (Most Popular / Soundboard /
   Audience / Matrix / FM Broadcast), a read-time ranker, a resolver that picks
   the recording to play for any show, per-show user pins, a fallback ladder
   that explains itself, and a "prefer X everywhere?" nudge.
3. **Show tags & filter tray** — five tag categories (Era, Source, Venue Type,
   Instrumentation, Notable) resolved at read time, a faceted filter tray
   (OR within a category, AND between categories, per-tag counts), and the
   existing official-release *Series* filter converted into a row badge.

## Decisions (confirmed with user)

1. **Mid-playback source switching and the canonical setlist / Track entity
   are dropped entirely**, not deferred. None of the tag categories in scope
   are performance-level; song-level tags (Originals, Covers, Hunter-Garcia,
   Jam Vehicle, …) come in a later spec and key off the canonical song title
   the app already has, so no setlist-position layer is needed.
2. **Read-time tag resolution, not baked tags.** The catalog bakes only
   Archive-derived facts per recording. Curated data lives in small editable
   TS files; a resolver computes a show's tags on demand and memoizes. This
   matches the custom-ratings precedent and its reason (no regen for a
   one-line curated fix).
3. **Bake parsed fields only; raw strings stay out of the bundle.** Raw
   `source`/`lineage`/`taper`/`transferer` go to a committed, non-imported
   audit file. A ≤60-char provenance string is baked for display.
   Bundle delta ≈ +0.7 MB.
4. **Per-show override is remembered (pinned)**, synced like ratings. Pins
   double as the override history that drives the nudge.
5. **Curated datasets are drafted by Claude** with a confidence/source note
   per entry, reviewed by the product owner.
6. **Instrumentation = Pedal Steel and Acoustic Set only**, both researched
   show-by-show with a cited source per entry — never inferred from date
   windows. Slide Guitar and MIDI Jerry are dropped.
7. **Series filter → badge.** `SeriesSection`, `selectedSeries`, and the
   `?series=` URL param are removed; show rows get an *"also on Dave's
   Picks 24"* badge from `officialReleases.ts`.
8. **No pruning.** Every tag is filterable; per-tag counts make low
   selectivity self-evident. The build report still prints coverage for
   information.
9. **The recording picker lists every recording** for the show (no cap),
   each with its format and lineage tags.
10. **Best-recording score is computed at read time**, not baked, so ranking
    weights can be tuned without a regen.
11. **Radio is left alone** — it plays specific rated performances tied to
    specific identifiers.
12. **Consensus Classic = tier 1** of `classicShowsTiers.ts` (default; owner
    may widen to tiers 1–2).

---

## Part 1 — Data pipeline & catalog schema

### Script

`scripts/fetchShowsByYear.js` is replaced by `scripts/buildCatalog.ts`, run via
`npx tsx scripts/buildCatalog.ts` (`tsx` added as a devDependency — the repo
has no TS runner today). TypeScript so the parser is one module shared by the
script and the app and unit-tested, instead of a third copy of the regex.

- One `advancedsearch` request per year, 1965–1995 (31 calls), with
  `fl[]` = `identifier, title, date, venue, coverage, year, downloads, source,
  taper, transferer, lineage, avg_rating, num_reviews`. A 1977 probe confirmed
  all fields come back from search; no per-identifier `/metadata` calls.
- Groups by date into `GratefulDeadShow`, sorts versions by `downloads` desc,
  sets `primaryIdentifier` = highest downloads (unchanged semantics).
- **No per-show cap.** All recordings are baked (8,611 today).
- Writes `src/data/shows.json` and a slim `api/_lib/shows.slim.json` (`date`, `primaryIdentifier`, `venue` per show — all the OG/HTML functions read; a full twin was inlined into the Edge bundle and tripled its size).
- Writes `scripts/output/recordings-raw.json` (committed, never imported by
  the app): `{ [identifier]: { source, lineage, taper, transferer } }`.
- Writes `scripts/output/catalog-report.md`: format distribution, list of
  `unknown`-format identifiers, lineage counts, per-tag **show-level**
  coverage % (union over recordings), venues missing from `venueTypes.ts`,
  and what the Residency rule caught.

### Schema (`src/types/show.types.ts`)

```ts
export type RecordingFormat = 'sbd' | 'aud' | 'matrix' | 'fm' | 'unknown';
export type LineageTag = 'betty' | 'miller' | '16track' | 'lowgen';

export interface RecordingVersion {
  identifier: string;
  title: string;
  downloads?: number;
  format: RecordingFormat;      // replaces the old lowercase `source` string
  lineage: LineageTag[];
  avgRating?: number;           // Archive avg_rating, 0–5
  numReviews?: number;
  provenance?: string;          // ≤60 chars, e.g. "SBD → Master Reel → DAT"
  taper?: string;
  transferrer?: string;         // app spelling; Archive field is `transferer`
}
```

`GratefulDeadShow`, `ShowDetail`, `Track`, `ShowsByYear` are unchanged.
`ShowDetail.allVersions` is now filled from the catalog, not a runtime search.

### Parser (`src/services/recordingParser.ts`, pure)

- `parseFormat(source: string | undefined, identifier: string): RecordingFormat`
  — the ladder below is run over the `source` field first; if that yields
  `unknown` (or `source` is empty), the same ladder runs over the identifier.
  Matrix must be tested first because matrix descriptions mention both board
  and audience sources.

  ```
  matrix|mtx                         → matrix
  sbd|soundboard                     → sbd
  pre-fm|fm broadcast|simulcast      → fm
  aud|audience|nak|schoeps|akg       → aud
  ```
- `parseLineage(raw: { source?, lineage?, taper?, transferer? }): LineageTag[]`
  — Betty: `/betty/i` in taper, source, or lineage. Charlie Miller:
  `/miller/i` in transferer. 16-Track: `/16[- ]?(track|tk)/i` in source.
  Low Generation: `/\b(master|mr|msr|msc|1st gen|first gen|0 gen)\b/i` in
  source or lineage. Patterns are tuned against the report before freezing.
- `shortProvenance(source: string | undefined): string | undefined` —
  collapse `->` / `>` to `→`, collapse whitespace, truncate to 60 chars with
  an ellipsis.

Target: ≥85% format accuracy on a hand-labeled fixture (see Testing).

### Overrides (`src/data/recordingOverrides.ts`, hand-edited, applied at read time)

```ts
export const tagFixes: Record<string /* identifier */, Partial<Pick<RecordingVersion, 'format' | 'lineage'>>>;
export const editorialPins: Record<string /* date */, string /* identifier */>;
```

`tagFixes` corrects parse misses without a regen. `editorialPins` is the
spec's curated "per-show pinned recording" — distinct from *user* pins
(Part 2). A catalog accessor `getCatalogVersions(date)` applies `tagFixes` and is
the only way app code reads a show's recordings. Keyed by date so persisted
favorites (which embed a stale `versions` array) self-heal. `RecordingVersion`
carries no per-recording `title` (unused by any UI; dropped for bundle size)
and the catalog is serialized one show per line without indentation —
uncapped, the catalog is ≈4.9 MB (18.3k recordings), not the +0.7 MB this
spec estimated before the per-show cap was removed.

### Removals

- `SOURCE_TYPES` (Title Case constants) and `ArchiveApiService.extractSource()`.
- `archiveApi.getShowVersions(date)` and `MAX_VERSIONS_PER_SHOW` — the catalog
  is the source of recordings.
- `scripts/fetchShows.js` / `scripts/fetchShowsByYear.js` regex copies.
- `VersionPicker` and `ShowDetailScreen` (two lines) switch from
  `version.source` to `formatLabel(version.format)` from
  `src/constants/tags.ts`.

---

## Part 2 — Source preference engine

### User store (`src/services/sourcePrefsStore.ts`)

Module-level store modeled on `userRatingsStore`: synchronous getters,
`subscribeSourcePrefs`, version counter for `useSyncExternalStore`,
`mergeSourcePrefs` (latest-wins), `pruneTombstones` (30 days),
`resetStoreForTests`.

```ts
export type SourcePreference = 'popular' | 'sbd' | 'aud' | 'matrix' | 'fm';  // default 'popular'

export interface SourcePin { identifier: string; format: RecordingFormat; pinnedAt: number; deletedAt?: number }

export interface SourcePrefs {
  preference: SourcePreference;
  preferenceSetAt: number;
  pins: Record<string /* YYYY-MM-DD */, SourcePin>;
  nudgeAnswers: Partial<Record<RecordingFormat, 'yes' | 'no'>>;
}
```

`format` is stored at pin time so the nudge needs no catalog lookup.

Merge rules: `preference` — newer `preferenceSetAt` wins. `pins` — per date,
newer of `max(pinnedAt, deletedAt)` wins; tombstoned pins are removed after
30 days. `nudgeAnswers` — union; on conflict, `'yes'` wins (a yes already
changed the preference).

### Context & persistence

`SourcePrefsContext` copies `UserRatingsContext`: AsyncStorage load on mount
(key registered in `STORAGE_KEYS`), write-through on store notify,
`useDebouncedSync` push, merge-on-login gated on a load-complete promise,
flush-on-logout. Fully functional signed out.

Cloud: new table `user_preferences` via a migration mirroring
`20260729120000_user_ratings_table.sql`:

- `user_id uuid primary key references auth.users(id) on delete cascade`
- `prefs jsonb not null default '{}'` (preference, preferenceSetAt, nudgeAnswers)
- `pins jsonb not null default '{}'` — CHECK `octet_length(pins::text) <= 262144`
- `updated_at timestamptz`
- RLS enabled; four idempotent per-user policies
- `SUPABASE_TABLES` in `registry.ts` updated. No change needed to
  `supabase/delete_user_function.sql` — the table's `on delete cascade` FK
  on `user_id` already removes the row when the user is deleted.
- Applied with `supabase db push --linked`.

`userPreferencesCloudService` — whole-blob `upsert(..., { onConflict: 'user_id' })`;
`PGRST116` → empty.

Provider slots next to `UserRatingsProvider` in `App.tsx` (above `ShowsProvider`).

### Ranker (`src/services/recordingRanker.ts`, pure)

For the versions of one show:

```
pop     = log10(downloads+1) / max over the show of log10(downloads+1)     (0–1; 0 if no downloads anywhere)
rating  = ((avgRating·numReviews) + PRIOR_MEAN·PRIOR_WEIGHT) / (numReviews + PRIOR_WEIGHT) / 5
          with PRIOR_MEAN = 4.0, PRIOR_WEIGHT = 20; missing rating ⇒ numReviews = 0
lineage = min(LINEAGE_CAP, Σ LINEAGE_BONUS[tag])   betty .08, miller .04, 16track .04, lowgen .02, cap .12
score   = W_POP·pop + W_RATING·rating + lineage     W_POP = .55, W_RATING = .30
```

All constants exported as `RANK_WEIGHTS`. `rankRecordings(versions)` returns
versions sorted by score desc, ties broken by downloads desc then identifier.

Calibrated 2026-08-20 against the full catalog: with these weights "Most
Popular" agrees with the most-downloaded recording on ~70% of
multi-recording shows (the first draft's heavier lineage bonus agreed on
only 29%).

### Resolver (`src/services/recordingResolver.ts`, pure)

```ts
export interface SourceConstraint { format?: RecordingFormat; lineage?: LineageTag[] }

export interface ResolveContext {
  preference: SourcePreference;
  userPins: Record<string, SourcePin>;
  editorialPins: Record<string, string>;
  sessionConstraint?: SourceConstraint;
}

export interface ResolvedRecording {
  identifier: string;
  via: 'user-pin' | 'editorial' | 'filter' | 'preference' | 'popular';
  fallback?: { requested: TagId[]; relaxed: TagId[] };
}

export function resolveRecording(show: GratefulDeadShow, ctx: ResolveContext): ResolvedRecording;
```

Implemented as pure `recordingResolver` + store-aware `sourceSelection`
(`resolveForDate` / `resolveShowIdentifier` / `resolveRouteIdentifier`);
`showDetailParams` resolves the identifier for every navigation, and web
URLs map any recording identifier back to its date.

Precedence:

1. **User pin** for `show.date`, if not tombstoned and the identifier still
   exists in the show's versions (stale pins are ignored, not deleted).
2. **Session constraint** (from an active source filter) — candidates
   filtered by the constraint, then ranked.
3. **Global preference** (`preference !== 'popular'`) — candidates filtered
   by `{ format: preference }`, then ranked.
4. **Unconstrained** — `rankRecordings(all)`.

At steps 2–4, if `editorialPins[show.date]` is among the remaining
candidates it wins (`via: 'editorial'`); otherwise the top-ranked candidate wins. An editorial pin
never overrides a user pin or a format the user asked for.

**Fallback ladder.** When a constraint (step 2 or 3) empties the candidate
set, relax in this order, stopping at the first non-empty set:

1. drop quality modifiers (`16track`, `lowgen`) from `lineage`
2. drop lineage identity (`betty`, `miller`) from `lineage`
3. drop `format`
4. unconstrained

`fallback.requested` is the original constraint as tag ids;
`fallback.relaxed` lists what was dropped. `describeFallback(result, chosen)`
renders *"No matrix from this night — playing the Betty Board soundboard
instead."* (format label of the chosen recording, prefixed by its lineage
labels if any).

A session constraint with several tags of one category (e.g. two formats)
is treated as OR within that category, consistent with the filter engine.

### Filter precedence (session constraint)

When a user opens a show from a filtered list, the selected `source`-category
tags are passed as the `sourceConstraint` route param on the ShowDetail
route. It is honored for that visit and disappears when they leave — no
session state. On web it appears in the URL, so a link shared from a Betty
Board filter opens the Betty Board. `webLinking.ts` gets the param.

The `sourceConstraint` param is a comma-separated string of tag ids (e.g.
`matrix,miller`), built by `stringifySourceConstraint` and parsed back by
`parseSourceConstraint`.

### Play seams

The `primaryIdentifier` reads at `PlayerContext.tsx` (×2 — the third read
keys a song's own recording and is untouched), `ShowOfTheDayContext.tsx`
(×2), and `showDetailParams.ts` go through `resolveRecording` with the
current store state. `showDetailParams`/`sourceSelection` wrap it for
components; non-React code reads the store synchronously. `radioService` is
unchanged.

### Stable show identity

The recording loaded for a show now varies per user (preference, pins), so
anything keyed per SHOW — favorites, collections, play counts — must not key
off the loaded recording's identifier. `stableShowIdentifier(date)` in
`sourceSelection.ts` returns the catalog's primary recording for that date
(falling back to the loaded identifier when the date is off-catalog) and is
the only identifier those features use; `resolveShowIdentifier` /
`resolveForDate` remain the seam for "what should play," and are unrelated
to this identity.

### UI

- **Settings → "Playback"** section: single-select list of Most Popular /
  Soundboard / Audience / Matrix / FM Broadcast with a one-line description
  each. Default Most Popular.
- **VersionPicker** reads from the catalog, lists every recording sorted by
  score. Row: format label, lineage chips, ★ `avgRating` (`numReviews`),
  download count, provenance string, taper/transferrer attribution.
  The resolver's current pick is marked **Default**; a user pin is marked
  **Pinned**. Tapping a row pins it; a "Use default" row removes the pin.
- **Fallback notice**: toast via the existing `ToastProvider` once per show
  open when `fallback` is present, plus a one-line note under the source
  pill on the show screen.
- **Nudge**: after a pin is saved, if the user's three most recent pins (by
  `pinnedAt`, across shows) resolve to recordings sharing a format `F`, `F !== preference`, and
  `nudgeAnswers[F]` is unset, the picker tray shows an inline prompt
  *"Prefer matrix everywhere?"* with **Yes** / **Not now**. Yes sets
  `preference = F`; either answer is stored in `nudgeAnswers[F]` and the
  prompt never returns for that format. The prompt renders in the picker's
  modal header — at the top of the scrollable options list, immediately
  below the "Select Source" title bar, via `renderHeaderExtras()`. The tray
  closes on selection, so the prompt is first seen on the next picker open.

---

## Part 3 — Show tags & filter tray

### Tag registry (`src/constants/tags.ts`)

Entity-agnostic so song tags can be added later without a second engine.

```ts
export type TagEntity = 'show' | 'recording' | 'song';
export interface TagCategory { id: string; label: string; appliesTo: TagEntity }
export interface TagDef { id: TagId; category: string; label: string; description?: string }
```

| Category | Tags |
|---|---|
| `era` (show) | Primal Dead · Live/Dead · Americana · Europe '72 · Wall of Sound · Hiatus · Return · Peak Keith · Brent Era · Vince & Bruce · Final Years |
| `source` (recording; shown on shows as the union) | Soundboard · Audience · Matrix · FM Broadcast · Betty Board · Charlie Miller · 16-Track · Low Generation |
| `venueType` (show) | Small Theater · Arena · Stadium · Amphitheater · Festival · International · Residency |
| `instrumentation` (show) | Pedal Steel · Acoustic Set |
| `notable` (show) | Consensus Classic · Historic Event · Guest Sit-In |

Tag ids are short stable slugs (`europe72`, `betty`, `arena`, …) because they
appear in URLs. `formatLabel(format)` and `lineageLabel(tag)` map
`RecordingFormat` / `LineageTag` to their `TagDef`.

### Era (`src/data/eras.ts`)

Exhaustive, single-valued, date-bounded. Replaces both existing taxonomies:
`FILTER_ERAS` in `ShowsFilterTray/types.ts` and `ERAS` in
`constants/classicShows.ts`. `EraPicker.tsx` has no consumers and is deleted
(verify at implementation time).

| Era | Start | End |
|---|---|---|
| Primal Dead | 1965-01-01 | 1967-12-31 |
| Live/Dead | 1968-01-01 | 1969-12-31 |
| Americana | 1970-01-01 | 1972-04-06 |
| Europe '72 | 1972-04-07 | 1972-12-31 (includes post-tour US dates) |
| Wall of Sound | 1973-01-01 | 1974-10-20 (includes 1973, while the PA was being built) |
| Hiatus | 1974-10-21 | 1976-06-02 |
| Return | 1976-06-03 | 1976-12-31 |
| Peak Keith | 1977-01-01 | 1979-02-17 |
| Brent Era | 1979-02-18 | 1990-07-23 |
| Vince & Bruce | 1990-07-24 | 1992-03-24 |
| Final Years | 1992-03-25 | 1995-12-31 |

Ranges are contiguous so every catalog date maps to exactly one era (tested).
`eraForDate(date)` and `eraForYear(year)` (era covering the most shows of
that year) are exported; the Years section of the filter tray groups years by
`eraForYear`. `eraForYear` groups the Years section by the era holding most
of that year's catalog shows; the two older era lists (`FILTER_ERAS`,
`classicShows.ERAS`) and `EraPicker` were removed.

### Venue Type (`src/data/venueTypes.ts`)

Multi-valued per show: at most one **physical** type (Small Theater / Arena /
Stadium / Amphitheater — mutually exclusive) plus derived modifiers.

- Physical type: curated map keyed by `normalizeVenue(venue)` (lowercase,
  strip punctuation, collapse whitespace, strip leading "the"), ~450 entries,
  each `{ type, confidence: 'high' | 'medium' | 'low', note? }`. The venue
  string comes from `getVenueFromShow()`. Unmapped venues get no physical
  tag and are listed in the build report.
- **International**: derived — `coverage`/location not in the United States.
  International derives from the curated venue flag in
  `scripts/data/venue-types.tsv` (the location regex misfires on
  spelled-out states and 'Unknown'); the map covers 613 normalized venues,
  472 with a physical type.
- **Festival**: curated date list (`festivalDates`).
- **Residency**: derived — a run of ≥4 shows at the same normalized venue
  within any 10-day window; every show in the run is tagged. The report lists
  the runs for review.

### Instrumentation (`src/data/instrumentation.ts`)

```ts
export const pedalSteelDates: Array<{ date: string; source: string }>;
export const acousticSetDates: Array<{ date: string; source: string }>;
```

Researched show-by-show (Jerrybase, DeadLists, setlist databases, the
Compendium notes in `showNotes.ts`); `source` cites where each entry came
from. No date-window inference. Entries carry `confidence`; only
`high`/`medium` are active, `low` rows are exported as `UNVERIFIED_*` and
never resolved. Research:
`docs/superpowers/research/2026-08-20-part3-curated-tags.md`. The
research-backed Pedal Steel list includes four 1987 Dylan-&-the-Dead nights
where Garcia played steel in the Dylan segment — flagged for owner review
against the "during the Dead's set" wording.

### Notable (`src/data/notableShows.ts`)

- **Consensus Classic**: tier-1 entries of `classicShowsTiers.ts` (derived).
- **Historic Event**, **Guest Sit-In**: curated
  `Array<{ date: string; note: string }>`.

### Tag resolver (`src/services/tagResolver.ts`)

- `getShowTags(date): TagId[]` — era from date; venue type from map + rules;
  instrumentation/notable from the curated sets; source = union of the show's
  recordings' `format` and `lineage` after `tagFixes` (`unknown` contributes
  nothing). Memoized in a lazy `Map<date, TagId[]>`.
- Lazy inverted index `Map<TagId, Set<date>>` built on first use from
  `getAllShowsSorted()`.
- `buildTagPredicate(selected: TagId[], registry, getTagsForItem)` — pure
  core: group `selected` by category; an item passes if, for every category
  with selections, it carries at least one selected tag in that category
  (OR within, AND between). Knows nothing about shows.
- `applyTagFilter(dates: string[], selected: TagId[]): string[]` — the
  show-specialized wrapper using the inverted index (set union per category,
  intersection across categories).
- `getTagCounts(selected: TagId[], baseDates: string[]): Record<TagId, number>`
  — faceted counts: the count for tag `T` in category `C` applies every
  *other* category's selection, ignores `C`'s own selection, and intersects
  with `T`'s set. Memoized by `(selected, baseDates)` identity.

### Filter tray

- `ShowsFilterState = { selectedYears: string[]; selectedTags: TagId[] }`.
  `selectedSeries` is removed.
- `SeriesSection.tsx` is deleted. New `TagCategorySection.tsx` renders one
  collapsible section per category (order: Era, Source, Venue Type,
  Instrumentation, Notable) with the active-selection count in its header
  and a per-tag result count in each `FilterPill`, counts from `getTagCounts`
  against the shows that survive the Years filter.
- `YearsSection` keeps its era grouping, now driven by `eraForYear`.
- `hasActiveFilters`, `getFilterCount`, `createEmptyFilterState` updated.
- `HomeScreen` / `FavoritesScreen` stage-1 filtering: Years as today, then
  `applyTagFilter`; search stays downstream and unchanged.
- Web URL: `?tags=europe72,betty,arena` replaces `?series=`.
  `webLinking.ts` parses/serializes `tags` and drops `series`.
- Navigating to a show from a list with any `source`-category tags selected
  passes them as `sourceConstraint` (Part 2).
- Counts are computed against the dates surviving the Years filter within
  the caller's `showsByYear` (Favorites passes its own).
- Year filtering is retained and rendered below the five tag sections
  (owner instruction 2026-08-20); `parseTagsParam`/`stringifyTagsParam` live
  in a dependency-free `src/navigation/tagsParam.ts` so native never loads
  the web linking config.

### Badges

- `ReleaseBadge` on show rows: *"also on Dave's Picks 24"* (first matching
  release by `DISPLAY_SERIES` order; `+N` if several) from
  `officialReleases.ts`. Replaces the Series filter's job.
- The show screen's recording list shows each recording's format and lineage
  tags (Part 2 VersionPicker rows).
- Implemented by extending the existing `OfficialReleaseBadge` (`alsoOn`
  mode) rather than a new component.

### Measured coverage

Catalog coverage (2073 shows), via `getTagCoverage()`:

| Tag | Shows | % |
|---|---|---|
| primal | 56 | 3 |
| livedead | 152 | 7 |
| americana | 191 | 9 |
| europe72 | 77 | 4 |
| wallofsound | 116 | 6 |
| hiatus | 27 | 1 |
| return | 42 | 2 |
| peakkeith | 172 | 8 |
| brent | 851 | 41 |
| vincebruce | 137 | 7 |
| finalyears | 252 | 12 |
| sbd | 1820 | 88 |
| aud | 1600 | 77 |
| matrix | 776 | 37 |
| fm | 94 | 5 |
| betty | 68 | 3 |
| miller | 1597 | 77 |
| 16track | 19 | 1 |
| lowgen | 1893 | 91 |
| theater | 424 | 20 |
| arena | 1023 | 49 |
| stadium | 143 | 7 |
| amphitheater | 251 | 12 |
| festival | 16 | 1 |
| international | 82 | 4 |
| residency | 281 | 14 |
| pedalsteel | 27 | 1 |
| acousticset | 68 | 3 |
| classic | 23 | 1 |
| historic | 36 | 2 |
| guest | 106 | 5 |

Lowest-selectivity tags: Low Generation 91%, Soundboard 88%,
Audience/Charlie Miller 77% — kept per the no-pruning decision.

---

## Testing

Jest (`jest-expo`), TDD per the repo's plan format, tests co-located under
`src/services/__tests__/`, `src/contexts/__tests__/`, `src/data/__tests__/`,
`src/__tests__/components/`.

- **recordingParser** — table-driven over real strings from
  `recordings-raw.json`: matrix precedence over sbd/aud mentions,
  identifier-only fallback, each lineage pattern, provenance truncation.
  **Accuracy gate:** a ~100-item hand-labeled fixture
  (`src/services/__tests__/fixtures/recordingFormats.json`); the test asserts
  ≥85% format accuracy so regex tweaks can't silently regress.
- **recordingRanker** — deterministic order; Bayesian shrink (one 5★ review
  loses to forty 4.6★ reviews); lineage cap; missing fields; tie-break.
- **recordingResolver** — precedence order; stale/tombstoned pin ignored;
  editorial pin wins only within candidates; every rung of the fallback
  ladder with the expected `relaxed` list; `describeFallback` strings;
  OR within a multi-tag constraint.
- **sourcePrefsStore / SourcePrefsContext** — merge latest-wins for
  preference and pins, tombstone pruning, `nudgeAnswers` yes-wins, nudge
  trigger (three same-format pins ≠ preference, once per format), the
  load/merge race (copied from the ratings context test).
- **userPreferencesCloudService** — upsert shape, `PGRST116` → empty.
- **eras** — contiguity and exhaustiveness: every date in `shows.json` maps to
  exactly one era; boundaries land where the table says.
- **tagResolver** — source union (incl. `unknown` contributes nothing,
  `tagFixes` applied), `buildTagPredicate` OR/AND semantics with a fake
  registry, `applyTagFilter` against a small fixture, faceted counts ignore
  own category, venue normalization, Residency rule.
- **buildCatalog** — grouping/report functions unit-tested with the saved
  1977 search response as a fixture; network mocked.
- **Components** — `TagCategorySection` (counts, collapse, active count),
  `VersionPicker` rows (Default/Pinned markers, pin/unpin), Settings Playback
  section, `ReleaseBadge`, via `@testing-library/react-native`.
- `npm run typecheck` and `npm run typecheck:web` clean (the 50 pre-existing
  web errors excepted).

## Rollout

Three PRs in dependency order, each independently shippable:

1. **Catalog & parser** — script, schema, parser, overrides, catalog
   accessor, VersionPicker from catalog (all recordings + tags), removals.
   User-visible: the picker lists every recording with tags.
2. **Source preference** — store, context, migration (`supabase db push
   --linked`), cloud service, ranker, resolver, play seams, Settings section,
   pins, nudge, fallback notice.
3. **Tags & filter tray** — registry, eras (replacing both old lists),
   curated datasets, tag resolver + index, tray rewrite, Series → badge, URL
   params, `sourceConstraint` hand-off.

All three are JS-only; native apps need an EAS build or `eas update`.

## Out of scope

- Mid-playback source switching; canonical setlist / Track entity.
- Song-level tags (Originals, Covers, Traditionals, Hunter-Garcia, Blues,
  Gospel, Barlow-Weir, Jam Vehicle, Ballad, Rare, Cowboy Songs, Pigpen) —
  next spec; `buildTagPredicate` is left entity-agnostic for it.
- Radio recording selection.
- Server-side OG functions reading tags.
- Filter pruning.
- User-created tags.
- Performance-level tags of any kind.
