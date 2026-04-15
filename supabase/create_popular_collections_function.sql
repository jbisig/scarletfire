-- supabase/create_popular_collections_function.sql
-- RPC for the Discover screen: returns the most-saved collections of a given
-- type, restricted to owners with public profiles. Save counts are aggregated
-- across all users. Runs as SECURITY DEFINER so the cross-user count over
-- saved_collections isn't blocked by RLS.

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
  order by coalesce(sc.save_count, 0) desc, c.updated_at desc
  limit greatest(p_limit, 0);
$$;

grant execute on function public.get_popular_collections(text, int) to anon, authenticated;
