# Code Review Punch List — Implementation Plan

Source: four-dimension code review (performance, DRY, security, general quality) run 2026-07-06.
Execution: subagent-driven development, one task per dispatch, sequential, on branch `fix/code-review-punch-list`.

## Global Constraints

- `npm run typecheck` must pass after every task from Task 3 onward (Tasks 1–2 establish it). `npx jest` must pass after every task.
- Never add `@ts-ignore`, `@ts-expect-error`, or `any` in new code. Do not remove existing ones unless the task says so.
- Use `logger` from `src/utils/logger.ts` — never `console.*` — in src/.
- Use theme constants from `src/constants/theme.ts` (COLORS, SPACING, RADIUS) instead of literals where they exist.
- Respect the platform-split pattern: `.native.ts` / `.web.ts` pairs with shared types. Web-only code must not import native modules and vice versa.
- No new npm dependencies without controller approval.
- SQL changes are migration FILES under `supabase/` only — never applied to any live database.
- Preserve existing behavior except where the task explicitly states a bug fix; each stated bug fix is intentional behavior change.
- One commit (or a few logical commits) per task, descriptive message, ending with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- The repo has a `.worktrees/` directory with stale copies — never read from or write to it.

## Task 1: Restore verification guardrails (tsconfig, jest, scripts)

**Problem:** `npx tsc --noEmit` produces 60 errors, 31 of which are TS2307 "Cannot find module '../services/hapticService'" etc. because `tsconfig.json` lacks `moduleSuffixes`, so TypeScript cannot resolve the project's own `.native.ts`/`.web.ts` platform-split files. Bare `npx jest` fails 26 suites because it crawls stale `.worktrees/` copies. `package.json` has no `typecheck` or `lint` script, so nothing gates any of this.

**Do:**
1. In `tsconfig.json` `compilerOptions`, add `"moduleSuffixes": [".ios", ".android", ".native", ""]`. (Native-first: the app's primary target is native; `.web.ts` files are resolved by Metro at build time. If any file only exists as `.web.ts` with no `.native.ts`/base counterpart and this breaks resolution, report it rather than adding `.web` to the list.)
2. In the jest config (in `package.json` or `jest.config.*` — find it), add `testPathIgnorePatterns` (and `modulePathIgnorePatterns` if needed) for `/.worktrees/`.
3. Add scripts to `package.json`: `"typecheck": "tsc --noEmit"`, `"test": "jest"` (if absent or wrong). If an eslint config exists, add `"lint": "eslint src"`; if none exists, skip lint entirely (do NOT introduce eslint setup — out of scope).
4. Run `npx jest` — must be green (26 suites / 191 tests expected). Run `npm run typecheck` — record the remaining error count and list in your report (do NOT fix them; that's Task 2). Expect roughly 29 real errors remaining.

**Verify:** jest green; typecheck runs and reports only real (non-TS2307-platform-split) errors.

## Task 2: Burn down the real TypeScript errors

**Problem:** After Task 1, ~29 genuine type errors remain. Known examples: `src/components/FullPlayer.tsx:540` passes `"cast"` — not a valid Ionicons glyph name (renders a broken icon at runtime); `src/components/FullPlayer.tsx:124` implicit `any`; `src/components/AnimatedSearchBar.tsx:115` invalid style props.

**Do:**
1. Run `npm run typecheck`, fix every error properly — no `@ts-ignore`, no `as any`. For the Ionicons `"cast"` name, find the correct glyph (check `@expo/vector-icons` Ionicons glyphmap; likely a MaterialIcons `cast` icon was intended — pick the visually correct icon and note the choice).
2. For web-only style props that TS rejects (a known cluster behind existing `@ts-ignore`s), create one small typed helper `src/utils/webStyle.ts` (e.g. `webStyle(style: Record<string, unknown>): any` narrowly typed and documented as the single escape hatch for CSS-only props) and use it where you touch those errors. Remove an existing `@ts-ignore` only where your fix makes it dead.
3. Full suite + typecheck green.

**Verify:** `npm run typecheck` exits 0. `npx jest` green.

## Task 3: Fix AuthContext dropping all auth events after the first

**Problem:** `src/contexts/AuthContext.tsx:150-160` gates the Supabase `onAuthStateChanged` subscription callback with `if (!hasResolved)`, which permanently flips true after the first event. Subsequent events (SIGNED_OUT on failed token refresh, USER_UPDATED, cross-tab sign-out on web — see `src/services/authService.native.ts:210-224`) never reach the reducer. If a session expires while the app is open, the UI shows the user as signed in while every Supabase write silently fails.

**Do:**
1. Restructure so the subscription ALWAYS dispatches auth state changes to the reducer. Keep `hasResolved` (or equivalent) only for its legitimate purpose: resolving the initial-loading timeout race so a slow first event doesn't leave the splash state stuck.
2. Make sure explicit `loginWith*`/`logout` paths don't double-dispatch in a way that causes visible flicker (idempotent reducer updates are fine).
3. Add a unit test for the context or the reducer covering: initial resolve, then a later SIGNED_OUT event actually clears the user. Follow existing test patterns in `src/__tests__/` / co-located tests.

**Verify:** new test red before fix (TDD), green after; full suite + typecheck green.

## Task 4: Index song performance ratings with a lazy Map

**Problem:** `getSongPerformanceRating` in `src/data/songPerformanceRatings.ts` (~line 22051) linearly scans `ALL_RATED_SONG_PERFORMANCES` (2,752 entries) calling `normalizeSongTitleForLookup` — a ~20-regex chain — on every candidate, per call. It is called unmemoized in render bodies of song rows (`src/screens/FavoritesScreen.tsx:83`, `src/screens/PublicProfileScreen.tsx:141`, `src/components/SongCard.tsx:37`). A miss scans everything: ~55k regex executions per row render.

**Do:**
1. Build a lazily-initialized `Map<string, tier>` keyed on `` `${normalizedTitle}|${date}` `` (or whatever the existing match semantics are — read the current comparison logic carefully and preserve exact match behavior, including any date-format nuances). Normalize each stored title exactly once at index build. Model it on the existing `releasesByDateMap` pattern in `src/data/officialReleases.ts`.
2. `getSongPerformanceRating` becomes: normalize the query title once → single Map lookup. Public signature unchanged.
3. Add a unit test: pick 3–5 real entries from the dataset (different tiers) and assert lookups return the same tier as before; assert a miss returns whatever the current miss value is (undefined/null).

**Verify:** TDD evidence; full suite + typecheck green.

## Task 5: One WebVideoBackground component; dedupe resolveVideoUri; fix PlayerBar playback rate

**Problem (two duplication clusters, one live bug):**
- The web HTML5 `<video>` background is copy-pasted 5×: `src/screens/ShowDetailScreen.tsx:59-85`, `src/screens/DiscoverLandingScreen.tsx:56-82`, `src/components/web/PlayerBar.tsx:14-39`, and inline `React.createElement('video', …)` in `src/components/FullPlayer.tsx:467-482` and `src/components/MiniPlayer.tsx:99-114`. All share: autoPlay/loop/muted/playsInline, ref callback with onerror fallback + 5s `readyState === 0` timeout, absolute-fill style. **Bug:** PlayerBar's copy omits `el.playbackRate = 0.5`; the other four set it — the desktop player bar video plays at full speed.
- `resolveVideoUri` has a canonical util at `src/utils/resolveVideoUri.ts` but three byte-for-byte local re-declarations: `FullPlayer.tsx:41-49`, `ShowDetailScreen.tsx:48-56`, `DiscoverLandingScreen.tsx:45-53`.

**Do:**
1. Create `src/components/shared/WebVideoBackground.tsx` (web-only usage; keep it a plain component guarded by the existing platform checks at call sites — follow how `src/components/shared/BlurBackground.tsx` handles platform splits) with props `{ uri, videoKey/videoId, onError?, playbackRate?: number }`, `playbackRate` defaulting to `0.5`. Preserve the onerror-fallback + 5s readyState timeout behavior exactly.
2. Replace all five copies with it. PlayerBar now inherits the 0.5 rate — intentional bug fix.
3. Delete the three local `resolveVideoUri` clones; import from `src/utils/resolveVideoUri`.
4. Note: `src/components/shared/VideoBackground.tsx` exists and renders a gradient on web — do NOT merge it; just leave a one-line comment in it pointing at WebVideoBackground if the relationship is confusing.

**Verify:** typecheck + suite green; grep confirms zero remaining inline `React.createElement('video'` and zero local resolveVideoUri declarations.

## Task 6: Re-render fixes: memo-defeating props, tab keys, ShowsContext memo, HomeScreen search hoist

**Problem:** Several one-prop mistakes defeat existing `React.memo` wrappers, and one context misses memoization entirely.

**Do (each is small and surgical):**
1. `src/contexts/ShowsContext.tsx:74-81` — wrap the provider value in `useMemo` (all five members already stable).
2. `src/screens/FavoritesScreen.tsx:740-745` — hoist the inline `onLongPress` arrow into a `useCallback` (the row component takes item-style callbacks; no per-row closure needed). Also make `renderItem`/`keyExtractor` stable with `useCallback`.
3. `src/screens/SongPerformancesScreen.tsx:262` — hoist inline `onPress={() => handlePerformancePress(item)}`; also decouple `renderPerformanceItem` from `getPlayCount`'s identity (read play counts via a ref or restructure the dep) so recording a play doesn't re-render ~400 rows.
4. `src/screens/ShowDetailScreen.tsx:756` — hoist inline `onAddToPlaylist={(t) => setPickerTrack(t)}` to a `useCallback` (setState functions are stable).
5. `src/screens/FavoritesScreen.tsx:849` — change `key={`${tab}-${activeTab}`}` to `key={tab}`.
6. `src/screens/HomeScreen.tsx:103-110` — hoist `Object.entries(STATE_ABBREVIATIONS).filter(...)` (and any other per-show invariant work) out of the per-show search loop.

**Verify:** typecheck + suite green. In your report, state for each item the memoized component it repairs.

## Task 7: Fix radio queue trim desync from the native queue

**Problem:** `src/contexts/PlayerContext.tsx:150-158` (`ADD_RADIO_TRACKS`) trims `radioQueue` beyond 100 entries and shifts `radioQueueIndex`, but the native player queue is append-only (`addTrack`, ~lines 494-503) and `PlaybackTrackChanged` dispatches `SYNC_RADIO_TRACK_INDEX` with the native ABSOLUTE index (~line 428; `src/services/nativeAudioPlayer.web.ts:105` confirms `trackIndex` is full-queue). After the first trim (~100 tracks of radio), displayed metadata points at the wrong entry and the 50% play-count recorder (~line 672) attributes plays to the wrong show.

**Do:**
1. Introduce a cumulative trim-offset (ref or reducer state — prefer reducer state so it's testable) incremented by the trim amount whenever `ADD_RADIO_TRACKS` trims. Subtract it wherever a native absolute index is translated to a `radioQueue` index (`SYNC_RADIO_TRACK_INDEX` handling, the play-count recorder, and any other native-index consumer — search for every use of the synced index).
2. Reset the offset whenever the native queue is rebuilt from scratch (radio start/stop, mode changes — find every `reset()`/queue-rebuild path).
3. Add unit tests for the reducer: append past 100, verify trim + offset; simulate a native index sync post-trim and assert the correct track is selected. If the reducer isn't cleanly importable for tests, extract it to a pure function in the same file and export it (do not restructure beyond that — full extraction is deliberately out of scope).

**Verify:** TDD evidence; full suite + typecheck green.

## Task 8: Fix ShowDetail version-switch race and PlayerContext spinner ordering

**Problem:**
- `src/screens/ShowDetailScreen.tsx:271-315` — `loadShowDetail` (called from the route-param effect ~line 219 and `handleVersionChange` ~line 317) has no cancellation; a slow response for version A landing after version B overwrites the newer state.
- `src/contexts/PlayerContext.tsx:372-390` — the auto-load effect's stale-track guard correctly prevents playing the wrong track, but `dispatch({ type: 'SET_LOADING', isLoading: false })` at ~line 373 runs BEFORE the staleness check, so an old load clears the spinner for a newer still-loading track.

**Do:**
1. In ShowDetailScreen, add a request-token/generation counter (match the `cancelled`-flag pattern already used in `src/screens/SettingsScreen.tsx:63-81`): only the latest request may call `setShow`/`setSelectedVersion`/`setLoading(false)`.
2. In PlayerContext, move the SET_LOADING-false dispatch after (inside) the staleness check so only the current track's completion clears loading.

**Verify:** typecheck + suite green. Explain in the report how you manually reasoned through the interleavings (list them).

## Task 9: Surface user-facing errors consistently

**Problem:** Screens are inconsistent about telling the user when something fails. The good pattern already exists: rate-limited sync-error toast in `src/contexts/FavoritesContext.tsx:73-79`, and a Toast context is available.

**Do:**
1. `src/screens/CollectionDetailScreen.tsx:186-226` — the primary load effect has no catch: add one; on failure render a proper error state with a Retry button (use `ErrorState` from `src/components/StateViews.tsx`). Also catch the owner-username effect (~line 246) — a username lookup failure should degrade gracefully (hide attribution), not reject unhandled.
2. `src/screens/SettingsScreen.tsx:183-185` — `handlePublicToggle`'s create-profile catch is a silent no-op while the toggle stays flipped: revert the toggle state and show a toast. Also give the existing rollback path (~171-173) a toast.
3. `src/screens/FavoritesScreen.tsx:535-539` — `handleSongPress` failure only logs: add a toast ("Couldn't load that show" style, match existing toast copy tone).
4. `src/services/archiveApi.ts:371-374` — `getShowVersions` returns `[]` on error with no logging: add `logger` error logging (keep returning `[]`).

**Verify:** typecheck + suite green. Screenshot-level manual verification not required, but describe the failure UX for each in the report.

## Task 10: Make errors visible in production

**Problem:** `src/utils/logger.ts:38-44` gates even `logger.error` on `__DEV__`, and no crash reporting exists — production failures are invisible.

**Do:**
1. Change `logger.error` (and only error) to also emit in production via `console.error`, keeping dev formatting as-is.
2. Add a minimal pluggable reporter: `setErrorReporter(fn)` module function; `logger.error` forwards `(message, args)` to the reporter when set. Default: none. Add a `// TODO: wire Sentry (needs DSN)` note at the obvious integration point. Do NOT add a Sentry dependency.
3. Unit test: reporter receives forwarded errors; `__DEV__` false path emits console.error (mock it).

**Verify:** TDD evidence; suite + typecheck green.

## Task 11: Cloud-sync hygiene: pure updaters, debounced sync, shared toast hook

**Problem:**
- `src/contexts/FavoritesContext.tsx:335-350, 361-374, 380-397, 404-419` — AsyncStorage writes and `favoritesCloudService.syncFavorites()` are invoked INSIDE `setFavoriteShows(prev => …)` updaters (impure; double-fires under StrictMode).
- Every favorite toggle and every play past 50% serializes the ENTIRE history and upserts the full JSONB blob (`src/contexts/PlayCountsContext.tsx:206-217`, `src/services/playCountsCloudService.ts:13-26`, `src/services/favoritesCloudService.ts:25-47`).
- Both contexts hand-roll the same rate-limited sync-error toast (`SYNC_ERROR_TOAST_COOLDOWN = 30000`; PlayCounts ~64-73, Favorites ~72-77).

**Do:**
1. In both contexts, compute the next state first, then call the setter, then run side effects (storage write + cloud sync) after — outside any updater.
2. Debounce cloud sync in both contexts: a trailing 30s debounce after the last change, with an immediate flush on app-background (AppState) and on logout. Local AsyncStorage persistence stays immediate (it's the offline source of truth). Keep the full-blob upsert wire format — schema change is out of scope.
3. Extract `useSyncErrorToast(message: string)` into `src/hooks/` and use it in both contexts.
4. Tests: debounce behavior with fake timers (change → no sync before 30s → one sync after; multiple changes coalesce; background flush fires immediately).

**Verify:** TDD evidence; suite + typecheck green.

## Task 12: Supabase policy migrations (collections privacy, support-request limits, avatar bucket, RPC auth)

**Problem (all in `supabase/`; write NEW migration files, never edit historical ones, never apply anywhere):**
- `create_collections_tables.sql:90-92,132` — public SELECT is `using (true)`: every user's collections are enumerable by anyone with the anon key, including users with private profiles.
- `create_support_requests_table.sql:15-19` — anon INSERT `with check (true)` with unbounded text columns.
- No `storage.objects` policy SQL for the `avatars` bucket exists in the repo (client uploads to `avatars/${userId}/…` with upsert, `src/services/profileService.ts:65-105`).
- `create_get_activity_feed_function.sql` / `create_search_profiles_function.sql` take client-supplied `viewer_id` instead of `auth.uid()`.

**Do:**
1. New migration `supabase/migrations/<timestamp>_collections_sharing_flag.sql` (create the migrations dir if the repo keeps flat files — follow whatever layout exists): add `is_shared boolean not null default false` to `collections`; `UPDATE collections SET is_shared = true;` to grandfather existing rows (no live links break); replace the two `using (true)` public SELECT policies with `using (is_shared = true)` for `collections`, and for `collection_items` a policy that joins to its parent collection's `is_shared`. Owner policies unchanged.
2. Client: in `src/services/collectionsService.ts` + the share flow (find where share links are produced — likely `shareService` or the collection screens), set `is_shared = true` on the collection when the user shares it (fire-and-forget update with error toast on failure). New collections default private. Add/adjust service tests.
3. New migration for `support_requests`: `CHECK (char_length(message) <= 5000)`, `CHECK (char_length(subject) <= 200)`, `CHECK (char_length(email) <= 320 AND position('@' in email) > 1)`. Mirror the same limits client-side in `src/services/supportService.ts` (or the SupportScreen validation) so users get friendly errors first.
4. New migration for avatar bucket policies (INSERT/UPDATE/DELETE on `storage.objects` for bucket `avatars` require `(storage.foldername(name))[1] = auth.uid()::text`; public SELECT ok). Header comment: "Reconcile with dashboard-configured policies before applying — dashboard may already have equivalents."
5. New migrations recreating `get_activity_feed` / `search_profiles` using `auth.uid()` internally (keep the parameter for backward compat but ignore it, or drop it and update `src/services/feedService.ts` call sites — prefer dropping + updating call sites since we control the only client).
6. Top-of-file comment in every migration explaining what it changes and why. Nothing gets applied — files only.

**Verify:** suite + typecheck green (client changes); SQL reviewed for syntax by reading (no DB to run against). List every migration file in the report.

## Task 13: Client security hardening (avatar content type, streamUrl allowlist, OG-tag replace)

**Do:**
1. `src/services/profileService.ts:65-105` — validate the avatar file extension against an allowlist (`jpg`, `jpeg`, `png`, `webp`, `heic` — check what the picker can emit) before upload; map to a correct `contentType`; reject others with a user-facing error.
2. Cross-user `streamUrl` validation: favorites/collection items synced from other users carry arbitrary `streamUrl`s (`src/contexts/PlayerContext.tsx:841,888,926`, `src/screens/CollectionDetailScreen.tsx:480`). Add `src/utils/validateStreamUrl.ts`: allow only `https:` URLs whose hostname is `archive.org` or ends with `.archive.org`. Apply at playback entry points for content that can originate from another user. On rejection: skip the track with a logged warning (and toast if user-initiated).
3. `api/_lib/injectOgTags.ts:50-52` — replace `.replace(pattern, string)` with the function form `(() => replacement)` so `$`-sequences in user text can't mangle the page.
4. Tests for `validateStreamUrl` (accept archive.org + subdomain; reject http:, other hosts, `evil-archive.org`, userinfo tricks like `https://archive.org@evil.com/`) and for the OG-tag `$` case.

**Verify:** TDD evidence; suite + typecheck green.

## Task 14: Consolidate date and number formatters

**Problem:** MM/DD/YYYY formatting exists 4×: `src/utils/formatters.ts:28` (`formatDate`, canonical), `src/services/shareService.ts:109` (`formatDateMMDDYYYY`), a verbatim clone in `src/screens/ShowDetailScreen.tsx:266-269`, and an inline variant at `ShowDetailScreen.tsx:302`. `formatDownloads` exists twice with different behavior: `formatters.ts:59` (`1.2K`/`1.2M`, returns `'0'`) vs `ShowDetailScreen.tsx:438-444` (`1.2k downloads`, no M tier, returns `''`).

**Do:**
1. Move `formatDateMMDDYYYY` (and `slugifyTrackTitle` if it's similarly generic) from shareService into `src/utils/formatters.ts`; delete the ShowDetailScreen clone; keep the inline short-date variant at :302 but implement it via the shared helpers.
2. Merge the two `formatDownloads` into one in formatters.ts with an options param if genuinely needed (`formatDownloads(n, { suffix?: string })`); update both call sites; delete the screen-local copy. Preserve each call site's current rendered output exactly (write characterization tests first).
3. Update all imports; extend the existing formatters tests.

**Verify:** TDD/characterization evidence; suite + typecheck green.

## Task 15: One show-lookup module (date index, venue correction, sorted catalog + binary search)

**Problem:** Linear scans of `shows.json` are re-implemented 4×: `getCorrectVenue` verbatim in `src/screens/FavoritesScreen.tsx:59-70` and `src/screens/PublicProfileScreen.tsx:86-94` (each with its own module-scope `import showsData` + cast), `getShowByDate` in `src/screens/SongPerformancesScreen.tsx:61-67`, `resolveIdentifier` in `src/screens/ShowDetailScreen.tsx:192-202`. Separately, `ShowDetailScreen.tsx:171-189` (`nextTourStops`) flattens and sorts the full ~2,300-show catalog per visited show, while `src/contexts/PlayerContext.tsx:17-38` already maintains a module-level pre-sorted array + binary search for exactly this.

**Do:**
1. Create `src/utils/showLookup.ts`: lazily-built `Map<dateString, Show>` index over shows.json; export `findShowByDate(date)`, `getCorrectVenue(date)`, `resolveIdentifierFromDate(id)`, plus the pre-sorted `allShowsSorted` array and a `findShowIndexByDate` binary search — MOVE the existing implementation out of `PlayerContext.tsx:17-38` (PlayerContext imports from here now; single source).
2. Replace all four screen-local implementations with imports.
3. Rewrite `nextTourStops` (ShowDetailScreen) using `allShowsSorted` + binary search — O(log n) per visit.
4. Unit tests: date hit/miss, venue correction sample, binary search edges (first/last/absent date), nextTourStops equivalence on a sample (characterize current behavior first).

**Verify:** TDD evidence; suite + typecheck green.

## Task 16: Adopt SongCard as the single song row

**Problem:** `src/components/SongCard.tsx:28` documents itself as the shared song row, but `src/screens/FavoritesScreen.tsx:81-124` (`SongItem`) and `src/screens/PublicProfileScreen.tsx:133-179` (`SongRow`) re-implement it with near-verbatim style blocks (FavoritesScreen:1209-1250, PublicProfileScreen:1122-1164 vs SongCard:80-128). Known divergences to reconcile: SongItem/SongRow apply `getCorrectVenue()` (SongCard doesn't); SongRow adds a `songItemLoading` opacity state; web vertical padding differs (10 vs 8).

**Do:**
1. Extend `SongCard` with the union of needed capabilities: venue correction via `getCorrectVenue` from Task 15's `showLookup` (applied inside SongCard or — better — at data level before render if the screens already map their data; pick one and be consistent), an optional `loading` prop for the opacity state, and settle padding on ONE value (use SongCard's; visual delta of 2px is acceptable and intentional).
2. Ensure `SongCard` is wrapped in `React.memo` and its rating lookup benefits from Task 4's Map.
3. Replace `SongItem` and `SongRow` with `SongCard`; delete both components and their orphaned style blocks (~180 lines).

**Verify:** suite + typecheck green; grep confirms no `SongItem`/`SongRow` remain; report lists deleted line ranges.

## Task 17: Adopt StateViews; shared glass-pill style; layout constant; delete dead code

**Do:**
1. Replace inline loading/empty/error re-implementations with the existing `src/components/StateViews.tsx` components: `src/screens/SOTDScreen.tsx:40-58` (+ styles 202-222), `src/screens/FavoritesScreen.tsx:582-591, 670-680` (+ empty styles), `src/screens/PublicProfileScreen.tsx:451-468`, `src/screens/ShowDetailScreen.tsx:446-460`, `src/screens/CollectionDetailScreen.tsx:537-543`. Extend StateViews minimally (e.g. optional icon) only if a call site genuinely needs it.
2. Add `GLASS_PILL` to `src/constants/theme.ts` (bg `rgba(255,255,255,0.15)` → use `COLORS.surfaceMedium` if identical, `borderRadius: RADIUS.full` replacing the magic `342`, border `rgba(255,255,255,0.33)`, `backdropFilter: blur(34px)` web-only) and use it at: `ShowDetailScreen.tsx:923-936, 1008-1021, 1022-1036`, `src/components/ShowCard.tsx:316-317`, `src/components/PlayCountBadge.tsx:46-47`, `src/components/VersionPicker.tsx:174-185`.
3. Add `LAYOUT.HORIZONTAL_PADDING` (= `SPACING.xl`) to theme; replace the six per-file `const HORIZONTAL_PADDING = SPACING.xl` (`HomeScreen.tsx:36`, `FavoritesScreen.tsx:54`, `FeedScreen.tsx:13`, `SongListScreen.tsx:31`, `SongPerformancesScreen.tsx:34`, `src/components/PageHeader.tsx:18`).
4. Delete dead code: `src/services/trackPlayerStub.ts` (zero imports), `src/utils/generateSongData.ts` (zero imports — confirm with grep first; if it's a build-time script actually used by an npm script, move it out of src/ instead), the unreachable `SHUFFLE_NEXT` exhausted branch + misleading comment in `src/contexts/PlayerContext.tsx:250-255` (verify unreachable by reading `shuffleNext` ~1063-1071 first), unused style blocks: `FullPlayer.tsx:814-825` + `ShowDetailScreen.tsx:953-965` (`saveButton/saveButtonActive`), `FavoritesScreen.tsx:1091-1100` (`headerGradient*`), CollectionDetailScreen's unused `description/attribution/toolbar/trackRow/pillsRight`. Verify each is unreferenced before deleting.
5. Small fix that rides along: replace hand-rolled `{playCount} {playCount === 1 ? 'play' : 'plays'}` at `ShowDetailScreen.tsx:546, 645, 716` and the one-off pluralizations at `CollectionDetailScreen.tsx:572, 606` with a `formatCount(n, noun)` helper in formatters.ts.

**Verify:** suite + typecheck green; report lists every deletion with the grep that proved it dead.

## Task 18: toFavoriteSong factory and showDetailParams helper

**Problem:**
- The 6-field `FavoriteSong` literal (`trackId, trackTitle, showIdentifier, showDate, venue, streamUrl`) is hand-built 5×: `src/screens/ShowDetailScreen.tsx:334-349`, `src/components/FullPlayer.tsx:267-285` and `:701-708`, `src/components/web/PlayerBar.tsx:216-231`, `src/screens/FavoritesScreen.tsx:983-990` — the last uses raw `show.venue` where the others use `getVenueFromShow(show)` (divergence).
- The ShowDetail navigation param bundle (`identifier, venue, date, location, classicTier`) is hand-built 6+×, and two sites already drop fields: `src/screens/CollectionDetailScreen.tsx:428-442` omits `classicTier`; `src/screens/PublicProfileScreen.tsx:470-472` omits `location` + `classicTier` (degrades ShowDetail's first-paint header). Full-bundle sites: `HomeScreen.tsx:314-322`, `FavoritesScreen.tsx:512-520`, `DiscoverLandingScreen.tsx:149-159, 165-173`, `SOTDScreen.tsx:24-34`, `ShowDetailScreen.tsx:368-376`.

**Do:**
1. `src/utils/favoriteSong.ts`: `toFavoriteSong(track, show): FavoriteSong` using `getVenueFromShow` (canonical — the FavoritesScreen raw-venue site adopts it; intentional consistency fix). Use it at all five sites, including the `AddToCollectionPicker.itemMetadata` construction.
2. `showDetailParams(show)` helper (put it next to the RootStackParamList types in `src/navigation/` or in formatters — pick the least-import-cycle-prone spot) returning the full bundle; use it at all 8 call sites. CollectionDetail/PublicProfile now pass full params — intentional fix (they have the show data or can look it up via Task 15's showLookup; if a site genuinely lacks the data, document what it passes).
3. Unit test for `toFavoriteSong` field mapping.

**Verify:** suite + typecheck green.

## Task 19: Consolidate sort machinery (one dropdown hook, shared options, canonical comparators)

**Problem:** Sort options arrays, label/icon mappers, comparator switches, and dropdown-position code are quintuplicated across `FavoritesScreen` (:134-148 options ×2, :460-510 mappers ×2, :343-448 comparators, :272-284 measure ×2), `PublicProfileScreen` (:104-118, :120-131, :385-422, :424-439), `CollectionDetailScreen` (:70-76, :78-98, :507-532, :162-167), `HomeScreen` (:46-51, :58-80, :219-224), `SongPerformancesScreen` (:44-49, :112-134, :104-109). Labels drifted ("Perform. Date" vs "Date" vs "Show Date"). **Behavioral bug:** Favorites handles missing `savedAt` with explicit tri-state ordering; PublicProfile uses `(a.savedAt || 0)` — the same list sorts differently on the two screens.

**Do:**
1. `src/constants/sortOptions.ts`: shared option arrays (show-sort, song-sort, etc. — unify labels; pick the clearest label per concept and note choices) + `getSortLabel`/`getSortIcon` maps.
2. `src/hooks/useSortDropdown.ts`: ref + measured position + visibility state + open-handler (the `measure() → setPosition → open` dance).
3. `src/utils/sortComparators.ts`: `compareBySavedAt` (canonical policy = FavoritesScreen's explicit tri-state: missing sorts last on newest, first on oldest — PublicProfile adopts it; intentional bug fix), `compareByDate`, `compareAlphabetical`. Unit-test the savedAt policy including missing-value cases.
4. Adopt across all five screens; delete the local copies.

**Verify:** TDD evidence for comparators; suite + typecheck green.

## Task 20: usePlaySavedSong hook

**Problem:** `src/screens/FavoritesScreen.tsx:522-540` and `src/screens/PublicProfileScreen.tsx:354-368` are line-for-line identical (loading-id state → `archiveApi.getShowDetail` → `tracks.find` → `loadTrack` → error log → finally clear). `src/screens/SongPerformancesScreen.tsx:223+` is a slug-matching variant.

**Do:**
1. `src/hooks/usePlaySavedSong.ts` returning `{ loadingSongId, playSong(showIdentifier, trackId) }`, including the Task 9 error toast.
2. Adopt in FavoritesScreen and PublicProfileScreen. For SongPerformancesScreen, adopt only if the slug-matching variant fits without contorting the hook's API; otherwise leave it and say so.

**Verify:** suite + typecheck green.

## Task 21: One avatar resolver; fix follower-list N+1

**Problem:** Avatar resolution exists 3×: `src/services/profileService.ts:371-382` and `:419-428` (prefer `profiles.avatar_url`, fall back to Storage list), and a DEGRADED copy in `src/services/followService.ts:92-100` that only does the Storage-list path (never checks `avatar_url`) and is called once per user in `hydrateUsers` (:116-128) — N+1 storage round-trips per follower list.

**Do:**
1. Export a single `resolveAvatarUrl(profileRow)` from profileService; both profileService call sites use it.
2. In followService `hydrateUsers`: include `avatar_url` in the batch profiles SELECT and use the shared resolver; only fall back to a Storage list for rows with no `avatar_url` (and consider batching even that — if it's more than a few lines, just do the per-missing-row fallback and note it).
3. Extend followService tests (they exist) for the hydration path.

**Verify:** suite + typecheck green.

## Task 22: usePlayerProgress + shared video-lifecycle hooks

**Problem:**
- ~150 lines of progress/seek machinery duplicated between `src/components/FullPlayer.tsx:136-217, 246-251, 306-357, 435-455` and `src/components/web/PlayerBar.tsx:45-192` (`ProgressRow`): `timeDisplayRef` + 1s `forceTimeUpdate` with ≥1000ms threshold, `getDurationMs()` fallback chain, position-from-x math, `isDragging`/`dragPosition`/200ms release timeout, identical `progressAnim.interpolate` blocks. Only the gesture source differs (PanResponder vs mouse) — that stays platform-specific.
- Video-lifecycle trios duplicated FullPlayer↔MiniPlayer (+DiscoverLanding): `videoMounted` + `prevVideoIdRef` remount hack (`FullPlayer.tsx:91-103` = `MiniPlayer.tsx:34-45`), AppState listener (`FullPlayer.tsx:83-114` = `MiniPlayer.tsx:29-51` ≈ `DiscoverLandingScreen.tsx:97-111`), prefetch-show-detail effect (`FullPlayer.tsx:185-192` = `MiniPlayer.tsx:59-66`).

**Do:**
1. `src/hooks/usePlayerProgress.ts` returning `{ displayPosition, displayDuration, isDragging, beginDrag, moveDrag, endDrag, progressWidth, thumbLeft }` (or the closest API that fits both call sites — read both carefully first). FullPlayer and PlayerBar keep only gesture wiring.
2. `src/hooks/useAppActiveState.ts` and `src/hooks/useVideoRemount.ts` (or one combined `usePlayerVideoBackground` — implementer's choice, justify it); adopt in FullPlayer, MiniPlayer, DiscoverLanding.
3. Move the duplicated prefetch-show-detail effect into PlayerContext (single instance) — it currently runs identically in FullPlayer and MiniPlayer.

**Verify:** suite + typecheck green; manual reasoning through drag interleavings in the report.

## Task 23: ScreenHeader, SegmentedTabs, GlassHeader extractions

**Problem:**
- Header shell near-verbatim between `src/screens/HomeScreen.tsx:344-407` (+styles 514-636) and `src/screens/FavoritesScreen.tsx:771-864` (+styles 1017-1174): avatar/ProfileDropdown wiring, AnimatedSearchBar handlers, filter button, headerWidth onLayout, gradient fade.
- Tab bar identical between `FavoritesScreen.tsx:846-863` (+1137-1174) and `PublicProfileScreen.tsx:798-817` (+996-1033), down to the Android `paddingTop: 2` hack.
- Web glass header duplicated between `ShowDetailScreen.tsx:494-516` (+1052-1098) and `CollectionDetailScreen.tsx:576-596` (+962-999); `DiscoverLandingScreen` sotdWebBlur (:484-495) repeats the blur literal.

**Do:**
1. `src/components/ScreenHeader.tsx` — title + avatar/ProfileDropdown + search + trailing buttons + gradient; adopt in HomeScreen and FavoritesScreen.
2. `src/components/SegmentedTabs.tsx` — adopt in FavoritesScreen and PublicProfileScreen.
3. `src/components/web/GlassHeader.tsx` — takes a background element + children; adopt in ShowDetailScreen, CollectionDetailScreen; use its blur-overlay piece in DiscoverLanding if it fits cleanly.
4. This is visual-parity refactoring: preserve rendered output. Note any intentional pixel differences.

**Verify:** suite + typecheck green.

## Task 24: Virtualize PublicProfileScreen

**Problem:** `src/screens/PublicProfileScreen.tsx:706-845` renders the entire profile — including hundreds of favorite rows — inside `ListHeaderComponent` of a `FlatList` with `data={[]}` (nothing virtualizes), while `useProgressiveCount` (:7-44, usage :431-432) re-renders the whole screen every 120ms as the list "grows". ShowCard memo is defeated by inline arrows (:495-560).

**Do:**
1. Restructure: the active tab's rows become the FlatList's real `data` with a memoized `renderItem` (SongCard from Task 16 / ShowCard) and stable callbacks; profile info/stats/tabs stay in `ListHeaderComponent`.
2. Delete `useProgressiveCount` — real virtualization makes it unnecessary.
3. Hoist the inline arrows defeating ShowCard's memo.
4. Standard FlatList tuning consistent with FavoritesScreen's existing props.

**Verify:** suite + typecheck green; report describes scroll behavior reasoning.

## Task 25: Split PlayerContext into state + actions contexts

**Problem:** `src/contexts/PlayerContext.tsx:1138-1180` memoizes the context value on the entire state, so every dispatch re-renders all ~10 consumers — including whole screens that only call actions (`FavoritesScreen.tsx:168`, `CollectionDetailScreen.tsx:136`, `SongPerformancesScreen.tsx:79`, `PublicProfileScreen.tsx:186`) and the navigator shell `MainTabsWithPlayer` (`src/navigation/AppNavigator.tsx:373-420`), whose inline `tabBar`/`onPress`/`onClose` props then defeat MiniPlayer/FullPlayer memos.

**Do:**
1. Split into `PlayerStateContext` and `PlayerActionsContext` inside PlayerContext.tsx (one provider component still). Actions object must be referentially stable (the file already uses the refs pattern internally — extend it). Keep a `usePlayer()` compat hook returning both (so this task doesn't have to touch every consumer), plus new `usePlayerState()` / `usePlayerActions()`.
2. Move `isFullPlayerVisible` (+ its setter) into a new tiny `FullPlayerVisibilityContext` so the navigator shell doesn't subscribe to playback state. Update `AppNavigator.tsx` accordingly and stabilize the inline `tabBar`/`onPress`/`onClose` props (useCallback) so MiniPlayer/FullPlayer memos hold.
3. Migrate the four action-only screens to `usePlayerActions()`.
4. Verify with a render-count sanity check in a test (or a documented manual check): play/pause no longer re-renders FavoritesScreen.

**Verify:** suite + typecheck green. This is the riskiest refactor in the plan — go slowly, list every consumer you touched.

## Task 26: Lazy-load the heavy generated datasets

**Problem:** ~8MB of data is materialized eagerly at startup: `src/constants/songs.generated.ts` (5MB — `ShowDetailScreen.tsx:88` and `SongPerformancesScreen.tsx:36` build module-scope Maps from it; AppNavigator imports every screen eagerly), `src/data/songPerformanceRatings.ts` (602KB — pulled in via `radioService.ts:9` → PlayerContext; module top-level spreads four tiers into `ALL_RATED_SONG_PERFORMANCES`), `src/data/shows.json` (2.6MB — flattened/sorted at module scope, moved to showLookup in Task 15). No metro.config.js code splitting exists.

**Do (pragmatic scope — lazy MATERIALIZATION, not necessarily lazy bundling):**
1. Convert module-scope derived structures into lazy singletons: the `songsByTitle` Maps (hoist ONE shared lazy map into `src/utils/songLookup.ts`, replacing both screen-local module-scope builds and the linear `GRATEFUL_DEAD_SONGS.find` in `src/hooks/usePerformanceRating.ts:20`), the tier spread in songPerformanceRatings (build `ALL_RATED_SONG_PERFORMANCES`/the Task 4 Map on first lookup), and showLookup's structures (Task 15 should already be lazy — verify).
2. Investigate dynamic `import()` for `songs.generated.ts` and `songPerformanceRatings.ts` on both platforms (Metro supports it). If it works cleanly, make the lookup modules async-initialize on first use with a sync "not ready yet" fallback that kicks off the load (callers are all in interaction paths, so a one-frame miss is acceptable — but DOCUMENT every call site's behavior on miss and make sure UI retries/re-renders when data arrives). If dynamic import is NOT clean on native, do the lazy-materialization-only version and report that the bundle-size half needs a follow-up — do not ship a broken half-measure.
3. Measure and report: startup work eliminated (describe what no longer runs at module scope) and web bundle delta if measurable via `npx expo export --platform web` before/after.

**Verify:** suite + typecheck green; app boots (run `npx expo export --platform web` as a smoke check that bundling still succeeds).

## Task 27: Final whole-branch review

Controller dispatches the final code reviewer over the full branch diff (merge-base..HEAD) per superpowers:requesting-code-review, on the most capable model, with the accumulated Minor-findings list for triage. One fix subagent for the complete findings list if needed.
