-- Create user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows (following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower  ON user_follows (follower_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can read rows where either side is a public profile.
-- This enables public followers/following lists and counts.
CREATE POLICY "Follows of public profiles are viewable"
  ON user_follows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_follows.following_id
      AND profiles.is_public = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_follows.follower_id
      AND profiles.is_public = true
    )
    OR auth.uid() = user_follows.follower_id
    OR auth.uid() = user_follows.following_id
  );

-- Only the follower can INSERT, and only when target is public.
CREATE POLICY "Users can follow public profiles"
  ON user_follows FOR INSERT
  WITH CHECK (
    auth.uid() = follower_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_follows.following_id
      AND profiles.is_public = true
    )
  );

-- Follower can unfollow; followee can remove a follower.
CREATE POLICY "Users can delete follows they participate in"
  ON user_follows FOR DELETE
  USING (
    auth.uid() = follower_id
    OR auth.uid() = following_id
  );
