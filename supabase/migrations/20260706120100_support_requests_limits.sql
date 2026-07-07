-- supabase/migrations/20260706120100_support_requests_limits.sql
--
-- WHAT: Adds CHECK constraints on public.support_requests bounding the
--   length of message/subject/email, plus a minimal shape check on email
--   (must contain "@" with at least one character before it).
--
-- WHY: supabase/create_support_requests_table.sql:15-19 lets anyone (anon
--   key, no auth required) INSERT rows `with check (true)` against columns
--   with no length limit. A bad actor could POST arbitrarily large payloads
--   directly against the anon key with no application code involved at all,
--   inflating table/row storage for free. These constraints are a
--   server-side backstop; the same limits are mirrored client-side so
--   well-behaved clients get a friendly inline error before ever hitting the
--   network:
--     - subject/message: src/screens/SupportScreen.tsx (SUBJECT_MAX / MESSAGE_MAX)
--     - email: src/screens/SupportScreen.tsx (EMAIL_MAX) — added alongside
--       this migration.
--
-- CAVEAT: adding a CHECK constraint to an existing table validates every
--   existing row by default (this migration does not use NOT VALID). If any
--   row already inserted violates one of these limits, the ALTER will fail
--   until that row is cleaned up or the migration is changed to use
--   `NOT VALID` + a follow-up `VALIDATE CONSTRAINT`. Review existing
--   support_requests rows against these limits before applying.
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead. This file has not been run against any database; it is
-- a reviewable deliverable only.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_requests_message_length'
      and conrelid = 'public.support_requests'::regclass
  ) then
    alter table public.support_requests
      add constraint support_requests_message_length
      check (char_length(message) <= 5000);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'support_requests_subject_length'
      and conrelid = 'public.support_requests'::regclass
  ) then
    alter table public.support_requests
      add constraint support_requests_subject_length
      check (char_length(subject) <= 200);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'support_requests_email_length_and_shape'
      and conrelid = 'public.support_requests'::regclass
  ) then
    alter table public.support_requests
      add constraint support_requests_email_length_and_shape
      check (char_length(email) <= 320 and position('@' in email) > 1);
  end if;
end $$;
