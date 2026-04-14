-- supabase/create_collections_tables.sql
-- Collections & collection_items for user-organized show/playlist groupings.

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('show_collection', 'playlist')),
  description text,
  cover_image_url text,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists collections_user_updated_idx
  on public.collections (user_id, updated_at desc);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  item_identifier text not null,
  item_metadata jsonb not null,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  unique (collection_id, item_identifier)
);

create index if not exists collection_items_collection_position_idx
  on public.collection_items (collection_id, position);

-- updated_at trigger for collections
create or replace function public.set_collection_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_collection_updated_at();

-- Also bump parent collection updated_at when items change
create or replace function public.touch_collection_from_items()
returns trigger as $$
begin
  update public.collections
    set updated_at = now()
    where id = coalesce(new.collection_id, old.collection_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists collection_items_touch_parent on public.collection_items;
create trigger collection_items_touch_parent
  after insert or update or delete on public.collection_items
  for each row execute function public.touch_collection_from_items();

-- RLS
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

-- Owners: full CRUD on own collections
drop policy if exists "collections_owner_select" on public.collections;
create policy "collections_owner_select" on public.collections
  for select using (auth.uid() = user_id);

drop policy if exists "collections_owner_insert" on public.collections;
create policy "collections_owner_insert" on public.collections
  for insert with check (auth.uid() = user_id);

drop policy if exists "collections_owner_update" on public.collections;
create policy "collections_owner_update" on public.collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "collections_owner_delete" on public.collections;
create policy "collections_owner_delete" on public.collections
  for delete using (auth.uid() = user_id);

-- Public read by direct link (independent of profile visibility)
drop policy if exists "collections_public_select_by_link" on public.collections;
create policy "collections_public_select_by_link" on public.collections
  for select using (true);

-- Owners: full CRUD on items of own collections
drop policy if exists "collection_items_owner_select" on public.collection_items;
create policy "collection_items_owner_select" on public.collection_items
  for select using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "collection_items_owner_insert" on public.collection_items;
create policy "collection_items_owner_insert" on public.collection_items
  for insert with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "collection_items_owner_update" on public.collection_items;
create policy "collection_items_owner_update" on public.collection_items
  for update using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "collection_items_owner_delete" on public.collection_items;
create policy "collection_items_owner_delete" on public.collection_items
  for delete using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- Public items read (universal link access)
drop policy if exists "collection_items_public_select" on public.collection_items;
create policy "collection_items_public_select" on public.collection_items
  for select using (true);
