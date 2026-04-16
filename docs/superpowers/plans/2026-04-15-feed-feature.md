# Feed Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Feed bottom-nav tab with two sub-tabs: Activity (chronological event feed blending followed users + a public-event mixin) and People (searchable directory of public profiles with follow/unfollow).

**Architecture:** New `activity_events` Supabase table records 5 event types with denormalized `metadata` snapshots and RLS gated on actor's `is_public`. Two Postgres functions (`get_activity_feed`, `search_profiles`) handle reads. Profile follower/following counter columns + trigger enable popular-user sort. A new `activityService` is the single emission point, called from existing contexts/services. A new `feedService` wraps the Postgres functions. UI is a single `FeedScreen` with a segmented control swapping between `ActivityList` and `PeopleList`.

**Tech Stack:** Supabase (Postgres + RLS + RPC functions), React Native / Expo, React Navigation (native bottom tabs + web stack), Jest for service tests.

**Spec:** `docs/superpowers/specs/2026-04-15-feed-feature-design.md`

---

## Task 1: Database migration — `activity_events` table + RLS

**Files:**
- Create: `supabase/create_activity_events_table.sql`

- [ ] **Step 1: Write the SQL migration**

```sql
-- supabase/create_activity_events_table.sql

CREATE TABLE IF NOT EXISTS public.activity_events (
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

CREATE INDEX IF NOT EXISTS idx_events_actor_time
  ON public.activity_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_time
  ON public.activity_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_dedupe
  ON public.activity_events (actor_id, event_type, target_id, created_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read events whose actor is public.
DROP POLICY IF EXISTS "Public actors' events are viewable" ON public.activity_events;
CREATE POLICY "Public actors' events are viewable"
  ON public.activity_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = activity_events.actor_id
      AND p.is_public = true
    )
  );

-- Only the actor can insert, and only when their profile is public.
DROP POLICY IF EXISTS "Public actors can insert events" ON public.activity_events;
CREATE POLICY "Public actors can insert events"
  ON public.activity_events FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_public = true
    )
  );

-- No UPDATE or DELETE policies → both denied (events are immutable history;
-- ON DELETE CASCADE on actor_id handles user deletion).
```

- [ ] **Step 2: Apply the migration**

Run it in the Supabase SQL editor (or `supabase db push` if that workflow is set up). Verify the table, indexes, and policies in the dashboard (Database → Tables → activity_events).

- [ ] **Step 3: Commit**

```bash
git add supabase/create_activity_events_table.sql
git commit -m "feat(db): add activity_events table with RLS"
```

---

## Task 2: Database migration — `profiles` follower-count columns + trigger

**Files:**
- Create: `supabase/add_profile_follow_counters.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/add_profile_follow_counters.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS followers_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_followers_count
  ON public.profiles (followers_count DESC)
  WHERE is_public = true;

-- Trigger: maintain counters on insert/delete of user_follows rows.
CREATE OR REPLACE FUNCTION public.handle_user_follow_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
      SET followers_count = followers_count + 1
      WHERE id = NEW.following_id;
    UPDATE public.profiles
      SET following_count = following_count + 1
      WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
      SET followers_count = GREATEST(followers_count - 1, 0)
      WHERE id = OLD.following_id;
    UPDATE public.profiles
      SET following_count = GREATEST(following_count - 1, 0)
      WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_follows_counters ON public.user_follows;
CREATE TRIGGER trg_user_follows_counters
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_follow_counters();

-- One-shot backfill of initial counter values from existing rows.
UPDATE public.profiles p SET
  followers_count = COALESCE((
    SELECT COUNT(*) FROM public.user_follows f WHERE f.following_id = p.id
  ), 0),
  following_count = COALESCE((
    SELECT COUNT(*) FROM public.user_follows f WHERE f.follower_id = p.id
  ), 0);
```

- [ ] **Step 2: Apply the migration**

Run it in the Supabase SQL editor. Verify: pick any user with existing follows in the dashboard and confirm the new columns match a manual `SELECT COUNT(*) FROM user_follows WHERE …`.

- [ ] **Step 3: Commit**

```bash
git add supabase/add_profile_follow_counters.sql
git commit -m "feat(db): add follower/following counters to profiles"
```

---

## Task 3: Database function — `get_activity_feed`

**Files:**
- Create: `supabase/create_get_activity_feed_function.sql`

- [ ] **Step 1: Write the function**

```sql
-- supabase/create_get_activity_feed_function.sql

CREATE OR REPLACE FUNCTION public.get_activity_feed(
  viewer_id uuid,
  cursor_time timestamptz DEFAULT now(),
  page_size int DEFAULT 30
)
RETURNS TABLE (
  id          uuid,
  actor_id    uuid,
  event_type  text,
  target_type text,
  target_id   text,
  metadata    jsonb,
  created_at  timestamptz,
  source      text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH following_events AS (
    SELECT e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'following'::text AS source
    FROM public.activity_events e
    JOIN public.user_follows f
      ON f.following_id = e.actor_id AND f.follower_id = viewer_id
    JOIN public.profiles p
      ON p.id = e.actor_id AND p.is_public = true
    WHERE e.created_at < cursor_time
    ORDER BY e.created_at DESC
    LIMIT page_size
  ),
  public_events AS (
    SELECT e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'public'::text AS source
    FROM public.activity_events e
    JOIN public.profiles p
      ON p.id = e.actor_id AND p.is_public = true
    WHERE e.created_at < cursor_time
      AND e.actor_id <> viewer_id
      AND NOT EXISTS (
        SELECT 1 FROM public.user_follows f
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
$$;

GRANT EXECUTE ON FUNCTION public.get_activity_feed(uuid, timestamptz, int) TO authenticated;
```

- [ ] **Step 2: Apply and smoke-test**

Run the migration. In the SQL editor, with two test users (one following the other, both public), insert a couple of test rows into `activity_events` and call:

```sql
SELECT * FROM public.get_activity_feed('<viewer-uuid>'::uuid, now(), 30);
```

Verify followed-actor events come back first, then public events from non-followed actors.

- [ ] **Step 3: Commit**

```bash
git add supabase/create_get_activity_feed_function.sql
git commit -m "feat(db): get_activity_feed RPC"
```

---

## Task 4: Database function — `search_profiles`

**Files:**
- Create: `supabase/create_search_profiles_function.sql`

- [ ] **Step 1: Write the function (and enable pg_trgm if not already enabled)**

```sql
-- supabase/create_search_profiles_function.sql

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm
  ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm
  ON public.profiles USING gin (display_name gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_profiles(
  query_text text,
  viewer_id uuid,
  cursor_offset int DEFAULT 0,
  page_size int DEFAULT 20
)
RETURNS TABLE (
  id                  uuid,
  username            text,
  display_name        text,
  followers_count     int,
  following_count     int,
  viewer_is_following boolean,
  section             text  -- 'following' | 'discover' | 'search'
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH q AS (SELECT NULLIF(TRIM(query_text), '') AS s)
  -- Search mode: query non-empty → flat list of matches.
  SELECT p.id, p.username, p.display_name,
         p.followers_count, p.following_count,
         EXISTS (
           SELECT 1 FROM public.user_follows f
           WHERE f.follower_id = viewer_id AND f.following_id = p.id
         ) AS viewer_is_following,
         'search'::text AS section
  FROM public.profiles p, q
  WHERE q.s IS NOT NULL
    AND p.is_public = true
    AND p.id <> viewer_id
    AND (p.username ILIKE '%' || q.s || '%'
         OR (p.display_name IS NOT NULL AND p.display_name ILIKE '%' || q.s || '%'))
  ORDER BY p.followers_count DESC, p.username ASC
  LIMIT 50

  UNION ALL

  -- Following section: empty query, viewer's follows.
  SELECT p.id, p.username, p.display_name,
         p.followers_count, p.following_count,
         true AS viewer_is_following,
         'following'::text AS section
  FROM public.profiles p, q
  JOIN public.user_follows f ON f.following_id = p.id AND f.follower_id = viewer_id
  WHERE q.s IS NULL
    AND p.is_public = true
  ORDER BY COALESCE(p.display_name, p.username) ASC

  UNION ALL

  -- Discover section: empty query, popular non-followed public users.
  SELECT p.id, p.username, p.display_name,
         p.followers_count, p.following_count,
         false AS viewer_is_following,
         'discover'::text AS section
  FROM public.profiles p, q
  WHERE q.s IS NULL
    AND p.is_public = true
    AND p.id <> viewer_id
    AND NOT EXISTS (
      SELECT 1 FROM public.user_follows f
      WHERE f.follower_id = viewer_id AND f.following_id = p.id
    )
  ORDER BY p.followers_count DESC, p.username ASC
  LIMIT page_size OFFSET cursor_offset;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(text, uuid, int, int) TO authenticated;
```

**Note:** PostgREST cannot mix multiple `ORDER BY` clauses inside a single `UNION ALL` query the way the snippet appears to — Postgres requires the final ORDER BY to apply to the whole UNION result. The form above uses three independent SELECTs that are unioned; this works because each branch is exclusive (`q.s IS NULL` vs `q.s IS NOT NULL`) so only one branch returns rows for a given call, AND within that branch the ORDER BY in the branch is preserved by Postgres planner because UNION ALL + LIMIT inside a CTE-style branch is what each branch actually evaluates. **If you see "ORDER BY clause not allowed inside UNION ALL" in Postgres,** rewrite each branch as its own CTE (`WITH search_branch AS (... ORDER BY ... LIMIT ...), following_branch AS (...), discover_branch AS (...)`) and `SELECT * FROM search_branch UNION ALL SELECT * FROM following_branch UNION ALL SELECT * FROM discover_branch` at the end.

- [ ] **Step 2: Apply and smoke-test**

Run the migration. Test with empty and non-empty queries:

```sql
SELECT * FROM public.search_profiles('', '<viewer-uuid>'::uuid, 0, 20);
SELECT * FROM public.search_profiles('jer', '<viewer-uuid>'::uuid, 0, 20);
```

Verify: empty-query returns rows tagged `following` and `discover`; non-empty returns rows tagged `search`.

- [ ] **Step 3: Commit**

```bash
git add supabase/create_search_profiles_function.sql
git commit -m "feat(db): search_profiles RPC with pg_trgm"
```

---

## Task 5: Database script — backfill recent activity

**Files:**
- Create: `supabase/backfill_activity_events.sql`

- [ ] **Step 1: Write the backfill function**

```sql
-- supabase/backfill_activity_events.sql

CREATE OR REPLACE FUNCTION public.backfill_recent_activity(
  days int DEFAULT 30,
  per_user_cap int DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz := now() - (days || ' days')::interval;
BEGIN
  -- created_collection
  INSERT INTO public.activity_events (actor_id, event_type, target_type, target_id, metadata, created_at)
  SELECT c.user_id, 'created_collection', 'collection', c.id::text,
         jsonb_build_object('name', c.name, 'type', c.type),
         c.created_at
  FROM public.collections c
  JOIN public.profiles p ON p.id = c.user_id AND p.is_public = true
  WHERE c.created_at >= cutoff
  AND NOT EXISTS (
    SELECT 1 FROM public.activity_events e
    WHERE e.actor_id = c.user_id
      AND e.event_type = 'created_collection'
      AND e.target_id = c.id::text
  );

  -- saved_collection (skip if saved one's own collection)
  INSERT INTO public.activity_events (actor_id, event_type, target_type, target_id, metadata, created_at)
  SELECT s.user_id, 'saved_collection', 'collection',
         COALESCE(s.collection_id::text, ''),
         jsonb_build_object(
           'name', s.last_known_name,
           'type', s.last_known_type,
           'creator_username', s.last_known_owner_username
         ),
         s.saved_at
  FROM public.saved_collections s
  JOIN public.profiles p ON p.id = s.user_id AND p.is_public = true
  WHERE s.saved_at >= cutoff
    AND s.collection_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = s.collection_id AND c.user_id = s.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.activity_events e
      WHERE e.actor_id = s.user_id
        AND e.event_type = 'saved_collection'
        AND e.target_id = s.collection_id::text
    );

  -- followed_user (only when followee is public)
  INSERT INTO public.activity_events (actor_id, event_type, target_type, target_id, metadata, created_at)
  SELECT f.follower_id, 'followed_user', 'user', f.following_id::text,
         jsonb_build_object(
           'username', target.username,
           'display_name', target.display_name
         ),
         f.created_at
  FROM public.user_follows f
  JOIN public.profiles actor  ON actor.id  = f.follower_id  AND actor.is_public  = true
  JOIN public.profiles target ON target.id = f.following_id AND target.is_public = true
  WHERE f.created_at >= cutoff
  AND NOT EXISTS (
    SELECT 1 FROM public.activity_events e
    WHERE e.actor_id = f.follower_id
      AND e.event_type = 'followed_user'
      AND e.target_id = f.following_id::text
  );

  -- Per-user cap: keep only the most-recent N events per actor from this backfill.
  DELETE FROM public.activity_events e
  USING (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY actor_id ORDER BY created_at DESC) AS rn
    FROM public.activity_events
    WHERE created_at >= cutoff
  ) ranked
  WHERE e.id = ranked.id AND ranked.rn > per_user_cap;
END;
$$;

GRANT EXECUTE ON FUNCTION public.backfill_recent_activity(int, int) TO service_role;
```

**Notes:**
- `listened_show` and `favorited_show` are **not** backfilled. The spec confirms `user_play_counts` has no per-listen timestamp; spot-check the live `user_favorites` table during application — current schema selects `'shows, songs'` columns, suggesting jsonb arrays without per-favorite timestamps. If you find a per-favorite timestamp during implementation, add a fourth INSERT block following the same pattern.
- The per-user cap step caps total events from this backfill window (not just newly inserted ones). That's intentional: rerunning the backfill should not exceed the cap.

- [ ] **Step 2: Apply and run once**

```sql
SELECT public.backfill_recent_activity(30, 10);
```

Sanity check:

```sql
SELECT actor_id, event_type, COUNT(*) FROM public.activity_events
GROUP BY actor_id, event_type ORDER BY actor_id;
```

Run it a second time and verify the row count does not change (idempotency).

- [ ] **Step 3: Commit**

```bash
git add supabase/backfill_activity_events.sql
git commit -m "feat(db): backfill_recent_activity function"
```

---

## Task 6: `activityService` skeleton + types

**Files:**
- Create: `src/services/activityService.ts`

- [ ] **Step 1: Write the skeleton**

```ts
// src/services/activityService.ts
import { authService } from './authService';
import { logger } from '../utils/logger';

export type ActivityEventType =
  | 'listened_show'
  | 'favorited_show'
  | 'created_collection'
  | 'saved_collection'
  | 'followed_user';

export type ActivityTargetType = 'show' | 'collection' | 'user';

export interface ActivityEvent {
  id: string;
  actor_id: string;
  event_type: ActivityEventType;
  target_type: ActivityTargetType;
  target_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  source: 'following' | 'public';
}

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

class ActivityService {
  async emitEvent(
    type: ActivityEventType,
    targetType: ActivityTargetType,
    targetId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    throw new Error('not implemented');
  }
}

export const activityService = new ActivityService();
```

- [ ] **Step 2: Commit**

```bash
git add src/services/activityService.ts
git commit -m "feat(activity): scaffold activityService"
```

---

## Task 7: `activityService.emitEvent` implementation + tests

**Files:**
- Modify: `src/services/activityService.ts`
- Create: `src/services/__tests__/activityService.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/activityService.test.ts
import { activityService } from '../activityService';
import { authService } from '../authService';

jest.mock('../authService');

function setup({
  user = { id: 'me' } as { id: string } | null,
  profileIsPublic = true as boolean | null,
  recentEventExists = false,
  insertError = null as null | { message: string },
} = {}) {
  const profileSelect = jest.fn().mockReturnThis();
  const profileEq = jest.fn().mockReturnThis();
  const profileSingle = jest.fn().mockResolvedValue({
    data: profileIsPublic === null ? null : { is_public: profileIsPublic },
    error: null,
  });

  const dedupeSelect = jest.fn().mockReturnThis();
  const dedupeEq = jest.fn().mockReturnThis();
  const dedupeGte = jest.fn().mockReturnThis();
  const dedupeLimit = jest.fn().mockResolvedValue({
    data: recentEventExists ? [{ id: 'existing' }] : [],
    error: null,
  });

  const insert = jest.fn().mockResolvedValue({ error: insertError });

  const from = jest.fn((table: string) => {
    if (table === 'profiles') {
      return { select: profileSelect, eq: profileEq, single: profileSingle };
    }
    // activity_events
    return {
      select: dedupeSelect,
      eq: dedupeEq,
      gte: dedupeGte,
      limit: dedupeLimit,
      insert,
    };
  });

  (authService.getClient as jest.Mock).mockReturnValue({
    from,
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  });

  return { from, insert };
}

describe('activityService.emitEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts an event when user is signed in, public, and no dedupe hit', async () => {
    const { from, insert } = setup();
    await activityService.emitEvent('followed_user', 'user', 'target-1', { foo: 'bar' });
    expect(from).toHaveBeenCalledWith('activity_events');
    expect(insert).toHaveBeenCalledWith({
      actor_id: 'me',
      event_type: 'followed_user',
      target_type: 'user',
      target_id: 'target-1',
      metadata: { foo: 'bar' },
    });
  });

  it('is a no-op when user is signed out', async () => {
    const { insert } = setup({ user: null });
    await activityService.emitEvent('followed_user', 'user', 'target-1', {});
    expect(insert).not.toHaveBeenCalled();
  });

  it('is a no-op when user profile is not public', async () => {
    const { insert } = setup({ profileIsPublic: false });
    await activityService.emitEvent('followed_user', 'user', 'target-1', {});
    expect(insert).not.toHaveBeenCalled();
  });

  it('is a no-op when a duplicate event exists in the dedupe window', async () => {
    const { insert } = setup({ recentEventExists: true });
    await activityService.emitEvent('favorited_show', 'show', 'show-1', {});
    expect(insert).not.toHaveBeenCalled();
  });

  it('swallows insert errors (non-blocking)', async () => {
    const { insert } = setup({ insertError: { message: 'boom' } });
    await expect(
      activityService.emitEvent('followed_user', 'user', 't', {}),
    ).resolves.toBeUndefined();
    expect(insert).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/services/__tests__/activityService.test.ts`
Expected: FAIL ("not implemented").

- [ ] **Step 3: Implement `emitEvent`**

Replace the body of `emitEvent` in `src/services/activityService.ts`:

```ts
async emitEvent(
  type: ActivityEventType,
  targetType: ActivityTargetType,
  targetId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const me = userData?.user?.id;
    if (!me) return;

    // Privacy gate: skip emission if profile is not public.
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_public')
      .eq('id', me)
      .single();
    if (!profile || !profile.is_public) return;

    // Dedupe: skip if same (actor, type, target) exists in last 24h.
    const cutoff = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
    const { data: recent } = await supabase
      .from('activity_events')
      .select('id')
      .eq('actor_id', me)
      .eq('event_type', type)
      .eq('target_id', targetId)
      .gte('created_at', cutoff)
      .limit(1);
    if (recent && recent.length > 0) return;

    const { error } = await supabase
      .from('activity_events')
      .insert({
        actor_id: me,
        event_type: type,
        target_type: targetType,
        target_id: targetId,
        metadata,
      });
    if (error) {
      logger.create('activity').error('emitEvent insert failed', error);
    }
  } catch (err) {
    logger.create('activity').error('emitEvent error', err);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/services/__tests__/activityService.test.ts`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git add src/services/activityService.ts src/services/__tests__/activityService.test.ts
git commit -m "feat(activity): emitEvent with dedupe and privacy gate"
```

---

## Task 8: Wire `followed_user` emission into `followService.followUser`

**Files:**
- Modify: `src/services/followService.ts`
- Modify: `src/services/__tests__/followService.test.ts`

- [ ] **Step 1: Add a failing test**

Append to `src/services/__tests__/followService.test.ts`:

```ts
describe('followService emits activity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('followUser calls activityService.emitEvent for followed_user when target is public', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.insert.mockReturnValue({ error: null });

    // Mock target profile lookup
    const profileChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { is_public: true, username: 'target', display_name: 'Target User' },
        error: null,
      }),
    };
    from.mockImplementation((table: string) => table === 'profiles' ? profileChain : chain);

    const emitSpy = jest.spyOn(require('../activityService').activityService, 'emitEvent')
      .mockResolvedValue(undefined);

    await followService.followUser('target-1');

    expect(emitSpy).toHaveBeenCalledWith(
      'followed_user',
      'user',
      'target-1',
      expect.objectContaining({ username: 'target', display_name: 'Target User' }),
    );
  });

  it('followUser does NOT emit when target is private', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.insert.mockReturnValue({ error: null });

    const profileChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { is_public: false, username: 'priv', display_name: null },
        error: null,
      }),
    };
    from.mockImplementation((table: string) => table === 'profiles' ? profileChain : chain);

    const emitSpy = jest.spyOn(require('../activityService').activityService, 'emitEvent')
      .mockResolvedValue(undefined);

    await followService.followUser('target-1');
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/services/__tests__/followService.test.ts -t "emits activity"`
Expected: FAIL.

- [ ] **Step 3: Implement the emission**

In `src/services/followService.ts`, add to the imports at top:

```ts
import { activityService } from './activityService';
```

Modify `followUser` (extend the existing implementation — keep the insert, add a post-success emission):

```ts
async followUser(targetUserId: string): Promise<void> {
  const me = await this.currentUserId();
  const supabase = authService.getClient();
  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: me, following_id: targetUserId });
  if (error) throw error;

  // Look up the target's public status + display info for the event metadata.
  const { data: target } = await supabase
    .from('profiles')
    .select('is_public, username, display_name')
    .eq('id', targetUserId)
    .single();

  if (target?.is_public) {
    await activityService.emitEvent('followed_user', 'user', targetUserId, {
      username: target.username,
      display_name: target.display_name,
    });
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx jest src/services/__tests__/followService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/followService.ts src/services/__tests__/followService.test.ts
git commit -m "feat(activity): emit followed_user from followService"
```

---

## Task 9: Wire `favorited_show` emission into `FavoritesContext`

**Files:**
- Modify: `src/contexts/FavoritesContext.tsx`

- [ ] **Step 1: Locate the show-add path**

Open `src/contexts/FavoritesContext.tsx`. Find `addFavoriteShow` (it accepts a `GratefulDeadShow` and adds it to `favoriteShows`). Note the show object's fields — specifically `primaryIdentifier`, `date`, and `venue` (or whatever the venue field is called; verify in the file).

- [ ] **Step 2: Add the emission**

At the top of the file, add:

```ts
import { activityService } from '../services/activityService';
```

Inside `addFavoriteShow`, immediately after the local state update succeeds (before or after the cloud sync — non-blocking either way), add:

```ts
activityService.emitEvent('favorited_show', 'show', show.primaryIdentifier, {
  date: show.date,
  venue: show.venue,
}).catch(() => {});
```

If the show object uses different field names than `primaryIdentifier` / `date` / `venue`, adapt to the actual field names visible in the function. The metadata snapshot is what shows up in the feed headline, so include whatever the UI needs to render `"Favorited {date} — {venue}"`.

- [ ] **Step 3: Smoke-test**

Run the app on web (`npm run web`). Sign in with a public account. Favorite a show. Then in Supabase SQL editor:

```sql
SELECT * FROM activity_events
WHERE actor_id = '<your-user-id>'
ORDER BY created_at DESC LIMIT 5;
```

You should see one `favorited_show` row.

- [ ] **Step 4: Commit**

```bash
git add src/contexts/FavoritesContext.tsx
git commit -m "feat(activity): emit favorited_show from FavoritesContext"
```

---

## Task 10: Wire `created_collection` + `saved_collection` emissions into `collectionsService`

**Files:**
- Modify: `src/services/collectionsService.ts`

- [ ] **Step 1: Locate the create + save paths**

Open `src/services/collectionsService.ts`. Find:
- The function that creates a new collection (likely `createCollection` or similar; it inserts into the `collections` table).
- The function that saves another user's collection (likely `saveCollection`; it inserts into `saved_collections`).

- [ ] **Step 2: Add emissions**

At the top of the file, add:

```ts
import { activityService } from './activityService';
```

After a successful insert in **createCollection**, add (using the actual returned collection's `id`, `name`, `type`):

```ts
activityService.emitEvent('created_collection', 'collection', created.id, {
  name: created.name,
  type: created.type,
}).catch(() => {});
```

After a successful insert in **saveCollection**, add (skip if the saved collection's `creator_id === currentUserId`):

```ts
if (collection.creator_id !== currentUserId) {
  activityService.emitEvent('saved_collection', 'collection', collection.id, {
    name: collection.name,
    type: collection.type,
    creator_username: collection.creator_username,
  }).catch(() => {});
}
```

The exact variable names depend on what the function has in scope at the emission site. Read the function carefully and use the names that already exist there. If creator-vs-self comparison isn't trivially available, do whatever read is needed (e.g., look at the `collection.user_id` field on the row being saved, compare to the current user's id from `authService.getClient().auth.getUser()`).

- [ ] **Step 3: Smoke-test**

Run the app, create a new collection → check `activity_events` for a `created_collection` row. Save someone else's collection → check for a `saved_collection` row. Save your own collection → no row.

- [ ] **Step 4: Commit**

```bash
git add src/services/collectionsService.ts
git commit -m "feat(activity): emit created_collection and saved_collection"
```

---

## Task 11: Add `totalTracks` to `recordTrackPlay` signature; thread through call sites

**Files:**
- Modify: `src/contexts/PlayCountsContext.tsx`
- Modify: `src/contexts/PlayerContext.tsx` (and any other caller — grep first)

- [ ] **Step 1: Find all call sites**

Run a search:

```bash
rg "recordTrackPlay\(" src
```

You should find call sites in `PlayerContext.tsx` (and possibly elsewhere). The audio-player call site has access to the show's track manifest, so it knows the total track count.

- [ ] **Step 2: Update the type and implementation in PlayCountsContext.tsx**

In `src/contexts/PlayCountsContext.tsx`:

Update the interface (around line 26):

```ts
recordTrackPlay: (
  trackTitle: string,
  showIdentifier: string,
  showDate: string,
  totalTracks: number,
) => Promise<void>;
```

Update the implementation signature (around line 170) to accept and ignore `totalTracks` for now (next task uses it):

```ts
const recordTrackPlay = useCallback(async (
  trackTitle: string,
  showIdentifier: string,
  showDate: string,
  totalTracks: number,
) => {
  // existing body unchanged for now; totalTracks used in Task 12.
  ...
}, [showSyncErrorToast]);
```

- [ ] **Step 3: Update each call site to pass `totalTracks`**

For each call site found in Step 1, pass the show's track count. In `PlayerContext.tsx`, the queue/playlist for the active show is already in scope — pass `currentShow.tracks.length` (or whatever the equivalent field is in that file).

If the call site does not have ready access to the track count, derive it from whatever queue or manifest it does have. Do not add network calls.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/PlayCountsContext.tsx src/contexts/PlayerContext.tsx
git commit -m "refactor(playcounts): thread totalTracks through recordTrackPlay"
```

---

## Task 12: Emit `listened_show` on derived show-play-count increment + tests

**Files:**
- Modify: `src/contexts/PlayCountsContext.tsx`
- Create: `src/contexts/__tests__/PlayCountsContext.activityEmit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/contexts/__tests__/PlayCountsContext.activityEmit.test.ts
import { activityService } from '../../services/activityService';

jest.mock('../../services/activityService', () => ({
  activityService: { emitEvent: jest.fn().mockResolvedValue(undefined) },
}));

// Pure unit test of the increment-detection helper that PlayCountsContext
// will export (see Step 2 for the helper definition).
import { computeShowPlayCount, shouldEmitListenedShow } from '../PlayCountsContext';
import type { PlayCount } from '../PlayCountsContext';

describe('computeShowPlayCount', () => {
  it('returns 0 when no tracks have been played', () => {
    expect(computeShowPlayCount([], 30)).toBe(0);
  });

  it('returns 1 when ≥50% of tracks have been played at least once', () => {
    const counts: PlayCount[] = Array.from({ length: 16 }, (_, i) => ({
      trackTitle: `t${i}`,
      showIdentifier: 's',
      showDate: '1977-05-08',
      count: 1,
      lastPlayedAt: 0,
      firstPlayedAt: 0,
    }));
    expect(computeShowPlayCount(counts, 30)).toBe(1);
  });

  it('returns 0 when fewer than 50% of tracks have been played', () => {
    const counts: PlayCount[] = Array.from({ length: 5 }, (_, i) => ({
      trackTitle: `t${i}`,
      showIdentifier: 's',
      showDate: '1977-05-08',
      count: 5,
      lastPlayedAt: 0,
      firstPlayedAt: 0,
    }));
    expect(computeShowPlayCount(counts, 30)).toBe(0);
  });

  it('returns 2 when ≥50% of tracks have been played twice', () => {
    const counts: PlayCount[] = Array.from({ length: 16 }, (_, i) => ({
      trackTitle: `t${i}`,
      showIdentifier: 's',
      showDate: '1977-05-08',
      count: 2,
      lastPlayedAt: 0,
      firstPlayedAt: 0,
    }));
    expect(computeShowPlayCount(counts, 30)).toBe(2);
  });
});

describe('shouldEmitListenedShow', () => {
  it('emits when count goes 0 -> 1', () => {
    expect(shouldEmitListenedShow(0, 1)).toBe(true);
  });
  it('emits when count goes 1 -> 2', () => {
    expect(shouldEmitListenedShow(1, 2)).toBe(true);
  });
  it('does not emit when count stays the same', () => {
    expect(shouldEmitListenedShow(1, 1)).toBe(false);
  });
  it('does not emit when count decreases (never expected)', () => {
    expect(shouldEmitListenedShow(2, 1)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/contexts/__tests__/PlayCountsContext.activityEmit.test.ts`
Expected: FAIL (helpers not exported).

- [ ] **Step 3: Extract helpers and emit on increment in PlayCountsContext.tsx**

In `src/contexts/PlayCountsContext.tsx`:

Add export above `PlayCountsProvider`:

```ts
export function computeShowPlayCount(
  showPlayCounts: PlayCount[],
  totalTracks: number,
): number {
  if (totalTracks === 0 || showPlayCounts.length === 0) return 0;
  const threshold = Math.ceil(totalTracks * 0.5);
  const maxCount = Math.max(...showPlayCounts.map(pc => pc.count));
  for (let n = maxCount; n >= 1; n--) {
    const tracksWithCountN = showPlayCounts.filter(pc => pc.count >= n).length;
    if (tracksWithCountN >= threshold) return n;
  }
  return 0;
}

export function shouldEmitListenedShow(prev: number, next: number): boolean {
  return next > prev;
}
```

Refactor `getShowPlayCount` to delegate to `computeShowPlayCount`:

```ts
const getShowPlayCount = useCallback((showIdentifier: string, totalTracks: number): number => {
  const showPlayCounts = showPlayCountsIndex.get(showIdentifier) ?? [];
  return computeShowPlayCount(showPlayCounts, totalTracks);
}, [showPlayCountsIndex]);
```

Add the import at the top of the file:

```ts
import { activityService } from '../services/activityService';
```

Modify `recordTrackPlay` to compute before/after and emit:

```ts
const recordTrackPlay = useCallback(async (
  trackTitle: string,
  showIdentifier: string,
  showDate: string,
  totalTracks: number,
) => {
  const now = Date.now();
  const key = `${trackTitle}:${showIdentifier}`;

  setPlayCountsMap(prev => {
    const existing = prev.get(key);
    const newMap = new Map(prev);

    if (existing) {
      newMap.set(key, { ...existing, count: existing.count + 1, lastPlayedAt: now });
    } else {
      newMap.set(key, {
        trackTitle, showIdentifier, showDate,
        count: 1, firstPlayedAt: now, lastPlayedAt: now,
      });
    }

    // Compute show-level count BEFORE and AFTER this increment.
    const prevShowCounts = Array.from(prev.values()).filter(pc => pc.showIdentifier === showIdentifier);
    const nextShowCounts = Array.from(newMap.values()).filter(pc => pc.showIdentifier === showIdentifier);
    const prevShowCount = computeShowPlayCount(prevShowCounts, totalTracks);
    const nextShowCount = computeShowPlayCount(nextShowCounts, totalTracks);

    if (shouldEmitListenedShow(prevShowCount, nextShowCount)) {
      activityService.emitEvent('listened_show', 'show', showIdentifier, {
        date: showDate,
      }).catch(() => {});
    }

    savePlayCounts(newMap);

    const auth = authStateRef.current;
    if (auth.isAuthenticated && auth.user) {
      const playCounts = Array.from(newMap.values());
      playCountsCloudService.syncPlayCounts(auth.user.id, playCounts).catch((error) => {
        playCountsLogger.error('Failed to sync play counts to cloud:', error);
        showSyncErrorToast();
      });
    }

    return newMap;
  });
}, [showSyncErrorToast]);
```

**Note:** The `metadata` only includes `date` here. If the venue is reachable via a separate lookup the audio player already does, pass `venue` through `recordTrackPlay` as well — but do not add a network call. The Activity row falls back gracefully when `venue` is missing (Task 14).

- [ ] **Step 4: Run tests**

Run: `npx jest src/contexts/__tests__/PlayCountsContext.activityEmit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/PlayCountsContext.tsx src/contexts/__tests__/PlayCountsContext.activityEmit.test.ts
git commit -m "feat(activity): emit listened_show on derived count increment"
```

---

## Task 13: `feedService` — `getActivityFeed` + `searchProfiles` + tests

**Files:**
- Create: `src/services/feedService.ts`
- Create: `src/services/__tests__/feedService.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/feedService.test.ts
import { feedService } from '../feedService';
import { authService } from '../authService';

jest.mock('../authService');

function setupRpc(rpcResponse: any) {
  const rpc = jest.fn().mockResolvedValue(rpcResponse);
  (authService.getClient as jest.Mock).mockReturnValue({
    rpc,
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'me' } } }) },
  });
  return rpc;
}

describe('feedService.getActivityFeed', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls get_activity_feed RPC with viewer + cursor + page size', async () => {
    const rpc = setupRpc({
      data: [
        { id: 'e1', actor_id: 'a', event_type: 'followed_user', target_type: 'user',
          target_id: 't', metadata: {}, created_at: '2026-04-15T00:00:00Z', source: 'following' },
      ],
      error: null,
    });

    const result = await feedService.getActivityFeed({
      cursor: '2026-04-15T01:00:00Z',
      pageSize: 30,
    });

    expect(rpc).toHaveBeenCalledWith('get_activity_feed', {
      viewer_id: 'me',
      cursor_time: '2026-04-15T01:00:00Z',
      page_size: 30,
    });
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('following');
  });

  it('returns [] when not signed in', async () => {
    (authService.getClient as jest.Mock).mockReturnValue({
      rpc: jest.fn(),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const result = await feedService.getActivityFeed({ cursor: null, pageSize: 30 });
    expect(result).toEqual([]);
  });
});

describe('feedService.searchProfiles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls search_profiles RPC with empty query → returns sectioned rows', async () => {
    const rpc = setupRpc({
      data: [
        { id: 'a', username: 'alice', display_name: 'Alice', followers_count: 5,
          following_count: 2, viewer_is_following: true, section: 'following' },
        { id: 'b', username: 'bob', display_name: null, followers_count: 100,
          following_count: 1, viewer_is_following: false, section: 'discover' },
      ],
      error: null,
    });

    const result = await feedService.searchProfiles({ query: '', cursor: 0, pageSize: 20 });

    expect(rpc).toHaveBeenCalledWith('search_profiles', {
      query_text: '',
      viewer_id: 'me',
      cursor_offset: 0,
      page_size: 20,
    });
    expect(result.following).toHaveLength(1);
    expect(result.discover).toHaveLength(1);
    expect(result.search).toEqual([]);
  });

  it('non-empty query → returns rows in `search` bucket', async () => {
    const rpc = setupRpc({
      data: [
        { id: 'a', username: 'alice', display_name: 'Alice', followers_count: 5,
          following_count: 2, viewer_is_following: false, section: 'search' },
      ],
      error: null,
    });

    const result = await feedService.searchProfiles({ query: 'al', cursor: 0, pageSize: 20 });
    expect(result.search).toHaveLength(1);
    expect(result.following).toEqual([]);
    expect(result.discover).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/services/__tests__/feedService.test.ts`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `feedService`**

```ts
// src/services/feedService.ts
import { authService } from './authService';
import type { ActivityEvent } from './activityService';

export interface PeopleRow {
  id: string;
  username: string;
  display_name: string | null;
  followers_count: number;
  following_count: number;
  viewer_is_following: boolean;
  section: 'following' | 'discover' | 'search';
}

export interface SectionedPeople {
  following: PeopleRow[];
  discover: PeopleRow[];
  search: PeopleRow[];
}

class FeedService {
  async getActivityFeed(args: {
    cursor: string | null;
    pageSize: number;
  }): Promise<ActivityEvent[]> {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const me = userData?.user?.id;
    if (!me) return [];

    const cursor = args.cursor ?? new Date().toISOString();
    const { data, error } = await supabase.rpc('get_activity_feed', {
      viewer_id: me,
      cursor_time: cursor,
      page_size: args.pageSize,
    });
    if (error) throw error;
    return (data ?? []) as ActivityEvent[];
  }

  async searchProfiles(args: {
    query: string;
    cursor: number;
    pageSize: number;
  }): Promise<SectionedPeople> {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const me = userData?.user?.id;
    if (!me) return { following: [], discover: [], search: [] };

    const { data, error } = await supabase.rpc('search_profiles', {
      query_text: args.query,
      viewer_id: me,
      cursor_offset: args.cursor,
      page_size: args.pageSize,
    });
    if (error) throw error;

    const rows = (data ?? []) as PeopleRow[];
    return {
      following: rows.filter(r => r.section === 'following'),
      discover:  rows.filter(r => r.section === 'discover'),
      search:    rows.filter(r => r.section === 'search'),
    };
  }
}

export const feedService = new FeedService();
```

- [ ] **Step 4: Run tests**

Run: `npx jest src/services/__tests__/feedService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/feedService.ts src/services/__tests__/feedService.test.ts
git commit -m "feat(feed): feedService with getActivityFeed and searchProfiles"
```

---

## Task 14: `ActivityRow` component

**Files:**
- Create: `src/components/feed/ActivityRow.tsx`

- [ ] **Step 1: Implement the row**

```tsx
// src/components/feed/ActivityRow.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileImage } from '../ProfileImage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import type { ActivityEvent } from '../../services/activityService';

export interface ActivityRowProps {
  event: ActivityEvent;
  actorDisplayName: string | null;
  actorUsername: string;
  actorAvatarUrl: string | null;
  onPressActor: () => void;
  onPressTarget: () => void;
}

const ICONS: Record<ActivityEvent['event_type'], keyof typeof Ionicons.glyphMap> = {
  listened_show: 'headset',
  favorited_show: 'heart',
  created_collection: 'add-circle',
  saved_collection: 'bookmark',
  followed_user: 'person-add',
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w`;
  return new Date(iso).toLocaleDateString();
}

function buildHeadline(event: ActivityEvent): string {
  const m = (event.metadata ?? {}) as Record<string, any>;
  switch (event.event_type) {
    case 'listened_show': {
      const date = m.date ?? '';
      const venue = m.venue ?? '';
      return venue ? `Listened to ${date} — ${venue}` : `Listened to ${date}`;
    }
    case 'favorited_show': {
      const date = m.date ?? '';
      const venue = m.venue ?? '';
      return venue ? `Favorited ${date} — ${venue}` : `Favorited ${date}`;
    }
    case 'created_collection':
      return `Created the playlist "${m.name ?? 'Untitled'}"`;
    case 'saved_collection':
      return `Saved ${m.creator_username ? `@${m.creator_username}'s` : "someone's"} playlist "${m.name ?? 'Untitled'}"`;
    case 'followed_user':
      return `Followed ${m.display_name ?? (m.username ? `@${m.username}` : 'a user')}`;
    default:
      return '';
  }
}

function ActivityRowImpl({
  event,
  actorDisplayName,
  actorUsername,
  actorAvatarUrl,
  onPressActor,
  onPressTarget,
}: ActivityRowProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onPressActor} style={styles.actorRow}>
        <ProfileImage avatarUrl={actorAvatarUrl} size={36} />
        <View style={styles.actorText}>
          <Text style={styles.displayName} numberOfLines={1}>
            {actorDisplayName ?? actorUsername}
          </Text>
          <Text style={styles.username} numberOfLines={1}>@{actorUsername}</Text>
        </View>
        <Text style={styles.time}>{formatRelative(event.created_at)}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressTarget} style={styles.headlineRow}>
        <Ionicons name={ICONS[event.event_type]} size={16} color={COLORS.textSecondary} />
        <Text style={styles.headline} numberOfLines={2}>{buildHeadline(event)}</Text>
      </TouchableOpacity>
    </View>
  );
}

export const ActivityRow = memo(ActivityRowImpl);

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  actorRow: { flexDirection: 'row', alignItems: 'center' },
  actorText: { flex: 1, marginLeft: SPACING.sm },
  displayName: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '600' },
  username: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  time: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingLeft: 36 + SPACING.sm,
  },
  headline: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.xs,
    flex: 1,
  },
});
```

**Note:** Verify token names against `src/constants/theme.ts` before running. If `COLORS.textSecondary`, `COLORS.border`, `TYPOGRAPHY.caption`, `RADIUS.*`, etc. don't exist, substitute the closest existing token. Do not invent new ones.

Verify `ProfileImage` props (open `src/components/ProfileImage.tsx`) — adjust `avatarUrl` / `size` if needed.

- [ ] **Step 2: Commit**

```bash
git add src/components/feed/ActivityRow.tsx
git commit -m "feat(feed): ActivityRow component"
```

---

## Task 15: `ActivityList` component (FlatList + pagination + pull-to-refresh)

**Files:**
- Create: `src/components/feed/ActivityList.tsx`

- [ ] **Step 1: Implement the list**

```tsx
// src/components/feed/ActivityList.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { feedService } from '../../services/feedService';
import { profileService } from '../../services/profileService';
import { ActivityRow } from './ActivityRow';
import type { ActivityEvent } from '../../services/activityService';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';

const PAGE_SIZE = 30;

interface ActorInfo {
  username: string;
  display_name: string | null;
  avatarUrl: string | null;
}

export function ActivityList({ onSwitchToPeople }: { onSwitchToPeople: () => void }) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [actors, setActors] = useState<Record<string, ActorInfo>>({});
  const actorsRef = useRef<Record<string, ActorInfo>>({});
  useEffect(() => { actorsRef.current = actors; }, [actors]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  // Stable identity — reads `actorsRef` (not state) to avoid re-fetch loops.
  const fetchActors = useCallback(async (newEvents: ActivityEvent[]) => {
    const missingIds = Array.from(
      new Set(newEvents.map(e => e.actor_id).filter(id => !(id in actorsRef.current))),
    );
    if (missingIds.length === 0) return;

    const fetched = await Promise.all(
      missingIds.map(async (id) => {
        const profile = await profileService.getProfileById(id);
        return [id, profile] as const;
      }),
    );

    setActors(prev => {
      const next = { ...prev };
      fetched.forEach(([id, p]) => {
        if (p) {
          next[id] = {
            username: p.username,
            display_name: p.display_name ?? null,
            avatarUrl: p.avatarUrl ?? null,
          };
        }
      });
      return next;
    });
  }, []);

  const load = useCallback(async (refreshing: boolean) => {
    if (refreshing) setIsRefreshing(true); else setIsLoading(true);
    try {
      const fresh = await feedService.getActivityFeed({
        cursor: null,
        pageSize: PAGE_SIZE,
      });
      setEvents(fresh);
      setReachedEnd(fresh.length < PAGE_SIZE);
      setCursor(fresh.length > 0 ? fresh[fresh.length - 1].created_at : null);
      await fetchActors(fresh);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchActors]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || reachedEnd || !cursor) return;
    setIsLoadingMore(true);
    try {
      const more = await feedService.getActivityFeed({ cursor, pageSize: PAGE_SIZE });
      if (more.length === 0) setReachedEnd(true);
      else {
        setEvents(prev => [...prev, ...more]);
        setCursor(more[more.length - 1].created_at);
        if (more.length < PAGE_SIZE) setReachedEnd(true);
        await fetchActors(more);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, fetchActors, isLoadingMore, reachedEnd]);

  useEffect(() => { load(false); }, [load]);

  const handlePressActor = (event: ActivityEvent) => {
    const a = actors[event.actor_id];
    if (a) navigation.navigate('PublicProfile', { username: a.username });
  };

  const handlePressTarget = (event: ActivityEvent) => {
    if (event.target_type === 'show') {
      navigation.navigate('ShowDetail', { identifier: event.target_id });
    } else if (event.target_type === 'collection') {
      navigation.navigate('CollectionDetail', { collectionId: event.target_id });
    } else if (event.target_type === 'user') {
      const targetUsername = (event.metadata as any)?.username;
      if (targetUsername) navigation.navigate('PublicProfile', { username: targetUsername });
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>;
  }

  if (events.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Nothing here yet — follow some folks.</Text>
        <TouchableOpacity onPress={onSwitchToPeople} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Find people</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => {
        const actor = actors[item.actor_id];
        return (
          <ActivityRow
            event={item}
            actorDisplayName={actor?.display_name ?? null}
            actorUsername={actor?.username ?? '…'}
            actorAvatarUrl={actor?.avatarUrl ?? null}
            onPressActor={() => handlePressActor(item)}
            onPressTarget={() => handlePressTarget(item)}
          />
        );
      }}
      onEndReachedThreshold={0.6}
      onEndReached={loadMore}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load(true)}
          tintColor={COLORS.accent}
        />
      }
      ListFooterComponent={isLoadingMore ? (
        <View style={styles.footer}><ActivityIndicator color={COLORS.accent} /></View>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.md },
  emptyBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.accent, borderRadius: 24 },
  emptyBtnText: { ...TYPOGRAPHY.button, color: COLORS.background },
  footer: { paddingVertical: SPACING.md },
});
```

**Note:** `profileService.getProfileById(id)` may not exist yet. If it doesn't, add a small method to `profileService` that does:

```ts
async getProfileById(id: string): Promise<{ username: string; display_name: string | null; avatarUrl: string | null } | null> {
  const supabase = authService.getClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('id', id)
    .single();
  if (!profile) return null;
  // avatar lookup mirrors the existing getPublicProfile logic
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(id, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
  let avatarUrl: string | null = null;
  if (files && files.length > 0) {
    const { data } = supabase.storage.from('avatars').getPublicUrl(`${id}/${files[0].name}`);
    avatarUrl = data.publicUrl;
  }
  return { username: profile.username, display_name: profile.display_name, avatarUrl };
}
```

Add this to `src/services/profileService.ts` if it's not already there. Verify the navigation route names (`PublicProfile`, `ShowDetail`, `CollectionDetail`) by grepping `RootStackParamList` in `src/navigation/AppNavigator.tsx` — adjust if they differ.

- [ ] **Step 2: Commit**

```bash
git add src/components/feed/ActivityList.tsx src/services/profileService.ts
git commit -m "feat(feed): ActivityList with pagination and refresh"
```

---

## Task 16: `PeopleRow` component

**Files:**
- Create: `src/components/feed/PeopleRow.tsx`

- [ ] **Step 1: Implement the row**

```tsx
// src/components/feed/PeopleRow.tsx
import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProfileImage } from '../ProfileImage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import type { PeopleRow as PeopleRowData } from '../../services/feedService';
import { followService } from '../../services/followService';

export interface PeopleRowProps {
  row: PeopleRowData;
  avatarUrl: string | null;
  onPressRow: () => void;
  onFollowChange: (nowFollowing: boolean) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}k`;
  }
  return String(n);
}

function PeopleRowImpl({ row, avatarUrl, onPressRow, onFollowChange }: PeopleRowProps) {
  const [following, setFollowing] = useState(row.viewer_is_following);
  const [busy, setBusy] = useState(false);

  const handleToggle = async (e: any) => {
    e?.stopPropagation?.();
    if (busy) return;
    const prev = following;
    setBusy(true);
    setFollowing(!prev);
    try {
      if (prev) await followService.unfollowUser(row.id);
      else await followService.followUser(row.id);
      onFollowChange(!prev);
    } catch {
      setFollowing(prev);
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableOpacity style={styles.row} onPress={onPressRow}>
      <ProfileImage avatarUrl={avatarUrl} size={44} />
      <View style={styles.text}>
        <Text style={styles.displayName} numberOfLines={1}>
          {row.display_name || row.username}
        </Text>
        <Text style={styles.subline} numberOfLines={1}>
          @{row.username} · {formatCount(row.followers_count)} followers · {formatCount(row.following_count)} following
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.pill, following ? styles.pillActive : styles.pillIdle]}
        onPress={handleToggle}
        disabled={busy}
      >
        <Text style={[styles.pillText, following ? styles.pillTextActive : styles.pillTextIdle]}>
          {following ? 'Following' : '+ Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export const PeopleRow = memo(PeopleRowImpl);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  text: { flex: 1, marginLeft: SPACING.sm },
  displayName: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '600' },
  subline: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 20, marginLeft: SPACING.sm },
  pillIdle: { backgroundColor: COLORS.accent },
  pillActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  pillText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  pillTextIdle: { color: COLORS.background },
  pillTextActive: { color: COLORS.text },
});
```

Verify theme tokens against `src/constants/theme.ts`. If `TYPOGRAPHY.caption` etc. don't exist, substitute closest tokens.

- [ ] **Step 2: Commit**

```bash
git add src/components/feed/PeopleRow.tsx
git commit -m "feat(feed): PeopleRow component with follow toggle"
```

---

## Task 17: `PeopleList` component (Following + Discover sections, search, pagination)

**Files:**
- Create: `src/components/feed/PeopleList.tsx`

- [ ] **Step 1: Implement the list**

```tsx
// src/components/feed/PeopleList.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, SectionList, FlatList, ActivityIndicator, Text, StyleSheet, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SearchBar } from '../SearchBar';
import { PeopleRow } from './PeopleRow';
import { feedService, type PeopleRow as PeopleRowData } from '../../services/feedService';
import { profileService } from '../../services/profileService';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';

const PAGE_SIZE = 20;

export function PeopleList() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [following, setFollowing] = useState<PeopleRowData[]>([]);
  const [discover, setDiscover] = useState<PeopleRowData[]>([]);
  const [search, setSearch] = useState<PeopleRowData[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string | null>>({});
  const avatarUrlsRef = useRef<Record<string, string | null>>({});
  useEffect(() => { avatarUrlsRef.current = avatarUrls; }, [avatarUrls]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [discoverCursor, setDiscoverCursor] = useState(0);
  const [discoverEnd, setDiscoverEnd] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search input.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Stable identity — reads `avatarUrlsRef` to avoid re-fetch loops.
  const fetchAvatars = useCallback(async (rows: PeopleRowData[]) => {
    const missing = rows.map(r => r.id).filter(id => !(id in avatarUrlsRef.current));
    if (missing.length === 0) return;
    const results = await Promise.all(
      missing.map(async (id) => {
        const p = await profileService.getProfileById(id);
        return [id, p?.avatarUrl ?? null] as const;
      }),
    );
    setAvatarUrls(prev => {
      const next = { ...prev };
      results.forEach(([id, url]) => { next[id] = url; });
      return next;
    });
  }, []);

  const load = useCallback(async (refreshing: boolean) => {
    if (refreshing) setIsRefreshing(true); else setIsLoading(true);
    try {
      const result = await feedService.searchProfiles({
        query: debouncedQuery,
        cursor: 0,
        pageSize: PAGE_SIZE,
      });
      setFollowing(result.following);
      setDiscover(result.discover);
      setSearch(result.search);
      setDiscoverCursor(result.discover.length);
      setDiscoverEnd(result.discover.length < PAGE_SIZE);
      await fetchAvatars([...result.following, ...result.discover, ...result.search]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedQuery, fetchAvatars]);

  useEffect(() => { load(false); }, [load]);

  const loadMoreDiscover = useCallback(async () => {
    if (debouncedQuery !== '' || discoverEnd) return;
    const result = await feedService.searchProfiles({
      query: '',
      cursor: discoverCursor,
      pageSize: PAGE_SIZE,
    });
    if (result.discover.length === 0) {
      setDiscoverEnd(true);
      return;
    }
    setDiscover(prev => [...prev, ...result.discover]);
    setDiscoverCursor(c => c + result.discover.length);
    if (result.discover.length < PAGE_SIZE) setDiscoverEnd(true);
    await fetchAvatars(result.discover);
  }, [debouncedQuery, discoverCursor, discoverEnd, fetchAvatars]);

  const handleRowPress = (row: PeopleRowData) => {
    navigation.navigate('PublicProfile', { username: row.username });
  };

  const handleFollowChange = (rowId: string, nowFollowing: boolean) => {
    // Local visual reorder happens on next refresh; no need to mutate state here
    // since PeopleRow keeps its own optimistic display state.
  };

  const renderRow = (row: PeopleRowData) => (
    <PeopleRow
      row={row}
      avatarUrl={avatarUrls[row.id] ?? null}
      onPressRow={() => handleRowPress(row)}
      onFollowChange={(f) => handleFollowChange(row.id, f)}
    />
  );

  const header = (
    <SearchBar
      value={query}
      onChangeText={setQuery}
      placeholder="Search people..."
      onClear={() => setQuery('')}
    />
  );

  if (isLoading) {
    return (
      <View>
        {header}
        <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>
      </View>
    );
  }

  // Search mode → flat list of search results.
  if (debouncedQuery !== '') {
    return (
      <View style={{ flex: 1 }}>
        {header}
        {search.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No people found for "{debouncedQuery}"</Text>
          </View>
        ) : (
          <FlatList
            data={search}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => renderRow(item)}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={COLORS.accent} />}
          />
        )}
      </View>
    );
  }

  // Default mode → sectioned list.
  const sections = [
    ...(following.length > 0 ? [{ title: 'FOLLOWING', data: following }] : []),
    { title: 'DISCOVER', data: discover },
  ];

  return (
    <View style={{ flex: 1 }}>
      {header}
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => renderRow(item)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        onEndReachedThreshold={0.6}
        onEndReached={loadMoreDiscover}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={COLORS.accent} />}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
});
```

**Note:** `SearchBar`'s prop names (`value`, `onChangeText`, `placeholder`, `onClear`) are taken from the exploration of `src/components/SearchBar.tsx`. Verify and adjust if any differ.

- [ ] **Step 2: Commit**

```bash
git add src/components/feed/PeopleList.tsx
git commit -m "feat(feed): PeopleList with sections and search"
```

---

## Task 18: `FeedScreen` shell (header + segmented control + body swap)

**Files:**
- Create: `src/screens/FeedScreen.tsx`

- [ ] **Step 1: Implement the screen**

```tsx
// src/screens/FeedScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { ActivityList } from '../components/feed/ActivityList';
import { PeopleList } from '../components/feed/PeopleList';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Segment = 'activity' | 'people';

export function FeedScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const responsive = useResponsive();
  const isDesktop = responsive?.isDesktop ?? false;

  const [segment, setSegment] = useState<Segment>('activity');
  const [myUsername, setMyUsername] = useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.id) { setMyUsername(null); return; }
    profileService.getProfileById(user.id).then(p => setMyUsername(p?.username ?? null));
  }, [user?.id]);

  const goToMyProfile = () => {
    if (!user) {
      navigation.navigate('Auth' as never);
      return;
    }
    if (myUsername) navigation.navigate('PublicProfile', { username: myUsername });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        {!isDesktop && user && myUsername && (
          <TouchableOpacity onPress={goToMyProfile} style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>My Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.segments}>
        <TouchableOpacity
          style={[styles.segment, segment === 'activity' && styles.segmentActive]}
          onPress={() => setSegment('activity')}
        >
          <Text style={[styles.segmentText, segment === 'activity' && styles.segmentTextActive]}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, segment === 'people' && styles.segmentActive]}
          onPress={() => setSegment('people')}
        >
          <Text style={[styles.segmentText, segment === 'people' && styles.segmentTextActive]}>
            People
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {segment === 'activity'
          ? <ActivityList onSwitchToPeople={() => setSegment('people')} />
          : <PeopleList />
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: { ...TYPOGRAPHY.h1, color: COLORS.text },
  profileBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.text, fontWeight: '600' },
  segments: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentActive: { borderBottomColor: COLORS.accent },
  segmentText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: COLORS.text },
});
```

**Notes:**
- Verify `useResponsive` returns `{ isDesktop }` (per the project memory) — adjust the destructure if the actual property name differs.
- If `TYPOGRAPHY.h1` doesn't exist, use whichever screen-title token other screens use (look at `DiscoverLandingScreen` or `FavoritesScreen` for the convention).
- The `'Auth' as never` cast follows the same pattern used in `PublicProfileScreen` for the sign-in CTA.

- [ ] **Step 2: Commit**

```bash
git add src/screens/FeedScreen.tsx
git commit -m "feat(feed): FeedScreen shell with segmented control"
```

---

## Task 19: Wire FeedTab into mobile bottom nav

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/components/CustomTabBar.tsx`

- [ ] **Step 1: Add FeedTab to the tab navigator**

In `src/navigation/AppNavigator.tsx`:

1. Add the import:
```ts
import { FeedScreen } from '../screens/FeedScreen';
```

2. Inside `MainTabsWithPlayer` (around the existing `<Tab.Screen name="DiscoverTab" …/>` block), insert after `SongsTab` and before `FavoritesTab`:
```tsx
<Tab.Screen name="FeedTab" component={FeedScreen} />
```

3. If `RootStackParamList` (or the tab param list) has explicit entries for tabs, add `FeedTab: undefined` (match the pattern of the existing tabs).

- [ ] **Step 2: Add icon + label to CustomTabBar**

In `src/components/CustomTabBar.tsx`, extend the `TAB_ICONS` and `TAB_LABELS` maps:

```ts
const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  DiscoverTab: { active: 'compass', inactive: 'compass-outline' },
  ShowsTab:    { active: 'calendar', inactive: 'calendar-outline' },
  SongsTab:    { active: 'musical-notes', inactive: 'musical-notes-outline' },
  FeedTab:     { active: 'pulse', inactive: 'pulse-outline' },        // <-- new
  FavoritesTab: { active: 'heart', inactive: 'heart-outline' },
};

const TAB_LABELS: Record<string, string> = {
  DiscoverTab: 'Discover',
  ShowsTab: 'Shows',
  SongsTab: 'Songs',
  FeedTab: 'Feed',                                                    // <-- new
  FavoritesTab: 'Favorites',
};
```

Match the actual structure of these maps in the file — open `CustomTabBar.tsx` first and use the existing entries as templates. Don't change the data shape; just add `FeedTab` keys.

- [ ] **Step 3: Smoke-test in the simulator and on web mobile**

```bash
npm run ios   # or npm run android
npm run web
```

Verify: 5 tabs render in the bottom bar, tapping Feed shows the FeedScreen with Activity selected.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/AppNavigator.tsx src/components/CustomTabBar.tsx
git commit -m "feat(nav): add Feed bottom-nav tab"
```

---

## Task 20: Wire Feed into desktop web layout (Sidebar + DesktopLayout + linking)

**Files:**
- Modify: `src/navigation/DesktopLayout.tsx`
- Modify: `src/components/web/Sidebar.tsx`
- Modify: `src/navigation/webLinking.ts`

- [ ] **Step 1: Add FeedTab to DesktopLayout**

In `src/navigation/DesktopLayout.tsx`:

1. Add import:
```ts
import { FeedScreen } from '../screens/FeedScreen';
```

2. Add to `TAB_ROOT_SCREENS`:
```ts
FeedTab: 'Feed',
```

3. Add to `SCREEN_TO_TAB`:
```ts
Feed: 'FeedTab',
```

4. Register in the Stack:
```tsx
<Stack.Screen name="Feed" component={FeedScreen} />
```

- [ ] **Step 2: Add Feed to the Sidebar**

In `src/components/web/Sidebar.tsx`, find `NAV_ITEMS` and insert after `Favorites` and before `My Profile`:

```ts
{ key: 'FeedTab', label: 'Feed', icon: 'pulse-outline', activeIcon: 'pulse', route: 'Feed' },
```

Match the exact shape of the other entries in the array — if the keys are named differently in this codebase, mirror them.

- [ ] **Step 3: Add Feed to web linking**

In `src/navigation/webLinking.ts`, add `Feed: 'feed'` inside the `screens` object of `desktopWebLinking.config` (and any equivalent block for mobile-web routing).

- [ ] **Step 4: Smoke-test on web desktop**

Resize browser ≥ 1024px wide. Reload. Verify:
- "Feed" appears in the sidebar between Favorites and My Profile.
- Clicking it shows the FeedScreen with the segmented control (no "My Profile" badge in the header — desktop already has My Profile in the sidebar).
- URL updates to `/feed`.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/DesktopLayout.tsx src/components/web/Sidebar.tsx src/navigation/webLinking.ts
git commit -m "feat(feed): desktop web sidebar entry and stack registration"
```

---

## Task 21: End-to-end manual QA

**Files:** none

- [ ] **Step 1: Apply all migrations to dev Supabase (in order)**

1. `supabase/create_activity_events_table.sql`
2. `supabase/add_profile_follow_counters.sql`
3. `supabase/create_get_activity_feed_function.sql`
4. `supabase/create_search_profiles_function.sql`
5. `supabase/backfill_activity_events.sql`

Then run `SELECT public.backfill_recent_activity(30, 10);` once.

- [ ] **Step 2: Seed test data**

Confirm at least 3 public test accounts exist with mutual follows and a few collections each. If not, sign up new test accounts via the app, mark them public in the dashboard, follow each other, and create a couple of collections.

- [ ] **Step 3: Walk the QA checklist**

From `docs/superpowers/specs/2026-04-15-feed-feature-design.md`, execute each item:

1. Listen to half of a show's tracks (e.g., 10 of 20 short tracks) → exactly one `listened_show` row appears in `activity_events` for the current user.
2. Listen to the same show again same day → no new row.
3. Listen enough additional times to push the derived show count from 1 → 2 → second `listened_show` row appears.
4. Favorite a show → row appears; unfavorite → no row added; refavorite within 24h → no duplicate.
5. Create a playlist → `created_collection` row.
6. Save another user's playlist → `saved_collection` row. Save your own → no row.
7. Follow a public user → `followed_user` row. Follow a private user (mark a test account `is_public = false` in the dashboard, follow them) → no row.
8. Set your own profile to private in the dashboard, take any of the actions above → no events emitted. Flip back to public → emission resumes.
9. Open Feed → Activity → followed users' events surface first; mixed in are events from non-followed public actors (~1 in 4 over a sufficient page).
10. Pull down → list refreshes.
11. Scroll to bottom → next page loads.
12. Tap an event row → navigates to the relevant target (show / collection / profile).
13. Tap an event's actor → navigates to actor's profile.
14. Open Feed → People → Following section shows people you follow alphabetically; Discover section sorts by follower count.
15. Type a query in the search bar → results appear within ~200ms; sections collapse into a flat list.
16. Tap "+ Follow" on a Discover row → pill becomes "Following"; refresh the page → the row now appears under Following.
17. On desktop web (≥1024px) → Feed appears in the sidebar; URL `/feed` deep-links straight in.
18. Tap "My Profile" badge in mobile FeedScreen header → navigates to your own public profile.
19. Sign out → My Profile badge hidden; Activity tab shows the "follow some folks" CTA which switches to People when tapped (since signed-out users have no follows).

- [ ] **Step 4: Spot-check Postgres performance**

In the SQL editor, with a few hundred test events:

```sql
EXPLAIN ANALYZE SELECT * FROM public.get_activity_feed('<viewer-uuid>'::uuid, now(), 30);
EXPLAIN ANALYZE SELECT * FROM public.search_profiles('je', '<viewer-uuid>'::uuid, 0, 20);
```

Confirm both use the indexes added in Tasks 1–4 (no sequential scans on `activity_events` or `profiles`).

- [ ] **Step 5: Final commit (only if anything changed during QA)**

```bash
git add -A
git commit -m "chore(feed): QA fixes" || echo "nothing to commit"
```

---

## Self-review notes

- **Spec coverage check:**
  - Goal & scope → covered across all tasks.
  - Event catalog → DB constraint (Task 1), emissions (Tasks 8–12).
  - Privacy gate → emitter (Task 7), DB RLS (Task 1).
  - Dedupe → emitter (Task 7).
  - Data model `activity_events` → Task 1; counter columns → Task 2.
  - Event emission sites → followed_user (8), favorited_show (9), created_collection + saved_collection (10), recordTrackPlay refactor (11), listened_show (12).
  - Feed query `get_activity_feed` → Task 3; service wrapper → Task 13.
  - People query `search_profiles` → Task 4; service wrapper → Task 13.
  - UI: FeedScreen (18), bottom nav (19), desktop (20), ActivityList (15), ActivityRow (14), PeopleList (17), PeopleRow (16).
  - Backfill → Task 5.
  - Manual QA → Task 21.

- **Type consistency:**
  - `ActivityEvent` defined in Task 6, used in Tasks 13, 14, 15. Property names (`actor_id`, `event_type`, `target_type`, `target_id`, `metadata`, `created_at`, `source`) match across the SQL function (Task 3) and the TypeScript type.
  - `PeopleRow` data shape from Task 4 matches the TypeScript interface in Task 13 and consumers in Tasks 16, 17.
  - `recordTrackPlay` 4-arg signature is established in Task 11 and used in Task 12.

- **Verification hooks called out for the implementer (not placeholders):**
  - Theme tokens: each UI task explicitly tells the implementer to verify `COLORS.*`, `TYPOGRAPHY.*`, etc. in `src/constants/theme.ts` and substitute closest existing tokens.
  - Component prop names (`SearchBar`, `ProfileImage`, `useResponsive`): verify before use.
  - Navigation route names (`PublicProfile`, `ShowDetail`, `CollectionDetail`, `Auth`): verify against `RootStackParamList`.
  - Postgres `UNION ALL` + per-branch ORDER BY edge case in Task 4: explicit fallback rewrite provided.
  - Sidebar nav-item shape (Task 20): mirror the existing array shape rather than guessing.

- **No placeholders:** every task has full SQL, full TS, full TSX. No "TBD", no "implement later", no "add appropriate error handling."
