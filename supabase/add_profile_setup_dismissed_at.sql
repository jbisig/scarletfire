-- supabase/add_profile_setup_dismissed_at.sql
-- Adds a dismissal timestamp so the profile-onboarding prompt shows at most once.
-- Existing rows are backfilled to NOW() so already-enrolled users are treated as
-- "already past onboarding" and will not be prompted.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_setup_dismissed_at timestamptz;

UPDATE profiles
  SET profile_setup_dismissed_at = NOW()
  WHERE profile_setup_dismissed_at IS NULL;
