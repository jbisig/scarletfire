# Feed Feature — Design

Date: 2026-04-15

## Goal

Add a social Feed surface with two tabs:

- **Activity** — a chronological feed of events from people the user follows, blended with public events from the broader community.
- **People** — a searchable directory of public profiles with one-tap follow/unfollow.

Build on the existing follow graph and public-profile model.

## Scope

**In scope (v1):**
- New `Feed` bottom-nav tab on native (5th tab) and a corresponding Sidebar entry on desktop web.
- New `activity_events` table that records five event types for public profiles only.
- Activity feed query that interleaves "following" events with a ~25% public-event mixin.
- People list with a "Following" section and a paginated "Discover" section, sortable by follower count, plus full-text search across both.
- Backfill script that seeds ~30 days of historical events from existing tables.

**Out of scope (v1):**
- Realtime push (WebSocket subscriptions) — pull-to-refresh only.
- Engagement actions on events (like / comment / reshare).
- Notifications when followed users post events.
- Engagement-based ranking — strict reverse-chronological only.
- Backfilling listens (no per-listen timestamps available in `user_play_counts`).

## Event Catalog

| `event_type`        | Trigger                                                                                                              | `target_type` | `target_id`           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------- |
| `listened_show`     | Show-level derived play count (≥50% of tracks crossed N→N+1) increments inside `recordTrackPlay`.                    | `show`        | Archive identifier    |
| `favorited_show`    | User adds a show to favorites (favoriting individual songs does **not** emit).                                       | `show`        | Archive identifier    |
| `created_collection`| User creates a new collection (playlist or show_collection).                                                         | `collection`  | collection uuid       |
| `saved_collection`  | User saves *another user's* collection (own collections excluded).                                                   | `collection`  | collection uuid       |
| `followed_user`     | User follows another user. Skipped if the followed user has `is_public = false` (avoid leaking private accounts).    | `user`        | followed user uuid    |

**Privacy gate:** Events are only emitted when the actor's profile has `is_public = true`. Private profiles never produce events; flipping `is_public` back to `true` resumes emission going forward.

**Dedupe:** Each emission checks the `(actor_id, event_type, target_id)` index for an existing event in the last 24h and skips the insert if one exists. Prevents toggle-spam (favorite → unfavorite → favorite) and re-listen flicker.

## Data Model

### New table: `activity_events`

```sql
CREATE TABLE activity_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   text NOT NULL CHECK (event_type IN (
    'listened_show', 'favorited_show', 'created_collection',
    'saved_collection', 'followed_user'
  )),
  target_type  text NOT NULL CHECK (target_type IN ('show', 'collection', 'user')),
  target_id    text NOT NULL,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_actor_time on activity_events (actor_id, created_at DESC);
CREATE INDEX idx_events_time       on activity_events (created_at DESC);
CREATE INDEX idx_events_dedupe     on activity_events (actor_id, event_type, target_id, created_at DESC);
```

`metadata` is a denormalized snapshot (show date, venue, collection name, target user's display_name) so the feed renders correctly even after the underlying record is renamed or deleted, and so feed reads need no joins beyond `profiles` for the actor row.

### RLS

- **INSERT** — `auth.uid() = actor_id` AND a subquery confirms the actor's profile has `is_public = true`.
- **SELECT** — any authenticated user may read events whose actor has `is_public = true`. (Anonymous read not required since Feed is auth-gated.)
- **UPDATE / DELETE** — disallowed in v1. Events are immutable history. `ON DELETE CASCADE` on `actor_id` handles user deletion.

### Profile follower-count counters

Add two columns to `profiles`:

```sql
ALTER TABLE profiles
  ADD COLUMN followers_count int NOT NULL DEFAULT 0,
  ADD COLUMN following_count int NOT NULL DEFAULT 0;
```

Maintained by trigger on `user_follows` (INSERT increments both sides, DELETE decrements). One-shot backfill seeds initial values from existing rows.

The counters power the People-tab Discover sort (`ORDER BY followers_count DESC`) without per-row count queries.

## Event Emission

Single client-side helper, called from each emission site:

```ts
// src/services/activityService.ts
emitEvent(
  type: ActivityEventType,
  targetType: 'show' | 'collection' | 'user',
  targetId: string,
  metadata: Record<string, unknown>
): Promise<void>
```

Behavior:
- No-op when current user is unauthenticated or has `is_public = false` (mirrors RLS, avoids a wasted round-trip).
- Performs the 24h dedupe check via a parameterized query before insert.
- Inserts and returns; failures are logged and swallowed (non-blocking).

Emission sites:

| Event              | Call site                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `listened_show`    | `PlayCountsContext.recordTrackPlay` — compute `getShowPlayCount(showId, totalTracks)` before/after; emit on increment. Requires adding `totalTracks: number` argument to `recordTrackPlay` and threading it through call sites in the audio player. |
| `favorited_show`   | `FavoritesContext` add-show path.                                                                      |
| `created_collection`| `collectionsService` create path.                                                                     |
| `saved_collection` | `collectionsService` save path (skip when `collection.creator_id === currentUserId`).                  |
| `followed_user`    | `followService.followUser` after the follow succeeds (skip if target `is_public = false`).             |

## Feed Query

A single Postgres function `get_activity_feed(viewer_id uuid, cursor timestamptz, page_size int)` returns up to `page_size` events.

```sql
WITH following_events AS (
  SELECT e.*, 'following' AS source
  FROM activity_events e
  JOIN user_follows f ON f.following_id = e.actor_id AND f.follower_id = viewer_id
  WHERE e.created_at < cursor
  ORDER BY e.created_at DESC
  LIMIT page_size
),
public_events AS (
  SELECT e.*, 'public' AS source
  FROM activity_events e
  JOIN profiles p ON p.id = e.actor_id AND p.is_public = true
  WHERE e.created_at < cursor
    AND e.actor_id <> viewer_id
    AND NOT EXISTS (
      SELECT 1 FROM user_follows f
      WHERE f.follower_id = viewer_id AND f.following_id = e.actor_id
    )
  ORDER BY e.created_at DESC
  LIMIT CEIL(page_size / 4.0)
)
SELECT * FROM following_events
UNION ALL
SELECT * FROM public_events
ORDER BY created_at DESC
LIMIT page_size;
```

- **Mixin ratio:** ~25% public, ~75% following. Tunable constant; users with zero follows get an effectively all-public feed.
- **Pagination:** cursor-based on `created_at`. Initial fetch passes `cursor = now()`. `nextCursor = oldest created_at in result`. FlatList `onEndReached` advances.
- **Refresh:** pull-to-refresh re-queries with `cursor = now()` and replaces the list.
- **Ranking:** strict reverse-chronological within each source, merged.
- **Indexes:** `idx_events_actor_time` covers the following query; `idx_events_time` covers the public scan; existing `user_follows` indexes cover the join and the `NOT EXISTS`.

## People Query

`search_profiles(query text, viewer_id uuid, cursor int, page_size int)` returns paginated profile rows.

When `query` is empty, two reads:
1. **Following section** — `SELECT … FROM profiles p JOIN user_follows f ON f.following_id = p.id WHERE f.follower_id = viewer_id AND p.is_public = true ORDER BY p.display_name`.
2. **Discover section** — `SELECT … FROM profiles p WHERE p.is_public = true AND p.id <> viewer_id AND NOT EXISTS (… already-following …) ORDER BY p.followers_count DESC LIMIT page_size OFFSET cursor`.

When `query` is non-empty, single read:
- `SELECT … FROM profiles p WHERE p.is_public = true AND (p.username ILIKE '%' || query || '%' OR p.display_name ILIKE '%' || query || '%') ORDER BY p.followers_count DESC LIMIT 50`.
- Sections collapse into a single flat list during search.

A trigram index on `username` and `display_name` (`pg_trgm`) keeps ILIKE fast as the user table grows.

Each row returns `{ id, username, display_name, avatar_url, followers_count, following_count, viewer_is_following }`.

## UI

### Bottom nav (mobile native + mobile web)

- Add `FeedTab` to `MainTabsWithPlayer` in `src/navigation/AppNavigator.tsx`.
- Tab order: `Discover, Shows, Songs, Feed, Favorites`.
- Icon: Ionicons `pulse-outline` / `pulse` for active state. Label: "Feed".
- Update `TAB_ICONS` and `TAB_LABELS` in `src/components/CustomTabBar.tsx`.

### FeedScreen shell

- New `src/screens/FeedScreen.tsx`.
- Header: standard `AppHeader` titled "Feed". Top-right has a small **"My Profile" badge button** that navigates to the current user's `PublicProfileScreen`. Hidden on desktop (Sidebar already exposes My Profile) and when signed out.
- Sticky **segmented control** below header: `Activity` | `People`. Selection persists during screen lifetime.
- Body swaps `<ActivityList />` and `<PeopleList />` based on segment state.

### ActivityList

Single FlatList of event rows. Each row is **text-only** (no artwork):

```
┌─────────────────────────────────────────┐
│ [avatar] Display Name             2h    │
│          @username                      │
│                                         │
│ [icon] Listened to 5/8/77 — Cornell     │
└─────────────────────────────────────────┘
```

Per event type (headline copy):

| Type                | Headline                                                       | Icon                |
| ------------------- | -------------------------------------------------------------- | ------------------- |
| `listened_show`     | `Listened to {showDate} — {venue}`                              | `headset`           |
| `favorited_show`    | `Favorited {showDate} — {venue}`                                | `heart`             |
| `created_collection`| `Created the playlist "{name}"`                                | `add-circle`        |
| `saved_collection`  | `Saved {creatorDisplayName}'s playlist "{name}"`               | `bookmark`          |
| `followed_user`     | `Followed {targetDisplayName}`                                 | `person-add`        |

All headline values come from the `metadata` snapshot — no per-row joins needed.

**Tap behavior:**
- Tap row body → navigate to event target (show detail / collection detail / target profile).
- Tap actor avatar or name → navigate to actor's `PublicProfileScreen`.

**No interactions in v1** (no like, no comment, no share). Pull-to-refresh and infinite scroll only.

**Empty / loading / error:**
- Loading: skeleton rows.
- Both streams empty (rare given the public mixin): "Nothing here yet — follow some folks." Tappable, switches to People tab.
- Network error: standard toast + retry button.

### PeopleList

```
┌─────────────────────────────────────────┐
│ [🔍 Search people...]                   │   pinned at top
├─────────────────────────────────────────┤
│ FOLLOWING                               │   section header (hidden if empty)
│ [avatar] Jerry            [Following]   │
│          @jerry                         │
├─────────────────────────────────────────┤
│ DISCOVER                                │
│ [avatar] Bob              [+ Follow]    │
│          @bob · 1.2k followers · 203    │
└─────────────────────────────────────────┘
```

- **Following section:** alphabetical by `display_name`. Loaded fully (no pagination in v1).
- **Discover section:** `ORDER BY followers_count DESC`. Paginated, 20 per page, infinite scroll.
- **Search:** debounced 200ms, hits `search_profiles` RPC. Results render as a flat list while a query is active.
- **Row:** `ProfileImage` avatar, display name (top), subline `@username · {n} followers · {n} following` with `1.2k`-style formatting.
- **Trailing pill:** `+ Follow` (filled) / `Following` (outlined). Toggles via existing `followService.followUser` / `unfollowUser`. Optimistic update; revert on error. No confirmation dialog (matches existing FollowListScreen behavior).
- **Tap row** (anywhere except the pill) → navigate to that user's `PublicProfileScreen`.

**Empty states:**
- No follows yet: hide the FOLLOWING section header, lead with DISCOVER.
- No matching search: "No people found for '{query}'."

## Web / Desktop Integration

- `src/navigation/DesktopLayout.tsx`:
  - Add `FeedTab: 'Feed'` to `TAB_ROOT_SCREENS`.
  - Add `Feed` to `SCREEN_TO_TAB`.
  - Register `<Stack.Screen name="Feed" component={FeedScreen} />`.
- `src/components/web/Sidebar.tsx`:
  - Add `Feed` to `NAV_ITEMS`, between `Favorites` and `My Profile`. Pulse icon to match mobile.
- `src/navigation/webLinking.ts`:
  - `Feed: 'feed'`. (Segment selection is component-internal; not URL-deep-linkable in v1.)
- `FeedScreen` renders identically on web; segmented control and rows use only cross-platform components. Standard centered max-width container on desktop.

## Backfill

One-shot Postgres function run at deploy time:

```sql
backfill_recent_activity(days int DEFAULT 30, per_user_cap int DEFAULT 10)
```

For each profile with `is_public = true`, generate up to `per_user_cap` events from the last `days` days, sourced from:

- `created_collection` from `collections.created_at`.
- `saved_collection` from the collection-saves table (verify exact name during implementation; schema check showed `collections` and `collection_items` tables — saves may live in a third table or as a column on `collection_items`).
- `followed_user` from `user_follows.created_at`, only when the followed user is also `is_public = true`.
- `favorited_show` from `user_favorites` if a per-favorite timestamp is available; otherwise skip.

Skipped:
- `listened_show` — no per-listen timestamp in `user_play_counts` (only aggregate counts).

Each backfilled row populates `metadata` from the live record at backfill time.

**Idempotency:** every insert is gated on `WHERE NOT EXISTS (SELECT 1 FROM activity_events WHERE actor_id = … AND event_type = … AND target_id = … AND created_at = …)`.

## Files Touched

**New:**
- `supabase/create_activity_events_table.sql`
- `supabase/create_get_activity_feed_function.sql`
- `supabase/create_search_profiles_function.sql`
- `supabase/add_profile_follow_counters.sql` (columns + trigger + initial backfill)
- `supabase/backfill_activity_events.sql`
- `src/services/activityService.ts`
- `src/services/feedService.ts` (wraps `get_activity_feed` + `search_profiles`)
- `src/screens/FeedScreen.tsx`
- `src/components/feed/ActivityList.tsx`
- `src/components/feed/ActivityRow.tsx`
- `src/components/feed/PeopleList.tsx`
- `src/components/feed/PeopleRow.tsx`
- `src/components/feed/SegmentedControl.tsx` (if no shared one exists)

**Modified:**
- `src/navigation/AppNavigator.tsx` — register FeedTab.
- `src/components/CustomTabBar.tsx` — add icon/label.
- `src/navigation/DesktopLayout.tsx` — register Feed in stack and tab map.
- `src/components/web/Sidebar.tsx` — add Feed nav item.
- `src/navigation/webLinking.ts` — `feed` URL.
- `src/contexts/PlayCountsContext.tsx` — `recordTrackPlay` accepts `totalTracks`; emits `listened_show` on derived-count increment.
- Audio player call sites — pass `totalTracks` to `recordTrackPlay`.
- `src/contexts/FavoritesContext.tsx` — emit `favorited_show` on add-show path.
- `src/services/collectionsService.ts` — emit `created_collection` and `saved_collection`.
- `src/services/followService.ts` — emit `followed_user` on successful follow.

## Testing

**Unit:**
- `activityService.emitEvent` — dedupe behavior, public-only gate, no-op when signed out, error swallowing.
- `feedService.getActivityFeed` — pagination cursor advances correctly, mixin honors page-size ratio, no events from your own actor surface, no double-counting of followed actors in the public stream.
- `feedService.searchProfiles` — empty-query splits into Following + Discover, non-empty unifies, pagination cursor.
- `PlayCountsContext` — `recordTrackPlay` calls `emitEvent` exactly once on derived-count transition; doesn't emit when count stays flat.

**Manual QA:**
- Listen to half of a show's tracks → exactly one `listened_show` event appears.
- Listen to the same show again same day → no duplicate event.
- Listen to the same show 24h+ later, after enough additional plays to advance the derived count → second event appears.
- Favorite a show → event; unfavorite → no event; refavorite within 24h → no duplicate.
- Create a playlist, save someone else's playlist → both events appear.
- Follow a public user → event; follow a private user → no event.
- Set profile to private → new actions emit no events; flip back to public → emission resumes.
- Activity feed shows followed users' events first, with public events sprinkled in (~1 in 4).
- People → Following section lists exactly the people you follow; Discover sorts by follower count; search filters across both.
- Follow / unfollow from People row updates the button optimistically and shifts the row between sections after refresh.
- Desktop Sidebar → Feed → renders correctly; segmented control switches; tapping a row navigates within the desktop stack.
- Backfill: rerun the script twice; second run is a no-op.
