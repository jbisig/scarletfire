-- supabase/alter_activity_events_dedupe_unique_index.sql
-- Unique index on (actor_id, event_type, target_id, utc_day) enforcing
-- day-bucket dedupe at the DB level. Client relies on 23505 as the dedupe
-- signal (see activityService.emitEvent).
--
-- The bucket expression is `((created_at AT TIME ZONE 'UTC')::date)`:
-- - `AT TIME ZONE 'UTC'` converts timestamptz to timestamp (at UTC),
-- - `::date` casts that to a date.
-- The full expression is IMMUTABLE (unlike `date_trunc('day', timestamptz)`
-- which is STABLE because it reads session TimeZone). Postgres requires
-- IMMUTABLE expressions for index predicates/expressions.
--
-- Buckets are aligned to UTC midnight, not local midnight — a deliberate
-- trade-off: the 23:59-ET/00:01-ET boundary edge already exists under
-- either strategy, and UTC alignment makes the index deterministic for
-- a globally-distributed actor set.
--
-- Keep existing idx_events_dedupe — still useful for RPC reads.
-- Safe to run multiple times.

CREATE UNIQUE INDEX IF NOT EXISTS activity_events_dedupe_day
  ON public.activity_events (actor_id, event_type, target_id, ((created_at AT TIME ZONE 'UTC')::date));
