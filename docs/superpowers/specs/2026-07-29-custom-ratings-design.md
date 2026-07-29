# Custom Show/Performance Ratings — Design

**Date:** 2026-07-29
**Status:** Approved

## Overview

Users can override the app's curated system ratings (show-level "classic tier" and song-performance-level ratings) with their own 0–3 star ratings. User ratings display in **gold** instead of the system **red**, take precedence everywhere ratings drive behavior (sorting, Classic Shows rail, Radio, Show of the Day), and sync to Supabase following the existing favorites pattern. A full-screen overlay with a star picker is opened by tapping a rating (or a placeholder where no rating exists) on detail surfaces.

## Decisions (confirmed with user)

1. **0 stars is a real rating** — it suppresses the system rating and displays a distinct gold zero state. Reset-to-default is a separate action.
2. **User ratings affect everything** — display, sorting, Classic Shows rail, Radio track pool, and Show of the Day.
3. **Tap targets on detail surfaces only** — ShowDetail hero, ShowDetail track rows, FullPlayer, SongPerformances list. Browse cards (ShowCard, SongCard, HorizontalShowCard, Discover rail) stay display-only but render gold when an override exists.
4. **Cloud sync** — AsyncStorage local-first + debounced upsert to a new `user_ratings` Supabase table, merge-on-login, fully functional logged out.

## Architecture

### Chosen approach: central ratings store + resolver

A small module-level store (`userRatingsStore`) holds the overrides map with a subscribe API, wrapped by a `UserRatingsContext` for React consumption. Two resolver functions are the single source of truth:

- `resolveShowRating(date)` — user rating if present, else `classicTier` converted to stars, else `null`
- `resolvePerformanceRating(songTitle, date)` — user rating if present, else `getSongPerformanceRating` / baked catalog rating, else `null`

Both return `{ stars: 0|1|2|3, isUserRating: boolean } | null`.

React components use hooks from the context; non-React code (`radioService`, SOTD selection) reads the store directly via its synchronous getter + subscribe.

The four existing places that pre-bake `classicTier` onto show objects (`ShowsContext`, `FavoritesContext` ×2, `ShowDetailScreen`) keep doing so — that remains the system baseline. Resolution happens at read time, so no memo invalidation or re-enrichment of the 22k-line song catalog is needed.

**Rejected alternatives:**
- *Data-layer enrichment* (patch overrides into show objects/catalog on change): fragile — baked in 4 places plus nav params, requires cascading memo invalidation.
- *Render-time interception only* (wrap `StarRating`): cannot reach radio/rails/SOTD/sorting.

## Data model & semantics

User ratings are stored as **stars (0–3)**, not tiers, to avoid the inverted-scale (`stars = 4 - tier`) confusion:

```ts
interface UserRatingEntry {
  stars: 0 | 1 | 2 | 3;
  ratedAt: number;        // epoch ms; latest-wins on cross-device merge
  deletedAt?: number;     // tombstone for sync merge (reset while offline)
}

interface UserRatings {
  shows: Record<string, UserRatingEntry>;         // key: "YYYY-MM-DD"
  performances: Record<string, UserRatingEntry>;  // key: `${normalizedTitle}|${date}`
}
```

- **Show key**: the date, `YYYY-MM-DD` — matches `getClassicTier` identity. Always `.split('T')[0]` (shows.json dates carry a time component).
- **Performance key**: reuses the existing `normalizeSongTitleForLookup` from `songPerformanceRatings.ts` so user ratings hit the same identity as system ratings. That normalizer is exported for reuse.
- **Resolution precedence**: user entry (not tombstoned) → `{ stars, isUserRating: true }`; else system tier → `{ stars: 4 - tier, isUserRating: false }`; else `null`.
- **Reset** = tombstone the entry (`deletedAt`), falling back to the system rating. Tombstones are pruned after successful sync convergence.

## Display

- `StarRating` gains a gold variant: gold filled stars via new `COLORS.userRating` (a gold that fits the dark theme, e.g. `#E5B44C`) when `isUserRating`; red (`COLORS.accent`) otherwise.
- **Zero-star override** renders a single gold **outline** star (Ionicons `star-outline`).
- **Placeholder** (tappable detail surfaces only): where no rating resolves, render 3 dim outline stars as the tap target for the overlay.
- Accessibility labels distinguish "your rating" from the community rating.

## Rating overlay

Provider-owned global overlay following the ShareSheet pattern (`ShareSheetContext`):

- `RatingOverlayContext` exposes `openRatingOverlay(item)` / `closeRatingOverlay()`; a single overlay component is mounted near root in `App.tsx`. Works on native, mobile web, and desktop web.
- `item` is a discriminated union: `{ kind: 'show', date, venue?, location?, title }` or `{ kind: 'performance', songTitle, date, venue? }`.
- Full-screen RN `Modal` (transparent) with `BlurBackground`, fade/slide-in animation.
- Contents:
  - Show info (date, venue, location) or performance info (song title, show date, venue)
  - Current system rating shown in red, labeled (e.g. "Community: ★★"), when one exists
  - Star picker 0–3: large tap targets; tapping a star sets 1–3; a dedicated "zero" element sets 0. Selection saves immediately with haptic feedback (`hapticService`).
  - "Reset to community rating" button — visible only when an override exists
  - Dismiss: X button, backdrop tap, swipe-down on native

## Behavior integration ("affect everything")

- **Sorting** — `ratingHighest` in `SongPerformancesScreen` sorts by resolved stars (missing ratings last, as today).
- **Classic Shows rail** (`DiscoverLandingScreen`) — membership is resolved show rating > 0. User-rated shows join the rail; 0-star overrides drop system classics from it.
- **Radio** (`radioService`, tier-1 pool) — pool = performances whose **resolved** stars = 3. User 3-star ratings add tracks; overrides below 3 remove system tier-1 tracks. Store read synchronously; pool recomputed when overrides change.
- **Show of the Day** (`ShowOfTheDayContext`) — picks from resolved classic shows (system classics ± user overrides).
- **Share cards** — local `ShareCard` uses resolved rating, gold when user's. **Known limitation:** server-side OG images (`api/_lib/classicShowsTiers.ts`) cannot see user data and keep system ratings.
- `ShowCard`'s existing `overrideRating` prop semantics are preserved; its call path is updated to the resolved value.

## Persistence & sync

Mirrors the favorites pattern (`FavoritesContext` + `favoritesCloudService`):

- **Local:** AsyncStorage key registered in `STORAGE_KEYS` (e.g. `USER_RATINGS = '@user_ratings'`); write-through on every mutation; fully functional logged out.
- **Cloud:** new table `user_ratings` — one JSONB row per user:
  - `user_id uuid primary key references auth.users(id) on delete cascade`
  - `shows jsonb`, `performances jsonb`, `updated_at timestamptz`
  - RLS enabled with per-user select/insert/update/delete policies; jsonb size check constraints — same house style as `user_favorites` (`supabase/create_collections_tables.sql` conventions).
  - Timestamped migration under `supabase/migrations/` for manual apply (per project workflow).
- **Sync:** `userRatingsCloudService` (load/save, `PGRST116` → empty), debounced push via `useDebouncedSync` (30s trailing, flush on background/unmount), flush on logout, merge-on-login with `ratedAt`/`deletedAt` latest-wins per entry.
- **Account deletion:** `supabase/delete_user_function.sql` updated to purge `user_ratings` (cascade covers it, but the function enumerates tables explicitly — keep it consistent).

## Testing

- **Unit:** resolver precedence (user > system > null); 0-star suppression; tier↔stars conversion; merge logic (latest-wins, tombstones both directions); performance key normalization matches system lookup identity.
- **Component:** `StarRating` gold/red/zero/placeholder variants; overlay set/reset/dismiss flows; reset button visibility.
- **Integration:** radio pool and Classic Shows rail react to override changes; `ratingHighest` sort uses resolved values.

## Out of scope

- User ratings in server-rendered OG share images.
- Rating recording versions (tapes) — only shows and song performances are ratable, matching the system rating model.
- Any social/aggregate use of user ratings (they are private to the user).
