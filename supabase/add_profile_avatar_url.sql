-- supabase/add_profile_avatar_url.sql
--
-- Add avatar_url column to profiles so that cross-user surfaces
-- (public profiles, activity feed) can display OAuth avatars that
-- live in auth.users.raw_user_meta_data (not client-readable).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Backfill from auth.users metadata (covers OAuth + uploaded avatars,
-- since uploadAvatar also stores the public URL in user_metadata).
UPDATE public.profiles p
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
FROM auth.users u
WHERE u.id = p.id
  AND p.avatar_url IS NULL
  AND (
    u.raw_user_meta_data->>'avatar_url' IS NOT NULL
    OR u.raw_user_meta_data->>'picture' IS NOT NULL
  );
