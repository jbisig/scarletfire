-- supabase/migrations/20260820120000_user_preferences_table.sql
--
-- WHAT: Creates public.user_preferences — one JSONB row per user holding
--   playback preferences. Written by src/services/userPreferencesCloudService.ts
--   (whole-blob upsert keyed on user_id, same pattern as user_ratings).
--
-- SHAPE:
--   prefs: { preference: 'popular'|'sbd'|'aud'|'matrix'|'fm',
--            preferenceSetAt: epoch-ms,
--            nudgeAnswers: { "<format>": 'yes'|'no' } }
--   pins:  { "YYYY-MM-DD": { identifier, format, pinnedAt, deletedAt? } }
--   deletedAt >= pinnedAt marks a tombstone (cleared pin), pruned
--   client-side after 30 days. Named `prefs` (not `source_prefs`) so future
--   settings have a home in the same row.
--
-- SIZE: serialized-text caps as a server-side backstop against oversized
--   blobs pushed straight at the API. A pin is ~120 bytes; 256 KB allows
--   ~2k pinned shows — the whole catalog is ~2k shows.
--
-- DELETION: user_id references auth.users ON DELETE CASCADE, so the
--   existing delete_user() function cleans this table up automatically.
--
-- RLS: policies wrap auth.uid() in a scalar subquery so it is evaluated
--   once per statement rather than per row.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. Apply with `supabase db push --linked`.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  pins jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_preferences_prefs_size
    check (octet_length(prefs::text) <= 16384),        -- 16 KB
  constraint user_preferences_pins_size
    check (octet_length(pins::text) <= 262144)         -- 256 KB
);

alter table public.user_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences'
      and policyname = 'Users can read own preferences'
  ) then
    create policy "Users can read own preferences"
      on public.user_preferences for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences'
      and policyname = 'Users can insert own preferences'
  ) then
    create policy "Users can insert own preferences"
      on public.user_preferences for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences'
      and policyname = 'Users can update own preferences'
  ) then
    create policy "Users can update own preferences"
      on public.user_preferences for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_preferences'
      and policyname = 'Users can delete own preferences'
  ) then
    create policy "Users can delete own preferences"
      on public.user_preferences for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;
