-- supabase/alter_user_follows_add_self_check.sql
-- Defensive: prevent user_follows rows where a user follows themselves.
-- Begins by deleting any existing self-follow rows so the ALTER doesn't abort.
-- Safe to run multiple times.

DELETE FROM public.user_follows WHERE follower_id = following_id;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_follows_no_self'
  ) then
    alter table public.user_follows
      add constraint user_follows_no_self
      check (follower_id <> following_id);
  end if;
end $$;
