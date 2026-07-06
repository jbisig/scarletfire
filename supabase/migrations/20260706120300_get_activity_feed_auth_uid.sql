-- supabase/migrations/20260706120300_get_activity_feed_auth_uid.sql
--
-- WHAT: Drops and recreates public.get_activity_feed WITHOUT the
--   client-supplied `viewer_id uuid` parameter, using `auth.uid()` internally
--   in every place `viewer_id` used to appear. Original:
--     supabase/create_get_activity_feed_function.sql
--   (viewer_id uuid, cursor_time timestamptz default now(), page_size int default 30)
--
-- WHY: the original function trusted a client-supplied `viewer_id` for
--   "which following graph / already-following exclusion should this feed be
--   personalized for" — the function is SECURITY INVOKER so table-level RLS
--   on activity_events/user_follows/profiles still constrained what rows
--   could come back, but there was no reason to accept an identity parameter
--   at all when the caller's own session identity (auth.uid()) is always the
--   correct value. Removing the parameter removes a confused-deputy surface
--   entirely rather than relying on RLS to catch a mismatched viewer_id.
--
-- CLIENT: src/services/feedService.ts no longer passes viewer_id in the RPC
--   call (this repo is the only consumer of this RPC). Apply this migration
--   in the same deploy as that client change — an old client still sending
--   viewer_id would fail against the new signature since Postgres functions
--   are resolved by full parameter signature.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. This file has not been run against any database; it is
-- a reviewable deliverable only.

drop function if exists public.get_activity_feed(uuid, timestamptz, int);

create or replace function public.get_activity_feed(
  cursor_time timestamptz default now(),
  page_size int default 30
)
returns table (
  id          uuid,
  actor_id    uuid,
  event_type  text,
  target_type text,
  target_id   text,
  metadata    jsonb,
  created_at  timestamptz,
  source      text
)
language sql
stable
security invoker
set search_path = public
as $$
  with following_events as (
    select e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'following'::text as source
    from public.activity_events e
    join public.user_follows f
      on f.following_id = e.actor_id and f.follower_id = auth.uid()
    join public.profiles p
      on p.id = e.actor_id and p.is_public = true
    where e.created_at < cursor_time
      and e.actor_id <> auth.uid()
    order by e.created_at desc
    limit page_size
  ),
  public_events as (
    select e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'public'::text as source
    from public.activity_events e
    join public.profiles p
      on p.id = e.actor_id and p.is_public = true
    where e.created_at < cursor_time
      and e.actor_id <> auth.uid()
      and not exists (
        select 1 from public.user_follows f
        where f.follower_id = auth.uid() and f.following_id = e.actor_id
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

grant execute on function public.get_activity_feed(timestamptz, int) to authenticated;
