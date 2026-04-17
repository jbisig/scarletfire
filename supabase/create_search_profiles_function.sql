-- supabase/create_search_profiles_function.sql

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm
  ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm
  ON public.profiles USING gin (display_name gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_profiles(
  query_text text,
  viewer_id uuid,
  cursor_offset int DEFAULT 0,
  page_size int DEFAULT 20
)
RETURNS TABLE (
  id                  uuid,
  username            text,
  display_name        text,
  avatar_url          text,
  followers_count     int,
  following_count     int,
  viewer_is_following boolean,
  section             text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH search_branch AS (
    SELECT p.id, p.username, p.display_name, p.avatar_url,
           p.followers_count, p.following_count,
           EXISTS (
             SELECT 1 FROM public.user_follows f
             WHERE f.follower_id = viewer_id AND f.following_id = p.id
           ) AS viewer_is_following,
           'search'::text AS section
    FROM public.profiles p
    WHERE NULLIF(TRIM(query_text), '') IS NOT NULL
      AND p.is_public = true
      AND p.id <> viewer_id
      AND (p.username ILIKE '%' || NULLIF(TRIM(query_text), '') || '%'
           OR (p.display_name IS NOT NULL
               AND p.display_name ILIKE '%' || NULLIF(TRIM(query_text), '') || '%'))
    ORDER BY p.followers_count DESC, p.username ASC
    LIMIT 50
  ),
  following_branch AS (
    SELECT p.id, p.username, p.display_name, p.avatar_url,
           p.followers_count, p.following_count,
           true AS viewer_is_following,
           'following'::text AS section
    FROM public.profiles p
    JOIN public.user_follows f ON f.following_id = p.id AND f.follower_id = viewer_id
    WHERE NULLIF(TRIM(query_text), '') IS NULL
      AND p.is_public = true
    ORDER BY COALESCE(p.display_name, p.username) ASC
  ),
  discover_branch AS (
    SELECT p.id, p.username, p.display_name, p.avatar_url,
           p.followers_count, p.following_count,
           false AS viewer_is_following,
           'discover'::text AS section
    FROM public.profiles p
    WHERE NULLIF(TRIM(query_text), '') IS NULL
      AND p.is_public = true
      AND p.id <> viewer_id
      AND NOT EXISTS (
        SELECT 1 FROM public.user_follows f
        WHERE f.follower_id = viewer_id AND f.following_id = p.id
      )
    ORDER BY p.followers_count DESC, p.username ASC
    LIMIT page_size OFFSET cursor_offset
  )
  SELECT * FROM search_branch
  UNION ALL
  SELECT * FROM following_branch
  UNION ALL
  SELECT * FROM discover_branch;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(text, uuid, int, int) TO authenticated;
