-- supabase/migrations/20260706120200_avatar_bucket_storage_policies.sql
--
-- WHAT: RLS policies on storage.objects scoped to the `avatars` bucket:
--   owner-only INSERT/UPDATE/DELETE gated on the first path segment matching
--   `auth.uid()`, plus a public SELECT (avatars are meant to be publicly
--   viewable, e.g. on public profiles).
--
-- WHY: no storage.objects policy SQL for the avatars bucket exists anywhere
--   in this repo. src/services/profileService.ts:65-105 uploads to
--   `avatars/${userId}/avatar-<timestamp>.<ext>` with `upsert: true` and
--   expects the object to end up world-readable but owner-writable — but
--   nothing in the codebase enforces that. Whatever access the bucket
--   currently has was either configured by hand in the Supabase dashboard or
--   the bucket has no policies at all (in which case, with RLS enabled by
--   default on storage.objects, every operation is currently denied and
--   uploads are only working because of a permissive dashboard policy).
--   This migration is the first checked-in source of truth for that policy
--   set.
--
-- >>> STATUS (2026-07-06): RECONCILED — INTENTIONALLY NOT APPLIED <<<
--   Dashboard inspection of project fftvyuykqbixzupxzlmo found four
--   equivalent hand-configured policies already on storage.objects:
--     "Public can view avatars"              SELECT  bucket_id = 'avatars'
--     "Users can upload their own avatar"    INSERT  bucket + foldername[1] = auth.uid()
--     "Users can update their own avatar"    UPDATE  bucket + foldername[1] = auth.uid()
--       (no WITH CHECK — safe: Postgres applies USING to new rows when
--        WITH CHECK is absent, so folder scoping still holds on both sides)
--     "Users can delete their own avatar"    DELETE  bucket + foldername[1] = auth.uid()
--   These enforce the same guarantees this file would add; applying it would
--   only create redundant permissive duplicates. Kept in the repo as the
--   documented source of truth for what the dashboard policies must enforce.
--   If the dashboard policies are ever deleted, apply this file.
--
-- >>> RECONCILE WITH DASHBOARD BEFORE APPLYING <<<
--   The `avatars` bucket may already have equivalent policies created via
--   the Supabase Studio UI (Storage > Policies), possibly under different
--   names than the ones below. Applying this migration on top of
--   dashboard-authored policies will not conflict (Postgres evaluates all
--   matching permissive policies with OR), but it will leave duplicate
--   policies doing the same job. Before applying: query
--     select policyname, cmd, qual, with_check
--     from pg_policies
--     where schemaname = 'storage' and tablename = 'objects';
--   and drop/reconcile any existing avatars-scoped policies so there is
--   exactly one INSERT/UPDATE/DELETE/SELECT policy per bucket.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. This file has not been run against any database; it is
-- a reviewable deliverable only. (storage.objects already has row level
-- security enabled by default in every Supabase project — this migration
-- does not attempt to toggle it.)

drop policy if exists "avatars_public_select" on storage.objects;
create policy "avatars_public_select" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
