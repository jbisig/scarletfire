-- supabase/migrations/20260706120400_search_profiles_auth_uid.sql
--
-- WHAT: Drops and recreates public.search_profiles WITHOUT the
--   client-supplied `viewer_id uuid` parameter, using `auth.uid()` internally
--   in every place `viewer_id` used to appear. Original:
--     supabase/create_search_profiles_function.sql
--   (query_text text, viewer_id uuid, cursor_offset int default 0, page_size int default 20)
--
-- WHY: same confused-deputy concern as get_activity_feed — the original
--   function let a caller pass an arbitrary `viewer_id` and get back
--   "is this profile followed by <that user>" / discover-feed personalization
--   computed for someone else's identity. SECURITY INVOKER + RLS on
--   profiles/user_follows limited the blast radius, but there's no reason to
--   accept the parameter at all when auth.uid() is always the correct value
--   for "who is asking".
--
-- CLIENT: src/services/feedService.ts no longer passes viewer_id in the RPC
--   call (this repo is the only consumer of this RPC). Apply this migration
--   in the same deploy as that client change.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. This file has not been run against any database; it is
-- a reviewable deliverable only.

drop function if exists public.search_profiles(text, uuid, int, int);

create or replace function public.search_profiles(
  query_text text,
  cursor_offset int default 0,
  page_size int default 20
)
returns table (
  id                  uuid,
  username            text,
  display_name        text,
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
  with search_branch as (
    select p.id, p.username, p.display_name,
           p.followers_count, p.following_count,
           exists (
             select 1 from public.user_follows f
             where f.follower_id = auth.uid() and f.following_id = p.id
           ) as viewer_is_following,
           'search'::text as section
    from public.profiles p
    where nullif(trim(query_text), '') is not null
      and p.is_public = true
      and p.id <> auth.uid()
      and (p.username ilike '%' || nullif(trim(query_text), '') || '%'
           or (p.display_name is not null
               and p.display_name ilike '%' || nullif(trim(query_text), '') || '%'))
    order by p.followers_count desc, p.username asc
    limit 50
  ),
  following_branch as (
    select p.id, p.username, p.display_name,
           p.followers_count, p.following_count,
           true as viewer_is_following,
           'following'::text as section
    from public.profiles p
    join public.user_follows f on f.following_id = p.id and f.follower_id = auth.uid()
    where nullif(trim(query_text), '') is null
      and p.is_public = true
    order by coalesce(p.display_name, p.username) asc
  ),
  discover_branch as (
    select p.id, p.username, p.display_name,
           p.followers_count, p.following_count,
           false as viewer_is_following,
           'discover'::text as section
    from public.profiles p
    where nullif(trim(query_text), '') is null
      and p.is_public = true
      and p.id <> auth.uid()
      and not exists (
        select 1 from public.user_follows f
        where f.follower_id = auth.uid() and f.following_id = p.id
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
