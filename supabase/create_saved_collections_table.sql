-- supabase/create_saved_collections_table.sql
-- Saved references to other users' collections.
-- ON DELETE SET NULL on collection_id turns the row into a tombstone rather
-- than removing it, so the saver sees "No longer available" and can dismiss.

create table if not exists public.saved_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete set null,
  last_known_name text not null,
  last_known_type text not null check (last_known_type in ('show_collection', 'playlist')),
  last_known_owner_username text not null,
  saved_at timestamptz not null default now(),
  unique (user_id, collection_id)
);

create index if not exists saved_collections_user_saved_at_idx
  on public.saved_collections (user_id, saved_at desc)
  where collection_id is not null;

alter table public.saved_collections enable row level security;

drop policy if exists "saved_collections_owner_select" on public.saved_collections;
create policy "saved_collections_owner_select" on public.saved_collections
  for select using (auth.uid() = user_id);

drop policy if exists "saved_collections_owner_insert" on public.saved_collections;
create policy "saved_collections_owner_insert" on public.saved_collections
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_collections_owner_update" on public.saved_collections;
create policy "saved_collections_owner_update" on public.saved_collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_collections_owner_delete" on public.saved_collections;
create policy "saved_collections_owner_delete" on public.saved_collections
  for delete using (auth.uid() = user_id);
