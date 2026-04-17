-- supabase/alter_activity_events_dedupe_unique_index.sql
-- Unique index on (actor_id, event_type, target_id, day) enabling
-- ON CONFLICT DO NOTHING in the client-side insert path (M2).
-- Keep existing idx_events_dedupe — still useful for RPC reads.
-- Safe to run multiple times.

CREATE UNIQUE INDEX IF NOT EXISTS activity_events_dedupe_day
  ON public.activity_events (actor_id, event_type, target_id, (date_trunc('day', created_at)));
