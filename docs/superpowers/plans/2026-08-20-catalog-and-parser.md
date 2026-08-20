# Catalog & Recording Parser Implementation Plan (Tagging PR 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Regenerate the bundled show catalog with every Archive recording per show (no cap) carrying a parsed format, lineage tags, rating, and provenance string, and make the show screen's recording picker read from that catalog instead of a runtime search.

**Architecture:** A pure parser module (`recordingParser.ts`) is shared by a new TypeScript build script (`scripts/buildCatalog.ts`) and the app's `archiveApi`. The script writes `src/data/shows.json` + its `api/_lib` twin, a committed raw-metadata audit dump the app never imports, and a coverage report. A thin catalog accessor (`recordingCatalog.ts`) keyed by **date** applies hand-edited tag fixes at read time and replaces `archiveApi.getShowVersions()`. `VersionPicker` renders every recording with its tags.

**Tech Stack:** React Native / Expo 54, TypeScript (strict), Jest (`jest-expo`, `react-test-renderer` for components), Node 22 (`fetch` is global), `tsx` to run the TS script.

**Spec:** `docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md` — Part 1, plus the "Removals" list. Parts 2 and 3 are separate plans written after this PR lands.

## Global Constraints

- **Format ids:** `RecordingFormat = 'sbd' | 'aud' | 'matrix' | 'fm' | 'unknown'`. **Lineage ids:** `LineageTag = 'betty' | 'miller' | '16track' | 'lowgen'`. These slugs are permanent — they will appear in URLs in PR 3.
- **Format ladder order is fixed:** matrix → sbd → fm → aud. Run over the Archive `source` field first; only if that yields `unknown` run the same ladder over the identifier.
- **Parser accuracy gate:** ≥ 85% on `src/services/__tests__/fixtures/recordingFormats.json`. Never relabel the fixture to make the parser pass; fix the parser or accept the miss.
- **Archive field spelling:** the API field is `transferer` (one r); the app's `RecordingVersion` field is `transferrer` (two r's). Map exactly once, in `recordingFromDoc`.
- **Show key:** date `YYYY-MM-DD`; `shows.json` dates carry `T00:00:00Z` — always slice to 10 chars before comparing (the existing `findShowByDate` already does).
- **`primaryIdentifier` semantics unchanged:** highest-`downloads` recording. Nothing in this PR changes which recording plays by default — that is PR 2.
- **The app must never import `scripts/output/*`.** Those files are audit artifacts only.
- **`api/_lib/shows.slim.json` is a slim twin of `src/data/shows.json`**, not a byte-identical copy: `date`, `primaryIdentifier`, `venue` per show — all the OG/HTML functions read. A full twin used to be inlined into the Edge OG bundle and roughly tripled its gzipped size.
- Tests: `npx jest <path> -v`. Typecheck: `npm run typecheck`. Both must pass before each commit. `npm run typecheck:web` has ~50 pre-existing errors in `expo-file-system`'s shim — do not add new ones, ignore the existing ones.
- Component tests use `react-test-renderer` (`TestRenderer.create` inside `act`) following `src/__tests__/components/RatingTray.test.tsx`.
- Tests must not hit the network. The build script's network layer is isolated in one function and is not unit-tested; its pure helpers are.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Work on branch `feat/catalog-parser` off `main`.

---

### Task 1: Recording parser (pure functions) + additive types

**Files:**
- Modify: `src/types/show.types.ts:1-8` (add `RecordingFormat`, `LineageTag`; add *optional* new fields to `RecordingVersion` — `source?` stays for now, it is removed in Task 5 once the data is regenerated)
- Modify: `src/types/archive.types.ts:10-21` (`ArchiveDoc` gains the new search fields)
- Create: `src/services/recordingParser.ts`
- Test: `src/services/__tests__/recordingParser.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `export type RecordingFormat = 'sbd' | 'aud' | 'matrix' | 'fm' | 'unknown'` and `export type LineageTag = 'betty' | 'miller' | '16track' | 'lowgen'` from `src/types/show.types.ts`
  - from `src/services/recordingParser.ts`:
    - `export interface RawRecordingFields { source?: string; lineage?: string; taper?: string; transferer?: string }`
    - `export function fieldText(value: unknown): string | undefined` — string → trimmed string; string[] → joined with `; `; anything else → `undefined`; empty → `undefined`
    - `export function parseFormat(source: string | undefined, identifier: string): RecordingFormat`
    - `export function parseLineage(raw: RawRecordingFields): LineageTag[]` (order: betty, miller, 16track, lowgen)
    - `export function shortProvenance(source: string | undefined): string | undefined`
    - `export function recordingFromDoc(doc: ArchiveDoc): RecordingVersion`

- [ ] **Step 1: Add the types**

In `src/types/show.types.ts` replace the `RecordingVersion` block (lines 1–8) with:

```ts
export type RecordingFormat = 'sbd' | 'aud' | 'matrix' | 'fm' | 'unknown';
export type LineageTag = 'betty' | 'miller' | '16track' | 'lowgen';

export interface RecordingVersion {
  identifier: string;
  title: string;
  /** @deprecated legacy lowercase string from the old catalog; removed once the catalog is regenerated */
  source?: string;
  downloads?: number; // All-time download count
  format?: RecordingFormat;     // becomes required in Task 5
  lineage?: LineageTag[];       // becomes required in Task 5
  avgRating?: number;           // Archive avg_rating, 0–5
  numReviews?: number;
  provenance?: string;          // ≤60 chars, e.g. "SBD → Master Reel → DAT"
  taper?: string; // Who recorded it
  transferrer?: string; // Who did the digital transfer (app spelling; Archive's field is `transferer`)
}
```

In `src/types/archive.types.ts`, extend `ArchiveDoc` (after `transferer?: string;`):

```ts
  source?: string | string[]; // Free-text source description (taper-entered)
  lineage?: string | string[]; // Transfer chain
  avg_rating?: number; // 0–5
  num_reviews?: number;
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/services/__tests__/recordingParser.test.ts
import {
  fieldText,
  parseFormat,
  parseLineage,
  shortProvenance,
  recordingFromDoc,
} from '../recordingParser';

describe('fieldText', () => {
  it('trims strings and joins arrays', () => {
    expect(fieldText('  SBD > DAT ')).toBe('SBD > DAT');
    expect(fieldText(['Sandy Troy', 'Matt Smith'])).toBe('Sandy Troy; Matt Smith');
  });
  it('returns undefined for empty, null, numbers', () => {
    expect(fieldText('')).toBeUndefined();
    expect(fieldText('   ')).toBeUndefined();
    expect(fieldText(undefined)).toBeUndefined();
    expect(fieldText(null)).toBeUndefined();
    expect(fieldText(42)).toBeUndefined();
  });
});

describe('parseFormat', () => {
  it.each([
    // matrix must win even when sbd/aud are also mentioned
    ['Matrix mix (SBD/AUD)', 'gd1977-04-23.mtx.seamons.97596.sbeok.flac16', 'matrix'],
    ['2 source matrix: Soundboard (shnid=18554) and Aud (shnid=88771)', 'gd1977-05-17.121485.x.flac16', 'matrix'],
    ['SBD -> Master Reel -> Dat', 'gd1977-10-14.sbd.miller.110400.flac16', 'sbd'],
    ['Soundboard patched with Audience', 'gd77-05-28.sbd.obv.31952.sbeok.shnf', 'sbd'],
    ['Barry Glassberg\'s Master FM Reel (Pioneer TX9500 tuner)', 'gd1977-04-27.167535.fm.x.flac2496', 'fm'],
    ['wnew simulcast > reel', 'gd1977-04-27.x.flac24', 'fm'],
    ['Pre-FM reel > DAT', 'gd1977-09-03.x.flac16', 'fm'],
    ['Audience Recording: Sony ECM-33Ps', 'gd77-04-30.moore.minches.17952.sbeok.shnf', 'aud'],
    ['Recorded with Nakamichi CM-300s', 'gd1977-05-25.x.flac16', 'aud'],
    ['Source: AKG D224s > Tandberg 10X', 'gd1977-06-07.x.flac2496', 'aud'],
    ['Schoeps CMC4 > Sony D5', 'gd1985-06-30.x.flac16', 'aud'],
    ['Kathy Sublette\'s Master Audience Cassettes; Shure SM57 mics', 'gd1977-05-04.x.flac1648', 'aud'],
  ])('source %p with identifier %p → %p', (source, identifier, expected) => {
    expect(parseFormat(source, identifier)).toBe(expected);
  });

  it('falls back to the identifier when the source field has no format keyword', () => {
    expect(parseFormat('master reels > dat', 'gd1977-05-05.sbd.cantor.7725.shnf')).toBe('sbd');
    expect(parseFormat('Partial Recording by Gene Taback, balcony', 'gd1977-03-20.132365.aud.taback.flac16')).toBe('aud');
    expect(parseFormat('See info file', 'gd1977-05-08.mtx.dan.29511.flac16')).toBe('matrix');
    expect(parseFormat(undefined, 'gd1977-02-26.sbd.steve.253.shnf')).toBe('sbd');
    expect(parseFormat(undefined, 'gd1977-10-06.fm.kbfh.77476.sbeok.flac16')).toBe('fm');
  });

  it('does not treat "audio"/"Audition" as audience', () => {
    expect(parseFormat('dBpoweramp (WAV) > Audition (Pitch Bender)', 'gd1977-02-17.145591.Goody-pitch-fix.flac1644')).toBe('unknown');
    expect(parseFormat('DTS-Audio-CD 5.1 Mix ; SBD > Master Reel', 'gd1977-10-28.101243.dts.tobin.flac16')).toBe('sbd');
  });

  it('returns unknown when nothing matches', () => {
    expect(parseFormat(undefined, 'gd1977-02-27.145196.bertrando.smith.flac2496')).toBe('unknown');
  });
});

describe('parseLineage', () => {
  it('detects Betty from taper, source, or lineage', () => {
    expect(parseLineage({ taper: 'Betty Cantor' })).toEqual(['betty']);
    expect(parseLineage({ source: 'Betty SBD > Reel Master' })).toContain('betty');
    expect(parseLineage({ lineage: 'Bettyboard 7 inch master reel' })).toContain('betty');
  });
  it('detects Charlie Miller only from the transferer field', () => {
    expect(parseLineage({ transferer: 'Scott Clugston, Charlie Miller' })).toContain('miller');
    expect(parseLineage({ source: 'provided by Charlie Miller' })).not.toContain('miller');
  });
  it('detects 16-track from the source field', () => {
    expect(parseLineage({ source: '16-track master reels > mixdown' })).toContain('16track');
    expect(parseLineage({ source: '16 Track Reel > DAT' })).toContain('16track');
    expect(parseLineage({ source: '16tk > DAT' })).toContain('16track');
    expect(parseLineage({ lineage: '16-track' })).not.toContain('16track');
  });
  it('detects low generation from master/MR/MSR/MSC/1st gen in source or lineage', () => {
    expect(parseLineage({ source: 'SBD > Master Reel > DAT' })).toContain('lowgen');
    expect(parseLineage({ lineage: 'SBD>MSR>DAT>SS>CD' })).toContain('lowgen');
    expect(parseLineage({ lineage: 'SBD>MR>C>D>CD' })).toContain('lowgen');
    expect(parseLineage({ source: '1st Generation Reel' })).toContain('lowgen');
    expect(parseLineage({ lineage: '3rd generation reel played back' })).not.toContain('lowgen');
    expect(parseLineage({ source: 'Remastered from CD' })).not.toContain('lowgen');
  });
  it('returns tags in a stable order and empty when nothing matches', () => {
    expect(parseLineage({ source: 'Betty SBD > Master Reel', transferer: 'Charlie Miller' })).toEqual(['betty', 'miller', 'lowgen']);
    expect(parseLineage({})).toEqual([]);
  });
});

describe('shortProvenance', () => {
  it('normalizes arrows and whitespace', () => {
    expect(shortProvenance('SBD -> Master Reel  ->Dat')).toBe('SBD → Master Reel → Dat');
    expect(shortProvenance('SBD>>MR>>DAT')).toBe('SBD → MR → DAT');
    expect(shortProvenance('A > B\n> C')).toBe('A → B → C');
  });
  it('truncates to 60 chars with an ellipsis', () => {
    const long = 'Recording Info: master recorded from the balcony on a Tandberg 10X reel to reel @ 7.5 ips';
    const out = shortProvenance(long)!;
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith('…')).toBe(true);
  });
  it('returns undefined for empty input', () => {
    expect(shortProvenance(undefined)).toBeUndefined();
    expect(shortProvenance('   ')).toBeUndefined();
  });
});

describe('recordingFromDoc', () => {
  it('maps an Archive search doc to a RecordingVersion', () => {
    const v = recordingFromDoc({
      identifier: 'gd1977-05-09.123480.sbd.miller.flac16',
      title: 'Grateful Dead Live at War Memorial Auditorium on 1977-05-09',
      date: '1977-05-09T00:00:00Z',
      downloads: 98069,
      source: 'SBD -> Master Reel (DBX-1 Encoded) -> Sony PCM501ES (44.055k)',
      lineage: 'Sony PCM501ES (Analog Out) -> DBX-1 Decoder> Sony PCM501ES',
      transferer: 'Charlie Miller',
      avg_rating: 4.89,
      num_reviews: 9,
    });
    expect(v).toEqual({
      identifier: 'gd1977-05-09.123480.sbd.miller.flac16',
      title: 'Grateful Dead Live at War Memorial Auditorium on 1977-05-09',
      downloads: 98069,
      format: 'sbd',
      lineage: ['miller', 'lowgen'],
      avgRating: 4.89,
      numReviews: 9,
      provenance: 'SBD → Master Reel (DBX-1 Encoded) → Sony PCM501ES (44.055k)',
      transferrer: 'Charlie Miller',
    });
  });
  it('omits absent optional fields and defaults downloads to 0', () => {
    const v = recordingFromDoc({ identifier: 'gd1977-02-26.sbd.steve.253.shnf', title: 'x', date: '1977-02-26T00:00:00Z' });
    expect(v).toEqual({
      identifier: 'gd1977-02-26.sbd.steve.253.shnf',
      title: 'x',
      downloads: 0,
      format: 'sbd',
      lineage: [],
    });
    expect(Object.keys(v)).not.toContain('avgRating');
    expect(Object.keys(v)).not.toContain('taper');
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest src/services/__tests__/recordingParser.test.ts -v`
Expected: FAIL — `Cannot find module '../recordingParser'`.

- [ ] **Step 4: Implement the parser**

```ts
// src/services/recordingParser.ts
/**
 * Pure parsing of Internet Archive per-recording metadata into the app's
 * format / lineage tags. Shared by the catalog build script
 * (scripts/buildCatalog.ts) and the runtime archiveApi so there is exactly
 * one copy of these rules. No I/O, no React.
 */
import type { ArchiveDoc } from '../types/archive.types';
import type { LineageTag, RecordingFormat, RecordingVersion } from '../types/show.types';

export interface RawRecordingFields {
  source?: string;
  lineage?: string;
  taper?: string;
  transferer?: string;
}

/** Archive fields are usually strings but can be arrays; collapse to one trimmed string. */
export function fieldText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const s = value.trim();
    return s.length > 0 ? s : undefined;
  }
  if (Array.isArray(value)) {
    const s = value.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(Boolean).join('; ');
    return s.length > 0 ? s : undefined;
  }
  return undefined;
}

// Order matters: matrix descriptions typically mention both board and
// audience sources, so matrix must be tested first. `aud` is word-bounded so
// "Audition"/"audio" don't read as audience; the mic-brand terms catch
// audience tapes described only by their gear.
const FORMAT_LADDER: ReadonlyArray<readonly [RecordingFormat, RegExp]> = [
  ['matrix', /matrix|mtx/i],
  ['sbd', /sbd|soundboard/i],
  ['fm', /pre-?fm|fm[ -]?broadcast|simulcast|\bfm\b/i],
  ['aud', /\baud\b|audience|nak|schoeps|akg|\becm\b|ecm-?\d|sennheiser|neumann|shure/i],
];

function runLadder(text: string): RecordingFormat {
  for (const [format, re] of FORMAT_LADDER) {
    if (re.test(text)) return format;
  }
  return 'unknown';
}

export function parseFormat(source: string | undefined, identifier: string): RecordingFormat {
  if (source) {
    const fromSource = runLadder(source);
    if (fromSource !== 'unknown') return fromSource;
  }
  return runLadder(identifier);
}

const BETTY_RE = /betty/i;
const MILLER_RE = /miller/i;
const SIXTEEN_TRACK_RE = /16[- ]?(track|tk)\b/i;
const LOW_GEN_RE = /\b(master|mr|msr|msc|1st gen(eration)?|first gen(eration)?|0 gen)\b/i;

export function parseLineage(raw: RawRecordingFields): LineageTag[] {
  const source = raw.source ?? '';
  const lineage = raw.lineage ?? '';
  const tags: LineageTag[] = [];
  if (BETTY_RE.test(`${raw.taper ?? ''} ${source} ${lineage}`)) tags.push('betty');
  if (MILLER_RE.test(raw.transferer ?? '')) tags.push('miller');
  if (SIXTEEN_TRACK_RE.test(source)) tags.push('16track');
  if (LOW_GEN_RE.test(`${source} ${lineage}`)) tags.push('lowgen');
  return tags;
}

const PROVENANCE_MAX = 60;

export function shortProvenance(source: string | undefined): string | undefined {
  if (!source) return undefined;
  const s = source
    .replace(/\s*(->|>+|→)\s*/g, ' → ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return undefined;
  if (s.length <= PROVENANCE_MAX) return s;
  return `${s.slice(0, PROVENANCE_MAX - 1).trimEnd()}…`;
}

/** Map one Archive advancedsearch doc to the app's RecordingVersion shape. */
export function recordingFromDoc(doc: ArchiveDoc): RecordingVersion {
  const source = fieldText(doc.source);
  const lineage = fieldText(doc.lineage);
  const taper = fieldText(doc.taper);
  const transferer = fieldText(doc.transferer);
  const provenance = shortProvenance(source);

  const version: RecordingVersion = {
    identifier: doc.identifier,
    title: doc.title,
    downloads: doc.downloads || 0,
    format: parseFormat(source, doc.identifier),
    lineage: parseLineage({ source, lineage, taper, transferer }),
  };
  if (typeof doc.avg_rating === 'number') version.avgRating = doc.avg_rating;
  if (typeof doc.num_reviews === 'number') version.numReviews = doc.num_reviews;
  if (provenance) version.provenance = provenance;
  if (taper) version.taper = taper;
  if (transferer) version.transferrer = transferer;
  return version;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/services/__tests__/recordingParser.test.ts -v`
Expected: PASS (all). If `parseFormat` cases fail, fix the regex — do not edit the expectations.

- [ ] **Step 6: Typecheck and commit**

Run: `npm run typecheck` — expected: clean.

```bash
git add src/types/show.types.ts src/types/archive.types.ts src/services/recordingParser.ts src/services/__tests__/recordingParser.test.ts
git commit -m "feat(catalog): pure recording parser for format and lineage tags

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Parser accuracy gate (hand-labeled fixture)

**Files:**
- Create: `src/services/__tests__/fixtures/recordingFormats.json`
- Test: `src/services/__tests__/recordingParser.accuracy.test.ts`

**Interfaces:**
- Consumes: `parseFormat` from Task 1.
- Produces: nothing for other tasks; this is the regression gate named in Global Constraints.

The labels below were assigned by a human reading each source string / identifier, **not** by running the parser. Three entries (identified only by mic model with no other hint) are expected misses and are why the gate is 85%, not 100%.

- [ ] **Step 1: Create the fixture**

```json
[
  { "identifier": "gd1977-12-29.133041.aud.troy-smith.flac24", "source": "Recording Info: master recorded from the balcony on a Tandberg 10X reel to reel @ 7.5 ips.", "expected": "aud" },
  { "identifier": "gd1977-05-26.sbd.wizard.32302.shnf", "source": "SBD>MSR>DAT>SS>CD>EAC>WAV>DC6>SHN", "expected": "sbd" },
  { "identifier": "gd1977-05-09.123480.sbd.miller.flac16", "source": "SBD -> Master Reel (DBX-1 Encoded) -> Sony PCM501ES (44.055k)", "expected": "sbd" },
  { "identifier": "gd1977-10-06.164827.aud.gale.miller.clugston.flac1648", "source": "Audience source of unknown provenance from Dan Gale's collection", "expected": "aud" },
  { "identifier": "gd1977-02-26.sbd.steve.253.shnf", "source": "", "expected": "sbd" },
  { "identifier": "gd1977-04-27.167535.fm.glassberg.smith.clugston.flac2496", "source": "Barry Glassberg's Master FM Reel (Pioneer TX9500 tuner > TEAC A3300S Reel @ 7 1/2 ips, Maxell UD180B) > 1st Ge", "expected": "fm" },
  { "identifier": "gd1977-10-28.148907.betty-board.anon.noel.t-flac16", "source": "Betty SBD > Reel Master > PCM > pcm clone", "expected": "sbd" },
  { "identifier": "gd1977-04-23.mtx.seamons.97596.sbeok.flac16", "source": "Matrix mix (SBD/AUD)", "expected": "matrix" },
  { "identifier": "gd77-06-08.sbd.miller.25621.sbeok.shnf", "source": "Recording Info: SBD -> Master Reel (7 inch Master Reels @ 7.5ips 1/2trk) -> Dat -> CD Transfer Info: CD -> EAC", "expected": "sbd" },
  { "identifier": "gd77-06-08.sbd.clugston.15421.sbeok.shnf", "source": "Master Soundboard Reel > Reel to Reel > PCM> DAT > CDR", "expected": "sbd" },
  { "identifier": "gd1977-05-08.sbd.cantor.sacks.266.shnf", "source": "WBOTB Source -- 7\" two track BBD reel encoded w/ DBX-1 noise reduction @ 7 1/2 ips > Sony PCM501ES @ 44.055 kH", "expected": "sbd" },
  { "identifier": "gd77-04-30.moore.minches.17952.sbeok.shnf", "source": "Audience Recording: Sony ECM-33Ps>Sony TC-152 from first row loge", "expected": "aud" },
  { "identifier": "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf", "source": "Soundboard", "expected": "sbd" },
  { "identifier": "gd1977-03-20.132365.aud.taback.flac16", "source": "Partial Recording by Gene Taback center-right balcony toward the front, deck and mics unlabeled and forgotten", "expected": "aud" },
  { "identifier": "gd1977-05-25.aud.lee.minches.107757.flac16", "source": "Recorded with Nakamichi CM-300s> Nakamichi 550 (except for Cassidy through Promised Land; recorded with Sony E", "expected": "aud" },
  { "identifier": "gd1977-09-03.131317.mtx.dusborne.flac16", "source": "2 Source Matrix by Dusborne; Soundboard (shnid:000276) Source: Two-track Pre-FM reel > DAT > CD-R, except for", "expected": "matrix" },
  { "identifier": "gd1977-05-07.148755.SBD.Betty.Anon.Noel.fix.t-flac2448", "source": "Source: Betty Cantor's SBD Reel Master > PCM > Beta PCM clone > cloned to wav file on computer by Sony SLHF300", "expected": "sbd" },
  { "identifier": "gd1977-06-07.141358.akg-d224.troy.miller.smith.sirmick.flac2496", "source": "Source: AKG D224s > Tandberg 10X > 10 in Master Reel @ 7.5 ips - Taped by Sandy Troy and provided by Charlie M", "expected": "aud" },
  { "identifier": "gd77-04-22.sbd.miller.27747.sbeok.flacf", "source": "Soundboard", "expected": "sbd" },
  { "identifier": "gd1977-10-06.sbd.heath.19138.shnf", "source": "S: Reel Master > Cassette > DAT > CD", "expected": "sbd" },
  { "identifier": "gd1977-06-09.141360.akg-d224.troy.miller.smith.sirmick.flac2496", "source": "Source: AKG D224s > Tandberg 10X > 10 in Master Reel @ 7.5 ips - Taped by Sandy Troy and provided by Charlie M", "expected": "aud" },
  { "identifier": "gd1977-10-16.151787.sbd.patched.clugston.flac16", "source": "Master Soundboard Reels > Cassette > DAT > CDR", "expected": "sbd" },
  { "identifier": "gd1977-10-06.fm.kbfh.77476.sbeok.flac16", "source": "FM > C(x2) > Marantz CDR-510 (rec at -0db) > CDR > EAC > Soundforge > CD-Wave > TLH (for SBE-OK, checksums, an", "expected": "fm" },
  { "identifier": "gd77-06-04.bertrando.goodbear.3417.sbeok.shnf", "source": "Audience Recording: AKG D224Es", "expected": "aud" },
  { "identifier": "gd1977-10-09.144480.sbd.troy.smith.miller.clugston.flac1648", "source": "Sandy Troy's 7\" Soundboard Reels @ 3.75 ips of unknown provenance (reels were not labeled, except to denote th", "expected": "sbd" },
  { "identifier": "gd1977-11-06.139055.SBD.Miller.Noel.t-flac16", "source": "Soundboard Master Reels > PCM > DAT; Charlie Miller", "expected": "sbd" },
  { "identifier": "gd1977-05-05.sbd.cantor.7725.shnf", "source": "master reels > dat", "expected": "sbd" },
  { "identifier": "gd1977-03-18.141388.mtx.seamons.ht114.141388.flac1644", "source": "Matrix by Hunter Seamons using Final Cut Pro (FLAC > AIFF > Final Cut > Soundtrack > AIFF CD tracking via Auda", "expected": "matrix" },
  { "identifier": "gd77-03-19.sbd.chinacat.255.sbeok.shnf", "source": "SBD>MR>DAT>DAT>Sonic Solutions>CDR", "expected": "sbd" },
  { "identifier": "gd1977-02-27.143885.SonyECM-280.bertrando.warburton.smith.sirmick.flac1644", "source": "Sony ECM-280s > Sony TC-153SD > Cassette Master > Reel > Reel - Taped by Dr. Rob Bertrando, Jimmy Warburton's", "expected": "aud" },
  { "identifier": "gd1977-03-19.139354.soneyecm.ebel.flac1644", "source": "Sony ECM 280 ->Cassette ->DAT", "expected": "aud" },
  { "identifier": "gd1977-12-29.141740.sbd.pcm.dalton.miller.clugston.flac1644", "source": "Source Info: Analog Soundboard > Cassette > PCM; Transfer Info: PCM (Sony SL-10)> Sony PCM-601ESD > Behringer", "expected": "sbd" },
  { "identifier": "gd1977-12-31.sbd.purvis.tetzeli.fix-286.35291.sbeok.shnf", "source": "SBD > Master Reel > DAT > CDR", "expected": "sbd" },
  { "identifier": "gd1977-03-19.152612.sbd.patched.miller.flac1644", "source": "SBD > Reel Master > DAT (44.1k)", "expected": "sbd" },
  { "identifier": "gd1977-05-22.152259.aud.lamarre.vernon.sirmicki.flac16", "source": "uknown audience cassette from the collection of Doug Lamarre", "expected": "aud" },
  { "identifier": "gd1977-10-30.sbd.miller.99838.sbeok.flac16", "source": "SBD -> Master Reel -> PCM -> Dat", "expected": "sbd" },
  { "identifier": "gd77-05-01.set2-sbd.unknown.4763.sbeok.shnf", "source": "Soundboard", "expected": "sbd" },
  { "identifier": "gd1977-05-26.sbd.ashley-bertha.31291.sbeok.shnf", "source": "SBD>>MR>>DAT>>SHN>>DAW(Bertha)>>CDA/SHN", "expected": "sbd" },
  { "identifier": "gd1977-10-02.142120.akg.d224e.troy-smith-miller-clugston.flac2496", "source": "Sandy Troy's Master 10\" Audience Reels (Sony TC-755); AKG D224E mics", "expected": "aud" },
  { "identifier": "gd1977-03-20.141691.sbd.miller.flac1644", "source": "SBD > Master Reel (7in 7.5ips 1/2trk dbx) > Dat (44.1k)", "expected": "sbd" },
  { "identifier": "gd1977-04-23.sbd.miller.88401.sbeok.flac16", "source": "SBD -> Master Reel -> Dat -> CD D", "expected": "sbd" },
  { "identifier": "gd1977-12-30.142698.5-1.tobin.flac1648", "source": "flac16/48kHz ; 5.1 LPCM Surround Sound (48k) - SBD (shnid = 139536) Recording Info: SBD > Master Reel > Dat >", "expected": "sbd" },
  { "identifier": "gd1977-11-04.139656.sbd.flac1644", "source": "This source is a DAE of the GDLive material listed as source ID 2595 ; Source/Lineage: SBD Master > DAT > dl g", "expected": "sbd" },
  { "identifier": "gd1977-05-22.152392.mtx.photoleon.flac16", "source": "Matrix created in Adobe Audition by Joe Noel April 26, 2021", "expected": "matrix" },
  { "identifier": "gd1977-05-04.151750.1st.set.shure.sm57.sublette.mattes.miller.clugston.flac1648", "source": "Kathy Sublette's Master Audience Cassettes; Shure SM57 mics > Sony-TC158", "expected": "aud" },
  { "identifier": "gd1977-12-31.141127.5-1.tobin.flac1648", "source": "flac16/48kHz ; 5.1 LPCM Surround Sound (48k) - SBD (shnid = 20596) Source: SBD > Master Reel > PCM > DAT > CD", "expected": "sbd" },
  { "identifier": "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf", "source": "Soundboard", "expected": "sbd" },
  { "identifier": "gd1977-10-02.sbd.cantor.gmb.86354.sbeok.flac16", "source": "Betty Board (see comments)", "expected": "sbd" },
  { "identifier": "gd77-05-07.rolfe.weiner.6021.sbeok.shnf", "source": "Audience Recording: Sony ECM 33P mic > TC-152 deck", "expected": "aud" },
  { "identifier": "gd1977-10-09.sbd.miller.88961.sbeok.flac16", "source": "SBD -> Master Reel -> Cassette -> Dat (48k)", "expected": "sbd" },
  { "identifier": "gd1977-05-28.141832.sony.ecm33p.moore.dalton.miller.clugston.flac1644", "source": "Jerry Moore's Master Audience Cassettes; Sony ECM-33P mics > Sony TC-158SD (Maxell UD-XLII with dolby B) > PCM", "expected": "aud" },
  { "identifier": "gd1977-06-09.sbd.fishman.3869.sbeok.shnf", "source": "Reel SBD>Reel>PCM>DAT>DAT>CD", "expected": "sbd" },
  { "identifier": "gd1977-05-01.151748.1st.set.shure.sm57.sublette.mattes.miller.clugston.flac1648", "source": "Kathy Sublette's Master Audience Cassettes; Shure SM57 mics > Sony-TC158", "expected": "aud" },
  { "identifier": "gd1977-10-28.mtx.tobin.101196.flac16", "source": "Matrix 2 Source Mix", "expected": "matrix" },
  { "identifier": "gd1977-02-26.170955.sony.ecm270.menke.miller.clugston.flac1648", "source": "Bob Menke's Master Audience Cassettes; Sony ECM-270 mics > Sony 153SD (Dolby B)", "expected": "aud" },
  { "identifier": "gd1977-10-16.aud.freezer.86712.sbeok.flac16", "source": "unknown", "expected": "aud" },
  { "identifier": "gd1977-05-15.aud.maizner.berger.99098.flac24", "source": "unknown mics > sony tc-153 > mac", "expected": "aud" },
  { "identifier": "gd1977-04-27.fm.moore.berger.98429.flac24", "source": "FM reel master", "expected": "fm" },
  { "identifier": "gd77-05-28.sbd.obv.31952.sbeok.shnf", "source": "Soundboard patched with Audience", "expected": "sbd" },
  { "identifier": "gd1977-12-31.141125.mtx.tobin.flac1644", "source": "Matrix 2 Source Mix - SBD (shnid = 20596) Source: SBD > Master Reel > PCM > DAT > CD original discs EAC'd and", "expected": "matrix" },
  { "identifier": "gd1977-02-17.145591.Goody-pitch-fix.flac1644", "source": "dBpoweramp (WAV) > Audition (Pitch Bender, various amounts; edits to smooth transitions) > TLH (FLAC Level 8;G", "expected": "unknown" },
  { "identifier": "gd1977-10-28.101243.dts.tobin.flac16", "source": "DTS-Audio-CD 5.1 Mix ; SBD (shn id 96159) SBD -> Master Reel -> PCM -> Dat; Transfer Info:Dat (Sony R500) -> S", "expected": "sbd" },
  { "identifier": "gd77-11-05.moore.cribbs.16757.sbeok.shnf", "source": "Audience - Sony ECM-33Ps", "expected": "aud" },
  { "identifier": "gd1977-10-02.123102.sbd.miller.flac16", "source": "SBD -> Master Reel -> PCM -> Dat", "expected": "sbd" },
  { "identifier": "gd77-10-29.maizner.vernon.8035.sbeok.shnf", "source": "Audience Recording: Sony ECM-990s", "expected": "aud" },
  { "identifier": "gd1977-05-25.sbd.shannon.fix-13399.82048.sbeok.flac16", "source": "Soundboard", "expected": "sbd" },
  { "identifier": "gd77-05-03.set1-sbd.miller.21646.sbeok.shnf", "source": "Soundboard", "expected": "sbd" },
  { "identifier": "gd1977-05-18.sbd.miller.79012.flac16", "source": "SBD -> Master Reel (7 inch reels @ 7.5ips 1/2trk) -> Dat (44.1k) D", "expected": "sbd" },
  { "identifier": "gd1977-05-08.mtx.dan.29511.flac16", "source": "See info file", "expected": "matrix" },
  { "identifier": "gd77-05-18.sbd.ladner.4618.sbeok.shnf", "source": "Soundboard", "expected": "sbd" },
  { "identifier": "gd1977-05-17.121485.mtx.dusborne.flac16", "source": "2 source matrix: Soundboard (shnid=18554): SBDMR > DAT > CD > EAC > SHN and Aud (shnid=88771): Recording by St", "expected": "matrix" },
  { "identifier": "gd1977-10-11.sbd.clemens.32796.sbeok.shnf", "source": "", "expected": "sbd" },
  { "identifier": "gd1977-12-30.sbd.cribbs.30624.sbeok.shnf", "source": "", "expected": "sbd" },
  { "identifier": "gd1977-05-19.sbd.bertha.9394.sbeok.shnf", "source": "", "expected": "sbd" },
  { "identifier": "gd1977-10-06.sbd.unk.101801.shnf", "source": "", "expected": "sbd" },
  { "identifier": "gd1977-05-15.sbd.bertha.31605.sbeok.flac24", "source": "", "expected": "sbd" },
  { "identifier": "gd1977-11-02.mtx.chappell.sb23.86233.sbeok.flac16", "source": "", "expected": "matrix" },
  { "identifier": "gd1977-02-27.gd1977-02-27.145196.sony.ecm280.bertrando.smith.miller.clugston.flac2496", "source": "", "expected": "aud" }
]
```

- [ ] **Step 2: Write the gate test**

```ts
// src/services/__tests__/recordingParser.accuracy.test.ts
import { parseFormat } from '../recordingParser';
import fixture from './fixtures/recordingFormats.json';

interface LabeledRecording { identifier: string; source: string; expected: string }

const REQUIRED_ACCURACY = 0.85;

describe('parseFormat accuracy against hand-labeled recordings', () => {
  const items = fixture as LabeledRecording[];

  it('has a meaningful sample', () => {
    expect(items.length).toBeGreaterThanOrEqual(50);
  });

  it(`classifies at least ${REQUIRED_ACCURACY * 100}% correctly`, () => {
    const misses = items.filter(
      item => parseFormat(item.source || undefined, item.identifier) !== item.expected,
    );
    const accuracy = (items.length - misses.length) / items.length;
    // Print misses so a regression is diagnosable from the test output.
    if (misses.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        'parseFormat misses:\n' +
          misses
            .map(m => `  ${m.identifier}  expected=${m.expected} got=${parseFormat(m.source || undefined, m.identifier)}`)
            .join('\n'),
      );
    }
    expect(accuracy).toBeGreaterThanOrEqual(REQUIRED_ACCURACY);
  });
});
```

- [ ] **Step 3: Run the gate**

Run: `npx jest src/services/__tests__/recordingParser.accuracy.test.ts -v`
Expected: PASS, with accuracy ≥ 0.95 given the Task 1 regexes (the console shows any misses). If it fails, the Task 1 ladder is wrong — fix the regex, never the labels.

- [ ] **Step 4: Commit**

```bash
git add src/services/__tests__/fixtures/recordingFormats.json src/services/__tests__/recordingParser.accuracy.test.ts
git commit -m "test(catalog): hand-labeled parser accuracy gate (>=85%)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Catalog builder library + `buildCatalog.ts` script

**Files:**
- Create: `scripts/lib/catalogBuilder.ts` (pure: grouping, raw dump, report)
- Create: `scripts/buildCatalog.ts` (I/O: fetch, write files)
- Create: `scripts/__tests__/fixtures/search-1977-sample.json`
- Test: `scripts/__tests__/catalogBuilder.test.ts`
- Modify: `package.json` (devDependency `tsx`; script `build:catalog`)

**Interfaces:**
- Consumes: `recordingFromDoc`, `fieldText` (Task 1); `ArchiveDoc`, `ShowsByYear`, `GratefulDeadShow`, `RecordingVersion`.
- Produces (from `scripts/lib/catalogBuilder.ts`):
  - `export function groupDocsIntoShows(docs: ArchiveDoc[]): ShowsByYear`
  - `export type RawDump = Record<string, { source?: string; lineage?: string; taper?: string; transferer?: string }>`
  - `export function buildRawDump(docs: ArchiveDoc[]): RawDump`
  - `export function buildReport(showsByYear: ShowsByYear, docCount: number): string` (markdown)

- [ ] **Step 1: Install `tsx` and add the npm script**

Run: `npm install --save-dev tsx`

In `package.json` `"scripts"`, after `"generate:videos"`, add:

```json
    "build:catalog": "tsx scripts/buildCatalog.ts",
```

- [ ] **Step 2: Create the search-response fixture**

```json
// scripts/__tests__/fixtures/search-1977-sample.json
[
  {
    "identifier": "gd1977-05-09.123480.sbd.miller.flac16",
    "title": "Grateful Dead Live at War Memorial Auditorium on 1977-05-09",
    "date": "1977-05-09T00:00:00Z",
    "venue": "War Memorial Auditorium",
    "coverage": "Buffalo, NY",
    "year": "1977",
    "downloads": 98069,
    "source": "SBD -> Master Reel (DBX-1 Encoded) -> Sony PCM501ES (44.055k)",
    "lineage": "Sony PCM501ES (Analog Out) -> DBX-1 Decoder> Sony PCM501ES (Analog In) ->Dat (48k/Analog I",
    "transferer": "Charlie Miller",
    "avg_rating": 4.89,
    "num_reviews": 9
  },
  {
    "identifier": "gd1977-04-23.mtx.seamons.97596.sbeok.flac16",
    "title": "Grateful Dead Live at Springfield Civic Center Arena on 1977-04-23",
    "date": "1977-04-23T00:00:00Z",
    "venue": "Springfield Civic Center Arena",
    "coverage": "Springfield, MA",
    "year": "1977",
    "downloads": 175853,
    "source": "Matrix mix (SBD/AUD)",
    "transferer": "Hunter Seamons",
    "avg_rating": 4.89,
    "num_reviews": 36
  },
  {
    "identifier": "gd1977-04-23.sbd.miller.88401.sbeok.flac16",
    "title": "Grateful Dead Live at Springfield Civic Center Arena on 1977-04-23",
    "date": "1977-04-23T00:00:00Z",
    "venue": "Springfield Civic Center Arena",
    "coverage": "Springfield, MA",
    "year": "1977",
    "downloads": 77417,
    "source": "SBD -> Master Reel -> Dat -> CD D",
    "lineage": "CD -> Samplitude Professional v9.11 -> FLAC",
    "transferer": "Charlie Miller",
    "avg_rating": 4.4,
    "num_reviews": 18
  },
  {
    "identifier": "gd1977-04-27.167535.fm.glassberg.smith.clugston.flac2496",
    "title": "Grateful Dead Live at Capitol Theatre on 1977-04-27",
    "date": "1977-04-27T00:00:00Z",
    "venue": "Capitol Theatre",
    "coverage": "Passaic, NJ",
    "year": "1977",
    "downloads": 1661,
    "source": "Barry Glassberg's Master FM Reel (Pioneer TX9500 tuner > TEAC A3300S Reel @ 7 1/2 ips, Max",
    "lineage": "1st Generation Reel (Technics RS-1506) > Tascam DA-3000 (DSF 1-bit/5.6 MHz) > dBpoweramp 2",
    "taper": "Barry Glassberg",
    "transferer": "Matt Smith;Scott Clugston",
    "avg_rating": 2,
    "num_reviews": 1
  },
  {
    "identifier": "gd1977-04-27.fm.moore.berger.98429.flac24",
    "title": "Grateful Dead Live at Capitol Theatre on 1977-04-27",
    "date": "1977-04-27T00:00:00Z",
    "venue": "Capitol Theatre",
    "coverage": "Passaic, NJ",
    "year": "1977",
    "downloads": 24239,
    "source": "FM reel master",
    "lineage": "wnew simulcast>10.5\" reel @ 7.5 ips, dolby b technics rs-1506>sony nr-335>hd-p2 24/48>cd w",
    "taper": "Jerry Moore",
    "transferer": "Rob Berger",
    "avg_rating": 5,
    "num_reviews": 2
  },
  {
    "identifier": "gd1977-02-26.sbd.steve.253.shnf",
    "title": "Grateful Dead Live at Swing Auditorium on 1977-02-26",
    "date": "1977-02-26T00:00:00Z",
    "venue": "Swing Auditorium",
    "coverage": "San Bernardino, CA",
    "downloads": 36721,
    "avg_rating": 4.8,
    "num_reviews": 12
  }
]
```

(The last doc deliberately has no `year` and no `source`, to exercise both fallbacks.)

- [ ] **Step 3: Write the failing tests**

```ts
// scripts/__tests__/catalogBuilder.test.ts
import { groupDocsIntoShows, buildRawDump, buildReport } from '../lib/catalogBuilder';
import sample from './fixtures/search-1977-sample.json';
import type { ArchiveDoc } from '../../src/types/archive.types';

const docs = sample as ArchiveDoc[];

describe('groupDocsIntoShows', () => {
  const byYear = groupDocsIntoShows(docs);
  const shows = byYear['1977'];

  it('groups recordings by date under their year, falling back to the date for a missing year', () => {
    expect(Object.keys(byYear)).toEqual(['1977']);
    expect(shows.map(s => s.date)).toEqual([
      '1977-02-26T00:00:00Z',
      '1977-04-23T00:00:00Z',
      '1977-04-27T00:00:00Z',
      '1977-05-09T00:00:00Z',
    ]);
  });

  it('keeps every recording (no cap), sorted by downloads desc, primary = highest downloads', () => {
    const apr23 = shows.find(s => s.date.startsWith('1977-04-23'))!;
    expect(apr23.versions.map(v => v.identifier)).toEqual([
      'gd1977-04-23.mtx.seamons.97596.sbeok.flac16',
      'gd1977-04-23.sbd.miller.88401.sbeok.flac16',
    ]);
    expect(apr23.primaryIdentifier).toBe('gd1977-04-23.mtx.seamons.97596.sbeok.flac16');
    expect(apr23.title).toBe('Grateful Dead Live at Springfield Civic Center Arena on 1977-04-23');
    expect(apr23.venue).toBe('Springfield Civic Center Arena');
    expect(apr23.location).toBe('Springfield, MA');
    expect(apr23.year).toBe('1977');
  });

  it('bakes parsed fields onto each version and never a legacy `source` string', () => {
    const apr27 = shows.find(s => s.date.startsWith('1977-04-27'))!;
    const moore = apr27.versions.find(v => v.identifier === 'gd1977-04-27.fm.moore.berger.98429.flac24')!;
    expect(moore.format).toBe('fm');
    expect(moore.lineage).toEqual(['lowgen']);
    expect(moore.avgRating).toBe(5);
    expect(moore.numReviews).toBe(2);
    expect(moore.provenance).toBe('FM reel master');
    expect(moore.taper).toBe('Jerry Moore');
    expect(moore.transferrer).toBe('Rob Berger');
    expect(moore).not.toHaveProperty('source');
  });

  it('keeps a show with many recordings intact (no slice at 5)', () => {
    const many: ArchiveDoc[] = Array.from({ length: 9 }, (_, i) => ({
      identifier: `gd1977-05-08.sbd.v${i}.shnf`,
      title: 'Grateful Dead Live at Barton Hall on 1977-05-08',
      date: '1977-05-08T00:00:00Z',
      year: '1977',
      downloads: i,
    }));
    const out = groupDocsIntoShows(many)['1977'][0];
    expect(out.versions).toHaveLength(9);
    expect(out.primaryIdentifier).toBe('gd1977-05-08.sbd.v8.shnf');
  });
});

describe('buildRawDump', () => {
  it('keeps only the raw text fields that are present, keyed by identifier', () => {
    const dump = buildRawDump(docs);
    expect(dump['gd1977-04-27.fm.moore.berger.98429.flac24']).toEqual({
      source: 'FM reel master',
      lineage: 'wnew simulcast>10.5" reel @ 7.5 ips, dolby b technics rs-1506>sony nr-335>hd-p2 24/48>cd w',
      taper: 'Jerry Moore',
      transferer: 'Rob Berger',
    });
    expect(dump['gd1977-02-26.sbd.steve.253.shnf']).toEqual({});
    expect(Object.keys(dump)).toHaveLength(6);
  });
});

describe('buildReport', () => {
  const report = buildReport(groupDocsIntoShows(docs), docs.length);

  it('summarizes totals and the recording-level format distribution', () => {
    expect(report).toContain('Recordings: 6');
    expect(report).toContain('Shows: 4');
    expect(report).toMatch(/\| sbd \| 3 \|/);
    expect(report).toMatch(/\| matrix \| 1 \|/);
    expect(report).toMatch(/\| fm \| 2 \|/);
  });

  it('reports show-level coverage per tag as a percentage of shows', () => {
    // sbd appears on 3 of 4 shows (02-26, 04-23, 05-09) = 75%
    expect(report).toMatch(/\| Soundboard \| 3 \| 75% \|/);
    // miller on 04-23 and 05-09 = 50%
    expect(report).toMatch(/\| Charlie Miller \| 2 \| 50% \|/);
  });

  it('lists identifiers whose format is unknown', () => {
    const withUnknown = [
      ...docs,
      { identifier: 'gd1977-02-17.145591.Goody-pitch-fix.flac1644', title: 'x', date: '1977-02-17T00:00:00Z', year: '1977', downloads: 1 },
    ] as ArchiveDoc[];
    const r = buildReport(groupDocsIntoShows(withUnknown), withUnknown.length);
    expect(r).toContain('## Unknown format (1)');
    expect(r).toContain('gd1977-02-17.145591.Goody-pitch-fix.flac1644');
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx jest scripts/__tests__/catalogBuilder.test.ts -v`
Expected: FAIL — `Cannot find module '../lib/catalogBuilder'`.

- [ ] **Step 5: Implement the builder library**

```ts
// scripts/lib/catalogBuilder.ts
/**
 * Pure helpers for scripts/buildCatalog.ts. No I/O here so they can be unit
 * tested with a saved search response. The CLI wrapper does the fetching and
 * file writes.
 */
import type { ArchiveDoc } from '../../src/types/archive.types';
import type { GratefulDeadShow, LineageTag, RecordingFormat, RecordingVersion, ShowsByYear } from '../../src/types/show.types';
import { fieldText, recordingFromDoc } from '../../src/services/recordingParser';

const FORMAT_LABELS: Record<RecordingFormat, string> = {
  sbd: 'Soundboard',
  aud: 'Audience',
  matrix: 'Matrix',
  fm: 'FM Broadcast',
  unknown: 'Unknown',
};

const LINEAGE_LABELS: Record<LineageTag, string> = {
  betty: 'Betty Board',
  miller: 'Charlie Miller',
  '16track': '16-Track',
  lowgen: 'Low Generation',
};

function yearOf(doc: ArchiveDoc): string {
  return String(doc.year || doc.date.slice(0, 4));
}

export function groupDocsIntoShows(docs: ArchiveDoc[]): ShowsByYear {
  const byDate = new Map<string, { doc: ArchiveDoc; versions: RecordingVersion[] }>();

  for (const doc of docs) {
    if (!doc.identifier || !doc.date) continue;
    const version = recordingFromDoc(doc);
    const existing = byDate.get(doc.date);
    if (existing) {
      existing.versions.push(version);
    } else {
      byDate.set(doc.date, { doc, versions: [version] });
    }
  }

  const showsByYear: ShowsByYear = {};
  const dates = Array.from(byDate.keys()).sort();
  for (const date of dates) {
    const { doc, versions } = byDate.get(date)!;
    versions.sort((a, b) => (b.downloads || 0) - (a.downloads || 0) || a.identifier.localeCompare(b.identifier));
    const show: GratefulDeadShow = {
      date,
      year: yearOf(doc),
      venue: fieldText(doc.venue),
      location: fieldText(doc.coverage),
      versions,
      primaryIdentifier: versions[0].identifier,
      title: versions[0].title,
    };
    const year = String(show.year);
    (showsByYear[year] ??= []).push(show);
  }
  return showsByYear;
}

export type RawDump = Record<string, { source?: string; lineage?: string; taper?: string; transferer?: string }>;

export function buildRawDump(docs: ArchiveDoc[]): RawDump {
  const dump: RawDump = {};
  for (const doc of docs) {
    const entry: RawDump[string] = {};
    const source = fieldText(doc.source);
    const lineage = fieldText(doc.lineage);
    const taper = fieldText(doc.taper);
    const transferer = fieldText(doc.transferer);
    if (source) entry.source = source;
    if (lineage) entry.lineage = lineage;
    if (taper) entry.taper = taper;
    if (transferer) entry.transferer = transferer;
    dump[doc.identifier] = entry;
  }
  return dump;
}

function pct(n: number, total: number): string {
  return total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;
}

export function buildReport(showsByYear: ShowsByYear, docCount: number): string {
  const shows = Object.values(showsByYear).flat();
  const versions = shows.flatMap(s => s.versions);

  const formatCounts: Record<RecordingFormat, number> = { sbd: 0, aud: 0, matrix: 0, fm: 0, unknown: 0 };
  const lineageCounts: Record<LineageTag, number> = { betty: 0, miller: 0, '16track': 0, lowgen: 0 };
  const unknownIds: string[] = [];
  for (const v of versions) {
    formatCounts[v.format ?? 'unknown'] += 1;
    if ((v.format ?? 'unknown') === 'unknown') unknownIds.push(v.identifier);
    for (const tag of v.lineage ?? []) lineageCounts[tag] += 1;
  }

  // Show-level coverage: a show carries a tag if ANY of its recordings does.
  const showFormatCoverage: Record<RecordingFormat, number> = { sbd: 0, aud: 0, matrix: 0, fm: 0, unknown: 0 };
  const showLineageCoverage: Record<LineageTag, number> = { betty: 0, miller: 0, '16track': 0, lowgen: 0 };
  for (const s of shows) {
    const formats = new Set(s.versions.map(v => v.format ?? 'unknown'));
    const lineages = new Set(s.versions.flatMap(v => v.lineage ?? []));
    formats.forEach(f => { showFormatCoverage[f] += 1; });
    lineages.forEach(l => { showLineageCoverage[l] += 1; });
  }

  const lines: string[] = [];
  lines.push('# Catalog build report', '');
  lines.push(`Recordings: ${versions.length} (from ${docCount} search docs)`);
  lines.push(`Shows: ${shows.length}`);
  lines.push(`Years: ${Object.keys(showsByYear).sort().join(', ')}`, '');

  lines.push('## Format distribution (recording-level)', '', '| format | count | share |', '|---|---|---|');
  (Object.keys(formatCounts) as RecordingFormat[]).forEach(f => {
    lines.push(`| ${f} | ${formatCounts[f]} | ${pct(formatCounts[f], versions.length)} |`);
  });
  lines.push('');

  lines.push('## Lineage tags (recording-level)', '', '| tag | count |', '|---|---|');
  (Object.keys(lineageCounts) as LineageTag[]).forEach(l => {
    lines.push(`| ${l} | ${lineageCounts[l]} |`);
  });
  lines.push('');

  lines.push('## Show-level coverage (union over recordings)', '', '| tag | shows | coverage |', '|---|---|---|');
  (['sbd', 'aud', 'matrix', 'fm'] as RecordingFormat[]).forEach(f => {
    lines.push(`| ${FORMAT_LABELS[f]} | ${showFormatCoverage[f]} | ${pct(showFormatCoverage[f], shows.length)} |`);
  });
  (Object.keys(lineageCounts) as LineageTag[]).forEach(l => {
    lines.push(`| ${LINEAGE_LABELS[l]} | ${showLineageCoverage[l]} | ${pct(showLineageCoverage[l], shows.length)} |`);
  });
  lines.push('');

  lines.push(`## Unknown format (${unknownIds.length})`, '');
  unknownIds.sort().forEach(id => lines.push(`- ${id}`));
  lines.push('');

  return lines.join('\n');
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest scripts/__tests__/catalogBuilder.test.ts -v`
Expected: PASS.

- [ ] **Step 7: Write the CLI script**

```ts
// scripts/buildCatalog.ts
/**
 * Regenerate the bundled show catalog from the Internet Archive.
 *
 *   npm run build:catalog
 *
 * One advancedsearch request per year (1965–1995). Writes:
 *   src/data/shows.json            — the app catalog (all recordings, parsed tags)
 *   api/_lib/shows.json            — byte-identical twin for the Vercel functions
 *   scripts/output/recordings-raw.json — raw source/lineage/taper/transferer per
 *                                       identifier; audit only, never imported
 *   scripts/output/catalog-report.md   — format/lineage distribution and coverage
 */
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ArchiveDoc, ArchiveSearchResponse } from '../src/types/archive.types';
import { buildRawDump, buildReport, groupDocsIntoShows } from './lib/catalogBuilder';

const ARCHIVE_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const START_YEAR = 1965;
const END_YEAR = 1995;
const ROWS_PER_REQUEST = 5000; // the busiest year has well under 1,000 items
const DELAY_MS = 500;
const FIELDS = [
  'identifier', 'title', 'date', 'venue', 'coverage', 'year', 'downloads',
  'source', 'taper', 'transferer', 'lineage', 'avg_rating', 'num_reviews',
];

const ROOT = path.resolve(__dirname, '..');
const APP_CATALOG = path.join(ROOT, 'src/data/shows.json');
const API_CATALOG = path.join(ROOT, 'api/_lib/shows.json');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

function buildQueryString(year: number): string {
  const params = new URLSearchParams();
  params.set('q', `collection:GratefulDead AND mediatype:etree AND year:${year}`);
  FIELDS.forEach(f => params.append('fl[]', f));
  params.set('sort', 'date asc');
  params.set('rows', String(ROWS_PER_REQUEST));
  params.set('output', 'json');
  return params.toString();
}

async function fetchYear(year: number): Promise<ArchiveDoc[]> {
  const response = await fetch(`${ARCHIVE_SEARCH_URL}?${buildQueryString(year)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for year ${year}`);
  const data = (await response.json()) as ArchiveSearchResponse;
  if (!Array.isArray(data?.response?.docs)) throw new Error(`Unexpected response for year ${year}`);
  if (data.response.numFound > ROWS_PER_REQUEST) {
    throw new Error(`Year ${year} has ${data.response.numFound} items; raise ROWS_PER_REQUEST`);
  }
  return data.response.docs;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function mb(file: string): string {
  return `${(statSync(file).size / 1024 / 1024).toFixed(2)} MB`;
}

async function main(): Promise<void> {
  console.log('Fetching Grateful Dead recordings year by year...\n');
  const allDocs: ArchiveDoc[] = [];
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    process.stdout.write(`  ${year}... `);
    const docs = await fetchYear(year);
    allDocs.push(...docs);
    console.log(`${docs.length} recordings`);
    await sleep(DELAY_MS);
  }
  console.log(`\nFetched ${allDocs.length} recordings total`);

  const showsByYear = groupDocsIntoShows(allDocs);
  const catalogJson = JSON.stringify(showsByYear, null, 2);
  writeFileSync(APP_CATALOG, catalogJson);
  writeFileSync(API_CATALOG, catalogJson);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(path.join(OUTPUT_DIR, 'recordings-raw.json'), JSON.stringify(buildRawDump(allDocs), null, 1));
  const report = buildReport(showsByYear, allDocs.length);
  writeFileSync(path.join(OUTPUT_DIR, 'catalog-report.md'), report);

  console.log(`\nWrote ${APP_CATALOG} (${mb(APP_CATALOG)})`);
  console.log(`Wrote ${API_CATALOG} (${mb(API_CATALOG)})`);
  console.log(`Wrote ${path.join(OUTPUT_DIR, 'recordings-raw.json')}`);
  console.log(`Wrote ${path.join(OUTPUT_DIR, 'catalog-report.md')}\n`);
  console.log(report);
}

main().catch(error => {
  console.error('\nCatalog build failed:', error);
  process.exit(1);
});
```

- [ ] **Step 8: Typecheck and commit**

Run: `npm run typecheck` — expected: clean (the script is inside the tsconfig's default include set; `@types/node` is present transitively, `fetch` is typed by the RN/DOM libs).

```bash
git add package.json package-lock.json scripts/lib/catalogBuilder.ts scripts/buildCatalog.ts scripts/__tests__/catalogBuilder.test.ts scripts/__tests__/fixtures/search-1977-sample.json
git commit -m "feat(catalog): TypeScript catalog build script with parsed recording tags

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Regenerate the catalog and commit the data

**Files:**
- Regenerate: `src/data/shows.json`, `api/_lib/shows.json`
- Create (generated): `scripts/output/recordings-raw.json`, `scripts/output/catalog-report.md`
- Modify: `src/__tests__/utils/showLookup.test.ts` (extend the catalog-integrity test)

**Interfaces:**
- Consumes: `npm run build:catalog` (Task 3).
- Produces: a catalog in which every `RecordingVersion` has `format` and `lineage`, and no `source`. Tasks 5–7 depend on this.

- [ ] **Step 1: Extend the catalog-integrity test first (it should fail against the old data)**

Append inside the `describe('shows.json catalog integrity')` block in `src/__tests__/utils/showLookup.test.ts`:

```ts
  it('every recording carries a parsed format and lineage array (regenerated catalog)', () => {
    const allShowsByYear = showsData as ShowsByYear;
    const versions = Object.values(allShowsByYear).flat().flatMap(show => show.versions);
    const FORMATS = new Set(['sbd', 'aud', 'matrix', 'fm', 'unknown']);

    expect(versions.length).toBeGreaterThan(8000);
    for (const v of versions) {
      expect(FORMATS.has(v.format as string)).toBe(true);
      expect(Array.isArray(v.lineage)).toBe(true);
      expect(v).not.toHaveProperty('source');
    }
  });

  it('primaryIdentifier is the highest-download recording of its show', () => {
    const allShowsByYear = showsData as ShowsByYear;
    for (const show of Object.values(allShowsByYear).flat()) {
      const max = Math.max(...show.versions.map(v => v.downloads ?? 0));
      const primary = show.versions.find(v => v.identifier === show.primaryIdentifier);
      expect(primary?.downloads ?? 0).toBe(max);
    }
  });
```

Run: `npx jest src/__tests__/utils/showLookup.test.ts -v`
Expected: the new `every recording carries a parsed format` test FAILS (old data has `source`, no `format`).

- [ ] **Step 2: Run the build**

Run: `npm run build:catalog`
Expected: 31 year lines, a total around 8,600+ recordings and ~2,000 shows, both catalog paths written, the report printed. Takes ~1 minute. If a year throws `raise ROWS_PER_REQUEST`, raise it and rerun.

- [ ] **Step 3: Sanity-check the output**

Run:
```bash
cmp src/data/shows.json api/_lib/shows.json && echo "twins identical"
ls -la src/data/shows.json scripts/output/recordings-raw.json
git diff --stat -- src/data/shows.json
sed -n 1,40p scripts/output/catalog-report.md
```
Expected: twins identical; `shows.json` roughly 3.3–3.6 MB (was 2.6 MB; the spec budget is ≈ +0.7 MB — if it is over 4 MB, check that `provenance` is being truncated and that `title` is not duplicated); `unknown` format share well under the old 38% (the 1977 probe predicts ~8%); show-level coverage table present. **Record the show-level coverage percentages in the commit message body** — they feed the PR 3 menu decision.

- [ ] **Step 4: Run the catalog tests**

Run: `npx jest src/__tests__/utils/showLookup.test.ts src/utils/__tests__/showLookup.test.ts -v`
Expected: PASS, including the duplicate-date invariant (if it fails, the Archive has two items with different `date` timestamps on one day — inspect `groupDocsIntoShows`; it groups on the full `date` string like the old script did, so a `T00:00:00Z` vs `T12:00:00Z` pair would create two shows; normalize by slicing the date to 10 chars in `groupDocsIntoShows` and keep the `T00:00:00Z` suffix on output so the rest of the app is unchanged).

- [ ] **Step 5: Commit the data**

```bash
git add src/data/shows.json api/_lib/shows.json scripts/output/recordings-raw.json scripts/output/catalog-report.md src/__tests__/utils/showLookup.test.ts
git commit -m "data(catalog): regenerate with all recordings, parsed format/lineage, ratings

Show-level coverage (from scripts/output/catalog-report.md):
<paste the coverage table here>

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Tighten the schema, add tag labels, move `archiveApi` onto the parser, drop the old source strings

**Files:**
- Modify: `src/types/show.types.ts` (`RecordingVersion`: remove `source`, make `format`/`lineage` required)
- Create: `src/constants/tags.ts`
- Modify: `src/services/archiveApi.ts:13, 208-265, 272-333, 344-351, 356-395`
- Modify: `src/constants/api.ts:49-55` (delete `SOURCE_TYPES`)
- Modify: `src/components/VersionPicker.tsx:54, 83, 88`
- Modify: `src/screens/ShowDetailScreen.tsx:590, 702`
- Delete: `scripts/fetchShows.js`, `scripts/fetchShowsByYear.js`
- Test: `src/constants/__tests__/tags.test.ts`

**Interfaces:**
- Consumes: regenerated data (Task 4), `recordingFromDoc` (Task 1).
- Produces (from `src/constants/tags.ts`):
  - `export const FORMAT_LABELS: Record<RecordingFormat, string>`
  - `export const LINEAGE_LABELS: Record<LineageTag, string>`
  - `export function formatLabel(format: RecordingFormat | undefined): string` (`undefined` → `'Unknown'`)
  - `export function lineageLabel(tag: LineageTag): string`

- [ ] **Step 1: Write the failing label test**

```ts
// src/constants/__tests__/tags.test.ts
import { FORMAT_LABELS, LINEAGE_LABELS, formatLabel, lineageLabel } from '../tags';

describe('tag labels', () => {
  it('labels every format', () => {
    expect(FORMAT_LABELS).toEqual({
      sbd: 'Soundboard',
      aud: 'Audience',
      matrix: 'Matrix',
      fm: 'FM Broadcast',
      unknown: 'Unknown',
    });
    expect(formatLabel('matrix')).toBe('Matrix');
    expect(formatLabel(undefined)).toBe('Unknown');
  });
  it('labels every lineage tag', () => {
    expect(LINEAGE_LABELS).toEqual({
      betty: 'Betty Board',
      miller: 'Charlie Miller',
      '16track': '16-Track',
      lowgen: 'Low Generation',
    });
    expect(lineageLabel('betty')).toBe('Betty Board');
  });
});
```

Run: `npx jest src/constants/__tests__/tags.test.ts -v` — expected: FAIL, module not found.

- [ ] **Step 2: Create `src/constants/tags.ts`**

```ts
// src/constants/tags.ts
/**
 * Display labels for recording format and lineage tags. PR 3 (tags & filter
 * tray) grows this file into the full tag registry; keep the ids stable —
 * they are URL-facing.
 */
import type { LineageTag, RecordingFormat } from '../types/show.types';

export const FORMAT_LABELS: Record<RecordingFormat, string> = {
  sbd: 'Soundboard',
  aud: 'Audience',
  matrix: 'Matrix',
  fm: 'FM Broadcast',
  unknown: 'Unknown',
};

export const LINEAGE_LABELS: Record<LineageTag, string> = {
  betty: 'Betty Board',
  miller: 'Charlie Miller',
  '16track': '16-Track',
  lowgen: 'Low Generation',
};

export function formatLabel(format: RecordingFormat | undefined): string {
  return FORMAT_LABELS[format ?? 'unknown'];
}

export function lineageLabel(tag: LineageTag): string {
  return LINEAGE_LABELS[tag];
}
```

Then in `scripts/lib/catalogBuilder.ts` delete the local `FORMAT_LABELS` / `LINEAGE_LABELS` constants and import them: `import { FORMAT_LABELS, LINEAGE_LABELS } from '../../src/constants/tags';`

Run: `npx jest src/constants/__tests__/tags.test.ts scripts/__tests__/catalogBuilder.test.ts -v` — expected: PASS.

- [ ] **Step 3: Tighten `RecordingVersion`**

In `src/types/show.types.ts` replace the interface with:

```ts
export interface RecordingVersion {
  identifier: string;
  title: string;
  downloads?: number; // All-time download count
  format: RecordingFormat;
  lineage: LineageTag[];
  avgRating?: number;           // Archive avg_rating, 0–5
  numReviews?: number;
  provenance?: string;          // ≤60 chars, e.g. "SBD → Master Reel → DAT"
  taper?: string; // Who recorded it
  transferrer?: string; // Who did the digital transfer (app spelling; Archive's field is `transferer`)
}
```

- [ ] **Step 4: Move `archiveApi` onto the parser and delete `extractSource` / `SOURCE_TYPES`**

In `src/services/archiveApi.ts`:

1. Remove `SOURCE_TYPES` from the `'../constants/api'` import (line 13) and add `import { recordingFromDoc } from './recordingParser';`.
2. In `getShowsByYear()` (≈ line 222) replace the hand-built `version` object with `const version = recordingFromDoc(doc);` and remove the `.slice(0, SEARCH_LIMITS.MAX_VERSIONS_PER_SHOW)` so all versions are kept (≈ line 248 — keep the sort).
3. In `getTopShows()` (≈ line 317) replace the hand-built `version` object with `const version = recordingFromDoc(doc);`.
4. Delete the `extractSource` method (≈ lines 341–351).
5. In `getShowVersions()` (≈ line 380) replace the `.map(doc => ({ ... }))` body with `.map(doc => recordingFromDoc(doc))`, and add `'source', 'lineage', 'avg_rating', 'num_reviews'` to its `fl[]` list. (This method is deleted in Task 6; keeping it compiling here keeps the commit green.)

In `src/constants/api.ts` delete the `SOURCE_TYPES` block (lines 49–55).

- [ ] **Step 5: Replace the three `.source` reads in the UI**

`src/components/VersionPicker.tsx`: add `import { formatLabel } from '../constants/tags';` and change

- line 54 `{version.source}` → `{formatLabel(version.format)}`
- line 83 `` `Recording source: ${currentVersion.source}` `` → `` `Recording source: ${formatLabel(currentVersion.format)}` ``
- line 88 `{currentVersion.source}` → `{formatLabel(currentVersion.format)}`

`src/screens/ShowDetailScreen.tsx`: add `import { formatLabel } from '../constants/tags';` and change both

- `{displayShow.allVersions?.[0]?.source || 'Unknown source'}` (lines 590 and 702) → `{formatLabel(displayShow.allVersions?.[0]?.format)}`

- [ ] **Step 6: Delete the legacy scripts**

```bash
git rm scripts/fetchShows.js scripts/fetchShowsByYear.js
```

- [ ] **Step 7: Typecheck, run the affected tests, commit**

Run: `npm run typecheck` — expected: clean. If `showsData as ShowsByYear` casts complain, the Task 4 data was not regenerated — stop and redo Task 4.
Run: `npx jest src/services src/constants src/utils scripts -v` — expected: PASS.

```bash
git add -A src/types/show.types.ts src/constants/tags.ts src/constants/__tests__/tags.test.ts src/constants/api.ts src/services/archiveApi.ts src/components/VersionPicker.tsx src/screens/ShowDetailScreen.tsx scripts/lib/catalogBuilder.ts scripts/fetchShows.js scripts/fetchShowsByYear.js
git commit -m "refactor(catalog): RecordingVersion carries format/lineage; archiveApi uses the shared parser

Removes SOURCE_TYPES, extractSource, and the two legacy fetch scripts.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Catalog accessor with read-time overrides; show screen reads recordings from the catalog

**Files:**
- Create: `src/data/recordingOverrides.ts`
- Create: `src/services/recordingCatalog.ts`
- Test: `src/services/__tests__/recordingCatalog.test.ts`
- Modify: `src/contexts/ShowsContext.tsx` (remove `getShowVersions`)
- Modify: `src/screens/ShowDetailScreen.tsx:69, 242-296`
- Modify: `src/services/archiveApi.ts` (delete `getShowVersions`)
- Modify: `src/constants/api.ts:25-26` (delete `MAX_VERSIONS_PER_SHOW`, `MAX_SHOW_VERSIONS`)
- Delete: `src/services/__tests__/archiveApi.getShowVersions.test.ts`

**Interfaces:**
- Consumes: `findShowByDate(date)` from `src/utils/showLookup.ts`; `RecordingVersion`.
- Produces:
  - from `src/data/recordingOverrides.ts`:
    - `export const tagFixes: Record<string, Partial<Pick<RecordingVersion, 'format' | 'lineage'>>>` (keyed by identifier)
    - `export const editorialPins: Record<string, string>` (date `YYYY-MM-DD` → identifier; **consumed by PR 2's resolver, unused in this PR**)
  - from `src/services/recordingCatalog.ts`:
    - `export function applyTagFixes(version: RecordingVersion): RecordingVersion`
    - `export function getCatalogVersions(date: string): RecordingVersion[]` — all recordings for that show (accepts `YYYY-MM-DD` or a full ISO timestamp), catalog order (downloads desc), tag fixes applied, memoized per date; `[]` when the date is not in the catalog
    - `export function resetCatalogCacheForTests(): void`

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/recordingCatalog.test.ts
jest.mock('../../data/recordingOverrides', () => ({
  tagFixes: {
    'gd1977-05-08.sbd.hicks.4982.sbeok.shnf': { format: 'matrix', lineage: ['betty'] },
  },
  editorialPins: {},
}));

import { applyTagFixes, getCatalogVersions, resetCatalogCacheForTests } from '../recordingCatalog';
import { findShowByDate } from '../../utils/showLookup';
import type { RecordingVersion } from '../../types/show.types';

beforeEach(() => resetCatalogCacheForTests());

describe('applyTagFixes', () => {
  it('overlays only the fixed fields and leaves other versions untouched', () => {
    const fixed: RecordingVersion = { identifier: 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf', title: 't', format: 'sbd', lineage: [], downloads: 5 };
    const other: RecordingVersion = { identifier: 'gd1977-05-08.other', title: 't', format: 'aud', lineage: ['lowgen'] };
    expect(applyTagFixes(fixed)).toEqual({ ...fixed, format: 'matrix', lineage: ['betty'] });
    expect(applyTagFixes(other)).toBe(other);
  });
});

describe('getCatalogVersions', () => {
  it('returns every recording for a show in catalog order, with fixes applied', () => {
    const show = findShowByDate('1977-05-08')!;
    const versions = getCatalogVersions('1977-05-08');
    expect(versions.map(v => v.identifier)).toEqual(show.versions.map(v => v.identifier));
    expect(versions.length).toBeGreaterThan(5); // the old 5-recording cap is gone
    const hicks = versions.find(v => v.identifier === 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf');
    if (hicks) expect(hicks.format).toBe('matrix'); // only asserts when that item exists in the catalog
  });

  it('accepts a full ISO timestamp', () => {
    expect(getCatalogVersions('1977-05-08T00:00:00Z')).toEqual(getCatalogVersions('1977-05-08'));
  });

  it('memoizes per date', () => {
    expect(getCatalogVersions('1977-05-08')).toBe(getCatalogVersions('1977-05-08'));
  });

  it('returns [] for a date with no show', () => {
    expect(getCatalogVersions('2050-01-01')).toEqual([]);
  });
});
```

Run: `npx jest src/services/__tests__/recordingCatalog.test.ts -v` — expected: FAIL, modules not found.

- [ ] **Step 2: Create the overrides file**

```ts
// src/data/recordingOverrides.ts
/**
 * Hand-edited corrections layered over the generated catalog at read time,
 * so a fix never requires regenerating shows.json.
 *
 * tagFixes — per-identifier corrections to the parsed format / lineage.
 *   Check scripts/output/recordings-raw.json for the raw strings when
 *   deciding a fix. Keep a short reason comment on each entry.
 *
 * editorialPins — per-show (YYYY-MM-DD) curated default recording. Read by
 *   the recording resolver (PR 2). Unused until then.
 */
import type { RecordingVersion } from '../types/show.types';

export const tagFixes: Record<string, Partial<Pick<RecordingVersion, 'format' | 'lineage'>>> = {};

export const editorialPins: Record<string, string> = {};
```

- [ ] **Step 3: Create the accessor**

```ts
// src/services/recordingCatalog.ts
/**
 * The one way app code reads a show's recordings. Keyed by DATE rather than
 * by a show object on purpose: favorites persist whole show objects (with
 * whatever `versions` shape they had when saved), so looking the catalog up
 * fresh by date means old saved shows self-heal instead of carrying stale
 * recording data forever.
 */
import { findShowByDate } from '../utils/showLookup';
import { tagFixes } from '../data/recordingOverrides';
import type { RecordingVersion } from '../types/show.types';

export function applyTagFixes(version: RecordingVersion): RecordingVersion {
  const fix = tagFixes[version.identifier];
  return fix ? { ...version, ...fix } : version;
}

const cache = new Map<string, RecordingVersion[]>();

function normalizeDate(date: string): string {
  return date.slice(0, 10);
}

export function getCatalogVersions(date: string): RecordingVersion[] {
  const key = normalizeDate(date);
  const cached = cache.get(key);
  if (cached) return cached;
  const show = findShowByDate(key);
  const versions = show ? show.versions.map(applyTagFixes) : [];
  cache.set(key, versions);
  return versions;
}

export function resetCatalogCacheForTests(): void {
  cache.clear();
}
```

Run: `npx jest src/services/__tests__/recordingCatalog.test.ts -v` — expected: PASS.

- [ ] **Step 4: Switch `ShowDetailScreen` to the catalog**

In `src/screens/ShowDetailScreen.tsx`:

1. Line 69: `const { getShowDetail, getShowVersions, showsByYear } = useShows();` → `const { getShowDetail, showsByYear } = useShows();`
2. Add `import { getCatalogVersions } from '../services/recordingCatalog';`
3. Replace the body of `loadShowDetail` between `try {` and `setSelectedVersion(identifier);` (≈ lines 250–268) with:

```ts
      const detail = await getShowDetail(identifier);

      // A newer loadShowDetail call started (and thus advanced the token)
      // while this one was in flight — this response is stale, discard it.
      if (loadRequestTokenRef.current !== requestToken) return;

      // Recordings come from the bundled catalog (all of them, with parsed
      // tags) — no second network request. A recording that isn't in the
      // catalog (brand-new upload, or a date we don't carry) just gets no
      // picker, same as a failed versions fetch did before.
      const versions = getCatalogVersions(previewDate ?? detail.date ?? '');
      setShow(versions.length > 0 ? { ...detail, allVersions: versions } : detail);
      setSelectedVersion(identifier);
```

4. Remove the now-unused `RecordingVersion` import from line 26 if nothing else in the file uses it (check with the typecheck; `handleToggleFavorite` at ≈ line 402 still reads `show.allVersions`, which is fine).

- [ ] **Step 5: Remove `getShowVersions` everywhere**

- `src/contexts/ShowsContext.tsx`: delete the `getShowVersions` member from `ShowsContextType`, the `getShowVersions` callback, and its entries in the `contextValue` object and dependency array. Drop `RecordingVersion` from the import.
- `src/services/archiveApi.ts`: delete the `getShowVersions` method. Remove `logger` import only if it is now unused (it is used elsewhere in the file — leave it).
- `src/constants/api.ts`: delete `MAX_VERSIONS_PER_SHOW` and `MAX_SHOW_VERSIONS`.
- `git rm src/services/__tests__/archiveApi.getShowVersions.test.ts`

- [ ] **Step 6: Typecheck, test, commit**

Run: `npm run typecheck` — expected: clean. Then `grep -rn "getShowVersions\|MAX_VERSIONS_PER_SHOW\|MAX_SHOW_VERSIONS" src` — expected: no output.
Run: `npx jest src/services src/contexts src/screens src/utils -v` — expected: PASS.

```bash
git add -A src/data/recordingOverrides.ts src/services/recordingCatalog.ts src/services/__tests__/recordingCatalog.test.ts src/contexts/ShowsContext.tsx src/screens/ShowDetailScreen.tsx src/services/archiveApi.ts src/constants/api.ts src/services/__tests__/archiveApi.getShowVersions.test.ts
git commit -m "feat(catalog): read show recordings from the bundled catalog with read-time tag fixes

Drops the per-show runtime versions search and its 5-recording cap.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: `VersionPicker` rows show tags, rating, and provenance

**Files:**
- Modify: `src/components/VersionPicker.tsx`
- Test: `src/__tests__/components/VersionPicker.test.tsx`

**Interfaces:**
- Consumes: `formatLabel`, `lineageLabel` (Task 5); `RecordingVersion` fields `format`, `lineage`, `avgRating`, `numReviews`, `provenance`.
- Produces: no new exports. Props are unchanged: `{ versions, selectedVersion, onVersionChange, webGlassStyle? }`.

Row layout (top to bottom):

```
Soundboard  [Betty Board] [Low Generation]        ✓
★ 4.9 (36) · 98.1K views
SBD → Master Reel → DAT
Taper: Betty Cantor · Transfer: Charlie Miller
```

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/VersionPicker.test.tsx
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VersionPicker } from '../../components/VersionPicker';
import type { RecordingVersion } from '../../types/show.types';

const VERSIONS: RecordingVersion[] = [
  {
    identifier: 'gd1977-05-08.sbd.cantor.sacks.266.shnf',
    title: 'a',
    downloads: 98069,
    format: 'sbd',
    lineage: ['betty', 'lowgen'],
    avgRating: 4.89,
    numReviews: 36,
    provenance: 'SBD → Master Reel → DAT',
    taper: 'Betty Cantor',
    transferrer: 'Darrin Sacks',
  },
  {
    identifier: 'gd1977-05-08.mtx.dan.29511.flac16',
    title: 'b',
    downloads: 1200,
    format: 'matrix',
    lineage: [],
  },
];

const allText = (tree: TestRenderer.ReactTestRenderer): string[] =>
  tree.root.findAllByType(Text).map(t => React.Children.toArray(t.props.children).join(''));

const render = async (props: Partial<React.ComponentProps<typeof VersionPicker>> = {}) => {
  const onVersionChange = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    // VersionPicker reads useSafeAreaInsets; nothing in the Jest setup mounts
    // a SafeAreaProvider, so supply one with fixed metrics.
    tree = TestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <VersionPicker
          versions={VERSIONS}
          selectedVersion={VERSIONS[0].identifier}
          onVersionChange={onVersionChange}
          {...props}
        />
      </SafeAreaProvider>,
    );
  });
  return { tree, onVersionChange };
};

// findByProps / findAllByProps match non-deep (a TouchableOpacity is matched
// once, not again via the host View it renders) — the same reason the
// RatingTray tests use them. Avoid root.findAll(predicate) with testIDs.
const openPicker = async (tree: TestRenderer.ReactTestRenderer) => {
  const trigger = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  await act(async () => { trigger.props.onPress(); });
};

it('shows the selected recording\'s format label in the pill', async () => {
  const { tree } = await render();
  expect(allText(tree)).toContain('Soundboard');
  const trigger = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  expect(trigger.props.accessibilityLabel).toBe('Recording source: Soundboard');
});

it('lists every recording with format, lineage chips, rating, views, and provenance', async () => {
  const { tree } = await render();
  await openPicker(tree);
  const text = allText(tree);
  expect(text).toContain('Betty Board');
  expect(text).toContain('Low Generation');
  expect(text).toContain('Matrix');
  expect(text.some(t => t.includes('4.9') && t.includes('36'))).toBe(true);
  expect(text).toContain('SBD → Master Reel → DAT');
  expect(text.some(t => t.includes('Taper: Betty Cantor'))).toBe(true);
});

it('omits the rating when a recording has none', async () => {
  const { tree } = await render({ selectedVersion: VERSIONS[1].identifier });
  await openPicker(tree);
  const rows = tree.root.findAllByProps({ testID: 'version-row-gd1977-05-08.mtx.dan.29511.flac16' });
  expect(rows).toHaveLength(1);
  const rowText = rows[0].findAllByType(Text).map(t => React.Children.toArray(t.props.children).join(''));
  expect(rowText.some(t => t.includes('★'))).toBe(false);
  expect(rowText).toContain('Matrix');
});

it('calls onVersionChange with the tapped identifier', async () => {
  const { tree, onVersionChange } = await render();
  await openPicker(tree);
  const row = tree.root.findByProps({ testID: 'version-row-gd1977-05-08.mtx.dan.29511.flac16' });
  await act(async () => { row.props.onPress(); });
  expect(onVersionChange).toHaveBeenCalledWith('gd1977-05-08.mtx.dan.29511.flac16');
});
```

Run: `npx jest src/__tests__/components/VersionPicker.test.tsx -v` — expected: FAIL (no `testID`s, no chips, no rating line).

- [ ] **Step 2: Update the row renderer**

In `src/components/VersionPicker.tsx`:

1. Add imports: `import { formatLabel, lineageLabel } from '../constants/tags';` (Task 5 already added `formatLabel`; extend it).
2. Add a helper above the component:

```tsx
const formatRating = (version: RecordingVersion): string | null => {
  if (typeof version.avgRating !== 'number') return null;
  const reviews = version.numReviews ? ` (${version.numReviews})` : '';
  return `★ ${version.avgRating.toFixed(1)}${reviews}`;
};
```

3. Replace the body of `renderVersionOptions` so each row is:

```tsx
    versions.map((version) => {
      const isSelected = version.identifier === selectedVersion;
      const attribution = formatAttribution(version);
      const rating = formatRating(version);
      return (
        <TouchableOpacity
          key={version.identifier}
          testID={`version-row-${version.identifier}`}
          style={styles.option}
          onPress={() => handleSelect(version.identifier)}
          activeOpacity={0.7}
        >
          <View style={styles.optionInfo}>
            <View style={styles.tagRow}>
              <Text style={[styles.optionSource, isSelected && styles.selectedText]}>
                {formatLabel(version.format)}
              </Text>
              {version.lineage.map(tag => (
                <View key={tag} style={styles.lineageChip}>
                  <Text style={styles.lineageChipText}>{lineageLabel(tag)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.optionDownloads}>
              {rating ? `${rating} · ` : ''}{formatDownloads(version.downloads)} views
            </Text>
            {version.provenance && (
              <Text style={styles.optionProvenance} numberOfLines={1}>
                {version.provenance}
              </Text>
            )}
            {attribution && (
              <Text style={styles.optionAttribution} numberOfLines={2}>
                {attribution}
              </Text>
            )}
          </View>
          {isSelected && (
            <Ionicons name="checkmark" size={24} color={COLORS.accent} />
          )}
        </TouchableOpacity>
      );
    });
```

4. Add styles to the `StyleSheet.create` block:

```ts
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  lineageChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lineageChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  optionProvenance: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
```

and remove `marginBottom: SPACING.xs` from `optionSource` (the row now owns the spacing). (`SPACING.sm` = 8 and `RADIUS.sm` = 6 already exist in `src/constants/theme.ts`.)

- [ ] **Step 3: Run the test**

Run: `npx jest src/__tests__/components/VersionPicker.test.tsx -v` — expected: PASS. If the "lists every recording" test cannot find the rows, React Native's `Modal` mock only renders children when `visible` is true — confirm `openPicker` fired (`isOpen` state) before debugging the row markup.

- [ ] **Step 4: Run the app once and eyeball it**

Run: `npm run web` (or the `run` skill) and open a show with many recordings, e.g. `/show/1977-05-08`. Expected: the picker lists more than five recordings, each with a format label, lineage chips where present, a ★ rating line, and a provenance line. Check a matrix-tagged row reads "Matrix", not "Soundboard".

- [ ] **Step 5: Typecheck, commit**

Run: `npm run typecheck` — expected: clean.

```bash
git add src/components/VersionPicker.tsx src/__tests__/components/VersionPicker.test.tsx
git commit -m "feat(catalog): recording picker shows format, lineage, rating, and provenance

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Full verification, spec note, branch hand-off

**Files:**
- Modify: `docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md` (one line — accessor signature)

- [ ] **Step 1: Align the spec with what shipped**

In the spec's Part 1 "Overrides" section, change `getCatalogVersions(show)` to `getCatalogVersions(date)` and append: *"Keyed by date so persisted favorites (which embed a stale `versions` array) self-heal."*

- [ ] **Step 2: Full suite + both typechecks**

Run: `npx jest 2>&1 | tail -30` — expected: all suites pass, coverage threshold met.
Run: `npm run typecheck` — expected: clean.
Run: `npm run typecheck:web 2>&1 | grep -v "expo-file-system" | grep "error TS" | wc -l` — expected: no new errors beyond the pre-existing set (compare with `git stash`-free baseline by running the same command on `main` if in doubt).

- [ ] **Step 3: Confirm the app never imports the audit files**

Run: `grep -rn "scripts/output" src api App.tsx` — expected: no output.

- [ ] **Step 4: Commit and hand off**

```bash
git add docs/superpowers/specs/2026-08-20-tagging-source-selection-design.md
git commit -m "docs(tagging): catalog accessor is keyed by date

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Then use the `superpowers:finishing-a-development-branch` skill to open the PR (`feat/catalog-parser` → `main`). The PR body should include the show-level coverage table from `scripts/output/catalog-report.md` and the `shows.json` size delta.

After merge: native apps pick this up via `eas update` (JS + JSON only; no native changes).
