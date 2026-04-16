-- supabase/add_profile_follow_counters.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS followers_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_followers_count
  ON public.profiles (followers_count DESC)
  WHERE is_public = true;

-- Trigger: maintain counters on insert/delete of user_follows rows.
CREATE OR REPLACE FUNCTION public.handle_user_follow_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
      SET followers_count = followers_count + 1
      WHERE id = NEW.following_id;
    UPDATE public.profiles
      SET following_count = following_count + 1
      WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
      SET followers_count = GREATEST(followers_count - 1, 0)
      WHERE id = OLD.following_id;
    UPDATE public.profiles
      SET following_count = GREATEST(following_count - 1, 0)
      WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_follows_counters ON public.user_follows;
CREATE TRIGGER trg_user_follows_counters
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_follow_counters();

-- One-shot backfill of initial counter values from existing rows.
UPDATE public.profiles p SET
  followers_count = COALESCE((
    SELECT COUNT(*) FROM public.user_follows f WHERE f.following_id = p.id
  ), 0),
  following_count = COALESCE((
    SELECT COUNT(*) FROM public.user_follows f WHERE f.follower_id = p.id
  ), 0);
