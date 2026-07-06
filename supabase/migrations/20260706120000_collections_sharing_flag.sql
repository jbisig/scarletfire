-- supabase/migrations/20260706120000_collections_sharing_flag.sql
--
-- WHAT: Adds `collections.is_shared` (boolean, default false) and replaces
--   the two blanket `using (true)` public SELECT policies — one on
--   `collections`, one on `collection_items` — with a gate on that flag.
--   Owner policies (collections_owner_*, collection_items_owner_*) are
--   unchanged.
--
--   Source of the policies being replaced:
--     supabase/create_collections_tables.sql:90-92  "collections_public_select_by_link"
--     supabase/create_collections_tables.sql:132     "collection_items_public_select"
--
-- WHY: Today any anon-key holder can enumerate every user's collections —
--   including collections belonging to users with private profiles —
--   because the "public read by link" policies have no actual link/sharing
--   check behind them; `using (true)` means "readable by anyone, always".
--   This migration makes "readable by anyone with the URL" an explicit,
--   opt-in flag that only flips to true when the owner actually shares the
--   collection (client change: collectionsService.markCollectionShared,
--   called from CollectionDetailScreen.handleShare).
--
-- TRADEOFF (grandfathering): the UPDATE below sets `is_shared = true` on every
--   existing row so any link the owner already handed out (pasted in a chat,
--   posted to social, etc.) keeps resolving — we have no historical
--   share-event log to know which collections actually have a link in the
--   wild, so we err on the side of "don't break things that used to work"
--   rather than "fail closed and silently 404 someone's shared link". Newly
--   created collections default to `is_shared = false` (private until
--   explicitly shared), so the fix is forward-looking: the enumerable-by-
--   anyone problem stops growing today even though it doesn't retroactively
--   close for collections created before this migration.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. This file has not been run against any database; it is
-- a reviewable deliverable only.

alter table public.collections
  add column if not exists is_shared boolean not null default false;

-- Grandfather existing rows so already-distributed share links don't break.
-- See TRADEOFF above.
--
-- The blanket UPDATE below touches every row in public.collections, which
-- would otherwise fire the `collections_set_updated_at` trigger
-- (supabase/create_collections_tables.sql:46-47) and stamp every existing
-- collection's `updated_at` to "now" — scrambling recency ordering (e.g.
-- get_popular_collections' `order by ... c.updated_at desc`) for every
-- pre-existing collection. Disable the trigger for just this statement so
-- the grandfathering is invisible to updated_at, then re-enable it.
alter table public.collections disable trigger collections_set_updated_at;
update public.collections set is_shared = true;
alter table public.collections enable trigger collections_set_updated_at;

drop policy if exists "collections_public_select_by_link" on public.collections;
create policy "collections_public_select_by_link" on public.collections
  for select using (is_shared = true);

drop policy if exists "collection_items_public_select" on public.collection_items;
create policy "collection_items_public_select" on public.collection_items
  for select using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.is_shared = true
    )
  );
