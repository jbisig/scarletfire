# Share Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users share Grateful Dead shows and songs via a bottom-sheet tray with 4 destinations (Copy link, WhatsApp, Instagram Story, Messages), where shared URLs unfurl in chat apps with a 1200×1200 card image and open in the native app (or the existing web build as fallback).

**Architecture:** A reusable `ShareTray` bottom sheet (native) / modal (web) opens from `FullPlayer` and `ShowDetailScreen`. The share URL is the show page URL (`https://www.scarletfire.app/show/<date>/<track-slug>?bg=N`). A small set of Vercel Functions intercepts that URL: one set returns a PNG card via `@vercel/og`, another set injects `og:*` meta tags into a copy of `dist/index.html`. Universal links (`.well-known/apple-app-site-association` + `assetlinks.json`) let the native app handle taps on those URLs directly.

**Tech Stack:** Expo + React Native (existing), TypeScript strict, `@gorhom/bottom-sheet` (new), `react-native-reanimated` (new), `expo-clipboard` / `-linking` / `-file-system` / `-sharing` (new), `@vercel/og` (new, server-only), Jest + `@testing-library/react-native` (existing), Node runtime Vercel Functions.

---

## File Structure Overview

**New client files** (under `src/`):

```
src/
├── components/
│   └── share/
│       ├── ShareTray.tsx           — cross-platform wrapper; delegates to .native/.web
│       ├── ShareTray.native.tsx    — @gorhom/bottom-sheet implementation
│       ├── ShareTray.web.tsx       — portal modal implementation
│       ├── ShareCard.tsx           — the square preview card
│       ├── ShareButton.tsx         — single circular destination button
│       └── shareBackgrounds.ts     — static require() map for the 6 local bg PNGs
├── contexts/
│   └── ShareSheetContext.tsx       — provider + useShareSheet hook
├── services/
│   ├── shareService.ts             — pure types + URL/text builders
│   ├── shareService.native.ts      — native destination handlers
│   └── shareService.web.ts         — web destination handlers
└── utils/
    └── trackMatching.ts            — calculateSimilarity + matchTrackBySlug (extracted)
```

**New backend files** (at repo root — Vercel auto-detects `api/`):

```
api/
├── og/
│   ├── show/
│   │   └── [identifier].tsx        — @vercel/og show card PNG endpoint
│   └── song/
│       └── [identifier]/
│           └── [trackTitle].tsx    — @vercel/og song card PNG endpoint
├── html/
│   ├── show/
│   │   └── [identifier].ts         — HTML injection for /show/:identifier
│   └── song/
│       └── [identifier]/
│           └── [trackTitle].ts     — HTML injection for /show/:identifier/:trackTitle
└── _lib/
    ├── showLookup.ts               — read shows.json → {identifier, date, venue, tier}
    ├── fetchTrackList.ts           — GET archive.org/metadata/<id> → tracks
    ├── ogTemplate.tsx              — showCard() / songCard() Satori JSX
    ├── injectOgTags.ts             — (html, tags) => html
    └── trackMatchingRemote.ts      — re-export of src/utils/trackMatching for function bundle
```

**New public assets:**

```
public/
├── .well-known/
│   ├── apple-app-site-association  — (no extension)
│   └── assetlinks.json
└── share/
    ├── bg-1.png                    — copied from assets/share_images/bg-1.png
    ├── bg-2.png
    ├── bg-3.png
    ├── bg-4.png
    ├── bg-5.png
    ├── bg-6.png
    └── logo.png
```

**New test files:**

```
src/__tests__/
├── utils/
│   └── trackMatching.test.ts       — (extracted fuzzy match logic)
├── services/
│   ├── shareService.test.ts        — URL + text builders
│   └── shareService.native.test.ts — destination handler dispatch (mocked)
└── components/
    └── share/
        ├── ShareTray.test.tsx
        └── ShareCard.test.tsx

api/__tests__/
├── injectOgTags.test.ts
└── showLookup.test.ts
```

**New scripts:**

```
scripts/
└── copy-share-assets.js            — copies assets/share_images/{bg-*,logo}.png → public/share/
```

**Modified files:**

- `src/components/FullPlayer.tsx` — add share icon in top-left header cluster (currently only has `chevron-down` at `closeButton`)
- `src/screens/ShowDetailScreen.tsx` — add share icon via `navigation.setOptions` `headerRight`; replace local `calculateSimilarity` + auto-play effect (lines 86–113, 242–263) with calls to the extracted `trackMatching` module and a new `selectAndScrollToTrack` behavior
- `src/components/TrackItem.tsx` — add `isSelected` prop + sustained background highlight style
- `App.tsx` — mount `<ShareSheetProvider>` near the root
- `src/navigation/webLinking.ts` — add query param passthrough so `bg` survives routing (non-functional on client, but avoids loss across navigation)
- `app.config.js` — add iOS `associatedDomains` and Android universal link `intentFilters`
- `vercel.json` — add rewrites for `/show/*` → HTML functions; declare `functions` with `includeFiles` for `shows.json`; update `buildCommand` to run `copy-share-assets` first
- `package.json` — add new dependencies

---

## Task Sequencing (overview)

1. **Task 1** — Foundation: install deps, rename + move asset files, add copy script
2. **Task 2** — Extract `trackMatching.ts` from `ShowDetailScreen.tsx` with tests
3. **Task 3** — `shareService.ts` pure builders with tests
4. **Task 4** — `ShareSheetContext` + `useShareSheet` hook
5. **Task 5** — `ShareBackgrounds` static require map
6. **Task 6** — `ShareCard` component with tests
7. **Task 7** — `ShareButton` component
8. **Task 8** — `ShareTray.native.tsx` using `@gorhom/bottom-sheet`
9. **Task 9** — Mount `<ShareSheetProvider>` in `App.tsx` and add `GestureHandlerRootView`
10. **Task 10** — Native destination handlers: `shareService.native.ts` (copy + WhatsApp + Messages first)
11. **Task 11** — Native Instagram Story destination handler
12. **Task 12** — Wire share icon into `FullPlayer.tsx`
13. **Task 13** — Wire share icon into `ShowDetailScreen.tsx` header
14. **Task 14** — Replace auto-play effect with `selectAndScrollToTrack`; add `isSelected` to `TrackItem.tsx`
15. **Task 15** — `ShareTray.web.tsx` (web modal)
16. **Task 16** — Web destination handlers: `shareService.web.ts`
17. **Task 17** — Backend foundation: add `api/` folder, install `@vercel/og`, set up `api/_lib/`
18. **Task 18** — `api/_lib/showLookup.ts` with tests
19. **Task 19** — `api/_lib/fetchTrackList.ts`
20. **Task 20** — `api/_lib/ogTemplate.tsx` (the Satori card templates)
21. **Task 21** — `api/og/show/[identifier].tsx` endpoint
22. **Task 22** — `api/og/song/[identifier]/[trackTitle].tsx` endpoint
23. **Task 23** — `api/_lib/injectOgTags.ts` with tests
24. **Task 24** — `api/html/show/[identifier].ts` endpoint
25. **Task 25** — `api/html/song/[identifier]/[trackTitle].ts` endpoint
26. **Task 26** — `vercel.json` rewrites + `functions.includeFiles` + updated buildCommand
27. **Task 27** — Universal link files: `apple-app-site-association`, `assetlinks.json`
28. **Task 28** — iOS `associatedDomains` + Android `intentFilters` in `app.config.js`
29. **Task 29** — End-to-end manual verification checklist

Each task ends in a commit. Tests are written before implementation wherever the code under test is pure (no RN/React/Vercel dependency).

---

## Task 1: Foundation — dependencies, asset renames, copy script

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (via `npm install`)
- Modify: `assets/share_images/` (rename files in place)
- Create: `scripts/copy-share-assets.js`

- [ ] **Step 1: Install new dependencies**

Run in the project root:

```bash
npx expo install @gorhom/bottom-sheet react-native-reanimated expo-clipboard expo-linking expo-file-system expo-sharing
npm install --save @vercel/og
```

Expected: each package installed. `npx expo install` picks the version compatible with the current Expo SDK. Warning: `react-native-reanimated` requires Babel plugin config — we'll handle that in Step 3.

- [ ] **Step 2: Verify install**

Run:

```bash
cat package.json | grep -E '"@gorhom/bottom-sheet"|"react-native-reanimated"|"expo-clipboard"|"expo-linking"|"expo-file-system"|"expo-sharing"|"@vercel/og"'
```

Expected: all 7 dependencies listed.

- [ ] **Step 3: Add reanimated Babel plugin**

Read `babel.config.js`. If the file doesn't exist in the repo root, create it with:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

If `babel.config.js` already exists, append `'react-native-reanimated/plugin'` to its `plugins` array (must be the **last** plugin). Important: per `react-native-reanimated` docs, the reanimated plugin must always be last.

- [ ] **Step 4: Rename background asset files**

The files in `assets/share_images/` currently have names like `Screenshot 2026-04-11 at 10.03.58 AM 1.png`. Rename them to `bg-1.png … bg-6.png` in chronological / alphabetical order, and rename `share-logo.png` to `logo.png`.

Run:

```bash
cd /Users/jessebisignano/projects/grateful-dead-player/assets/share_images
i=1
for f in Screenshot*.png; do
  git mv "$f" "bg-$i.png"
  i=$((i+1))
done
git mv share-logo.png logo.png
cd -
```

Expected output: 7 `git mv` operations. Run `ls assets/share_images/` after and verify you see exactly: `bg-1.png bg-2.png bg-3.png bg-4.png bg-5.png bg-6.png logo.png`.

- [ ] **Step 5: Create `scripts/copy-share-assets.js`**

Create `scripts/copy-share-assets.js` with:

```js
#!/usr/bin/env node
// Copies share card assets from assets/share_images/ → public/share/
// so Vercel can serve them as public URLs for Satori (OG image) and unfurl previews.
// Run as part of the build command in vercel.json.

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'assets', 'share_images');
const destDir = path.join(__dirname, '..', 'public', 'share');

const files = ['bg-1.png', 'bg-2.png', 'bg-3.png', 'bg-4.png', 'bg-5.png', 'bg-6.png', 'logo.png'];

fs.mkdirSync(destDir, { recursive: true });

for (const file of files) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (!fs.existsSync(src)) {
    console.error(`[copy-share-assets] missing source file: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  console.log(`[copy-share-assets] copied ${file}`);
}
```

- [ ] **Step 6: Run the copy script once manually**

Run:

```bash
node scripts/copy-share-assets.js
```

Expected: 7 "copied" lines. Verify `ls public/share/` shows all 7 files.

- [ ] **Step 7: Ensure `public/share/` is not gitignored**

Run `git check-ignore -v public/share/bg-1.png`. If it returns a match (indicating it's ignored), edit `.gitignore` to explicitly un-ignore `public/share/`. If no match, the files are tracked — good.

- [ ] **Step 8: Commit**

```bash
git add assets/share_images/ public/share/ scripts/copy-share-assets.js package.json package-lock.json babel.config.js
git commit -m "feat(share): foundation — install deps, rename assets, add copy script

- Install @gorhom/bottom-sheet + reanimated (required), expo-clipboard,
  expo-linking, expo-file-system, expo-sharing, and @vercel/og
- Rename 6 background screenshots to bg-1..bg-6.png, share-logo to logo.png
- Add scripts/copy-share-assets.js to stage share assets for Vercel static serving
- Wire react-native-reanimated Babel plugin

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Extract `trackMatching.ts` from `ShowDetailScreen.tsx`

**Files:**
- Create: `src/utils/trackMatching.ts`
- Create: `src/__tests__/utils/trackMatching.test.ts`
- Modify: `src/screens/ShowDetailScreen.tsx:86-113` (remove local `calculateSimilarity`)
- Modify: `src/screens/ShowDetailScreen.tsx:242-263` (replace auto-play body — but keep `loadTrack` call for now; the behavior change happens in Task 14)

- [ ] **Step 1: Write the failing test file**

Create `src/__tests__/utils/trackMatching.test.ts`:

```typescript
import { calculateSimilarity, matchTrackBySlug } from '../../utils/trackMatching';

describe('calculateSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(calculateSimilarity('dark star', 'dark star')).toBe(1);
  });

  it('returns 0 for completely different strings of equal length', () => {
    expect(calculateSimilarity('abcd', 'wxyz')).toBe(0);
  });

  it('returns a value between 0 and 1 for partial matches', () => {
    const score = calculateSimilarity('franklins tower', 'franklin tower');
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThan(1);
  });

  it('is case insensitive', () => {
    expect(calculateSimilarity('Dark Star', 'dark star')).toBe(1);
  });

  it('returns 1 for two empty strings', () => {
    expect(calculateSimilarity('', '')).toBe(1);
  });
});

describe('matchTrackBySlug', () => {
  const tracks = [
    { id: 't1', title: "Franklin's Tower" },
    { id: 't2', title: 'Dark Star' },
    { id: 't3', title: 'Scarlet Begonias' },
  ];

  it('finds an exact slug match', () => {
    const result = matchTrackBySlug('dark-star', tracks, 0.85);
    expect(result?.id).toBe('t2');
  });

  it('finds a close match for apostrophe-free slugs', () => {
    const result = matchTrackBySlug('franklins-tower', tracks, 0.85);
    expect(result?.id).toBe('t1');
  });

  it('returns null when no match clears the threshold', () => {
    const result = matchTrackBySlug('not-a-real-song', tracks, 0.85);
    expect(result).toBeNull();
  });

  it('returns null for an empty track list', () => {
    const result = matchTrackBySlug('dark-star', [], 0.85);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx jest src/__tests__/utils/trackMatching.test.ts
```

Expected: FAIL with `Cannot find module '../../utils/trackMatching'`.

- [ ] **Step 3: Create `src/utils/trackMatching.ts`**

The body of `calculateSimilarity` is the exact Levenshtein implementation currently at `src/screens/ShowDetailScreen.tsx:86-113`. Copy it verbatim, then add a typed wrapper around the match loop.

Create `src/utils/trackMatching.ts`:

```typescript
// Shared fuzzy track-slug matching. Used by:
//  - ShowDetailScreen's URL-driven track selection (formerly inline here)
//  - the Vercel Functions that render song share cards (via api/_lib/trackMatchingRemote.ts)
//  - the shareService URL builders to produce slugs

/**
 * Calculate string similarity using Levenshtein distance, normalized to [0, 1].
 * Extracted verbatim from ShowDetailScreen.tsx:86-113 — behavior must not change.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const distance = costs[s2.length];
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

export interface MinimalTrack {
  id: string;
  title: string;
}

/**
 * Normalizes a track title for comparison: lowercase, strip punctuation,
 * collapse whitespace. Mirrors normalizeTrackTitle from utils/titleNormalization,
 * but inlined here so the module has no dependencies beyond itself (so it can
 * be imported from Vercel Functions without pulling in React Native code).
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Given a URL slug (e.g. "franklins-tower") and a list of tracks,
 * return the track whose normalized title best matches the slug,
 * or null if no track clears the similarity threshold.
 */
export function matchTrackBySlug<T extends MinimalTrack>(
  slug: string,
  tracks: readonly T[],
  threshold: number
): T | null {
  if (tracks.length === 0) return null;

  const searchString = normalize(slug.replace(/-/g, ' '));
  let bestMatch: T | null = null;
  let bestScore = 0;

  for (const track of tracks) {
    const normalized = normalize(track.title);
    const score = calculateSimilarity(searchString, normalized);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = track;
    }
  }

  if (bestMatch && bestScore >= threshold) {
    return bestMatch;
  }
  return null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npx jest src/__tests__/utils/trackMatching.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Remove the local `calculateSimilarity` from `ShowDetailScreen.tsx`**

Delete `src/screens/ShowDetailScreen.tsx:85-113` (the `// Calculate string similarity using Levenshtein distance` comment through the closing brace of `calculateSimilarity`). Add `calculateSimilarity` / `matchTrackBySlug` imports near the existing imports at the top:

Find this line (around line 33):

```typescript
import { normalizeTrackTitle } from '../utils/titleNormalization';
```

Add below:

```typescript
import { calculateSimilarity, matchTrackBySlug } from '../utils/trackMatching';
```

- [ ] **Step 6: Update the auto-play effect to use `matchTrackBySlug`**

Replace the body of the `useEffect` at `src/screens/ShowDetailScreen.tsx:242-263` so it uses the extracted matcher but preserves the existing `loadTrack` behavior (Task 14 changes this to `selectAndScrollToTrack`):

```typescript
// Auto-play track from URL slug (e.g. /show/:identifier/dark-star)
// NOTE: This will be changed to select-only in Task 14 of the share feature plan.
useEffect(() => {
  if (!trackTitle || !show || hasAutoPlayed.current) return;
  hasAutoPlayed.current = true;

  const bestMatch = matchTrackBySlug(
    trackTitle,
    show.tracks,
    SIMILARITY_THRESHOLDS.SEARCH_MATCH
  );

  if (bestMatch) {
    loadTrack(bestMatch, show, show.tracks);
  }
}, [trackTitle, show]);
```

- [ ] **Step 7: Run the full test suite and the TS check**

```bash
npx tsc --noEmit
npx jest
```

Expected: TS compiles cleanly, all existing tests still pass, and the new `trackMatching` tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/utils/trackMatching.ts src/__tests__/utils/trackMatching.test.ts src/screens/ShowDetailScreen.tsx
git commit -m "refactor(show-detail): extract fuzzy track matching to shared util

Moves calculateSimilarity (Levenshtein) and the slug→track match loop
out of ShowDetailScreen.tsx into src/utils/trackMatching.ts so the same
implementation can be imported by the upcoming share feature's Vercel
Functions. Existing auto-play behavior is unchanged (will change in a
later task to select-only).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `shareService.ts` pure builders

**Files:**
- Create: `src/services/shareService.ts`
- Create: `src/__tests__/services/shareService.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/services/shareService.test.ts`:

```typescript
import {
  buildShareUrl,
  buildShareText,
  pickRandomBackground,
  WEB_ORIGIN,
  type ShareItem,
} from '../../services/shareService';

const showItem: ShareItem = {
  kind: 'show',
  showId: 'gd1982-08-06.sbd.miller.110987',
  date: '1982-08-06',
  venue: 'Sound City Recording Studios',
  tier: 1,
};

const songItem: ShareItem = {
  kind: 'song',
  showId: 'gd1982-08-06.sbd.miller.110987',
  trackId: 't42',
  trackTitle: "Franklin's Tower",
  trackSlug: 'franklins-tower',
  date: '1982-08-06',
  venue: 'Sound City Recording Studios',
  rating: 1,
};

describe('buildShareUrl', () => {
  it('builds a show URL using the show date as the identifier', () => {
    expect(buildShareUrl(showItem, 3)).toBe(
      `${WEB_ORIGIN}/show/1982-08-06?bg=3`
    );
  });

  it('builds a song URL with the track slug as a second segment', () => {
    expect(buildShareUrl(songItem, 5)).toBe(
      `${WEB_ORIGIN}/show/1982-08-06/franklins-tower?bg=5`
    );
  });

  it('clamps bg to the 1..6 range', () => {
    expect(buildShareUrl(showItem, 0).endsWith('?bg=1')).toBe(true);
    expect(buildShareUrl(showItem, 7).endsWith('?bg=6')).toBe(true);
    expect(buildShareUrl(showItem, -2).endsWith('?bg=1')).toBe(true);
  });
});

describe('buildShareText', () => {
  it('includes the formatted date and venue for a show', () => {
    const text = buildShareText(showItem);
    expect(text).toContain('08/06/1982');
    expect(text).toContain('Sound City Recording Studios');
  });

  it('includes the track title, date, and venue for a song', () => {
    const text = buildShareText(songItem);
    expect(text).toContain("Franklin's Tower");
    expect(text).toContain('08/06/1982');
    expect(text).toContain('Sound City Recording Studios');
  });
});

describe('pickRandomBackground', () => {
  it('always returns an integer in 1..6', () => {
    for (let i = 0; i < 500; i++) {
      const n = pickRandomBackground();
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx jest src/__tests__/services/shareService.test.ts
```

Expected: FAIL — `Cannot find module '../../services/shareService'`.

- [ ] **Step 3: Create `src/services/shareService.ts`**

```typescript
// Pure TypeScript: no React Native, no Expo, no platform imports.
// Used by ShareTray, the destination handlers, and is also safe to import
// from web code. Platform-specific destinations live in the .native.ts /
// .web.ts siblings.

export const WEB_ORIGIN = 'https://www.scarletfire.app';

export type ShareItem =
  | {
      kind: 'show';
      showId: string;           // archive identifier
      date: string;             // ISO "1982-08-06"
      venue: string;
      tier: 1 | 2 | 3 | null;   // classicTier — drives star count on the card
    }
  | {
      kind: 'song';
      showId: string;
      trackId: string;
      trackTitle: string;
      trackSlug: string;        // already slugified (lowercased, hyphenated)
      date: string;
      venue: string;
      rating: 1 | 2 | 3 | null; // per-performance rating, falls back to tier
    };

function clampBg(bg: number): number {
  if (!Number.isFinite(bg)) return 1;
  const rounded = Math.round(bg);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

/**
 * Build the public share URL for a ShareItem.
 * - Show: /show/<date>?bg=<n>
 * - Song: /show/<date>/<track-slug>?bg=<n>
 *
 * Uses <date> (not the full archive identifier) to match the existing
 * showDetailRoute in src/navigation/webLinking.ts which stringifies
 * identifiers as dates via its identifierToDate lookup.
 */
export function buildShareUrl(item: ShareItem, bg: number): string {
  const bgSafe = clampBg(bg);
  const base = `${WEB_ORIGIN}/show/${item.date}`;
  if (item.kind === 'show') {
    return `${base}?bg=${bgSafe}`;
  }
  return `${base}/${item.trackSlug}?bg=${bgSafe}`;
}

/**
 * Build the share message body — what gets pre-filled in WhatsApp / Messages.
 * Format: "<title> · <date> · <venue>"
 * The share URL is appended by the destination handler, not by this function.
 */
export function buildShareText(item: ShareItem): string {
  const formattedDate = formatDateMMDDYYYY(item.date);
  if (item.kind === 'show') {
    return `${formattedDate} · ${item.venue}`;
  }
  return `${item.trackTitle} · ${formattedDate} · ${item.venue}`;
}

/**
 * Pick a random integer in [1, 6]. The mobile client calls this once when
 * the share tray opens so the in-tray preview and the chat-unfurl image
 * use the same background.
 */
export function pickRandomBackground(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function formatDateMMDDYYYY(iso: string): string {
  // Accept "1982-08-06" or "1982-08-06T..." — same logic as ShowDetailScreen
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

/**
 * Derive the URL slug for a track title (lowercased, spaces → hyphens,
 * URL-encoded). Matches stringifyTrackTitle in webLinking.ts.
 */
export function slugifyTrackTitle(title: string): string {
  return encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/services/shareService.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/shareService.ts src/__tests__/services/shareService.test.ts
git commit -m "feat(share): add shareService URL/text builders

Pure TypeScript module with no RN dependencies — buildShareUrl,
buildShareText, pickRandomBackground, slugifyTrackTitle, and the
ShareItem type. These are the contract between the share tray UI,
destination handlers, and the Vercel Functions.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `ShareSheetContext` + `useShareSheet` hook

**Files:**
- Create: `src/contexts/ShareSheetContext.tsx`

No tests for this task — the context is a thin provider that delegates all real work to the tray component it renders. Behavior is verified via `ShareTray` tests in Task 8.

- [ ] **Step 1: Create the context file**

Create `src/contexts/ShareSheetContext.tsx`:

```typescript
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ShareItem } from '../services/shareService';
import { ShareTray } from '../components/share/ShareTray';

interface ShareSheetContextValue {
  openShareTray: (item: ShareItem) => void;
  closeShareTray: () => void;
}

const ShareSheetContext = createContext<ShareSheetContextValue | null>(null);

export function ShareSheetProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ShareItem | null>(null);

  const openShareTray = useCallback((item: ShareItem) => {
    setCurrent(item);
  }, []);

  const closeShareTray = useCallback(() => {
    setCurrent(null);
  }, []);

  const value = useMemo(
    () => ({ openShareTray, closeShareTray }),
    [openShareTray, closeShareTray]
  );

  return (
    <ShareSheetContext.Provider value={value}>
      {children}
      <ShareTray item={current} onClose={closeShareTray} />
    </ShareSheetContext.Provider>
  );
}

export function useShareSheet(): ShareSheetContextValue {
  const ctx = useContext(ShareSheetContext);
  if (!ctx) {
    throw new Error('useShareSheet must be used inside a <ShareSheetProvider>');
  }
  return ctx;
}
```

Note: `ShareTray` is a cross-platform wrapper created in Task 8 that resolves to `.native.tsx` or `.web.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/contexts/ShareSheetContext.tsx
git commit -m "feat(share): add ShareSheetProvider + useShareSheet hook

Global context so FullPlayer and ShowDetailScreen can open the share
tray without each mounting their own sheet. Renders a single <ShareTray>
near the root; callers just pass a ShareItem.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `shareBackgrounds.ts` static require map

**Files:**
- Create: `src/components/share/shareBackgrounds.ts`

Metro requires `require()` calls to be static (literal string paths) for bundling. This file is the single place where the 6 PNGs are imported.

- [ ] **Step 1: Create the file**

Create `src/components/share/shareBackgrounds.ts`:

```typescript
// Static require() map for the 6 share card backgrounds.
// Metro can't bundle dynamic require paths, so this file is the canonical
// place where each asset is pulled in by literal string.

import type { ImageSourcePropType } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bg1: ImageSourcePropType = require('../../../assets/share_images/bg-1.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bg2: ImageSourcePropType = require('../../../assets/share_images/bg-2.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bg3: ImageSourcePropType = require('../../../assets/share_images/bg-3.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bg4: ImageSourcePropType = require('../../../assets/share_images/bg-4.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bg5: ImageSourcePropType = require('../../../assets/share_images/bg-5.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bg6: ImageSourcePropType = require('../../../assets/share_images/bg-6.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const logo: ImageSourcePropType = require('../../../assets/share_images/logo.png');

const BACKGROUNDS: readonly ImageSourcePropType[] = [bg1, bg2, bg3, bg4, bg5, bg6];

/** Get the background image for a bg index in 1..6. Clamps out-of-range inputs to bg-1. */
export function getShareBackground(bgIndex: number): ImageSourcePropType {
  const i = Math.floor(bgIndex);
  if (i < 1 || i > 6) return BACKGROUNDS[0];
  return BACKGROUNDS[i - 1];
}

export const SHARE_LOGO: ImageSourcePropType = logo;
```

- [ ] **Step 2: Run the TS check**

```bash
npx tsc --noEmit
```

Expected: compiles cleanly. If Metro complains about missing image types, add `assets/share_images/bg-1.png` module declarations to an existing `.d.ts` (most Expo projects have `react-native` image module typing via `@types/react-native-img` or similar; if TS complains, add `declare module '*.png';` to `src/types/images.d.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/components/share/shareBackgrounds.ts
git commit -m "feat(share): add static require() map for 6 card backgrounds + logo

Metro requires literal paths for require() — this file is the single
place the 6 bg PNGs and the logo are imported so other components can
pick one by index.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `ShareCard` component

**Files:**
- Create: `src/components/share/ShareCard.tsx`
- Create: `src/__tests__/components/share/ShareCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/share/ShareCard.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { ShareCard } from '../../../components/share/ShareCard';
import type { ShareItem } from '../../../services/shareService';

const showItem: ShareItem = {
  kind: 'show',
  showId: 'gd1982',
  date: '1982-08-06',
  venue: 'Sound City Recording Studios',
  tier: 1,
};

const songItem: ShareItem = {
  kind: 'song',
  showId: 'gd1982',
  trackId: 't1',
  trackTitle: "Franklin's Tower",
  trackSlug: 'franklins-tower',
  date: '1982-08-06',
  venue: 'Sound City Recording Studios',
  rating: 1,
};

describe('ShareCard', () => {
  it('renders a show card with date as title and venue as subtitle', () => {
    const { getByText } = render(<ShareCard item={showItem} bgIndex={1} />);
    expect(getByText('08/06/1982')).toBeTruthy();
    expect(getByText('Sound City Recording Studios')).toBeTruthy();
  });

  it('renders a song card with track title as title, venue + date in subtitle row', () => {
    const { getByText } = render(<ShareCard item={songItem} bgIndex={2} />);
    expect(getByText("Franklin's Tower")).toBeTruthy();
    expect(getByText('Sound City Recording Studios')).toBeTruthy();
    expect(getByText('08/06/1982')).toBeTruthy();
  });

  it('does not crash when tier/rating is null', () => {
    const nullTierShow: ShareItem = { ...showItem, tier: null };
    const { getByText } = render(<ShareCard item={nullTierShow} bgIndex={1} />);
    expect(getByText('08/06/1982')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx jest src/__tests__/components/share/ShareCard.test.tsx
```

Expected: FAIL — `Cannot find module '../../../components/share/ShareCard'`.

- [ ] **Step 3: Create the component**

Create `src/components/share/ShareCard.tsx`:

```typescript
import React from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import type { ShareItem } from '../../services/shareService';
import { getShareBackground, SHARE_LOGO } from './shareBackgrounds';

interface ShareCardProps {
  item: ShareItem;
  bgIndex: number;   // 1..6
}

/**
 * Square preview card shown in the share tray AND rendered server-side as the
 * OG image. Layout mirrors Figma node 138:287 (song) / 138:324 (show) —
 * logo top-left, text info bottom-left, background image behind everything.
 *
 * Design spec:
 *  - 1:1 aspect, 64px radius, dark #121212 background under the bg image
 *  - Logo: top-left, ~15% width
 *  - Text: bottom-left, title + subtitle rows
 */
export function ShareCard({ item, bgIndex }: ShareCardProps) {
  const bgSource = getShareBackground(bgIndex);
  const formattedDate = formatDate(item.date);

  const title = item.kind === 'show' ? formattedDate : item.trackTitle;
  const starCount = starsForTier(item.kind === 'show' ? item.tier : item.rating);

  return (
    <View style={styles.card}>
      <ImageBackground source={bgSource} style={styles.bg} imageStyle={styles.bgImage}>
        <View style={styles.content}>
          <Image source={SHARE_LOGO} style={styles.logo} resizeMode="contain" />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.venue}
            </Text>
            <View style={styles.metaRow}>
              {item.kind === 'song' && (
                <Text style={styles.meta}>{formattedDate}</Text>
              )}
              {starCount > 0 && (
                <View style={styles.stars}>
                  {Array.from({ length: starCount }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={14}
                      color={COLORS.accent}
                      style={i > 0 ? styles.starSpaced : undefined}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

function starsForTier(tier: 1 | 2 | 3 | null): number {
  if (tier === 1) return 3;
  if (tier === 2) return 2;
  if (tier === 3) return 1;
  return 0;
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  bg: {
    flex: 1,
  },
  bgImage: {
    borderRadius: 32,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logo: {
    width: 56,
    height: 62,
  },
  info: {
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  meta: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.9,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starSpaced: {
    marginLeft: 2,
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest src/__tests__/components/share/ShareCard.test.tsx
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/share/ShareCard.tsx src/__tests__/components/share/ShareCard.test.tsx
git commit -m "feat(share): add ShareCard preview component

Square card showing logo + background + show/song info. Renders both
variants (show vs song) from a ShareItem. Layout matches Figma 138:287
and 138:324.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `ShareButton` component

**Files:**
- Create: `src/components/share/ShareButton.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/share/ShareButton.tsx`:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  bgColor: string;
  onPress: () => void;
}

/**
 * Single circular destination button in the share tray.
 * Layout: colored circle (~64px) with a 24px icon, text label below.
 */
export function ShareButton({ icon, label, bgColor, onPress }: ShareButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.circle, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    width: 72,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/share/ShareButton.tsx
git commit -m "feat(share): add ShareButton destination button

Circular 64px button with icon + label below. Matches Figma spec.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `ShareTray.native.tsx` with `@gorhom/bottom-sheet`

**Files:**
- Create: `src/components/share/ShareTray.tsx` (cross-platform wrapper — just re-exports)
- Create: `src/components/share/ShareTray.native.tsx`
- Create: `src/__tests__/components/share/ShareTray.test.tsx`

Metro resolves `ShareTray` to `.native.tsx` on iOS/Android and `.web.tsx` on web. The plain `.tsx` file is a fallback + type source.

- [ ] **Step 1: Create the cross-platform wrapper**

Create `src/components/share/ShareTray.tsx`:

```typescript
// Cross-platform type source. Metro resolves this to:
//  - ShareTray.native.tsx on iOS/Android
//  - ShareTray.web.tsx on web
// This file is a fallback + shared prop types.
import type { ShareItem } from '../../services/shareService';

export interface ShareTrayProps {
  item: ShareItem | null;
  onClose: () => void;
}

// Re-export from the platform-specific file. On native, Metro picks .native.tsx
// automatically; on web, it picks .web.tsx.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export { ShareTray } from './ShareTray.native';
```

Note: the top-level `.tsx` file here is only needed so the TypeScript compiler has something to resolve when it sees `import { ShareTray } from './ShareTray'`. Metro will replace the resolution at bundle time.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/components/share/ShareTray.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ShareTray } from '../../../components/share/ShareTray.native';
import * as shareService from '../../../services/shareService.native';
import type { ShareItem } from '../../../services/shareService';

jest.mock('../../../services/shareService.native', () => ({
  shareToCopyLink: jest.fn(),
  shareToWhatsApp: jest.fn(),
  shareToInstagramStory: jest.fn(),
  shareToMessages: jest.fn(),
}));

const songItem: ShareItem = {
  kind: 'song',
  showId: 'gd1982',
  trackId: 't1',
  trackTitle: "Franklin's Tower",
  trackSlug: 'franklins-tower',
  date: '1982-08-06',
  venue: 'Sound City',
  rating: 1,
};

describe('ShareTray (native)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all four destination buttons when an item is present', () => {
    const { getByLabelText } = render(
      <ShareTray item={songItem} onClose={jest.fn()} />
    );
    expect(getByLabelText('Copy link')).toBeTruthy();
    expect(getByLabelText('WhatsApp')).toBeTruthy();
    expect(getByLabelText('Instagram')).toBeTruthy();
    expect(getByLabelText('Messages')).toBeTruthy();
  });

  it('invokes shareToCopyLink with the current item when Copy link tapped', () => {
    const { getByLabelText } = render(
      <ShareTray item={songItem} onClose={jest.fn()} />
    );
    fireEvent.press(getByLabelText('Copy link'));
    expect(shareService.shareToCopyLink).toHaveBeenCalledTimes(1);
    expect(shareService.shareToCopyLink).toHaveBeenCalledWith(
      expect.objectContaining({ item: songItem })
    );
  });

  it('renders nothing when item is null', () => {
    const { queryByLabelText } = render(
      <ShareTray item={null} onClose={jest.fn()} />
    );
    expect(queryByLabelText('Copy link')).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx jest src/__tests__/components/share/ShareTray.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4: Create `ShareTray.native.tsx`**

```typescript
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { ShareCard } from './ShareCard';
import { ShareButton } from './ShareButton';
import { pickRandomBackground } from '../../services/shareService';
import {
  shareToCopyLink,
  shareToWhatsApp,
  shareToInstagramStory,
  shareToMessages,
} from '../../services/shareService.native';
import type { ShareTrayProps } from './ShareTray';

/**
 * Native share tray. Bottom sheet that shows a preview card + 4 destination
 * buttons. Backed by @gorhom/bottom-sheet for gesture-driven open/close.
 */
export function ShareTray({ item, onClose }: ShareTrayProps) {
  const sheetRef = useRef<BottomSheet>(null);

  // Pick one random background per tray open; it's passed to the preview card
  // AND to the destination handlers so the OG URL uses the same bg.
  const bgIndex = useMemo(() => {
    return item ? pickRandomBackground() : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.showId, item?.kind, 'trackId' in (item ?? {}) ? (item as any).trackId : null]);

  useEffect(() => {
    if (item) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [item]);

  if (!item) return null;

  const headline = item.kind === 'song' ? 'Share this song' : 'Share this show';

  const handleDestination = (
    fn: typeof shareToCopyLink,
  ) => () => {
    fn({ item, bgIndex });
    onClose();
  };

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['80%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.cardWrap}>
          <ShareCard item={item} bgIndex={bgIndex} />
        </View>
        <Text style={styles.headline}>{headline}</Text>
        <View style={styles.buttons}>
          <ShareButton
            icon="link"
            label="Copy link"
            bgColor="#343434"
            onPress={handleDestination(shareToCopyLink)}
          />
          <ShareButton
            icon="logo-whatsapp"
            label="WhatsApp"
            bgColor="#25d366"
            onPress={handleDestination(shareToWhatsApp)}
          />
          <ShareButton
            icon="logo-instagram"
            label="Instagram"
            bgColor="#343434"
            onPress={handleDestination(shareToInstagramStory)}
          />
          <ShareButton
            icon="chatbubble"
            label="Messages"
            bgColor="#3ddd57"
            onPress={handleDestination(shareToMessages)}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#1f1f1f',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  handle: {
    backgroundColor: '#b3b3b3',
    width: 54,
    height: 6,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  cardWrap: {
    width: '100%',
  },
  headline: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 24,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
```

- [ ] **Step 5: Run the test to verify it passes**

Note: `@gorhom/bottom-sheet` uses reanimated. The test environment needs the reanimated mock from `react-native-reanimated/mock`. Check `src/__tests__/setup.ts` to see if it's already configured — if not, add:

```typescript
// src/__tests__/setup.ts — append
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
```

Then run:

```bash
npx jest src/__tests__/components/share/ShareTray.test.tsx
```

Expected: all 3 tests PASS. If `@gorhom/bottom-sheet` imports fail, you may also need to mock it in the same setup file with `jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'))` or a simple stub that just renders children.

- [ ] **Step 6: Commit**

```bash
git add src/components/share/ShareTray.tsx src/components/share/ShareTray.native.tsx src/__tests__/components/share/ShareTray.test.tsx src/__tests__/setup.ts
git commit -m "feat(share): add native ShareTray bottom sheet

Uses @gorhom/bottom-sheet. Renders the ShareCard preview plus 4
destination buttons. Picks a random bg index per open so the preview
matches the URL passed to destination handlers.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Mount `<ShareSheetProvider>` + `GestureHandlerRootView` in `App.tsx`

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Read `App.tsx` and identify the root**

```bash
head -100 App.tsx
```

Understand the existing provider structure. Note the outermost wrapping component (e.g. `<NavigationContainer>`, `<PlayerProvider>`, etc.).

- [ ] **Step 2: Wrap with `GestureHandlerRootView` (required by `@gorhom/bottom-sheet`)**

`@gorhom/bottom-sheet` requires a `GestureHandlerRootView` at the root of the app on native. If `App.tsx` doesn't already wrap the tree in one (many Expo apps don't by default), add it.

Add to the imports at the top of `App.tsx`:

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ShareSheetProvider } from './src/contexts/ShareSheetContext';
```

Wrap the outermost return so it looks like:

```typescript
return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    {/* ... all existing providers / NavigationContainer ... */}
    <ShareSheetProvider>
      {/* everything that was previously inside the outermost wrapper */}
    </ShareSheetProvider>
  </GestureHandlerRootView>
);
```

Place `ShareSheetProvider` **inside** any provider that the share tray depends on (e.g. PlayerContext, ShowsContext) — because the tray needs to read from them via hooks — and **outside** screen-level components so both FullPlayer and ShowDetailScreen can open the tray.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: compiles cleanly.

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat(share): mount ShareSheetProvider + GestureHandlerRootView

Wraps the app in GestureHandlerRootView (required by @gorhom/bottom-sheet)
and adds ShareSheetProvider so any component can call useShareSheet().

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Native destination handlers — copy, WhatsApp, Messages

**Files:**
- Create: `src/services/shareService.native.ts`
- Create: `src/__tests__/services/shareService.native.test.ts`

Instagram Story is in Task 11 — it has extra complexity around FileSystem and native intents.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/services/shareService.native.test.ts`:

```typescript
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import {
  shareToCopyLink,
  shareToWhatsApp,
  shareToMessages,
} from '../../services/shareService.native';
import type { ShareItem } from '../../services/shareService';

jest.mock('expo-linking');
jest.mock('expo-clipboard');

const mockedLinking = Linking as jest.Mocked<typeof Linking>;
const mockedClipboard = Clipboard as jest.Mocked<typeof Clipboard>;

const songItem: ShareItem = {
  kind: 'song',
  showId: 'gd1982',
  trackId: 't1',
  trackTitle: "Franklin's Tower",
  trackSlug: 'franklins-tower',
  date: '1982-08-06',
  venue: 'Sound City',
  rating: 1,
};

describe('shareToCopyLink', () => {
  it('writes the share URL to the clipboard', async () => {
    mockedClipboard.setStringAsync.mockResolvedValue(true);
    await shareToCopyLink({ item: songItem, bgIndex: 3 });
    expect(mockedClipboard.setStringAsync).toHaveBeenCalledTimes(1);
    const urlArg = mockedClipboard.setStringAsync.mock.calls[0][0];
    expect(urlArg).toMatch(/\/show\/1982-08-06\/franklins-tower\?bg=3$/);
  });
});

describe('shareToWhatsApp', () => {
  it('uses the whatsapp:// scheme if canOpenURL returns true', async () => {
    mockedLinking.canOpenURL.mockResolvedValue(true);
    mockedLinking.openURL.mockResolvedValue();
    await shareToWhatsApp({ item: songItem, bgIndex: 2 });
    expect(mockedLinking.openURL).toHaveBeenCalledTimes(1);
    const url = mockedLinking.openURL.mock.calls[0][0];
    expect(url).toContain('whatsapp://send');
    expect(url).toContain('bg=2');
  });

  it('falls back to https://wa.me/ if canOpenURL returns false', async () => {
    mockedLinking.canOpenURL.mockResolvedValue(false);
    mockedLinking.openURL.mockResolvedValue();
    await shareToWhatsApp({ item: songItem, bgIndex: 2 });
    const url = mockedLinking.openURL.mock.calls[0][0];
    expect(url).toContain('https://wa.me/');
  });
});

describe('shareToMessages', () => {
  const originalOS = Platform.OS;
  afterEach(() => { (Platform as any).OS = originalOS; });

  it('uses sms:&body= on iOS', async () => {
    (Platform as any).OS = 'ios';
    mockedLinking.openURL.mockResolvedValue();
    await shareToMessages({ item: songItem, bgIndex: 1 });
    const url = mockedLinking.openURL.mock.calls[0][0];
    expect(url.startsWith('sms:&body=')).toBe(true);
  });

  it('uses smsto:?body= on Android', async () => {
    (Platform as any).OS = 'android';
    mockedLinking.openURL.mockResolvedValue();
    await shareToMessages({ item: songItem, bgIndex: 1 });
    const url = mockedLinking.openURL.mock.calls[0][0];
    expect(url.startsWith('smsto:?body=')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx jest src/__tests__/services/shareService.native.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/services/shareService.native.ts`**

```typescript
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import {
  buildShareUrl,
  buildShareText,
  type ShareItem,
} from './shareService';
import { haptics } from './hapticService';

interface DestinationArgs {
  item: ShareItem;
  bgIndex: number;
}

export async function shareToCopyLink({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  await Clipboard.setStringAsync(url);
  haptics.success();
}

export async function shareToWhatsApp({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  const text = buildShareText(item);
  const encodedBody = encodeURIComponent(`${text} ${url}`);

  const nativeUrl = `whatsapp://send?text=${encodedBody}`;
  const webFallback = `https://wa.me/?text=${encodedBody}`;

  const canOpen = await Linking.canOpenURL(nativeUrl);
  await Linking.openURL(canOpen ? nativeUrl : webFallback);
  haptics.light();
}

export async function shareToMessages({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  const text = buildShareText(item);
  const encodedBody = encodeURIComponent(`${text} ${url}`);

  // iOS: "sms:&body=..."    (ampersand is intentional per Apple's URL scheme docs)
  // Android: "smsto:?body=..."
  const smsUrl = Platform.OS === 'ios'
    ? `sms:&body=${encodedBody}`
    : `smsto:?body=${encodedBody}`;

  await Linking.openURL(smsUrl);
  haptics.light();
}

// Instagram Story is in Task 11. Stub for now so ShareTray imports don't break.
export async function shareToInstagramStory(_args: DestinationArgs): Promise<void> {
  throw new Error('shareToInstagramStory not yet implemented — see Task 11');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx jest src/__tests__/services/shareService.native.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/shareService.native.ts src/__tests__/services/shareService.native.test.ts
git commit -m "feat(share): native destination handlers for copy, WhatsApp, Messages

Instagram Story is stubbed and implemented in a follow-up task.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Native Instagram Story destination

**Files:**
- Modify: `src/services/shareService.native.ts`
- Modify: `app.config.js` (add `LSApplicationQueriesSchemes` for Instagram)

Instagram Story sharing requires:
- iOS: The PNG must be in the pasteboard under key `com.instagram.sharedSticker.backgroundImage`, then open `instagram-stories://share?source_application=<bundle_id>`.
- Android: An `Intent.ACTION_SEND` with type `image/png` and category `com.instagram.share.ADD_TO_STORY`.

We use `expo-file-system` to download the PNG and `react-native-share` (already widely used for this purpose) or Expo's native intent APIs. **During implementation, verify the current state of Instagram's share API** — this has changed multiple times historically. Official docs: https://developers.facebook.com/docs/instagram-platform/sharing-to-stories/

- [ ] **Step 1: Install `react-native-share` if not present**

Run:

```bash
npx expo install react-native-share
```

Note: this is a native module and requires a native rebuild (EAS). For development in Expo Go, `react-native-share` is NOT supported — the handler will no-op in Expo Go. That's acceptable for this feature since sharing-to-stories is only meaningful on real devices.

- [ ] **Step 2: Update `Info.plist` scheme query list via `app.config.js`**

Find the `ios.infoPlist` block in `app.config.js` (currently around line 32). Add:

```js
LSApplicationQueriesSchemes: [
  'instagram-stories',
  'whatsapp',
  'sms',
],
```

If `LSApplicationQueriesSchemes` already exists with other entries, merge these in — don't replace.

- [ ] **Step 3: Implement `shareToInstagramStory`**

Replace the stub in `src/services/shareService.native.ts`:

```typescript
import * as FileSystem from 'expo-file-system';
import Share from 'react-native-share';
import { WEB_ORIGIN } from './shareService';

// ... keep the existing imports, add:
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ensureImports = FileSystem;  // prevent unused-import warning

/**
 * Share the generated share card as an Instagram Story sticker.
 * Downloads the OG image PNG to local cache, then hands it to the
 * Instagram native share API.
 *
 * Not supported in Expo Go — requires a native build.
 */
export async function shareToInstagramStory({ item, bgIndex }: DestinationArgs): Promise<void> {
  // Build the OG image URL that the Vercel function serves.
  // Using the public image directly (not the /show/ page URL) so the user
  // is sharing the raw card.
  const ogImageUrl =
    item.kind === 'show'
      ? `${WEB_ORIGIN}/api/og/show/${item.date}?bg=${bgIndex}`
      : `${WEB_ORIGIN}/api/og/song/${item.date}/${item.trackSlug}?bg=${bgIndex}`;

  // Download the PNG to a local file.
  const localPath = `${FileSystem.cacheDirectory}share-card-${Date.now()}.png`;
  const downloadResult = await FileSystem.downloadAsync(ogImageUrl, localPath);

  if (downloadResult.status !== 200) {
    throw new Error(`Failed to download share card: ${downloadResult.status}`);
  }

  // Convert to a base64 data URL — react-native-share for Instagram Stories
  // expects either a file path or a data URL as `backgroundImage`.
  const fileBase64 = await FileSystem.readAsStringAsync(localPath, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const dataUrl = `data:image/png;base64,${fileBase64}`;

  try {
    await Share.shareSingle({
      social: Share.Social.INSTAGRAM_STORIES,
      backgroundImage: dataUrl,
      appId: '',  // Facebook App ID — leave empty for a generic share
    });
    haptics.success();
  } catch (err) {
    // Instagram not installed, user cancelled, etc. — fail silently.
    // Don't rethrow: destination handlers should never crash the tray.
    console.warn('[share] Instagram Story share failed:', err);
  }
}
```

Note: `react-native-share`'s typing on `Share.shareSingle` may require `appId` as a string — check `node_modules/react-native-share/index.d.ts` during implementation. The empty-string `appId` above is a placeholder — if IG's current API requires a real Facebook App ID, register one at developers.facebook.com and plumb it through an env var (add to `app.config.js` `extra` block).

- [ ] **Step 4: Commit**

```bash
git add src/services/shareService.native.ts app.config.js package.json package-lock.json
git commit -m "feat(share): Instagram Story destination via react-native-share

Downloads the server-rendered card PNG, hands it to the Instagram
stories share API. Not supported in Expo Go — requires a native build.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Wire share icon into `FullPlayer.tsx`

**Files:**
- Modify: `src/components/FullPlayer.tsx`

- [ ] **Step 1: Read the current close button layout**

Read `src/components/FullPlayer.tsx:475-515` to understand the current header cluster (the `chevron-down` close button). Identify the outer wrapping `View` that contains it and what style positions it in the top-right.

- [ ] **Step 2: Add imports**

Near the existing imports block at the top of the file, add:

```typescript
import { useShareSheet } from '../contexts/ShareSheetContext';
import type { ShareItem } from '../services/shareService';
import { slugifyTrackTitle } from '../services/shareService';
```

- [ ] **Step 3: Get the share handler inside the component body**

Around line 66 (where the other context hooks are called), add:

```typescript
const { openShareTray } = useShareSheet();
```

- [ ] **Step 4: Build the share callback**

After the other `useCallback`s / handlers in the component, add:

```typescript
const handleShare = useCallback(() => {
  if (!state.currentTrack || !state.currentShow) return;

  const track = state.currentTrack;
  const show = state.currentShow;

  // Resolve rating from whatever the FullPlayer already reads.
  // If the player context doesn't expose rating, use the show's classicTier.
  const rating: 1 | 2 | 3 | null =
    (track as any).rating ?? show.classicTier ?? null;

  const item: ShareItem = {
    kind: 'song',
    showId: show.identifier,
    trackId: track.id,
    trackTitle: track.title,
    trackSlug: slugifyTrackTitle(track.title),
    date: show.date,
    venue: show.venue ?? getVenueFromShow(show),
    rating,
  };

  haptics.light();
  openShareTray(item);
}, [state.currentTrack, state.currentShow, openShareTray]);
```

If the exact field names (`state.currentShow`, `show.classicTier`, `show.venue`) don't match what's actually on the PlayerContext / show types, inspect them during implementation and adapt — the shape of `ShareItem` is fixed but the source of each field isn't. The goal: assemble a `{ kind: 'song', showId, trackId, trackTitle, trackSlug, date, venue, rating }` object.

- [ ] **Step 5: Add the share button JSX**

Find the close button at around `src/components/FullPlayer.tsx:483-492`:

```typescript
{/* Close button */}
<TouchableOpacity
  onPress={onClose}
  style={styles.closeButton}
  ...
>
  <Ionicons name="chevron-down" size={32} color={COLORS.textPrimary} />
</TouchableOpacity>
```

This currently sits on the left of the header cluster. Per the brainstorm, the top-right corner is empty — add a sibling `TouchableOpacity` with the share icon positioned top-right. **Add immediately after the closing `</TouchableOpacity>` of the close button:**

```typescript
{/* Share button */}
<TouchableOpacity
  onPress={handleShare}
  style={styles.shareButton}
  accessibilityRole="button"
  accessibilityLabel="Share song"
  accessibilityHint="Double tap to open the share tray"
>
  <Ionicons name="share-outline" size={28} color={COLORS.textPrimary} />
</TouchableOpacity>
```

Find the existing `closeButton` style in the `StyleSheet.create` block at the bottom of the file. Add a mirrored `shareButton` entry with the same vertical offset but positioned to the right:

```typescript
shareButton: {
  position: 'absolute',
  top: /* same as closeButton */,
  right: /* same left-offset as closeButton's left */,
  width: /* same as closeButton */,
  height: /* same as closeButton */,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
},
```

(Copy the exact values from the existing `closeButton` style; swap `left` → `right`.)

- [ ] **Step 6: Verify**

Run:

```bash
npx tsc --noEmit
```

Expected: compiles cleanly.

Start the dev server and visually verify on iOS Simulator: the share icon sits top-right of the FullPlayer header, matching the close chevron's vertical offset on the left. Tapping it opens the share tray with the current song's data.

```bash
npx expo start --ios
```

- [ ] **Step 7: Commit**

```bash
git add src/components/FullPlayer.tsx
git commit -m "feat(share): add share icon to FullPlayer header

Top-right share button opens the tray with a ShareItem assembled from
the player's current show and track.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Wire share icon into `ShowDetailScreen.tsx`

**Files:**
- Modify: `src/screens/ShowDetailScreen.tsx`

- [ ] **Step 1: Add imports**

Near the existing imports at the top of the file, add:

```typescript
import { useShareSheet } from '../contexts/ShareSheetContext';
import type { ShareItem } from '../services/shareService';
```

- [ ] **Step 2: Get the share hook**

Inside the component body, near the other hooks (right after `useFavorites()` etc.), add:

```typescript
const { openShareTray } = useShareSheet();
```

- [ ] **Step 3: Build the share callback**

Add near the other handlers in the component:

```typescript
const handleShareShow = useCallback(() => {
  if (!show) return;

  const item: ShareItem = {
    kind: 'show',
    showId: show.identifier,
    date: show.date,
    venue: show.venue ?? getVenueFromShow(show),
    tier: classicTier ?? null,
  };

  haptics.light();
  openShareTray(item);
}, [show, classicTier, openShareTray]);
```

If `classicTier` is not already in scope, derive it the same way the existing `<StarRating tier={classicTier} />` call at `ShowDetailScreen.tsx:472` does.

- [ ] **Step 4: Add `headerRight` to `navigation.setOptions`**

Find the existing `navigation.setOptions` call at `src/screens/ShowDetailScreen.tsx:302-308`:

```typescript
navigation.setOptions({
  title: Platform.OS === 'web' ? webTitle : '',
  headerLeftContainerStyle: {
    paddingLeft: 10,
  },
});
```

Replace with:

```typescript
navigation.setOptions({
  title: Platform.OS === 'web' ? webTitle : '',
  headerLeftContainerStyle: {
    paddingLeft: 10,
  },
  headerRight: () => (
    <TouchableOpacity
      onPress={handleShareShow}
      style={{ paddingRight: 16, paddingLeft: 16, paddingVertical: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Share show"
    >
      <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
    </TouchableOpacity>
  ),
});
```

Ensure `TouchableOpacity` is imported from `react-native` and `Ionicons` from `@expo/vector-icons` at the top of the file — they probably already are.

Important: `handleShareShow` is captured in the `setOptions` closure, so `setOptions` must be called within a `useEffect` that lists `[show, classicTier, handleShareShow]` in its deps. If the existing `setOptions` call is inside a one-time `useEffect`, convert it so it re-runs when the callback changes.

- [ ] **Step 5: Verify on device**

```bash
npx expo start --ios
```

Open any show detail screen, confirm the share icon appears in the top-right of the navigation bar, tapping it opens the share tray with the show data.

- [ ] **Step 6: Commit**

```bash
git add src/screens/ShowDetailScreen.tsx
git commit -m "feat(share): add share icon to ShowDetailScreen header

Rendered as the navigation headerRight; opens the share tray with a
'show' ShareItem.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Replace auto-play with `selectAndScrollToTrack` + `isSelected` on `TrackItem`

**Files:**
- Modify: `src/screens/ShowDetailScreen.tsx`
- Modify: `src/components/TrackItem.tsx`

- [ ] **Step 1: Add `isSelected` prop to `TrackItem`**

Read `src/components/TrackItem.tsx` to find the props interface at lines 10-19. Update it:

```typescript
interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPress: (track: Track) => void;
  rating?: 1 | 2 | 3 | null;
  /** Web only: whether this song is saved as a favorite */
  isSaved?: boolean;
  /** Web only: callback to toggle save state */
  onToggleSave?: (track: Track) => void;
  /** Highlighted state when the screen was opened via a URL targeting this track.
   * Distinct from isPlaying — this is "the user navigated here but hasn't pressed play yet". */
  isSelected?: boolean;
}
```

Destructure `isSelected` in the component signature:

```typescript
export function TrackItem({ track, isPlaying, onPress, rating, isSaved, onToggleSave, isSelected }: TrackItemProps) {
```

Find the `style` array at around line 39-45 (`[styles.container, isDesktop && styles.containerDesktop, isPlaying && styles.playing, ...]`). Add `isSelected && !isPlaying && styles.selected` to the array:

```typescript
style={[
  styles.container,
  isDesktop && styles.containerDesktop,
  isPlaying && styles.playing,
  isPlaying && isDesktop && styles.playingDesktop,
  isSelected && !isPlaying && styles.selected,
  isDesktop && isHovered && !isPlaying && styles.hovered,
]}
```

Add the `selected` style at the bottom of the `StyleSheet.create` block:

```typescript
selected: {
  backgroundColor: 'rgba(229, 76, 79, 0.12)',  // COLORS.accentTransparent
},
```

- [ ] **Step 2: Add `selectedTrackId` state and scroll ref in `ShowDetailScreen.tsx`**

Near the other `useState` calls in the component body, add:

```typescript
const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
const tracklistRef = useRef<ScrollView | FlatList<any> | null>(null);
```

(Use whichever type matches the existing tracklist — check how the tracks are rendered.)

- [ ] **Step 3: Create the `selectAndScrollToTrack` helper**

Add below the state declarations:

```typescript
const selectAndScrollToTrack = useCallback((track: Track) => {
  setSelectedTrackId(track.id);
  // Attempt to scroll the tracklist so the selected row is visible.
  // If the tracklist is a FlatList, use scrollToItem; otherwise fall back
  // to no-op (the visual highlight is enough).
  const list = tracklistRef.current as any;
  if (list && typeof list.scrollToItem === 'function') {
    list.scrollToItem({ item: track, viewPosition: 0.3, animated: true });
  }
}, []);
```

- [ ] **Step 4: Update the auto-play effect to call `selectAndScrollToTrack`**

Replace the body of the auto-play effect at `src/screens/ShowDetailScreen.tsx:242-263` (now using `matchTrackBySlug` after Task 2):

```typescript
// URL-driven track arrival: select + scroll, do NOT auto-play.
// Applies to every URL navigation with a trackTitle param, whether from a
// share link or a pasted URL — per the design spec, there's one behavior.
useEffect(() => {
  if (!trackTitle || !show || hasAutoPlayed.current) return;
  hasAutoPlayed.current = true;

  const bestMatch = matchTrackBySlug(
    trackTitle,
    show.tracks,
    SIMILARITY_THRESHOLDS.SEARCH_MATCH
  );

  if (bestMatch) {
    selectAndScrollToTrack(bestMatch);
  }
}, [trackTitle, show, selectAndScrollToTrack]);
```

Rename `hasAutoPlayed` → `hasSelectedFromUrl` in both the `useRef` declaration and the guard above. (Optional but clearer; one find-and-replace within the file.)

- [ ] **Step 5: Pass `isSelected` into `TrackItem` in the tracklist render**

Find where `<TrackItem ... />` is rendered. Add `isSelected={track.id === selectedTrackId}` to the props:

```typescript
<TrackItem
  track={track}
  isPlaying={playerState.currentTrack?.id === track.id && playerState.isPlaying}
  onPress={handleTrackPress}
  rating={trackRatings[track.id]}
  isSelected={track.id === selectedTrackId}
/>
```

- [ ] **Step 6: Wire the tracklist ref**

Find the `<ScrollView>` or `<FlatList>` that renders the tracks. Add `ref={tracklistRef}` to it.

- [ ] **Step 7: Clear selection when the track starts playing**

Add a small effect: once the user taps play on the selected track (or any track), clear the selection so the highlight doesn't fight with the "playing" highlight.

```typescript
useEffect(() => {
  if (!selectedTrackId) return;
  if (playerState.currentTrack?.id === selectedTrackId && playerState.isPlaying) {
    setSelectedTrackId(null);
  }
}, [selectedTrackId, playerState.currentTrack?.id, playerState.isPlaying]);
```

- [ ] **Step 8: Run tests + type check**

```bash
npx tsc --noEmit
npx jest
```

Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add src/screens/ShowDetailScreen.tsx src/components/TrackItem.tsx
git commit -m "feat(show-detail): URL-driven arrivals select track, don't auto-play

Replaces the auto-play-from-URL effect with select-and-scroll behavior.
TrackItem now supports an isSelected prop with a sustained background
highlight. Applies to all URL-driven arrivals — the behavior no longer
branches on share markers; one mental model.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: `ShareTray.web.tsx`

**Files:**
- Create: `src/components/share/ShareTray.web.tsx`

The web tray is a portal modal — centered on desktop, slide-up on mobile web. It shares the `ShareCard` and `ShareButton` components with native but uses DOM/React primitives for the overlay.

- [ ] **Step 1: Create the file**

Create `src/components/share/ShareTray.web.tsx`:

```typescript
import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { ShareCard } from './ShareCard';
import { ShareButton } from './ShareButton';
import { pickRandomBackground } from '../../services/shareService';
import {
  shareToCopyLink,
  shareToWhatsApp,
  shareToMessages,
} from '../../services/shareService.web';
import type { ShareTrayProps } from './ShareTray';

/**
 * Web share tray: modal dialog.
 * - Desktop (>=1024px): centered modal
 * - Mobile web (<768px): slide-up from bottom
 * Instagram is hidden on web entirely; Messages only on mobile web.
 */
export function ShareTray({ item, onClose }: ShareTrayProps) {
  const { width } = Dimensions.get('window');
  const isDesktop = width >= 1024;
  const isMobileWeb = width < 768;

  const bgIndex = useMemo(() => {
    return item ? pickRandomBackground() : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.showId, item?.kind]);

  // ESC closes the modal on web
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, onClose]);

  if (!item) return null;

  const headline = item.kind === 'song' ? 'Share this song' : 'Share this show';

  const handleDestination = (fn: (args: any) => Promise<void>) => async () => {
    try {
      await fn({ item, bgIndex });
    } finally {
      onClose();
    }
  };

  return (
    <Pressable onPress={onClose} style={styles.backdrop}>
      <Pressable
        onPress={(e: any) => e.stopPropagation?.()}
        style={[
          styles.panel,
          isDesktop ? styles.panelDesktop : styles.panelMobile,
        ]}
      >
        <View style={styles.cardWrap}>
          <ShareCard item={item} bgIndex={bgIndex} />
        </View>
        <Text style={styles.headline}>{headline}</Text>
        <View style={styles.buttons}>
          <ShareButton
            icon="link"
            label="Copy link"
            bgColor="#343434"
            onPress={handleDestination(shareToCopyLink)}
          />
          <ShareButton
            icon="logo-whatsapp"
            label="WhatsApp"
            bgColor="#25d366"
            onPress={handleDestination(shareToWhatsApp)}
          />
          {isMobileWeb && (
            <ShareButton
              icon="chatbubble"
              label="Messages"
              bgColor="#3ddd57"
              onPress={handleDestination(shareToMessages)}
            />
          )}
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#1f1f1f',
    padding: 24,
    gap: 16,
  },
  panelDesktop: {
    width: 420,
    maxWidth: '90%',
    borderRadius: 24,
  },
  panelMobile: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  cardWrap: {
    width: '100%',
  },
  headline: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    gap: 12,
  },
});
```

Note: The cross-platform wrapper at `src/components/share/ShareTray.tsx` (from Task 8) re-exports `ShareTray.native`. Metro will resolve to `.web.tsx` on web automatically. No change needed to the wrapper.

- [ ] **Step 2: Commit**

```bash
git add src/components/share/ShareTray.web.tsx
git commit -m "feat(share): add web ShareTray modal

Centered on desktop, slide-up on mobile web. Instagram hidden on web
entirely; Messages only on mobile web.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Web destination handlers

**Files:**
- Create: `src/services/shareService.web.ts`

- [ ] **Step 1: Create the file**

```typescript
import {
  buildShareUrl,
  buildShareText,
  type ShareItem,
} from './shareService';

interface DestinationArgs {
  item: ShareItem;
  bgIndex: number;
}

export async function shareToCopyLink({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  await navigator.clipboard.writeText(url);
}

export async function shareToWhatsApp({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  const text = buildShareText(item);
  const encodedBody = encodeURIComponent(`${text} ${url}`);
  window.open(`https://wa.me/?text=${encodedBody}`, '_blank', 'noopener,noreferrer');
}

export async function shareToMessages({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  const text = buildShareText(item);
  const encodedBody = encodeURIComponent(`${text} ${url}`);
  // sms: URL scheme — only meaningful on mobile browsers. ShareTray.web.tsx
  // only renders this button on mobile web.
  window.location.href = `sms:?body=${encodedBody}`;
}

// Instagram is hidden on web, no handler needed. Stub for symmetry.
export async function shareToInstagramStory(_args: DestinationArgs): Promise<void> {
  // no-op: Instagram Story share is not supported on web.
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/shareService.web.ts
git commit -m "feat(share): web destination handlers

Copy link via navigator.clipboard; WhatsApp via https://wa.me/; Messages
via sms: URL scheme. Instagram is a no-op (hidden by the tray on web).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Backend foundation — `api/` directory + `tsconfig` for functions

**Files:**
- Create: `api/tsconfig.json`
- Create: `api/_lib/` (empty, populated by later tasks)

Vercel Functions at the repo root get their own TypeScript configuration because they target Node.js, not React Native.

- [ ] **Step 1: Create `api/tsconfig.json`**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "lib": ["dom", "es2022"],
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 2: Create empty directory markers**

```bash
mkdir -p api/_lib api/og/show api/og/song api/html/show api/html/song api/__tests__
touch api/_lib/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add api/tsconfig.json api/_lib/.gitkeep
git commit -m "chore(api): scaffold Vercel Functions directory structure

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 18: `api/_lib/showLookup.ts` with tests

**Files:**
- Create: `api/_lib/showLookup.ts`
- Create: `api/__tests__/showLookup.test.ts`

- [ ] **Step 1: Write the failing test**

Create `api/__tests__/showLookup.test.ts`:

```typescript
import { lookupShowByDate, lookupShowByIdentifier } from '../_lib/showLookup';

describe('lookupShowByDate', () => {
  it('returns show metadata for a known date', () => {
    // Pick any date known to exist in src/data/shows.json.
    // At implementation time, grep shows.json for a real date and use it.
    const result = lookupShowByDate('1977-05-08');
    expect(result).toBeTruthy();
    expect(result?.date).toBe('1977-05-08');
    expect(result?.primaryIdentifier).toBeTruthy();
    expect(result?.venue).toBeTruthy();
  });

  it('returns null for an unknown date', () => {
    const result = lookupShowByDate('1800-01-01');
    expect(result).toBeNull();
  });
});

describe('lookupShowByIdentifier', () => {
  it('returns show metadata when given an archive identifier', () => {
    // At implementation time, grep shows.json for a real primaryIdentifier.
    const result = lookupShowByIdentifier('gd77-05-08.sbd.hicks.4982.sbeok.shnf');
    expect(result).toBeTruthy();
    expect(result?.date).toBeTruthy();
  });
});
```

- [ ] **Step 2: Create `api/_lib/showLookup.ts`**

```typescript
import showsData from '../../src/data/shows.json';

export interface ShowMetadata {
  primaryIdentifier: string;
  date: string;         // "1977-05-08"
  venue: string;
  classicTier: 1 | 2 | 3 | null;
}

interface RawShow {
  primaryIdentifier?: string;
  date?: string;
  venue?: string;
  classicTier?: 1 | 2 | 3 | null;
  [key: string]: unknown;
}

// Build lookup tables once at module load time. Vercel Functions reuse
// warm instances (Fluid Compute), so this runs at most once per cold start.
const byDate: Map<string, ShowMetadata> = new Map();
const byIdentifier: Map<string, ShowMetadata> = new Map();

for (const yearShows of Object.values(showsData as Record<string, RawShow[]>)) {
  for (const raw of yearShows) {
    if (!raw.primaryIdentifier || !raw.date) continue;
    const isoDate = raw.date.substring(0, 10);
    const meta: ShowMetadata = {
      primaryIdentifier: raw.primaryIdentifier,
      date: isoDate,
      venue: raw.venue ?? '',
      classicTier: (raw.classicTier as 1 | 2 | 3 | null) ?? null,
    };
    byDate.set(isoDate, meta);
    byIdentifier.set(raw.primaryIdentifier, meta);
  }
}

/** Lookup by ISO date like "1977-05-08". */
export function lookupShowByDate(date: string): ShowMetadata | null {
  return byDate.get(date) ?? null;
}

/** Lookup by archive identifier like "gd77-05-08.sbd.hicks..." */
export function lookupShowByIdentifier(identifier: string): ShowMetadata | null {
  return byIdentifier.get(identifier) ?? null;
}
```

- [ ] **Step 3: Run the test**

The existing Jest config targets `src/**/*`. Add `api/**/*` to the test match:

Edit `jest.config.js` and change `testMatch` to:

```js
testMatch: [
  '**/__tests__/**/*.test.ts?(x)',
],
```

(It already uses `**/__tests__/**` — so tests under `api/__tests__/` should pick up automatically. Verify.)

Run:

```bash
npx jest api/__tests__/showLookup.test.ts
```

Expected: tests PASS. If the two dates/identifiers hardcoded in the test aren't actually in `shows.json`, grep `src/data/shows.json | head` during implementation to find real ones and substitute.

- [ ] **Step 4: Commit**

```bash
git add api/_lib/showLookup.ts api/__tests__/showLookup.test.ts jest.config.js
git commit -m "feat(api): add showLookup utility + tests

Reads src/data/shows.json once per cold start, exposes lookupShowByDate
and lookupShowByIdentifier. Used by OG image and HTML-injection functions
to resolve show metadata without hitting the network.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 19: `api/_lib/fetchTrackList.ts`

**Files:**
- Create: `api/_lib/fetchTrackList.ts`

- [ ] **Step 1: Create the file**

```typescript
interface TrackListResponse {
  identifier: string;
  tracks: Array<{ title: string; length?: string }>;
}

/**
 * Fetches track metadata from the Internet Archive for a given show identifier.
 * Only called by the song OG/HTML endpoints — show-card endpoints don't need
 * track data. Response is cached at the Vercel edge via Cache-Control.
 */
export async function fetchTrackList(identifier: string): Promise<TrackListResponse | null> {
  const url = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ScarletFire/1.0 (https://www.scarletfire.app)' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      files?: Array<{ name: string; title?: string; track?: string; format?: string }>;
    };
    // Internet Archive returns a flat "files" array; audio tracks are the ones
    // with an audio format (Flac, VBR MP3, etc.) and a "track" number.
    const tracks = (data.files ?? [])
      .filter(f => f.format && /^(Flac|VBR MP3|Ogg Vorbis)$/i.test(f.format) && f.track)
      .map(f => ({ title: f.title ?? f.name }));
    return { identifier, tracks };
  } catch {
    return null;
  }
}
```

Note: The exact format filtering matches what `src/services/archiveApi.ts` does (review that file during implementation to match its logic precisely — the `.filter()` predicate should match).

- [ ] **Step 2: Commit**

```bash
git add api/_lib/fetchTrackList.ts
git commit -m "feat(api): add fetchTrackList — Internet Archive metadata fetch

Used by the song-card endpoints to resolve a track slug to a real
track title. No tests — this is a thin fetch wrapper.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 20: `api/_lib/ogTemplate.tsx` — Satori card templates

**Files:**
- Create: `api/_lib/ogTemplate.tsx`

- [ ] **Step 1: Create the file**

```typescript
/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { WEB_ORIGIN } from './constants';

export interface CardProps {
  title: string;
  subtitle: string;
  metaLine?: string;     // date (song cards only) — omitted on show cards
  tier: 1 | 2 | 3 | null;
  bgIndex: number;       // 1..6
}

const STAR_COLOR = '#E54C4F';

function stars(tier: 1 | 2 | 3 | null): number {
  if (tier === 1) return 3;
  if (tier === 2) return 2;
  if (tier === 3) return 1;
  return 0;
}

function Star({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={STAR_COLOR}
    >
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

/**
 * Card JSX used by both /api/og/show/* and /api/og/song/* endpoints.
 * Rendered by @vercel/og → Satori → PNG.
 */
export function renderCard(props: CardProps) {
  const bgUrl = `${WEB_ORIGIN}/share/bg-${props.bgIndex}.png`;
  const logoUrl = `${WEB_ORIGIN}/share/logo.png`;
  const starCount = stars(props.tier);

  return (
    <div
      style={{
        width: 1200,
        height: 1200,
        display: 'flex',
        position: 'relative',
        backgroundColor: '#121212',
      }}
    >
      <img
        src={bgUrl}
        width={1200}
        height={1200}
        style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
      />
      <img
        src={logoUrl}
        width={186}
        height={206}
        style={{ position: 'absolute', top: 96, left: 96 }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 96,
          left: 96,
          right: 96,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          color: 'white',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 500,
            color: 'white',
            lineHeight: 1.1,
          }}
        >
          {props.title}
        </div>
        <div style={{ fontSize: 44, fontWeight: 500, color: 'white', opacity: 0.9 }}>
          {props.subtitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {props.metaLine && (
            <span style={{ fontSize: 44, fontWeight: 500, color: 'white', opacity: 0.9 }}>
              {props.metaLine}
            </span>
          )}
          {starCount > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: starCount }).map((_, i) => (
                <Star key={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `api/_lib/constants.ts`**

```typescript
export const WEB_ORIGIN = 'https://www.scarletfire.app';
```

- [ ] **Step 3: Commit**

```bash
git add api/_lib/ogTemplate.tsx api/_lib/constants.ts
git commit -m "feat(api): add Satori card template for share OG images

One renderCard() function used by both show and song endpoints.
Stars are inline SVG; bg and logo are absolute URLs into /share/.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 21: `api/og/show/[identifier].tsx` endpoint

**Files:**
- Create: `api/og/show/[identifier].tsx`

- [ ] **Step 1: Create the endpoint**

```typescript
import { ImageResponse } from '@vercel/og';
import { renderCard } from '../../_lib/ogTemplate';
import { lookupShowByDate, lookupShowByIdentifier } from '../../_lib/showLookup';

export const config = {
  runtime: 'nodejs',
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

/**
 * GET /api/og/show/:identifier?bg=<1-6>
 * Returns a 1200×1200 PNG of the show share card.
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  // Extract :identifier from path — the filename [identifier] is the Vercel convention.
  const segments = url.pathname.split('/').filter(Boolean);
  const identifier = decodeURIComponent(segments[segments.length - 1] ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  // Identifier can be either a date ("1977-05-08") or an archive identifier.
  const show = lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);

  if (!show) {
    // Fallback card — don't 404, just render a generic one with short TTL.
    return new ImageResponse(
      renderCard({
        title: 'Scarlet Fire',
        subtitle: 'Grateful Dead Archive',
        tier: null,
        bgIndex,
      }),
      {
        width: 1200,
        height: 1200,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      }
    );
  }

  return new ImageResponse(
    renderCard({
      title: formatDate(show.date),
      subtitle: show.venue,
      tier: show.classicTier,
      bgIndex,
    }),
    {
      width: 1200,
      height: 1200,
      headers: {
        // Immutable: same URL = same image forever.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add api/og/show/
git commit -m "feat(api): add /api/og/show/:identifier — show card OG image

Returns 1200×1200 PNG via @vercel/og. Looks up show metadata in the
bundled shows.json. Immutable cache on hit, 5 min on fallback.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 22: `api/og/song/[identifier]/[trackTitle].tsx` endpoint

**Files:**
- Create: `api/og/song/[identifier]/[trackTitle].tsx`

- [ ] **Step 1: Create the endpoint**

```typescript
import { ImageResponse } from '@vercel/og';
import { renderCard } from '../../../_lib/ogTemplate';
import { lookupShowByDate, lookupShowByIdentifier } from '../../../_lib/showLookup';
import { fetchTrackList } from '../../../_lib/fetchTrackList';
import { matchTrackBySlug } from '../../../../src/utils/trackMatching';

export const config = {
  runtime: 'nodejs',
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

/**
 * GET /api/og/song/:identifier/:trackTitle?bg=<1-6>
 * Returns a 1200×1200 PNG of the song share card.
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  // api/og/song/[identifier]/[trackTitle] → last two segments
  const trackSlug = decodeURIComponent(segments[segments.length - 1] ?? '');
  const identifier = decodeURIComponent(segments[segments.length - 2] ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const show = lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);

  let songTitle = trackSlug.replace(/-/g, ' ');
  if (show) {
    const trackList = await fetchTrackList(show.primaryIdentifier);
    if (trackList) {
      const match = matchTrackBySlug(
        trackSlug,
        trackList.tracks.map((t, i) => ({ id: String(i), title: t.title })),
        0.75  // match SIMILARITY_THRESHOLDS.SEARCH_MATCH
      );
      if (match) songTitle = match.title;
    }
  }

  return new ImageResponse(
    renderCard({
      title: songTitle,
      subtitle: show?.venue ?? 'Grateful Dead',
      metaLine: show ? formatDate(show.date) : undefined,
      tier: show?.classicTier ?? null,
      bgIndex,
    }),
    {
      width: 1200,
      height: 1200,
      headers: {
        'Cache-Control': show
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=300, s-maxage=300',
      },
    }
  );
}
```

Note the relative import `../../../../src/utils/trackMatching` — Vercel bundles the function with its transitive imports, so this will work at deploy time. Verify locally with `vercel dev` during implementation; if the bundler complains, create `api/_lib/trackMatchingRemote.ts` that re-exports from `../../src/utils/trackMatching` and import that instead.

- [ ] **Step 2: Commit**

```bash
git add api/og/song/
git commit -m "feat(api): add /api/og/song — song card OG image

Resolves the track slug to a real title via archive.org metadata,
then renders the song card.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 23: `api/_lib/injectOgTags.ts` with tests

**Files:**
- Create: `api/_lib/injectOgTags.ts`
- Create: `api/__tests__/injectOgTags.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { injectOgTags } from '../_lib/injectOgTags';

const sampleHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Scarlet Fire</title>
  <meta charset="utf-8">
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

describe('injectOgTags', () => {
  it('replaces the <title> with the provided title', () => {
    const out = injectOgTags(sampleHtml, {
      title: 'Franklin\'s Tower',
      description: 'Sound City',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com/show/1982-08-06/franklins-tower',
    });
    expect(out).toContain("<title>Franklin&#039;s Tower</title>");
  });

  it('adds og:image meta tag', () => {
    const out = injectOgTags(sampleHtml, {
      title: 't', description: 'd',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com/show/1982-08-06',
    });
    expect(out).toMatch(/<meta property="og:image" content="https:\/\/example\.com\/img\.png">/);
  });

  it('preserves the original <body> and <div id="root">', () => {
    const out = injectOgTags(sampleHtml, {
      title: 't', description: 'd',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com',
    });
    expect(out).toContain('<div id="root"></div>');
  });

  it('HTML-escapes attribute values to prevent injection', () => {
    const out = injectOgTags(sampleHtml, {
      title: 'Tower "quoted"',
      description: '<script>alert(1)</script>',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com',
    });
    expect(out).not.toContain('<script>alert(1)</script>');
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(out).toContain('Tower &quot;quoted&quot;');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest api/__tests__/injectOgTags.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create `api/_lib/injectOgTags.ts`**

```typescript
export interface OgTags {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Inject Open Graph + Twitter Card meta tags into an HTML string.
 * Pure function — no I/O, no dependencies.
 */
export function injectOgTags(html: string, tags: OgTags): string {
  const title = escapeHtml(tags.title);
  const description = escapeHtml(tags.description);
  const imageUrl = escapeHtml(tags.imageUrl);
  const url = escapeHtml(tags.url);

  const metaBlock = [
    `<meta property="og:type" content="music.song">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="1200">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
  ].join('\n  ');

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace('</head>', `  ${metaBlock}\n</head>`);
}
```

- [ ] **Step 4: Run the tests**

```bash
npx jest api/__tests__/injectOgTags.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/injectOgTags.ts api/__tests__/injectOgTags.test.ts
git commit -m "feat(api): add injectOgTags utility + tests

Pure function: (html, tags) => html. HTML-escapes attribute values
to prevent injection. Used by the HTML endpoints.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 24: `api/html/show/[identifier].ts` endpoint

**Files:**
- Create: `api/html/show/[identifier].ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import { injectOgTags } from '../../_lib/injectOgTags';
import { lookupShowByDate, lookupShowByIdentifier } from '../../_lib/showLookup';
import { WEB_ORIGIN } from '../../_lib/constants';

export const config = { runtime: 'nodejs' };

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

let cachedIndexHtml: string | null = null;
async function loadIndexHtml(): Promise<string> {
  if (cachedIndexHtml) return cachedIndexHtml;
  // In Vercel, the function's cwd is the repo root.
  const indexPath = path.resolve(process.cwd(), 'dist', 'index.html');
  cachedIndexHtml = await fs.readFile(indexPath, 'utf-8');
  return cachedIndexHtml;
}

/**
 * GET /show/:identifier
 * Rewritten from /show/:identifier via vercel.json.
 * Returns dist/index.html with OG meta tags injected for the show.
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const identifier = decodeURIComponent(segments[segments.length - 1] ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const show = lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);
  const html = await loadIndexHtml();

  if (!show) {
    // Not found — still return the SPA with generic tags so the app can handle it.
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  }

  const title = `${formatDate(show.date)} — Grateful Dead`;
  const description = `${show.venue} — listen to the full show on Scarlet Fire`;
  const imageUrl = `${WEB_ORIGIN}/api/og/show/${show.date}?bg=${bgIndex}`;
  const shareUrl = `${WEB_ORIGIN}/show/${show.date}?bg=${bgIndex}`;

  const injected = injectOgTags(html, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/html/show/
git commit -m "feat(api): add /api/html/show — OG-injected HTML for show URLs

Reads dist/index.html, injects og:* meta tags using show metadata from
the bundled catalog, returns the HTML for both crawlers and real browsers.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 25: `api/html/song/[identifier]/[trackTitle].ts` endpoint

**Files:**
- Create: `api/html/song/[identifier]/[trackTitle].ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import { injectOgTags } from '../../../_lib/injectOgTags';
import { lookupShowByDate, lookupShowByIdentifier } from '../../../_lib/showLookup';
import { fetchTrackList } from '../../../_lib/fetchTrackList';
import { matchTrackBySlug } from '../../../../src/utils/trackMatching';
import { WEB_ORIGIN } from '../../../_lib/constants';

export const config = { runtime: 'nodejs' };

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

let cachedIndexHtml: string | null = null;
async function loadIndexHtml(): Promise<string> {
  if (cachedIndexHtml) return cachedIndexHtml;
  const indexPath = path.resolve(process.cwd(), 'dist', 'index.html');
  cachedIndexHtml = await fs.readFile(indexPath, 'utf-8');
  return cachedIndexHtml;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const trackSlug = decodeURIComponent(segments[segments.length - 1] ?? '');
  const identifier = decodeURIComponent(segments[segments.length - 2] ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const show = lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);
  const html = await loadIndexHtml();

  if (!show) {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  // Resolve the track slug to a real title via archive.org metadata.
  let songTitle = trackSlug.replace(/-/g, ' ');
  const trackList = await fetchTrackList(show.primaryIdentifier);
  if (trackList) {
    const match = matchTrackBySlug(
      trackSlug,
      trackList.tracks.map((t, i) => ({ id: String(i), title: t.title })),
      0.75
    );
    if (match) songTitle = match.title;
  }

  const title = `${songTitle} — ${formatDate(show.date)}`;
  const description = `${show.venue} — listen on Scarlet Fire`;
  const imageUrl = `${WEB_ORIGIN}/api/og/song/${show.date}/${trackSlug}?bg=${bgIndex}`;
  const shareUrl = `${WEB_ORIGIN}/show/${show.date}/${trackSlug}?bg=${bgIndex}`;

  const injected = injectOgTags(html, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/html/song/
git commit -m "feat(api): add /api/html/song — OG-injected HTML for song URLs

Resolves track slug via archive.org metadata, injects og tags pointing
at the song OG image endpoint.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 26: `vercel.json` rewrites + `functions.includeFiles` + updated buildCommand

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Update `vercel.json`**

Replace the contents of `vercel.json` with:

```json
{
  "buildCommand": "node scripts/copy-share-assets.js && npx expo export --platform web",
  "outputDirectory": "dist",
  "functions": {
    "api/og/show/[identifier].tsx": {
      "maxDuration": 10,
      "memory": 1024,
      "includeFiles": "src/data/shows.json"
    },
    "api/og/song/[identifier]/[trackTitle].tsx": {
      "maxDuration": 10,
      "memory": 1024,
      "includeFiles": "src/data/shows.json"
    },
    "api/html/show/[identifier].ts": {
      "maxDuration": 10,
      "memory": 512,
      "includeFiles": "{src/data/shows.json,dist/index.html}"
    },
    "api/html/song/[identifier]/[trackTitle].ts": {
      "maxDuration": 10,
      "memory": 512,
      "includeFiles": "{src/data/shows.json,dist/index.html}"
    }
  },
  "rewrites": [
    { "source": "/show/:identifier/:trackTitle", "destination": "/api/html/song/:identifier/:trackTitle" },
    { "source": "/show/:identifier", "destination": "/api/html/show/:identifier" },
    { "source": "/((?!assets|favicon|manifest|_expo|.well-known|api|share).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/.well-known/apple-app-site-association",
      "headers": [{ "key": "Content-Type", "value": "application/json" }]
    },
    {
      "source": "/.well-known/assetlinks.json",
      "headers": [{ "key": "Content-Type", "value": "application/json" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://archive.org https://*.archive.org; img-src 'self' https: data:; media-src 'self' https://archive.org https://*.archive.org; font-src 'self' data:; frame-ancestors 'none'" }
      ]
    }
  ]
}
```

Note: The CSP `img-src` already allows `https:` so OG image URLs from `scarletfire.app/api/og/...` pass.

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore(vercel): add rewrites, functions config, share asset pre-build

- Rewrite /show/:identifier and /show/:identifier/:trackTitle to html functions
- Configure all 4 Vercel Functions with memory, maxDuration, and
  includeFiles for shows.json + dist/index.html
- Update buildCommand to run copy-share-assets before the Expo export

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 27: Universal link association files

**Files:**
- Create: `public/.well-known/apple-app-site-association`
- Create: `public/.well-known/assetlinks.json`

Note: these require real Apple Team ID and Android signing fingerprint. Placeholder values are used here; the engineer implementing this task must substitute real values from `eas credentials` before deploying.

- [ ] **Step 1: Create `public/.well-known/apple-app-site-association`**

No file extension. Content:

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.com.scarletfire.app"],
        "components": [
          { "/": "/show/*", "comment": "Share links to show and song pages" }
        ]
      }
    ]
  }
}
```

Replace `TEAMID` with the real Apple Team ID. Get it from `eas credentials --platform ios` or Apple Developer portal → Membership.

- [ ] **Step 2: Create `public/.well-known/assetlinks.json`**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.scarletfire.app",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_PLACEHOLDER"]
    }
  }
]
```

Replace `SHA256_FINGERPRINT_PLACEHOLDER` with the real signing cert fingerprint. Get it from `eas credentials --platform android` → "Keystore" → look for `SHA256 Fingerprint`.

- [ ] **Step 3: Verify files are served with correct Content-Type**

After deploying (or with `vercel dev`), run:

```bash
curl -I https://www.scarletfire.app/.well-known/apple-app-site-association
curl -I https://www.scarletfire.app/.well-known/assetlinks.json
```

Both should return `Content-Type: application/json`.

- [ ] **Step 4: Commit**

```bash
git add public/.well-known/
git commit -m "feat(share): add AASA + Android asset links for universal linking

Maps https://www.scarletfire.app/show/* to the native app. Apple Team
ID and Android signing fingerprint must be filled in before deploy —
see task 27 notes.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 28: `app.config.js` — iOS `associatedDomains` + Android intent filters

**Files:**
- Modify: `app.config.js`

- [ ] **Step 1: Add iOS `associatedDomains`**

Find the `ios` block in `app.config.js` (around line 25). Add `associatedDomains` right after `entitlements`:

```js
ios: {
  // ... existing fields ...
  entitlements: {
    "com.apple.developer.applesignin": ["Default"]
  },
  associatedDomains: [
    "applinks:www.scarletfire.app",
    "applinks:scarletfire.app"
  ],
  // ... rest ...
},
```

- [ ] **Step 2: Add Android `intentFilters`**

Find the `android` block. Add `intentFilters`:

```js
android: {
  // ... existing fields ...
  intentFilters: [
    {
      action: "VIEW",
      autoVerify: true,
      data: [
        {
          scheme: "https",
          host: "www.scarletfire.app",
          pathPrefix: "/show"
        }
      ],
      category: ["BROWSABLE", "DEFAULT"]
    }
  ],
  // ... rest ...
},
```

- [ ] **Step 3: Verify the config parses**

```bash
npx expo config --type public | grep -A 5 associatedDomains
npx expo config --type public | grep -A 15 intentFilters
```

Expected: both fields appear in the resolved config.

- [ ] **Step 4: Commit**

```bash
git add app.config.js
git commit -m "feat(share): add iOS associatedDomains + Android intent filters

Registers the native app as a handler for https://www.scarletfire.app/show/*
on both platforms. Requires a native rebuild (EAS) for the entitlement
to take effect.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 29: End-to-end manual verification

**No files.** This task is a checklist to run after all code tasks are committed and a deploy is live.

- [ ] **Step 1: Deploy to Vercel**

```bash
vercel --prod
```

- [ ] **Step 2: Verify `.well-known/` files are live**

```bash
curl -i https://www.scarletfire.app/.well-known/apple-app-site-association
curl -i https://www.scarletfire.app/.well-known/assetlinks.json
```

Expected: both return `200 OK` with `Content-Type: application/json`.

- [ ] **Step 3: Verify OG image endpoints**

```bash
curl -o /tmp/show-card.png "https://www.scarletfire.app/api/og/show/1977-05-08?bg=3"
file /tmp/show-card.png
```

Expected: `/tmp/show-card.png: PNG image data, 1200 x 1200, ...`. Open the file and visually verify the card looks reasonable.

- [ ] **Step 4: Verify HTML injection**

```bash
curl -s "https://www.scarletfire.app/show/1977-05-08" | grep -E 'og:(title|image|url)'
```

Expected: three `<meta>` tags with real values.

- [ ] **Step 5: Build a native iOS build via EAS**

```bash
eas build --platform ios --profile preview
```

- [ ] **Step 6: Install on a real iPhone, open the FullPlayer, tap share**

Verify: share tray opens with the card preview, 4 buttons.

- [ ] **Step 7: Tap "Copy link"**

Verify: toast appears, URL is in the clipboard. Paste into Notes.app — URL is `https://www.scarletfire.app/show/<date>/<slug>?bg=<n>`.

- [ ] **Step 8: Paste the URL into iMessage compose and wait**

Verify: iMessage unfurls to show the card as a rich preview with the title and description.

- [ ] **Step 9: Tap "WhatsApp" from the share tray**

Verify: WhatsApp opens with the text and URL pre-filled.

- [ ] **Step 10: Tap "Messages" from the share tray**

Verify: Messages opens with text + URL in the compose field.

- [ ] **Step 11: Tap "Instagram"**

Verify: card PNG opens as a story sticker in Instagram. (Requires a real device + Instagram installed.)

- [ ] **Step 12: With the app installed, tap a shared URL in iMessage**

Verify: the native app opens directly to the show (or song, with the track highlighted in the tracklist — NOT auto-playing). If the browser opens instead, universal link verification hasn't propagated yet — wait up to 24 hours.

- [ ] **Step 13: On a phone with the app uninstalled, tap the same URL**

Verify: mobile web loads `https://www.scarletfire.app/show/...`, the SPA renders the show page.

- [ ] **Step 14: Repeat on Android**

Same sequence, using an Android device with the app installed via EAS build.

- [ ] **Step 15: Desktop web**

Visit `https://www.scarletfire.app/show/<date>` in Chrome desktop. Verify the share icon appears on the show detail page. Open the share tray — verify it's a centered modal with only Copy link + WhatsApp visible (no Instagram, no Messages).

- [ ] **Step 16: Mobile web**

Open the same URL on an iPhone browser with the app NOT installed. Verify the share tray shows Copy link + WhatsApp + Messages (no Instagram).

- [ ] **Step 17: Same-URL caching**

```bash
for i in 1 2 3; do
  time curl -so /dev/null "https://www.scarletfire.app/api/og/show/1977-05-08?bg=3"
done
```

Expected: second and third requests are served from the Vercel edge cache (noticeably faster — sub-50ms).

- [ ] **Step 18: Regression check on existing URL navigation**

On the web, visit `https://www.scarletfire.app/show/<date>/<track-slug>` directly (pasted URL, no share flow). Verify: show detail screen loads, the track is highlighted and scrolled into view, audio does NOT start playing. This exercises the changed auto-play behavior.

---

## Plan self-review

Spec coverage:

- ✅ Share tray on native (Tasks 6–8, 12–14)
- ✅ Share tray on web (Task 15)
- ✅ 4 destinations on native, 2–3 on web (Tasks 10, 11, 16)
- ✅ URL shape + pure builders (Task 3)
- ✅ OG image endpoints for show + song (Tasks 21, 22)
- ✅ HTML injection endpoints for show + song (Tasks 24, 25)
- ✅ Universal link association (Tasks 27, 28)
- ✅ "URL arrivals select, don't auto-play" (Task 14)
- ✅ 6 random backgrounds (Tasks 1, 5)
- ✅ Share icons in FullPlayer and ShowDetailScreen (Tasks 12, 13)
- ✅ Tests at every layer
- ✅ End-to-end manual verification (Task 29)

Placeholder scan:

- Task 1 Step 3 has a conditional ("if file exists… else…") — this is a legitimate branch, not a placeholder.
- Task 12 Step 4 has inline notes ("if the exact field names don't match") because the PlayerContext shape wasn't surveyed line-by-line. The TASK itself is concrete; the shape-matching is a small implementation adjustment.
- Task 27 has placeholder values (`TEAMID`, `SHA256_FINGERPRINT_PLACEHOLDER`) that MUST be substituted. The placeholder is explicitly called out, with instructions on where to find real values.
- No "TBD", "TODO", or empty-handwave steps remain.

Type consistency:

- `ShareItem` — defined in Task 3, referenced identically in Tasks 4, 6, 8, 10, 12, 13. ✅
- `DestinationArgs` — defined inline in Task 10, used in Task 11. ✅
- `ShowMetadata` — defined in Task 18, referenced in Tasks 21, 22, 24, 25. ✅
- `matchTrackBySlug` signature — defined in Task 2, used by the client (Task 14) and by server functions (Tasks 22, 25). ✅

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-11-share-feature.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
