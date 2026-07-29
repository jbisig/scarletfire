-- supabase/migrations/20260729120000_user_ratings_table.sql
--
-- WHAT: Creates public.user_ratings — one JSONB row per user holding their
--   personal star-rating overrides for shows and song performances.
--   Written by src/services/userRatingsCloudService.ts (whole-blob upsert
--   keyed on user_id, same pattern as user_favorites / user_play_counts).
--
-- SHAPE: shows/performances are maps of key -> entry:
--   shows:        { "YYYY-MM-DD": { stars, ratedAt, deletedAt? } }
--   performances: { "<normalized title>|YYYY-MM-DD":
--                   { stars, ratedAt, deletedAt?, songTitle?, showIdentifier? } }
--   stars is 0..3 (0 = explicit zero rating suppressing the system rating);
--   deletedAt >= ratedAt marks a tombstone (reset), pruned client-side
--   after 30 days.
--
-- SIZE: jsonb size checks are a server-side backstop against oversized
--   blobs pushed straight at the anon/authed API (mirrors the
--   support_requests limits rationale). ~100 bytes/entry means the caps
--   below allow roughly 2.5k show + 10k performance overrides — far beyond
--   plausible use.
--
-- DELETION: user_id references auth.users ON DELETE CASCADE, so the
--   existing delete_user() SECURITY DEFINER function (which deletes the
--   auth.users row) cleans this table up automatically — no function
--   change needed.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. This file has not been run against any database; it
-- is a reviewable deliverable applied manually.

create table if not exists public.user_ratings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  shows jsonb not null default '{}'::jsonb,
  performances jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_ratings_shows_size
    check (pg_column_size(shows) <= 262144),        -- 256 KB
  constraint user_ratings_performances_size
    check (pg_column_size(performances) <= 1048576) -- 1 MB
);

alter table public.user_ratings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_ratings'
      and policyname = 'Users can read own ratings'
  ) then
    create policy "Users can read own ratings"
      on public.user_ratings for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_ratings'
      and policyname = 'Users can insert own ratings'
  ) then
    create policy "Users can insert own ratings"
      on public.user_ratings for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_ratings'
      and policyname = 'Users can update own ratings'
  ) then
    create policy "Users can update own ratings"
      on public.user_ratings for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_ratings'
      and policyname = 'Users can delete own ratings'
  ) then
    create policy "Users can delete own ratings"
      on public.user_ratings for delete
      using (auth.uid() = user_id);
  end if;
end $$;
