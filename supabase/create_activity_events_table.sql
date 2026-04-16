-- supabase/create_activity_events_table.sql

CREATE TABLE IF NOT EXISTS public.activity_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   text NOT NULL CHECK (event_type IN (
    'listened_show', 'favorited_show', 'created_collection',
    'saved_collection', 'followed_user'
  )),
  target_type  text NOT NULL CHECK (target_type IN ('show', 'collection', 'user')),
  target_id    text NOT NULL,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_actor_time
  ON public.activity_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_time
  ON public.activity_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_dedupe
  ON public.activity_events (actor_id, event_type, target_id, created_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read events whose actor is public.
DROP POLICY IF EXISTS "Public actors' events are viewable" ON public.activity_events;
CREATE POLICY "Public actors' events are viewable"
  ON public.activity_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = activity_events.actor_id
      AND p.is_public = true
    )
  );

-- Only the actor can insert, and only when their profile is public.
DROP POLICY IF EXISTS "Public actors can insert events" ON public.activity_events;
CREATE POLICY "Public actors can insert events"
  ON public.activity_events FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_public = true
    )
  );

-- No UPDATE or DELETE policies → both denied (events are immutable history;
-- ON DELETE CASCADE on actor_id handles user deletion).
