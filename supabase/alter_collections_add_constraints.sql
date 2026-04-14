-- supabase/alter_collections_add_constraints.sql
-- Apply after create_collections_tables.sql has already been run.
-- Adds length/format CHECK constraints that weren't in the original schema.
-- Safe to run multiple times: each ALTER guards against existing constraints.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'collections_name_length'
  ) then
    alter table public.collections
      add constraint collections_name_length
      check (char_length(name) between 1 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'collections_description_length'
  ) then
    alter table public.collections
      add constraint collections_description_length
      check (description is null or char_length(description) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'collections_cover_image_url_length'
  ) then
    alter table public.collections
      add constraint collections_cover_image_url_length
      check (cover_image_url is null or char_length(cover_image_url) <= 1024);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'collections_slug_length'
  ) then
    alter table public.collections
      add constraint collections_slug_length
      check (char_length(slug) between 1 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'collection_items_identifier_length'
  ) then
    alter table public.collection_items
      add constraint collection_items_identifier_length
      check (char_length(item_identifier) between 1 and 256);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'collection_items_metadata_shape'
  ) then
    alter table public.collection_items
      add constraint collection_items_metadata_shape
      check (
        jsonb_typeof(item_metadata) = 'object'
        and octet_length(item_metadata::text) <= 4096
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'collection_items_position_nonneg'
  ) then
    alter table public.collection_items
      add constraint collection_items_position_nonneg
      check (position >= 0);
  end if;
end $$;
