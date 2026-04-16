-- supabase/create_get_activity_feed_function.sql

CREATE OR REPLACE FUNCTION public.get_activity_feed(
  viewer_id uuid,
  cursor_time timestamptz DEFAULT now(),
  page_size int DEFAULT 30
)
RETURNS TABLE (
  id          uuid,
  actor_id    uuid,
  event_type  text,
  target_type text,
  target_id   text,
  metadata    jsonb,
  created_at  timestamptz,
  source      text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH following_events AS (
    SELECT e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'following'::text AS source
    FROM public.activity_events e
    JOIN public.user_follows f
      ON f.following_id = e.actor_id AND f.follower_id = viewer_id
    JOIN public.profiles p
      ON p.id = e.actor_id AND p.is_public = true
    WHERE e.created_at < cursor_time
      AND e.actor_id <> viewer_id
    ORDER BY e.created_at DESC
    LIMIT page_size
  ),
  public_events AS (
    SELECT e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'public'::text AS source
    FROM public.activity_events e
    JOIN public.profiles p
      ON p.id = e.actor_id AND p.is_public = true
    WHERE e.created_at < cursor_time
      AND e.actor_id <> viewer_id
      AND NOT EXISTS (
        SELECT 1 FROM public.user_follows f
        WHERE f.follower_id = viewer_id AND f.following_id = e.actor_id
      )
    ORDER BY e.created_at DESC
    LIMIT CEIL(page_size / 4.0)
  )
  SELECT * FROM following_events
  UNION ALL
  SELECT * FROM public_events
  ORDER BY created_at DESC
  LIMIT page_size;
$$;

GRANT EXECUTE ON FUNCTION public.get_activity_feed(uuid, timestamptz, int) TO authenticated;
