-- supabase/migrations/20260706120500_popular_collections_is_shared.sql
--
-- WHAT: CREATE OR REPLACE public.get_popular_collections(text, int) with an
--   added `and c.is_shared = true` gate on the collections/profiles join.
--   `CREATE OR REPLACE FUNCTION` preserves the function's existing
--   ownership, SECURITY DEFINER setting, `set search_path = public` pin, and
--   the `grant execute ... to anon, authenticated` from
--   supabase/create_popular_collections_function.sql — none of that is
--   restated or changed here, only the query body.
--
-- WHY: supabase/create_popular_collections_function.sql is SECURITY DEFINER
--   and granted to anon + authenticated, and its WHERE/JOIN gate only checks
--   `p.is_public = true` on the owner's profile — it never checks the
--   collection's own sharing flag. Once 20260706120000_collections_sharing_flag.sql
--   (which adds `collections.is_shared` and locks direct SELECT access to
--   `is_shared = true`) is applied, this RPC becomes the one remaining path
--   that still leaks every collection (including ones the owner never
--   shared) — full name/description/cover_image/slug/counts — for any owner
--   with a public profile, to any anon-key holder. This migration closes
--   that gap by requiring `is_shared = true` here too, matching the same
--   gate the direct-read policies enforce.
--
-- This file has not been applied anywhere; it must be applied together with
-- (immediately after) 20260706120000_collections_sharing_flag.sql — applying
-- this one without that one is a no-op error (is_shared wouldn't exist yet),
-- and applying that one without this one leaves the RPC leak open.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. This file has not been run against any database; it is
-- a reviewable deliverable only.

create or replace function public.get_popular_collections(
  p_type text,
  p_limit int default 10
)
returns table (
  id uuid,
  user_id uuid,
  name text,
  type text,
  description text,
  cover_image_url text,
  slug text,
  created_at timestamptz,
  updated_at timestamptz,
  item_count bigint,
  save_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.user_id,
    c.name,
    c.type,
    c.description,
    c.cover_image_url,
    c.slug,
    c.created_at,
    c.updated_at,
    (select count(*) from public.collection_items ci where ci.collection_id = c.id) as item_count,
    coalesce(sc.save_count, 0) as save_count
  from public.collections c
  inner join public.profiles p on p.id = c.user_id and p.is_public = true
  left join (
    select collection_id, count(*) as save_count
    from public.saved_collections
    where collection_id is not null
    group by collection_id
  ) sc on sc.collection_id = c.id
  where c.type = p_type
    and c.is_shared = true
  order by coalesce(sc.save_count, 0) desc, c.updated_at desc
  limit greatest(p_limit, 0);
$$;
