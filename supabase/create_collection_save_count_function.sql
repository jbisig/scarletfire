-- supabase/create_collection_save_count_function.sql
-- RPC used by the collection detail screen to show a "saves" count for a
-- single collection. Aggregates across all users, so it must run as
-- SECURITY DEFINER to bypass RLS on saved_collections.

create or replace function public.get_collection_save_count(
  p_collection_id uuid
)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.saved_collections
  where collection_id = p_collection_id;
$$;

grant execute on function public.get_collection_save_count(uuid) to anon, authenticated;
