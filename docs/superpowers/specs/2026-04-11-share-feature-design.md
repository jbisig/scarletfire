# Share Feature — Design Spec

**Date:** 2026-04-11
**Status:** Approved for implementation planning
**Owner:** Jesse Bisignano

## Goal

Let users share Grateful Dead shows and songs from the Scarlet Fire app. Shared links open in the native app if installed, otherwise load the show page on the web build. Shares sent to chat apps (iMessage, WhatsApp) unfurl with a beautiful square card image — one of six randomly-selected backgrounds, with the show/song metadata overlaid — matching the visual treatment users expect from Spotify-style shares.

## Non-goals

- User-authored captions or messages on top of the share text
- Share history or analytics (outside a minimal log for function errors)
- Sharing playlists (none exist)
- Sharing to arbitrary system share sheets beyond the four destinations in the Figma (Copy link, WhatsApp, Instagram, Messages)
- Per-track ratings in any new data model — use what already exists in the codebase

## User stories

1. While listening to a song in the FullPlayer, a user taps a share icon top-right (opposite the collapse chevron), a bottom sheet slides up showing a square preview card for the current song, and four destination buttons. Tapping one initiates the share.
2. While viewing a show's detail page, a user taps a share icon top-right (opposite the back button), a similar bottom sheet slides up showing a preview card for the show, and four destinations.
3. A recipient on WhatsApp/iMessage sees a rich preview: the generated card as the unfurl image, the show/song title, and a short description.
4. A recipient with the app installed who taps the link has the native app open directly to the show detail page (and for song shares, the track is visually selected in the tracklist — not auto-played).
5. A recipient without the app who taps the link on mobile or desktop web lands on the show detail page in the existing web build.

## High-level architecture

Three subsystems in one URL space.

### 1. Mobile + web client

- A reusable `ShareTray` bottom sheet (native) / modal dialog (web) that takes a `ShareItem` descriptor and renders the preview card + destination buttons.
- A shared `shareService.ts` with pure TypeScript URL and text builders; platform splits (`.native.ts`, `.web.ts`) for destination handlers.
- A global `useShareSheet` hook backed by a provider mounted at the app root, so `FullPlayer` and `ShowDetailScreen` can open the tray without owning the sheet themselves.
- Share icons added to `FullPlayer.tsx` and `ShowDetailScreen.tsx` headers (top-right, empty corner across from the existing back/collapse button).

### 2. Backend (Vercel Functions)

Three new endpoints alongside the existing static Expo web export:

- **`/api/og/show/[identifier]`** — returns a 1200×1200 PNG of the show share card, rendered server-side with `@vercel/og` (Satori). Cached immutably at the edge; same URL produces the same image forever.
- **`/api/og/song/[identifier]/[trackTitle]`** — same shape for song shares.
- **`/api/html/show/[identifier]`** and **`/api/html/song/[identifier]/[trackTitle]`** — intercept requests to `/show/:identifier` and `/show/:identifier/:trackTitle?` paths, load show metadata from the bundled `shows.json` catalog and (for song cards) from the Internet Archive metadata API, inject populated `og:*` / `twitter:*` meta tags into a copy of `dist/index.html`, and return it. The SPA then hydrates normally for real browsers.

The share URL is the show page URL — there is no intermediate `/share/...` landing page. Crawlers (WhatsApp, iMessage) and real browsers hit the same URL; the HTML function serves them both.

### Source of show metadata inside Vercel Functions

**No Supabase in functions** — this codebase doesn't use Supabase for show data. Show metadata lives in two existing places:

1. **`src/data/shows.json`** — static catalog bundled with the app. Contains the year → shows mapping with `primaryIdentifier`, `date`, `venue`, and `classicTier` for every show. Already used by `webLinking.ts` for URL stringification; available at function build time.
2. **Internet Archive metadata API** — `https://archive.org/metadata/<archiveIdentifier>` returns full show detail including the track list. Used by `src/services/archiveApi.ts` at runtime.

The HTML injection and OG image functions use both:
- Read the show entry from the bundled `shows.json` (no network call) for date/venue/tier.
- For song cards, additionally fetch `archive.org/metadata/<archiveIdentifier>` once (cached at the Vercel edge for 1h via `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`) to resolve the track slug to a real track title.

`src/data/shows.json` is included in each function's bundle via `functions.includeFiles` in `vercel.json`.

### 3. Universal link association

- `public/.well-known/apple-app-site-association` declares the app's `applinks` for `/show/*`.
- `public/.well-known/assetlinks.json` declares Android digital asset links for the same paths.
- `app.config.js` adds the iOS `associatedDomains` entitlement and Android intent filters so the native apps register as handlers for `https://www.scarletfire.app/show/*`.

## URL shape (single source of truth)

```
https://www.scarletfire.app/show/<date>?bg=<1-6>
https://www.scarletfire.app/show/<date>/<track-slug>?bg=<1-6>
```

- `<date>` is the show's date in ISO format (e.g. `1982-08-06`). This is what `src/navigation/webLinking.ts` already uses for its `stringify.identifier` — `identifierToDate[id] || id` maps archive identifiers like `gd1982-08-06.sbd.miller.110987.flac16` to `1982-08-06` in URLs.
- `<track-slug>` is the track title lower-cased with spaces replaced by hyphens (`encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))` — the existing `stringifyTrackTitle` convention in `webLinking.ts`).
- `bg` is chosen randomly (1–6) by the client when the share tray opens. The same value is passed to the OG image endpoint, so the preview the sender sees in the tray matches the unfurl the recipient sees in chat. The SPA never reads `bg`; it's only meaningful to the OG image endpoint.
- Route path is `/show/:identifier/:trackTitle?` — **singular `show`, not plural** — matching the existing `showDetailRoute` in `webLinking.ts`.

## Data flow

### Share a song (native)

1. User is listening to "Franklin's Tower" from `gd1982-08-06.sbd.miller.110987.flac16`; taps the share icon in `FullPlayer`.
2. `FullPlayer` assembles a `ShareItem` from its current state: `{ kind: 'song', showId, trackId, trackTitle, trackSlug, date, venue, rating }`.
3. Calls `openShareTray(item)` from `useShareSheet`.
4. Provider mounts the native `ShareTray`, which:
   - Picks a random `bg` (1–6) via `pickRandomBackground()`.
   - Renders the `ShareCard` preview with the corresponding local background — a static `require()` map against the renamed files in `assets/share_images/` (bundled with the app) — plus the logo and text.
   - Renders four destination buttons.
5. User taps WhatsApp. The handler:
   - Builds the URL via `buildShareUrl(item, bg)`.
   - Builds the share text via `buildShareText(item)`.
   - Calls `Linking.openURL('whatsapp://send?text=' + encodeURIComponent(text + ' ' + url))`.
6. WhatsApp opens with the text pre-filled; its crawler will hit the URL and fetch the OG image for the unfurl.

### Open a shared song URL (recipient)

1. Crawler (or user) hits `https://www.scarletfire.app/show/1982-08-06/franklin-s-tower?bg=3`.
2. Vercel's rewrite matches `/show/:identifier/:trackTitle` and routes to `/api/html/song/[identifier]/[trackTitle]`.
3. The function:
   - Parses `bg=3` from the query string.
   - Looks up the show in the bundled `shows.json` catalog (by date → `primaryIdentifier` + `date` + `venue` + `classicTier`).
   - Fetches `https://archive.org/metadata/<archiveIdentifier>` to get the track list (for resolving the track slug to a real title). Response is edge-cached by Vercel.
   - Fuzzy-matches `franklin-s-tower` to a track in the show using the shared `trackMatching` utility.
   - Reads `dist/index.html` from disk.
   - Injects `og:image = https://www.scarletfire.app/api/og/song/gd1982-08-06.../franklin-s-tower?bg=3`, `og:title = Franklin's Tower`, `og:description = Sound City Recording Studios · 08/06/1982`, and the corresponding `twitter:*` tags.
   - Returns the HTML with `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
4. A crawler stops here, uses the `og:*` tags, and fetches the OG image separately.
5. A real browser continues loading; the SPA bundle hydrates.
6. The SPA router sees `/show/:identifier/:trackTitle`, mounts `ShowDetailScreen`, passes `trackTitle` (and `bg=3`, which is ignored by the client — it's only meaningful to the OG image endpoint).
7. `ShowDetailScreen`'s existing "auto-play from URL slug" effect (`ShowDetailScreen.tsx:242`) is replaced: instead of calling `loadTrack(bestMatch, ...)`, it calls `selectAndScrollToTrack(bestMatch)`. This change is unconditional — applies to every URL-driven arrival on a `/show/:identifier/:trackTitle` route, whether from a share link, a pasted URL, or any future deep link. Per brainstorm Section 3, we deliberately converged on a single mental model: URL-driven navigation selects a track; only explicit user interaction (tapping play) starts audio.
8. Track row is highlighted and scrolled into view. Audio does not start playing.
9. When the recipient taps Play on that row (or on the big play button for the show), normal playback begins.

### Open a shared URL on a native device with the app installed

1. Crawler unfurl flow is identical to above.
2. When the user taps the link in iMessage (iOS) or a browser (Android), the OS checks the universal link table:
   - iOS: matches `www.scarletfire.app` in the app's `associatedDomains` + `/show/*` in the AASA → launches app.
   - Android: matches `www.scarletfire.app` + `/shows` prefix in the app's intent filter → launches app.
3. The app opens with a `Linking.getInitialURL()` or an event for the incoming URL.
4. Native linking config routes the URL to `ShowDetailScreen` with the right params (`identifier`, optional `trackSlug`; `bg` is ignored by the client).
5. Inside the app, the same "URL-driven arrival → select, don't play" behavior from the recipient flow above applies — no share-specific branching.

## Component inventory

### New files

| Path | Purpose |
|---|---|
| `src/components/share/ShareTray.tsx` | Shared container that composes `ShareCard` + buttons; imports platform-specific destination handlers from `shareService` |
| `src/components/share/ShareTray.native.tsx` | Native implementation using `@gorhom/bottom-sheet` |
| `src/components/share/ShareTray.web.tsx` | Web implementation: modal dialog (desktop) / bottom-sheet-style portal (mobile web) |
| `src/components/share/ShareCard.tsx` | Cross-platform square preview card matching the Figma |
| `src/components/share/ShareButton.tsx` | Single circular destination button (icon + label + bg color) |
| `src/contexts/ShareSheetContext.tsx` | Provider + `useShareSheet` hook |
| `src/services/shareService.ts` | Pure TS: `buildShareUrl`, `buildShareText`, `pickRandomBackground`, `ShareItem` type |
| `src/services/shareService.native.ts` | Native destination handlers (copy/whatsapp/instagram/messages) |
| `src/services/shareService.web.ts` | Web destination handlers |
| `src/utils/trackMatching.ts` | Extracted from `ShowDetailScreen.tsx` (including the locally-defined `calculateSimilarity` at lines 86–113, plus the match loop at lines 247–258). Pure TS, used by the client, the test suite, and — via a relative import — the Vercel functions that render song cards. |
| `api/og/show/[identifier].tsx` | `@vercel/og` endpoint for show cards |
| `api/og/song/[identifier]/[trackTitle].tsx` | `@vercel/og` endpoint for song cards |
| `api/html/show/[identifier].ts` | HTML-with-injected-OG endpoint for show URLs |
| `api/html/song/[identifier]/[trackTitle].ts` | HTML-with-injected-OG endpoint for song URLs |
| `api/_lib/showLookup.ts` | Pure TS: given a date or identifier, reads from the bundled `shows.json` and returns `{ primaryIdentifier, date, venue, classicTier }` |
| `api/_lib/fetchTrackList.ts` | Fetches `https://archive.org/metadata/<id>` and returns the track list; used by song-card functions |
| `api/_lib/ogTemplate.tsx` | Shared Satori/JSX card templates (show + song variants) |
| `api/_lib/injectOgTags.ts` | Pure function: `(html, tags) => html` |
| `public/.well-known/apple-app-site-association` | iOS universal link file (no extension) |
| `public/.well-known/assetlinks.json` | Android digital asset links |
| `assets/share_images/bg-1.png` … `bg-6.png` | Six card backgrounds, renamed in place from the existing `Screenshot *.png` files. Consumed by the native client via `require()`. |
| `assets/share_images/logo.png` | Card logo, renamed in place from `share-logo.png`. |
| `public/share/bg-1.png` … `bg-6.png`, `logo.png` | Copies of the above, published to the web build so Vercel can serve them at `https://www.scarletfire.app/share/*.png`. Copied by a pre-build script (`scripts/copy-share-assets.js`), invoked from `vercel.json`'s `buildCommand`. This avoids drift — there's one canonical source in `assets/share_images/`, and the web output is derived from it. |

### Modified files

| Path | Change |
|---|---|
| `src/components/FullPlayer.tsx` | Add share icon (top-right header) that calls `openShareTray({ kind: 'song', ... })` |
| `src/screens/ShowDetailScreen.tsx` | Add share icon (top-right header). Replace `loadTrack` at line 260 with `selectAndScrollToTrack` when `bg` query param is present. Extract the fuzzy match into `src/utils/trackMatching.ts` and import. |
| `src/components/TrackItem.tsx` | Accept `isSelected` prop; render a sustained background highlight when true |
| `App.tsx` | Mount `<ShareSheetProvider>` near the root |
| `app.config.js` | Add iOS `associatedDomains` entitlement and Android universal link intent filters |
| `vercel.json` | Add rewrites for `/show/*` → HTML functions, `/.well-known/*`, `/api/*`, `/share/*`. Update the SPA catch-all to exclude the new prefixes. Declare `functions` block for the `api/*` handlers. Update `buildCommand` to run `node scripts/copy-share-assets.js && npx expo export --platform web`. |
| `package.json` | Add `@vercel/og`, `@gorhom/bottom-sheet`, `react-native-reanimated` (required by bottom-sheet), `expo-clipboard`, `expo-linking`, `expo-file-system`, `expo-sharing`. None of these are currently installed; `react-native-gesture-handler ^2.30.0` already is. |

### New scripts

| Path | Purpose |
|---|---|
| `scripts/copy-share-assets.js` | Copies `assets/share_images/{bg-1..6,logo}.png` → `public/share/` before the Expo web export runs. Idempotent. |

### Cleanup

The 6 existing `Screenshot YYYY-MM-DD at H.MM.SS AM 1.png` files in `assets/share_images/` are renamed to `bg-1.png … bg-6.png` (alphabetical order → numerical order). `share-logo.png` is renamed to `logo.png`. The `assets/share_images/` directory itself is retained.

## The `ShareItem` data model

```ts
type ShareItem =
  | {
      kind: 'show';
      showId: string;             // existing identifier, e.g. "gd1982-08-06.sbd.miller..."
      date: string;               // "1982-08-06"
      venue: string;              // "Sound City Recording Studios"
      tier: 1 | 2 | 3 | null;     // classicTier — drives star count
    }
  | {
      kind: 'song';
      showId: string;
      trackId: string;            // the existing track.id from the show's track list
      trackTitle: string;         // "Franklin's Tower"
      trackSlug: string;          // "franklin-s-tower" — used for URL building
      date: string;
      venue: string;
      rating: 1 | 2 | 3 | null;   // trackRating ?? classicTier
    };
```

All data is passed in at tray open time. The tray does no async fetching, has no loading state, opens instantly.

## Share tray layout

Matches the Figma (`138:287` and `138:324` in `u59O6n76KYop9NxIuJ8iLM`):

- Dark bottom sheet, `#1f1f1f` bg, 115px top corner radius, centered drag handle (54×6, `#b3b3b3`)
- 51px inset padding around content
- Square `ShareCard` (600×600 at design scale, 1:1 aspect at runtime), 64px radius, dark bg
- Card has:
  - Scarlet Fire logo top-left (~93×103 design units)
  - One of 6 backgrounds filling behind the content
  - Text bottom-left: title (32px), subtitle row with venue (22px), info row (date/stars depending on kind)
- Label "Share this song" or "Share this show" (26px) below the card
- Row of 4 destination buttons: ~82px wide, circular (~76×78), icon 36px, label below
  - Copy link — gray `#343434`
  - WhatsApp — green `#25d366`
  - Instagram — gray `#343434` (minimal, no IG gradient)
  - Messages — green `#3ddd57`

### Show card content

- Title line: formatted date (e.g. `08/06/1982`)
- Subtitle: venue name
- Info row: star row (1–3 stars depending on `classicTier`)

### Song card content

- Title line: track title ("Franklin's Tower")
- Subtitle: venue name
- Info row: formatted date + star row (track rating, fall back to classicTier)

## Server-side card rendering (`@vercel/og`)

The Satori template lives in `api/_lib/ogTemplate.tsx` and exports two JSX variants. Background is referenced by absolute URL (`https://www.scarletfire.app/share/bg-${n}.png`) so Satori can inline it. Logo same.

```tsx
// Sketch — not final code
export function showCard(props: ShowCardProps) {
  return (
    <div style={{ width: 1200, height: 1200, display: 'flex', position: 'relative', borderRadius: 128, overflow: 'hidden', background: '#121212' }}>
      <img src={props.bgUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <img src={props.logoUrl} style={{ position: 'absolute', top: 96, left: 96, width: 186 }} />
      <div style={{ position: 'absolute', bottom: 96, left: 96, display: 'flex', flexDirection: 'column', gap: 22, color: 'white' }}>
        <span style={{ fontSize: 64, fontWeight: 500 }}>{props.title}</span>
        <span style={{ fontSize: 44, fontWeight: 500 }}>{props.subtitle}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {props.date && <span style={{ fontSize: 44, fontWeight: 500 }}>{props.date}</span>}
          {renderStars(props.tier)}
        </div>
      </div>
    </div>
  );
}
```

Font: either package `Familjen_Grotesk` via `@vercel/og`'s font loader, or fall back to Satori's default if the font file isn't easily included. Acceptable trade-off — the card is legible either way and recipients won't notice.

## HTML injection function

```ts
// api/_lib/injectOgTags.ts — sketch
export function injectOgTags(html: string, tags: OgTags): string {
  const metaTags = [
    `<meta property="og:type" content="music.song">`,
    `<meta property="og:url" content="${escape(tags.url)}">`,
    `<meta property="og:title" content="${escape(tags.title)}">`,
    `<meta property="og:description" content="${escape(tags.description)}">`,
    `<meta property="og:image" content="${escape(tags.imageUrl)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="1200">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escape(tags.title)}">`,
    `<meta name="twitter:description" content="${escape(tags.description)}">`,
    `<meta name="twitter:image" content="${escape(tags.imageUrl)}">`,
  ].join('\n');

  // Replace existing <title> and append meta tags inside <head>
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(tags.title)}</title>`)
    .replace('</head>', `${metaTags}\n</head>`);
}
```

Pure function, trivially testable, no dependencies.

## Destination handlers

### Native (iOS + Android)

| Destination | Implementation |
|---|---|
| Copy link | `Clipboard.setStringAsync(url)` + haptic success + toast "Link copied" |
| WhatsApp | `Linking.openURL('whatsapp://send?text=' + encodeURIComponent(text + ' ' + url))`. Fallback to `https://wa.me/?text=...` if `Linking.canOpenURL` returns false. |
| Instagram Story | Download `imageUrl` to local cache via `expo-file-system`, then use `react-native-share` (or a native intent) to share to `instagram-stories://share` (iOS) / `com.instagram.share.ADD_TO_STORY` (Android). IG opens with the card as a story sticker. Fallback: open App Store / Play Store if not installed. |
| Messages | iOS: `Linking.openURL('sms:&body=' + encodeURIComponent(...))`. Android: `Linking.openURL('smsto:?body=' + ...)`. |

The Instagram Story flow requires `Info.plist` `LSApplicationQueriesSchemes` to include `instagram-stories`. May also need a Meta Facebook App ID in entitlements — to be verified during implementation against current Instagram documentation, since this has changed repeatedly over the years.

### Web

| Destination | Desktop (`>=1024px`) | Mobile web (`<768px`) |
|---|---|---|
| Copy link | `navigator.clipboard.writeText(url)` + toast | same |
| WhatsApp | `window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank')` | same |
| Instagram | **Hidden** | **Hidden** |
| Messages | **Hidden** | `window.location.href = 'sms:?body=' + encodeURIComponent(text + ' ' + url)` |

Desktop web shows 2 buttons in the tray; mobile web shows 3. The tray layout reflows to distribute the available buttons. This is a deliberate departure from the 4-button Figma (which is native-only).

## URL handling in the SPA

- `ShowDetailScreen` already reads `identifier` and `trackTitle` from route params (native linking config + web routing).
- The existing "auto-play from URL slug" effect at `ShowDetailScreen.tsx:242–263` is changed unconditionally: replace the `loadTrack(bestMatch, ...)` call with `selectAndScrollToTrack(bestMatch)`. This applies to every URL-driven arrival with a `trackTitle` param, regardless of whether the URL came from a share link, a pasted URL, a bookmark, or a future deep link. One behavior, no branching on share-specific markers.
- `selectAndScrollToTrack`:
  - Stores the selected track ID in local state.
  - Scrolls the tracklist (FlatList or ScrollView) so that track row is visible.
  - Passes `isSelected={true}` to the corresponding `TrackItem`, which renders a sustained background tint.
- The selection state is cleared on navigation away from the screen. Tapping play on the selected row (or the show's big play button) starts normal playback.
- The `bg` query param is never read by the SPA — it exists only so that OG image URLs are deterministic and cacheable, and so the sender's in-tray preview matches the chat recipient's unfurl.

## Assumptions locked in

- The share URL uses the existing `showDetailRoute` in `webLinking.ts`: `/show/:identifier/:trackTitle?` where `identifier` is the show's date (per the existing `identifierToDate` stringifier). This avoids changing any URL routing; the SPA already handles it.
- The 6 background images in `assets/share_images/` are the intended "random card background" set. They will be renamed to `bg-1..bg-6.png` in alphabetical order of their current filenames and moved to `public/share/`.
- `share-logo.png` is the correct card logo asset.
- `Familjen Grotesk Medium` is the target font for both in-app previews and the server-rendered card. If the font file isn't easily bundled with the Vercel function, fall back to Satori's default sans-serif. The spec doesn't block on this.
- The track "rating" for song cards uses the existing `performance.rating` field from `ShowDetailScreen.tsx:178`, with show `classicTier` as the fallback.
- Functions do not use Supabase. Show catalog comes from the bundled `src/data/shows.json` (included in each function via `functions.includeFiles`); track lists come from `https://archive.org/metadata/<identifier>` with edge caching.
- Bottom sheet library: `@gorhom/bottom-sheet`. Dependency health checked during implementation — it's the de facto standard in the Expo ecosystem.
- iOS Team ID and Android signing SHA-256 will be supplied at implementation time (they live in EAS credentials, not in the repo).

## Deferred

- Capturing share events for analytics (e.g. how many shows get shared, which destinations are most popular). No analytics infra exists in the app; adding it is out of scope for this feature.
- Support for arbitrary native share sheet ("Share via…" system picker) in addition to the four curated destinations.
- Sharing individual playlists, setlists, SOTD archive entries.
- Localization of the share text. The feature ships English-only.
- Deep-linking to a specific timestamp within a track.

## Risks and open questions

1. **Instagram Story flow on Android** is historically finicky — Android's content provider sharing model has changed across OS versions. The fallback "IG not installed → open Play Store" is straightforward; the forward path has to be tested on a physical Android device.
2. **Familjen Grotesk font in `@vercel/og`** — the font file needs to be bundled into the function deployment. If the size or licensing makes this awkward, the server card falls back to Satori default. Acceptable.
3. **Universal link verification delay** — after the AASA and assetlinks files are live, Apple/Google's servers need to recrawl them before the native app actually intercepts links. Typically <24h. During this window, shared URLs on devices with the app installed will open in the browser instead of the app. Not a regression because the feature doesn't exist yet.
4. **Internet Archive metadata latency** — for song card URLs, the function fetches `archive.org/metadata/<id>` once per uncached URL. At edge cache with `s-maxage=3600` + SWR, this is negligible after the first hit. Show card URLs never touch the network (catalog is in the bundled `shows.json`).
5. **The fuzzy match for track slugs** in `trackMatching.ts` could mis-map a slug to the wrong track on shows with near-duplicate titles. The existing in-app auto-play code already has this risk; extracting to a shared utility doesn't make it worse, but the function's fallback card behavior (generic card if the match fails) handles this cleanly on the server side.

## Testing strategy

Scaled to risk; see Brainstorm Section 6 for the full list. Summary:

- **Unit**: `shareService` builders (URL + text), `trackMatching`, `injectOgTags`
- **Integration (mocked)**: native destination handler dispatch (`shareService.native.test.ts`)
- **Component (RNTL)**: `ShareTray` renders correct buttons per item kind; button taps invoke correct handlers
- **Backend**: `api/og/*` returns 200 PNG for valid inputs, fallback for invalid; `api/html/*` returns HTML with correct meta tags
- **Manual verification checklist** (run at the end of implementation): unfurl in iMessage, WhatsApp, desktop chat; tap-to-open with app installed on iOS and Android; tap-to-open without app; verify share song does not auto-play; verify same-URL caching of OG image

Not tested: Satori-vs-RN visual parity (manual only), universal link activation (requires Apple/Google crawl), `@gorhom/bottom-sheet`'s gesture behavior.

## Implementation phases

The writing-plans skill will sequence this, but the natural phase order is:

1. **Foundation**: rename/move background assets, add `@vercel/og` and `@gorhom/bottom-sheet` deps, scaffold the directory structure, extract `trackMatching.ts` with tests.
2. **Shared services**: `shareService.ts` builders, `ShareItem` type, `ShareSheetContext`.
3. **Native UI**: `ShareCard`, `ShareButton`, `ShareTray.native.tsx`, wire up FullPlayer and ShowDetailScreen share icons. Test with copy-link (simplest destination).
4. **Native destinations**: WhatsApp, Messages, Instagram Story (hardest last).
5. **ShowDetailScreen selection change**: replace auto-play with select-and-scroll, add `isSelected` to `TrackItem`.
6. **Web UI**: `ShareTray.web.tsx`, web destinations.
7. **Backend — OG images**: `api/og/show` and `api/og/song` endpoints with the Satori template. Test with direct URL hits.
8. **Backend — HTML injection**: `api/html/show` and `api/html/song`, `vercel.json` rewrites, `injectOgTags` utility.
9. **Universal links**: `.well-known/` files, `app.config.js` entitlements, native linking config wiring.
10. **End-to-end manual verification**: the checklist above, on real devices.

## Related files

- Brainstorm transcript: this conversation
- Figma designs: `u59O6n76KYop9NxIuJ8iLM` nodes `138:287` (share song), `138:324` (share show)
- Figma account: user's — file not accessible via MCP under Claude's own auth; user fetched inline during brainstorm
