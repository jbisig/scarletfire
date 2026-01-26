# Supabase Setup Guide

This guide will help you set up Supabase for authentication and cloud sync in your Grateful Dead Player app.

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: Grateful Dead Player
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is perfect for this project
4. Click **"Create new project"**
5. Wait for the project to be provisioned (takes 1-2 minutes)

## Step 2: Get Your API Keys

1. Once your project is ready, go to **Settings** (gear icon) → **API**
2. You'll need two values:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **anon public**: Your public API key (starts with `eyJ...`)

3. Open `/src/services/authService.ts` and replace:
   ```typescript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

   With your actual values:
   ```typescript
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...your-actual-anon-key...';
   ```

## Step 3: Enable Google OAuth (Optional)

If you want Google Sign-In:

1. Go to **Authentication** → **Providers** in Supabase
2. Click **"Google"**
3. Toggle **"Enable Sign in with Google"**
4. You'll need to:
   - Create a Google OAuth app in Google Cloud Console
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase
5. Save the settings

## Step 4: Create the Database Table

1. Go to **SQL Editor** in Supabase
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
-- Create user_favorites table
CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  shows JSONB DEFAULT '[]'::jsonb,
  songs JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own favorites
CREATE POLICY "Users can update own favorites"
  ON user_favorites
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX user_favorites_user_id_idx ON user_favorites(user_id);

-- Function to update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_favorites_updated_at
  BEFORE UPDATE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click **"Run"** to execute the SQL
5. You should see a success message

## Step 5: Configure Email Templates (Optional)

For better email verification/password reset emails:

1. Go to **Authentication** → **Email Templates**
2. Customize the templates with your app branding
3. Default templates work fine if you want to skip this

## Step 6: Test the Connection

Your app is now ready to use Supabase! When you run the app:

1. The app will connect to Supabase automatically
2. Sign up with email/password will create a user in Supabase Auth
3. Google Sign-In will work if you configured OAuth
4. Favorites will sync to the `user_favorites` table
5. Anonymous users (skip login) will only have local favorites

## Viewing Your Data

To see your users and data in Supabase:

- **Users**: Go to **Authentication** → **Users**
- **Favorites**: Go to **Table Editor** → **user_favorites**

## Security Notes

- ✅ Row Level Security (RLS) is enabled - users can only access their own data
- ✅ API keys are safe to use in the app (the anon key is public)
- ✅ All database operations are protected by RLS policies
- ✅ User passwords are hashed and secured by Supabase

## Free Tier Limits

The Supabase free tier includes:
- 50,000 monthly active users
- 500 MB database space
- 2 GB file storage
- 2 GB bandwidth

This is more than enough for personal use and testing!

## Troubleshooting

### "Invalid API key" error
- Double-check you copied the correct `anon public` key, not the service_role key

### "relation 'user_favorites' does not exist"
- Make sure you ran the SQL in Step 4

### Google Sign-In not working
- Verify OAuth redirect URI matches exactly
- Check that Google provider is enabled in Supabase

### Favorites not syncing
- Check the browser console/logs for errors
- Verify RLS policies are created (Step 4)
- Make sure user is authenticated

## Next Steps

After setup is complete, rebuild your iOS app:

```bash
cd ios
pod install
cd ..
npx expo run:ios
```

The app will now use Supabase for authentication and cloud sync!
