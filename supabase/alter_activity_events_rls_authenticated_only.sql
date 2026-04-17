-- supabase/alter_activity_events_rls_authenticated_only.sql
-- Replace the anonymous-readable SELECT policy with one that requires an
-- authenticated session. Per design: Feed is auth-gated; PostgREST anon key
-- should not be able to bulk-read activity_events.
-- Safe to run multiple times.

DROP POLICY IF EXISTS "Public actors' events are viewable" ON public.activity_events;

CREATE POLICY "Authenticated users can read public actors' events"
  ON public.activity_events FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = activity_events.actor_id
        AND p.is_public = true
    )
  );
