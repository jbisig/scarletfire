-- supabase/migrations/20260706130000_feed_streams_search_avatar_auth_uid.sql
--
-- WHAT: Fuses main's feed/search rework (PR #8: per-stream cursors, actor
--   denorm columns, avatar_url in people search) with the punch-list
--   auth.uid() hardening (migrations 120300/120400). Written while merging
--   the punch-list branch into main: PR #8's SQL (edited in place in the
--   legacy flat files) had never been applied to production, and the
--   punch-list migrations were applied 2026-07-06 from the pre-#8 function
--   bodies — so production needs this file to serve the merged client.
--
-- WHY auth.uid(): both functions are SECURITY INVOKER and personalize
--   results per viewer. Deriving the viewer from auth.uid() removes the
--   confused-deputy surface of a client-supplied viewer_id (see 120300/
--   120400 headers).
--
-- SUPERSEDES: the 2-arg get_activity_feed(cursor_time, page_size) created
--   by 120300 (dropped below — no shipped client ever called it; the
--   punch-list client was not deployed before this migration), and the
--   3-arg search_profiles created by 120400 (recreated below with
--   avatar_url in the return shape).
--
-- SHIMS: the legacy old-binary signatures are preserved:
--   get_activity_feed(viewer_id, cursor_time, page_size) and
--   search_profiles(query_text, viewer_id, cursor_offset, page_size),
--   recreated here because their RETURN shapes gain columns (a superset —
--   old clients ignore unknown JSON fields). Both ignore viewer_id and
--   delegate. The feed shim approximates the legacy single-stream feed by
--   passing cursor_time as both stream cursors (merged, created_at DESC,
--   same page_size cap) — acceptable for the transition window. Drop both
--   shims in a future migration once pre-2026-07 binaries age out.
--
-- Applied together with the punch-list→main merge. Never edit after apply.

-- ---------------------------------------------------------------------------
-- 1) get_activity_feed: drop the short-lived 2-arg single-stream version.
-- ---------------------------------------------------------------------------
drop function if exists public.get_activity_feed(timestamptz, int);

-- ---------------------------------------------------------------------------
-- 2) Canonical per-stream feed, viewer derived from auth.uid().
-- ---------------------------------------------------------------------------
create or replace function public.get_activity_feed(
  following_cursor   timestamptz default null,
  public_cursor      timestamptz default null,
  include_following  boolean     default true,
  include_public     boolean     default true,
  page_size          int         default 30
)
returns table (
  id                  uuid,
  actor_id            uuid,
  event_type          text,
  target_type         text,
  target_id           text,
  metadata            jsonb,
  created_at          timestamptz,
  source              text,
  actor_username      text,
  actor_display_name  text,
  actor_avatar_url    text
)
language sql
stable
security invoker
set search_path = public
as $$
  with viewer as (
    select auth.uid() as id
  ),
  following_events as (
    select e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'following'::text as source,
           p.username as actor_username,
           p.display_name as actor_display_name,
           p.avatar_url as actor_avatar_url
    from public.activity_events e
    join viewer v on true
    join public.user_follows f
      on f.following_id = e.actor_id and f.follower_id = v.id
    join public.profiles p
      on p.id = e.actor_id and p.is_public = true
    where include_following
      and (following_cursor is null or e.created_at < following_cursor)
      and e.actor_id <> v.id
    order by e.created_at desc
    limit page_size
  ),
  public_events as (
    select e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'public'::text as source,
           p.username as actor_username,
           p.display_name as actor_display_name,
           p.avatar_url as actor_avatar_url
    from public.activity_events e
    join viewer v on true
    join public.profiles p
      on p.id = e.actor_id and p.is_public = true
    where include_public
      and (public_cursor is null or e.created_at < public_cursor)
      and e.actor_id <> v.id
      and not exists (
        select 1 from public.user_follows f
        where f.follower_id = v.id and f.following_id = e.actor_id
      )
    order by e.created_at desc
    limit ceil(page_size / 4.0)
  )
  select * from following_events
  union all
  select * from public_events
  order by created_at desc
  limit page_size;
$$;

grant execute on function public.get_activity_feed(timestamptz, timestamptz, boolean, boolean, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Legacy feed shim: old 3-arg signature, return shape widened (superset).
--    Must drop first because the return type changes.
-- ---------------------------------------------------------------------------
drop function if exists public.get_activity_feed(uuid, timestamptz, int);

create function public.get_activity_feed(
  viewer_id   uuid,
  cursor_time timestamptz default now(),
  page_size   int         default 30
)
returns table (
  id                  uuid,
  actor_id            uuid,
  event_type          text,
  target_type         text,
  target_id           text,
  metadata            jsonb,
  created_at          timestamptz,
  source              text,
  actor_username      text,
  actor_display_name  text,
  actor_avatar_url    text
)
language sql
stable
security invoker
set search_path = public
as $$
  -- TRANSITION SHIM for pre-2026-07 binaries. viewer_id is IGNORED; the
  -- canonical function derives the viewer from auth.uid(). Legacy
  -- single-cursor behavior approximated by using cursor_time for both
  -- streams. Drop in a future migration once old binaries age out.
  select * from public.get_activity_feed(cursor_time, cursor_time, true, true, page_size);
$$;

grant execute on function public.get_activity_feed(uuid, timestamptz, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) search_profiles: recreate the 3-arg canonical with avatar_url in the
--    return shape (drop first — return type changes), viewer from auth.uid().
-- ---------------------------------------------------------------------------
drop function if exists public.search_profiles(text, int, int);

create function public.search_profiles(
  query_text    text,
  cursor_offset int default 0,
  page_size     int default 20
)
returns table (
  id                  uuid,
  username            text,
  display_name        text,
  avatar_url          text,
  followers_count     int,
  following_count     int,
  viewer_is_following boolean,
  section             text
)
language sql
stable
security invoker
set search_path = public
as $$
  with viewer as (
    select auth.uid() as id
  ),
  search_branch as (
    select p.id, p.username, p.display_name, p.avatar_url,
           p.followers_count, p.following_count,
           exists (
             select 1 from public.user_follows f, viewer v
             where f.follower_id = v.id and f.following_id = p.id
           ) as viewer_is_following,
           'search'::text as section
    from public.profiles p, viewer v
    where nullif(trim(query_text), '') is not null
      and p.is_public = true
      and p.id <> v.id
      and (p.username ilike '%' || nullif(trim(query_text), '') || '%'
           or (p.display_name is not null
               and p.display_name ilike '%' || nullif(trim(query_text), '') || '%'))
    order by p.followers_count desc, p.username asc
    limit 50
  ),
  following_branch as (
    select p.id, p.username, p.display_name, p.avatar_url,
           p.followers_count, p.following_count,
           true as viewer_is_following,
           'following'::text as section
    from public.profiles p
    join viewer v on true
    join public.user_follows f on f.following_id = p.id and f.follower_id = v.id
    where nullif(trim(query_text), '') is null
      and p.is_public = true
    order by coalesce(p.display_name, p.username) asc
  ),
  discover_branch as (
    select p.id, p.username, p.display_name, p.avatar_url,
           p.followers_count, p.following_count,
           false as viewer_is_following,
           'discover'::text as section
    from public.profiles p, viewer v
    where nullif(trim(query_text), '') is null
      and p.is_public = true
      and p.id <> v.id
      and not exists (
        select 1 from public.user_follows f
        where f.follower_id = v.id and f.following_id = p.id
      )
    order by p.followers_count desc, p.username asc
    limit page_size offset cursor_offset
  )
  select * from search_branch
  union all
  select * from following_branch
  union all
  select * from discover_branch;
$$;

grant execute on function public.search_profiles(text, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Legacy search shim: old 4-arg signature, return shape widened.
-- ---------------------------------------------------------------------------
drop function if exists public.search_profiles(text, uuid, int, int);

create function public.search_profiles(
  query_text    text,
  viewer_id     uuid,
  cursor_offset int default 0,
  page_size     int default 20
)
returns table (
  id                  uuid,
  username            text,
  display_name        text,
  avatar_url          text,
  followers_count     int,
  following_count     int,
  viewer_is_following boolean,
  section             text
)
language sql
stable
security invoker
set search_path = public
as $$
  -- TRANSITION SHIM for pre-2026-07 binaries. viewer_id is IGNORED (viewer
  -- derived from auth.uid() in the canonical function). Drop in a future
  -- migration once old binaries age out.
  select * from public.search_profiles(query_text, cursor_offset, page_size);
$$;

grant execute on function public.search_profiles(text, uuid, int, int) to authenticated;
