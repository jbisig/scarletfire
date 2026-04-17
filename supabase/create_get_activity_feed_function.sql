-- supabase/create_get_activity_feed_function.sql
-- Per-stream cursors (following_cursor, public_cursor) with include flags so
-- the client can exhaust one stream without falsely re-fetching the other.
-- Returns actor denorm fields to eliminate N+1 client-side profile lookups.

-- Drop the prior signature so PostgREST doesn't keep overloaded variants.
DROP FUNCTION IF EXISTS public.get_activity_feed(uuid, timestamptz, int);

CREATE OR REPLACE FUNCTION public.get_activity_feed(
  viewer_id          uuid,
  following_cursor   timestamptz DEFAULT NULL,
  public_cursor      timestamptz DEFAULT NULL,
  include_following  boolean     DEFAULT TRUE,
  include_public     boolean     DEFAULT TRUE,
  page_size          int         DEFAULT 30
)
RETURNS TABLE (
  id                  uuid,
  actor_id            uuid,
  event_type          text,
  target_type         text,
  target_id           text,
  metadata            jsonb,
  created_at          timestamptz,
  source              text,
  actor_username      text,
  actor_display_name  text,
  actor_avatar_url    text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH following_events AS (
    SELECT e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'following'::text AS source,
           p.username AS actor_username,
           p.display_name AS actor_display_name,
           p.avatar_url AS actor_avatar_url
    FROM public.activity_events e
    JOIN public.user_follows f
      ON f.following_id = e.actor_id AND f.follower_id = viewer_id
    JOIN public.profiles p
      ON p.id = e.actor_id AND p.is_public = true
    WHERE include_following
      AND (following_cursor IS NULL OR e.created_at < following_cursor)
      AND e.actor_id <> viewer_id
    ORDER BY e.created_at DESC
    LIMIT page_size
  ),
  public_events AS (
    SELECT e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'public'::text AS source,
           p.username AS actor_username,
           p.display_name AS actor_display_name,
           p.avatar_url AS actor_avatar_url
    FROM public.activity_events e
    JOIN public.profiles p
      ON p.id = e.actor_id AND p.is_public = true
    WHERE include_public
      AND (public_cursor IS NULL OR e.created_at < public_cursor)
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

GRANT EXECUTE ON FUNCTION public.get_activity_feed(uuid, timestamptz, timestamptz, boolean, boolean, int) TO authenticated;
