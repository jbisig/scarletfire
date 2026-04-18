# Feed Review Fixes — Design

**Date:** 2026-04-17
**Status:** Approved, ready for plan
**Source:** Combined code review of the Feed feature on `main` (shipped via PRs #2 and #4). Scope = all Critical + Major findings from that review.

## Goal

Bring the Feed feature from "shipped but rough" to "ship-ready" by fixing three correctness bugs (pagination, error swallowing, anon RLS) and six quality/performance issues (N+1 actor fetches, emit chattiness, StrictMode double-emit, missing self-follow guard, non-reordering follow UI, dead pill when signed out on native).

Out of scope for this work: all Minor (m1–m11) and Nit (n1–n8) findings. Those ride in a later pass.

## Scope

### In scope
- C1 — `get_activity_feed` cursor loses public events when streams are density-skewed.
- C2 — `ActivityList` / `PeopleList` swallow RPC errors and render empty state.
- C3 — `activity_events` SELECT policy permits anonymous reads.
- M1 — N+1 per-row actor fetches after feed/search RPC returns.
- M2 — `emitEvent` does 3-4 round-trips per call.
- M3 — `PlayCountsContext` fires emit from inside a state updater; StrictMode double-fires.
- M4 — No `CHECK (follower_id <> following_id)` constraint on `user_follows`.
- M5 — Follow/unfollow from `PeopleList` is visually optimistic but doesn't move the row between sections.
- M7 — "My Profile" pill on native `FeedScreen` is shown to signed-out users as a dead button.

### Out of scope
- Minor / Nit findings from the review.
- Existing test-coverage gaps for happy paths not touched by a fix above.
- Any feed-feature additions beyond the above.

## Deliverables

Two PRs, landed in order:

1. **`fix/feed-backend-perf`** — SQL migrations, RPC changes, activity-emission refactor, StrictMode-safe emit.
2. **`fix/feed-ux`** — error states, follow-row reorder, signed-out pill gating.

PR 1 must merge and deploy (DB + client consuming new RPC shape) before PR 2 starts, because PR 1 changes the `get_activity_feed` / `search_profiles` signatures and `ActivityList` / `PeopleList` consumers.

## PR 1 — Backend & Performance

### C1 — Per-stream cursors in `get_activity_feed`

**Problem.** Single `cursor_time` + merge-and-trim LIMIT can permanently skip public-stream events whenever the following-stream is denser.

**Fix.**
- Edit `supabase/create_get_activity_feed_function.sql` (in place, CREATE OR REPLACE).
- Replace parameter `cursor_time TIMESTAMPTZ DEFAULT NULL` with four new parameters:
  - `following_cursor TIMESTAMPTZ DEFAULT NULL`
  - `public_cursor TIMESTAMPTZ DEFAULT NULL`
  - `include_following BOOLEAN DEFAULT TRUE`
  - `include_public BOOLEAN DEFAULT TRUE`
- Each CTE applies its own cursor (`e.created_at < following_cursor` / `e.created_at < public_cursor`). NULL cursor means "start from newest".
- Each CTE is entirely skipped when its `include_*` flag is FALSE (wrap the CTE body in a conditional or produce no rows when the flag is off).
- Return columns unchanged beyond what M1 adds (see below). `event_source` already tags each row.
- Client computes next cursors per source: oldest `created_at` among rows where `event_source = 'following'` (or `'public'`). On subsequent calls, client passes that timestamp as the cursor.
- `feedService.getActivityFeed` signature becomes `{ followingCursor, publicCursor, includeFollowing, includePublic, pageSize }` → `{ events, nextFollowingCursor, nextPublicCursor, followingExhausted, publicExhausted }`.
- First call: both cursors `null`, both `include_*` `true`.

**Exhaustion semantics.**
- Client marks `publicExhausted = true` when the returned page contains zero `public` rows AND the request had `include_public = true` with a non-null cursor (i.e., we asked for more and got none). The RPC does not know about exhaustion; the client tracks it.
- Once exhausted, subsequent calls send `include_public: false` (same for following). This makes `null`-cursor unambiguously mean "start from newest" at the RPC layer without overloading NULL.
- If both streams are exhausted, the list's `onEndReached` stops firing additional calls (client-side short-circuit).

### M1 — Actor denormalization in RPC returns

**Problem.** Client fires N parallel `getProfileById` per page; `search_profiles` doesn't return `avatar_url` so each row fetches one.

**Fix.**
- Same edit to `create_get_activity_feed_function.sql`: add `JOIN public.profiles p ON p.id = e.actor_id` to both CTEs and add return columns:
  - `actor_username TEXT`
  - `actor_display_name TEXT`
  - `actor_avatar_url TEXT`
- Edit `supabase/create_search_profiles_function.sql` (in place): add `avatar_url` to the RETURNS TABLE and include `p.avatar_url` in each of the three `SELECT` branches.
- `ActivityList.tsx` / `PeopleList.tsx`: delete `fetchActors` helpers and the actor-map state. Rows read actor fields directly from the event / profile row.
- Keep `profileService.getProfileById` — still used by `PublicProfileScreen` and `useProfileDropdown`.

### C3 — Authenticated-only SELECT on `activity_events`

**Problem.** RLS policy allows `anon` role to read activity events, contradicting "Feed is auth-gated" from the original design.

**Fix.** New file: `supabase/alter_activity_events_rls_authenticated_only.sql`:
- `DROP POLICY IF EXISTS "Public actors' events are viewable" ON public.activity_events;`
- Recreate with `USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = activity_events.actor_id AND p.is_public = true))`.
- No data migration needed.

### M4 — Self-follow DB guard

**Problem.** `user_follows` has no CHECK preventing `follower_id = following_id`. Today a client-side bug could insert self-follow rows that would leak a user's own events into their feed (the RPC has a defensive `<> viewer_id` filter, but the constraint is defense-in-depth).

**Fix.** New file: `supabase/alter_user_follows_add_self_check.sql`:
- `ALTER TABLE public.user_follows ADD CONSTRAINT user_follows_no_self CHECK (follower_id <> following_id);`
- Idempotent-guard via `DO` block that checks `pg_constraint` so reruns are safe.

### M2 — Collapse `emitEvent` to one round-trip

**Problem.** Per call: `auth.getUser()` + `SELECT is_public` + `SELECT dedupe` + `INSERT`. Fires once per track past 50%, so a 16-track show = 60+ round-trips on the hot path.

**Fix.**
- New file: `supabase/alter_activity_events_dedupe_unique_index.sql`:
  - `CREATE UNIQUE INDEX IF NOT EXISTS activity_events_dedupe_day ON public.activity_events (actor_id, event_type, target_id, (date_trunc('day', created_at)));`
  - Trades the 24h sliding dedupe for a calendar-day dedupe. Edge case: emits at 23:59 and 00:01 of adjacent days would both succeed. Acceptable — the dedupe exists to prevent spam from repeated actions, not to produce a precise 24h window.
- Keep existing `idx_events_dedupe` — still useful for the RPC's `WHERE actor_id IN (...)` lookup in the following CTE. It becomes redundant for dedupe but remains load-bearing for reads.
- `src/services/activityService.ts`:
  - Module-level cache `isPublicCache: { userId: string; value: boolean } | null = null`.
  - Subscribe to `authService.onAuthStateChanged` (already implemented in both `authService.native.ts:210` and `authService.web.ts:104`) to invalidate the cache on sign-in/sign-out.
  - `emitEvent` flow: ensure `isPublicCache` (fetch + cache on miss) → `insert(...)`; ignore Postgres 23505 unique-violation errors; propagate other errors normally.
  - Remove the pre-insert dedupe SELECT.
- Net: 1 round-trip per emit in steady state (cache hit).

### M3 — StrictMode-safe emission from `PlayCountsContext`

**Problem.** Emit fires from inside the `setPlayCountsMap` updater. StrictMode double-invokes updaters in dev; the side-effect fires twice.

**Fix.**
- `src/contexts/PlayCountsContext.tsx`:
  - Derive `distinctShowsListenedCount` from `playCountsMap` via `useMemo` (already has the `getShowPlayCount` logic; the count is "number of unique `showId`s where `getShowPlayCount(showId) >= 1`").
  - Track `prevDistinctShowsListenedCountRef` via `useRef`.
  - `useEffect(() => { … }, [distinctShowsListenedCount])`: compare to ref; if strictly greater, compute the set of newly-crossed show IDs (by comparing current listenedShowIds snapshot to ref snapshot) and call `emitEvent('listened_show', newShowId)` for each. Update the ref snapshot at the end of the effect.
  - Updater becomes pure — builds the new map only.
- Double-effect edge case: React can invoke effects twice in StrictMode (dev mount), but the ref won't be stable across the unmount-remount cycle. Guard by comparing show-ID *sets*, not counts — the set diff from `prev → current` is empty on remount, so no duplicate emit.

### Tests (PR 1)

- `src/services/__tests__/feedService.test.ts` — new cases:
  - Per-stream cursor advancement: two RPC pages against a fixture where following stream has 30 events in last hour and public stream has 8 events from 2 days ago; assert page 1 + page 2 together surface all 38 events.
  - Cursor exhaustion: when a source returns 0 rows, subsequent pages omit it.
- `src/services/__tests__/activityService.test.ts` — new cases:
  - is_public cache: second call in same session skips the profile lookup.
  - Auth change invalidates the cache.
  - ON CONFLICT path (Postgres 23505): insert rejects with 23505 → emitEvent resolves without throwing.
  - Non-23505 errors still throw.
- `src/contexts/__tests__/PlayCountsContext.activityEmit.test.ts` — update:
  - Under simulated StrictMode double-render, emit fires exactly once per newly-crossed show.
  - Diff-based emission: if two shows cross threshold in one render, emit fires twice (one per show).

## PR 2 — UX & error handling

### C2 — Error and retry states for Feed lists

**Problem.** `try/finally` with no `catch`; RPC failure renders empty state.

**Fix.**
- New shared component `src/components/feed/ListErrorView.tsx`:
  - Props: `{ message: string; onRetry: () => void }`.
  - Renders a centered message + a "Retry" button, styled consistent with empty-state views.
- `src/components/feed/ActivityList.tsx`:
  - Add `error: Error | null` state.
  - Wrap `load` / `loadMore` in `try/catch/finally`:
    - `load` catch: `setError(err)`, toast via existing `useToast`, leave events list untouched on failed refresh (swap to `ListErrorView` only on first-load; on refresh-failure, keep existing data + toast).
    - `loadMore` catch: toast only; clear loading flag so the user can retry by scrolling again.
  - Render precedence: `isLoading && events.length === 0` → skeleton; `error && events.length === 0` → `ListErrorView`; otherwise the list.
- `src/components/feed/PeopleList.tsx`: same treatment.

### M5 — Optimistic reorder of follow/unfollow

**Problem.** Follow tap only flips the pill — row stays in its section until refresh.

**Fix.**
- Extract a pure function in `src/components/feed/peopleListState.ts`:
  - `reshapeAfterFollow(state: PeopleState, userId: string, nowFollowing: boolean): PeopleState`.
  - `true` path: find row in `discover` or `search` results; remove from origin; prepend to `following`; set `viewer_is_following = true`; `followers_count + 1`.
  - `false` path: find row in `following`; remove; prepend to `discover`; set `viewer_is_following = false`; `followers_count - 1`.
  - If the row doesn't exist in any section, return state unchanged (defensive).
- `PeopleList.tsx`:
  - Replace `onFollowChange` no-op with `setState(prev => reshapeAfterFollow(prev, userId, nowFollowing))`.
  - On follow-mutation failure from `PeopleRow`'s follow service call, `PeopleRow` already reverts its local optimistic state; `PeopleList` also reverts by calling the inverse reshape — propagated via existing error handling in the row, which already calls `onFollowChange(revertedState)`.

### M7 — Gate the pill on signed-in native users only

**Problem.** Signed-out native user sees the pill; tap is a dead handler.

**Fix.**
- `src/screens/FeedScreen.tsx`:
  - Pull `isAuthenticated` from the existing auth context (already wired via `useProfileDropdown` — export the flag from that hook, or consume the underlying auth context directly).
  - Wrap the pill JSX with `Platform.OS !== 'web' && isAuthenticated && (...)`.

### Tests (PR 2)

- `src/components/feed/__tests__/ListErrorView.test.tsx` — renders message + fires onRetry on tap.
- `src/components/feed/__tests__/ActivityList.test.tsx` (new):
  - First-load RPC failure shows `ListErrorView`; Retry re-invokes the RPC.
  - Refresh-failure keeps existing events and shows toast.
  - `loadMore` failure shows toast and re-enables trigger.
- `src/components/feed/__tests__/PeopleList.test.tsx` (new): same three scenarios.
- `src/components/feed/__tests__/peopleListState.test.ts` — exhaustive `reshapeAfterFollow` cases:
  - discover → following (top of list, count bumped)
  - search → following
  - following → discover (count decremented)
  - row not found → state unchanged
  - idempotent re-application (follow twice = single move; unfollow twice = single move)
- `src/screens/__tests__/FeedScreen.test.tsx`:
  - Pill hidden when `isAuthenticated === false` on native.
  - Pill always hidden on web.
  - Pill shown when authenticated on native.

## Risks & mitigations

- **RPC contract break.** Changing `get_activity_feed` params and return shape breaks any caller on old client builds. Mitigation: ship PR 1 atomically (SQL + client). The repo only has one mobile client and one web bundle; no other callers. Native users on older builds will see the feed fail (handled gracefully by C2's error state once PR 2 lands, but PR 1 ships first — so native clients on old builds will see a blank feed for the gap). Acceptable for a pre-GA app; document in the PR.
- **Calendar-day dedupe boundary.** Rare, cosmetic. Documented above.
- **`is_public` cache coherency.** A user who toggles their profile to private mid-session will keep emitting for ~session lifetime. Mitigation: invalidate on auth events (sign-in/out). Full invalidation on profile update is overkill for the current product; the next emit after cache expiry (if we add TTL later) fixes it.
- **Self-follow CHECK retrofit.** If any self-follow rows exist today, the `ALTER TABLE ADD CONSTRAINT` will fail. Mitigation: the migration begins with `DELETE FROM user_follows WHERE follower_id = following_id;` inside the same transaction. No legitimate self-follow data exists.

## Acceptance

PR 1 merged & deployed:
- Manual: a seeded test user following a high-activity follower plus a public-events source returns both streams across multiple pages with no gaps.
- Manual: the Supabase Table Editor shows the `activity_events` SELECT policy now requires authentication.
- Automated: new feedService + activityService + PlayCountsContext tests pass.
- Profiler: single listen-through of a 16-track show emits exactly one `listened_show` event and issues exactly one network round-trip from `activityService.emitEvent` (after cache warm).

PR 2 merged & deployed:
- Manual: kill network mid-feed-load → error view renders with Retry; tapping Retry succeeds once network returns.
- Manual: tap Follow on a Discover row → row moves to Following section with +1 follower count, no refresh.
- Manual: sign out on a native build → open Feed → My Profile pill is absent.
- Automated: new PR 2 tests pass.
