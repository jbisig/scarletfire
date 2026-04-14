-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text UNIQUE NOT NULL,
  display_name text,
  is_public    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Username format: lowercase alphanumeric, underscores, hyphens, 3-20 chars
ALTER TABLE profiles ADD CONSTRAINT username_format
  CHECK (username ~ '^[a-z0-9_-]{3,20}$');

-- Index for username lookups (public profile pages)
CREATE INDEX idx_profiles_username ON profiles (username);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_public = true);

-- Users can read their own profile (even if not public)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS on user_favorites: allow public read when profile is public
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own favorites (existing behavior, now explicit)
CREATE POLICY "Users can manage own favorites"
  ON user_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Anyone can read favorites of public profiles
CREATE POLICY "Public profile favorites are viewable"
  ON user_favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_favorites.user_id
      AND profiles.is_public = true
    )
  );

-- RLS on user_play_counts: same pattern
ALTER TABLE user_play_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own play counts"
  ON user_play_counts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public profile play counts are viewable"
  ON user_play_counts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_play_counts.user_id
      AND profiles.is_public = true
    )
  );
