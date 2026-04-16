-- supabase/backfill_activity_events.sql

CREATE OR REPLACE FUNCTION public.backfill_recent_activity(
  days int DEFAULT 30,
  per_user_cap int DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz := now() - (days || ' days')::interval;
BEGIN
  -- Temp table to track only the events inserted by THIS backfill run,
  -- so the per-user cap below doesn't accidentally drop live-app events.
  CREATE TEMP TABLE IF NOT EXISTS _backfilled_ids (id uuid PRIMARY KEY) ON COMMIT DROP;
  TRUNCATE _backfilled_ids;

  -- created_collection
  WITH inserted AS (
    INSERT INTO public.activity_events (actor_id, event_type, target_type, target_id, metadata, created_at)
    SELECT c.user_id, 'created_collection', 'collection', c.id::text,
           jsonb_build_object('name', c.name, 'type', c.type),
           c.created_at
    FROM public.collections c
    JOIN public.profiles p ON p.id = c.user_id AND p.is_public = true
    WHERE c.created_at >= cutoff
    AND NOT EXISTS (
      SELECT 1 FROM public.activity_events e
      WHERE e.actor_id = c.user_id
        AND e.event_type = 'created_collection'
        AND e.target_id = c.id::text
    )
    RETURNING id
  )
  INSERT INTO _backfilled_ids (id) SELECT id FROM inserted;

  -- saved_collection (skip if saved one's own collection)
  WITH inserted AS (
    INSERT INTO public.activity_events (actor_id, event_type, target_type, target_id, metadata, created_at)
    SELECT s.user_id, 'saved_collection', 'collection',
           s.collection_id::text,
           jsonb_build_object(
             'name', s.last_known_name,
             'type', s.last_known_type,
             'creator_username', s.last_known_owner_username
           ),
           s.saved_at
    FROM public.saved_collections s
    JOIN public.profiles p ON p.id = s.user_id AND p.is_public = true
    WHERE s.saved_at >= cutoff
      AND s.collection_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = s.collection_id AND c.user_id = s.user_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.activity_events e
        WHERE e.actor_id = s.user_id
          AND e.event_type = 'saved_collection'
          AND e.target_id = s.collection_id::text
      )
    RETURNING id
  )
  INSERT INTO _backfilled_ids (id) SELECT id FROM inserted;

  -- followed_user (only when followee is public)
  WITH inserted AS (
    INSERT INTO public.activity_events (actor_id, event_type, target_type, target_id, metadata, created_at)
    SELECT f.follower_id, 'followed_user', 'user', f.following_id::text,
           jsonb_build_object(
             'username', target.username,
             'display_name', target.display_name
           ),
           f.created_at
    FROM public.user_follows f
    JOIN public.profiles actor  ON actor.id  = f.follower_id  AND actor.is_public  = true
    JOIN public.profiles target ON target.id = f.following_id AND target.is_public = true
    WHERE f.created_at >= cutoff
    AND NOT EXISTS (
      SELECT 1 FROM public.activity_events e
      WHERE e.actor_id = f.follower_id
        AND e.event_type = 'followed_user'
        AND e.target_id = f.following_id::text
    )
    RETURNING id
  )
  INSERT INTO _backfilled_ids (id) SELECT id FROM inserted;

  -- Per-user cap: keep only the most-recent N events per actor from THIS backfill run.
  DELETE FROM public.activity_events e
  USING (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY actor_id ORDER BY created_at DESC) AS rn
    FROM public.activity_events
    WHERE id IN (SELECT id FROM _backfilled_ids)
  ) ranked
  WHERE e.id = ranked.id AND ranked.rn > per_user_cap;
END;
$$;

GRANT EXECUTE ON FUNCTION public.backfill_recent_activity(int, int) TO service_role;
