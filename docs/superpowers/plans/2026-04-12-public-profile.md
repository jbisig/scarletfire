# Public Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to opt-in to a public profile page at `/profile/:username` displaying their favorite shows, favorite songs, and most-listened-to content, shareable via a share card.

**Architecture:** New `profiles` table in Supabase with RLS policies for public read access. Profile settings managed in SettingsScreen. Public profile page as a new screen/route. Share card and OG image generation follow existing show/song share patterns.

**Tech Stack:** React Native/Expo, Supabase (Postgres + Auth + Storage), Vercel Functions (`@vercel/og` for OG images), TypeScript

---

### Task 1: Create Supabase `profiles` table and RLS policies

**Files:**
- Create: `supabase/create_profiles_table.sql`

This SQL file will be run manually against the Supabase dashboard (same pattern as the existing `supabase/delete_user_function.sql`).

- [ ] **Step 1: Write the migration SQL**

```sql
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
```

Save this to `supabase/create_profiles_table.sql`.

- [ ] **Step 2: Commit**

```bash
git add supabase/create_profiles_table.sql
git commit -m "feat: add profiles table migration with RLS policies"
```

> **Note:** This SQL must be run manually against the Supabase dashboard before testing. The existing `user_favorites` and `user_play_counts` tables currently have no RLS — this migration enables it and adds policies for both authenticated users and public readers. Test that existing favorites sync still works after enabling RLS.

---

### Task 2: Add profile service methods

**Files:**
- Modify: `src/services/profileService.ts`

Extend the existing `ProfileService` class with methods for profile CRUD and public data fetching.

- [ ] **Step 1: Add profile types and imports**

Add at the top of `src/services/profileService.ts`, after the existing imports:

```typescript
import { GratefulDeadShow } from '../types/show.types';
import { FavoriteSong } from './favoritesCloudService';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicProfileData {
  profile: UserProfile;
  avatarUrl: string | null;
  favorites: {
    shows: GratefulDeadShow[];
    songs: FavoriteSong[];
  };
  playCounts: Array<{ trackId: string; showIdentifier: string; count: number }>;
}
```

- [ ] **Step 2: Add getUserProfile method**

Add inside the `ProfileService` class:

```typescript
  /**
   * Fetch the authenticated user's own profile row from the profiles table.
   * Returns null if no profile exists yet (user hasn't set a username).
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No row yet
      throw error;
    }
    return data;
  }
```

- [ ] **Step 3: Add createProfile method**

```typescript
  /**
   * Create a new profile row. Called when the user sets a username for the first time.
   */
  async createProfile(userId: string, username: string): Promise<UserProfile> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, username: username.toLowerCase() })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
```

- [ ] **Step 4: Add updateUsername method**

```typescript
  /**
   * Update the user's username. Returns the updated profile or throws if
   * the username is taken (unique constraint violation).
   */
  async updateUsername(userId: string, username: string): Promise<UserProfile> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
```

- [ ] **Step 5: Add updateDisplayName method**

```typescript
  /**
   * Update the user's display name.
   */
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    const supabase = authService.getClient();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName || null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }
```

- [ ] **Step 6: Add setProfilePublic method**

```typescript
  /**
   * Toggle the user's profile visibility.
   */
  async setProfilePublic(userId: string, isPublic: boolean): Promise<void> {
    const supabase = authService.getClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }
```

- [ ] **Step 7: Add checkUsernameAvailable method**

```typescript
  /**
   * Check if a username is available. Returns true if no other user has it.
   * Uses the anon-accessible policy (public profiles) plus the user's own
   * row, so this works whether or not the caller is authenticated.
   */
  async checkUsernameAvailable(username: string): Promise<boolean> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return data === null;
  }
```

- [ ] **Step 8: Add getPublicProfile method**

```typescript
  /**
   * Fetch a public profile by username, including their favorites and play counts.
   * Returns null if the profile doesn't exist or is not public.
   */
  async getPublicProfile(username: string): Promise<PublicProfileData | null> {
    const supabase = authService.getClient();

    // Fetch profile (RLS ensures only public profiles are returned for non-owners)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (profileError || !profile) return null;

    // Fetch avatar URL from auth.users metadata via a targeted query.
    // Since we can't directly query auth.users from client, we'll resolve
    // the avatar from Supabase Storage using the user's id.
    const { data: avatarFiles } = await supabase.storage
      .from('avatars')
      .list(profile.id, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

    let avatarUrl: string | null = null;
    if (avatarFiles && avatarFiles.length > 0) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${profile.id}/${avatarFiles[0].name}`);
      avatarUrl = urlData.publicUrl;
    }

    // Fetch favorites and play counts in parallel
    const [favResult, playResult] = await Promise.all([
      supabase
        .from('user_favorites')
        .select('shows, songs')
        .eq('user_id', profile.id)
        .single(),
      supabase
        .from('user_play_counts')
        .select('play_counts')
        .eq('user_id', profile.id)
        .single(),
    ]);

    const favorites = {
      shows: favResult.data?.shows || [],
      songs: favResult.data?.songs || [],
    };

    const playCounts = playResult.data?.play_counts || [];

    return { profile, avatarUrl, favorites, playCounts };
  }
```

- [ ] **Step 9: Commit**

```bash
git add src/services/profileService.ts
git commit -m "feat: add profile CRUD and public data fetching to profileService"
```

---

### Task 3: Add "Public Profile" section to SettingsScreen

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Add imports and state**

At the top of `SettingsScreen.tsx`, add imports:

```typescript
import { Switch, TextInput, Linking as RNLinking } from 'react-native';
import { profileService, UserProfile } from '../services/profileService';
```

(Add `Switch` and `TextInput` to the existing `react-native` import, and `Linking as RNLinking` as well. Add the profileService import.)

Inside the `SettingsScreen` component (after the existing state declarations), add:

```typescript
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
```

- [ ] **Step 2: Add profile loading effect**

After the state declarations, add a useEffect to load the profile on mount:

```typescript
  // Load user's profile on mount
  React.useEffect(() => {
    if (!authState.user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const p = await profileService.getUserProfile(authState.user!.id);
        if (cancelled) return;
        setProfile(p);
        if (p) {
          setUsername(p.username);
          setDisplayName(p.display_name || '');
        }
      } catch {
        // Silently fail — profile section will show empty fields
      } finally {
        if (!cancelled) setIsProfileLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authState.user?.id]);
```

- [ ] **Step 3: Add username validation and save handler**

```typescript
  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Must be at least 3 characters';
    if (value.length > 20) return 'Must be 20 characters or less';
    if (!/^[a-z0-9_-]+$/.test(value)) return 'Only lowercase letters, numbers, _ and -';
    return null;
  };

  const handleUsernameSave = async () => {
    const trimmed = username.toLowerCase().trim();
    if (!trimmed || !authState.user?.id) return;

    const validationError = validateUsername(trimmed);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    // Don't save if unchanged
    if (profile && trimmed === profile.username) {
      setUsernameError(null);
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);

    try {
      const available = await profileService.checkUsernameAvailable(trimmed);
      if (!available && trimmed !== profile?.username) {
        setUsernameError('Username is already taken');
        return;
      }

      let updated: UserProfile;
      if (profile) {
        updated = await profileService.updateUsername(authState.user.id, trimmed);
      } else {
        updated = await profileService.createProfile(authState.user.id, trimmed);
      }
      setProfile(updated);
      setUsername(updated.username);
    } catch {
      setUsernameError('Failed to save username');
    } finally {
      setIsSavingUsername(false);
    }
  };
```

- [ ] **Step 4: Add display name save handler**

```typescript
  const handleDisplayNameSave = async () => {
    if (!authState.user?.id || !profile) return;
    if (displayName === (profile.display_name || '')) return;

    setIsSavingDisplayName(true);
    try {
      await profileService.updateDisplayName(authState.user.id, displayName.trim());
      setProfile(prev => prev ? { ...prev, display_name: displayName.trim() || null } : null);
    } catch {
      // Silently fail — field will show stale value
    } finally {
      setIsSavingDisplayName(false);
    }
  };
```

- [ ] **Step 5: Add public toggle handler**

```typescript
  const handlePublicToggle = async (value: boolean) => {
    if (!authState.user?.id || !profile) return;

    // Optimistic update
    setProfile(prev => prev ? { ...prev, is_public: value } : null);

    try {
      await profileService.setProfilePublic(authState.user.id, value);
    } catch {
      // Revert on failure
      setProfile(prev => prev ? { ...prev, is_public: !value } : null);
    }
  };
```

- [ ] **Step 6: Add the Public Profile section JSX**

In the render, insert this new section between the Account section and the Danger Zone section (after the `{/* Account Section */}` `</View>` closing tag and before `{/* Danger Zone */}`):

```tsx
      {/* Public Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Public Profile</Text>

        {isProfileLoading ? (
          <ActivityIndicator size="small" color={COLORS.textSecondary} />
        ) : (
          <>
            {/* Username */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={[styles.textInput, usernameError && styles.textInputError]}
                value={username}
                onChangeText={(text) => {
                  setUsername(text.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                  setUsernameError(null);
                }}
                onBlur={handleUsernameSave}
                placeholder="choose a username"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                editable={!isSavingUsername}
              />
              {usernameError && (
                <Text style={styles.fieldError}>{usernameError}</Text>
              )}
              {isSavingUsername && (
                <ActivityIndicator size="small" color={COLORS.textSecondary} style={{ marginTop: 4 }} />
              )}
            </View>

            {/* Display Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                onBlur={handleDisplayNameSave}
                placeholder={authState.user?.email?.split('@')[0] || 'your name'}
                placeholderTextColor={COLORS.textTertiary}
                maxLength={50}
                editable={!isSavingDisplayName}
              />
            </View>

            {/* Make Profile Public Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Make Profile Public</Text>
                <Text style={styles.toggleHint}>
                  {profile ? 'Allow others to see your favorites and listening history' : 'Set a username first to enable'}
                </Text>
              </View>
              <Switch
                value={profile?.is_public ?? false}
                onValueChange={handlePublicToggle}
                disabled={!profile}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor={COLORS.textPrimary}
              />
            </View>

            {/* Profile URL Preview */}
            {profile?.is_public && profile.username && (
              <TouchableOpacity
                style={styles.profileUrlContainer}
                onPress={() => RNLinking.openURL(`https://www.scarletfire.app/profile/${profile.username}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="link-outline" size={16} color={COLORS.accent} />
                <Text style={styles.profileUrl}>
                  scarletfire.app/profile/{profile.username}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
```

- [ ] **Step 7: Add styles for the new section**

Add to the `StyleSheet.create` in SettingsScreen:

```typescript
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  textInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInputError: {
    borderColor: COLORS.error,
  },
  fieldError: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  toggleLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  toggleHint: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  profileUrl: {
    ...TYPOGRAPHY.label,
    color: COLORS.accent,
  },
```

- [ ] **Step 8: Verify the Settings page renders correctly**

Run the dev server and navigate to Settings. Verify:
- The Public Profile section appears between Account and Danger Zone
- Username input accepts only valid characters
- Display name field works
- Toggle is disabled until username is set
- Profile URL appears when public + username set

- [ ] **Step 9: Commit**

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "feat: add Public Profile section to Settings screen"
```

---

### Task 4: Add share button to FavoritesScreen header

**Files:**
- Modify: `src/screens/FavoritesScreen.tsx`

- [ ] **Step 1: Add imports**

Add these imports to the top of `FavoritesScreen.tsx`:

```typescript
import { useShareSheet } from '../contexts/ShareSheetContext';
import { profileService, UserProfile } from '../services/profileService';
import Toast from 'react-native-root-toast';
```

(Check if `Toast` or a toast utility is already used in the codebase — if not, use `Alert` instead.)

- [ ] **Step 2: Add profile state and share sheet hook**

Inside the `FavoritesScreen` component, after the existing state declarations, add:

```typescript
  const { openShareTray } = useShareSheet();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
```

And add a useEffect to load the profile:

```typescript
  // Load user's profile for share button
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const { user } = authState || {};
    // Access user from the auth context — need to check how auth state is accessed
    // in this screen. The useProfileDropdown hook provides isAuthenticated.
    // We need the user ID, so let's use useAuth directly.
  }, [isAuthenticated]);
```

Actually, looking at the existing code, `FavoritesScreen` doesn't directly use `useAuth`. It uses `useProfileDropdown` which provides `isAuthenticated`. We need to also import `useAuth`:

```typescript
import { useAuth } from '../contexts/AuthContext';
```

Then in the component:

```typescript
  const { state: authState } = useAuth();
  const { openShareTray } = useShareSheet();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user's profile for share functionality
  React.useEffect(() => {
    if (!authState.user?.id) {
      setUserProfile(null);
      return;
    }
    profileService.getUserProfile(authState.user.id)
      .then(setUserProfile)
      .catch(() => setUserProfile(null));
  }, [authState.user?.id]);
```

- [ ] **Step 3: Add share button press handler**

```typescript
  const handleShareProfile = useCallback(() => {
    if (!userProfile || !userProfile.is_public || !userProfile.username) {
      Alert.alert(
        'Public Profile',
        'Set up your public profile in Settings to share your favorites.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Settings',
            onPress: () => {
              if (isDesktop) {
                navigation.reset({ index: 0, routes: [{ name: 'Settings' as never }] });
              } else {
                navigation.navigate('Settings' as never);
              }
            },
          },
        ]
      );
      return;
    }

    const displayName = userProfile.display_name || authState.user?.email?.split('@')[0] || 'User';
    openShareTray({
      kind: 'profile' as const,
      username: userProfile.username,
      displayName,
      showCount: favoriteShows.length,
      songCount: favoriteSongs.length,
    } as any); // Type will be updated in Task 5
  }, [userProfile, authState.user, favoriteShows.length, favoriteSongs.length, openShareTray, navigation, isDesktop]);
```

- [ ] **Step 4: Add share button to header JSX**

In the header's `headerRight` View (around line 724), add the share button **before** the `AnimatedSearchBar`:

```tsx
          <View style={[styles.headerRight, isSearchExpanded && { zIndex: 30 }]}>
            {/* Share Profile Button */}
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShareProfile}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Share favorites"
              >
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={COLORS.textHint}
                />
              </TouchableOpacity>
            )}

            {/* Animated Search Bar */}
            <AnimatedSearchBar
```

- [ ] **Step 5: Add headerButton style**

Add to the StyleSheet if not already present (check if `filterButton` can be reused — it should have the same dimensions):

```typescript
  headerButton: {
    width: LAYOUT.headerButtonSize,
    height: LAYOUT.headerButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
```

- [ ] **Step 6: Update searchBarFullWidth calculation**

The search bar's full width calculation needs to account for the new button. Update the line:

```typescript
  // Before (line ~149):
  const searchBarFullWidth = headerWidth - (padding * 2) - LAYOUT.headerButtonSize - LAYOUT.headerButtonGap;

  // After — add space for the share button:
  const shareButtonWidth = isAuthenticated ? LAYOUT.headerButtonSize + LAYOUT.headerButtonGap : 0;
  const searchBarFullWidth = headerWidth - (padding * 2) - LAYOUT.headerButtonSize - LAYOUT.headerButtonGap - shareButtonWidth;
```

- [ ] **Step 7: Commit**

```bash
git add src/screens/FavoritesScreen.tsx
git commit -m "feat: add share profile button to Favorites screen header"
```

---

### Task 5: Extend ShareItem type and share service for profiles

**Files:**
- Modify: `src/services/shareService.ts`
- Modify: `src/services/shareDestinations.native.ts`
- Modify: `src/services/shareDestinations.web.ts`

- [ ] **Step 1: Add profile kind to ShareItem type**

In `src/services/shareService.ts`, extend the `ShareItem` union:

```typescript
export type ShareItem =
  | {
      kind: 'show';
      showId: string;
      date: string;
      venue: string;
      tier: 1 | 2 | 3 | null;
    }
  | {
      kind: 'song';
      showId: string;
      trackId: string;
      trackTitle: string;
      trackSlug: string;
      date: string;
      venue: string;
      rating: 1 | 2 | 3 | null;
    }
  | {
      kind: 'profile';
      username: string;
      displayName: string;
      showCount: number;
      songCount: number;
    };
```

- [ ] **Step 2: Update buildShareUrl for profiles**

In `buildShareUrl`, add the profile case before the final return:

```typescript
export function buildShareUrl(item: ShareItem, bg: number): string {
  const bgSafe = clampBg(bg);
  if (item.kind === 'profile') {
    return `${WEB_ORIGIN}/profile/${item.username}?bg=${bgSafe}`;
  }
  const base = `${WEB_ORIGIN}/show/${item.date}`;
  if (item.kind === 'show') {
    return `${base}?bg=${bgSafe}`;
  }
  return `${base}/${item.trackSlug}?bg=${bgSafe}`;
}
```

- [ ] **Step 3: Update buildShareText for profiles**

```typescript
export function buildShareText(item: ShareItem): string {
  if (item.kind === 'profile') {
    return `${item.displayName}'s Favorites · ${item.showCount} shows · ${item.songCount} songs`;
  }
  const formattedDate = formatDateMMDDYYYY(item.date);
  if (item.kind === 'show') {
    return `${formattedDate} · ${item.venue}`;
  }
  return `${item.trackTitle} · ${formattedDate} · ${item.venue}`;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/services/shareService.ts
git commit -m "feat: extend ShareItem type and share URL/text builders for profiles"
```

---

### Task 6: Update ShareCard and ShareTray for profile items

**Files:**
- Modify: `src/components/share/ShareCard.tsx`
- Modify: `src/components/share/ShareTray.native.tsx`
- Modify: `src/components/share/ShareTray.web.tsx`

- [ ] **Step 1: Update ShareCard to handle profile items**

In `src/components/share/ShareCard.tsx`, update the component:

```tsx
export function ShareCard({ item, bgIndex }: ShareCardProps) {
  const bgSource = getShareBackground(bgIndex);

  let title: string;
  let subtitle: string;
  let metaDate: string | null = null;
  let tier: 1 | 2 | 3 | null = null;

  if (item.kind === 'profile') {
    title = `${item.displayName}'s Favorites`;
    subtitle = `${item.showCount} shows · ${item.songCount} songs`;
  } else {
    const formattedDate = formatDateMMDDYYYY(item.date);
    title = item.kind === 'show' ? formattedDate : item.trackTitle;
    subtitle = item.venue;
    tier = item.kind === 'show' ? item.tier : item.rating;
    if (item.kind === 'song') metaDate = formattedDate;
  }

  return (
    <View style={styles.card}>
      <ImageBackground source={bgSource} style={styles.bg} imageStyle={styles.bgImage}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.75)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />
        <View style={styles.content}>
          <Image source={SHARE_LOGO} style={styles.logo} resizeMode="contain" />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
            <View style={styles.metaRow}>
              {metaDate && (
                <Text style={styles.meta}>{metaDate}</Text>
              )}
              {tier !== null && <StarRating tier={tier} size={14} />}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
```

- [ ] **Step 2: Update ShareTray.native.tsx headline**

In `src/components/share/ShareTray.native.tsx`, update the headline logic (around line 58):

```typescript
  let headline: string;
  if (item.kind === 'profile') {
    headline = 'Share your favorites';
  } else {
    headline = item.kind === 'song' ? 'Share this song' : 'Share this show';
  }
```

Also update the bgIndex memo deps to handle the profile kind (no `showId` on profile items):

```typescript
  const bgIndex = useMemo(() => {
    return item ? pickRandomBackground() : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    item?.kind === 'profile' ? (item as any).username : item?.showId,
    item?.kind,
    item?.kind === 'song' ? item.trackId : null,
  ]);
```

- [ ] **Step 3: Update ShareTray.web.tsx headline**

Same change in `src/components/share/ShareTray.web.tsx`:

```typescript
  let headline: string;
  if (item.kind === 'profile') {
    headline = 'Share your favorites';
  } else {
    headline = item.kind === 'song' ? 'Share this song' : 'Share this show';
  }
```

Also update the bgIndex memo deps:

```typescript
  const bgIndex = useMemo(() => {
    return item ? pickRandomBackground() : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.kind === 'profile' ? (item as any).username : item?.showId, item?.kind]);
```

- [ ] **Step 4: Commit**

```bash
git add src/components/share/ShareCard.tsx src/components/share/ShareTray.native.tsx src/components/share/ShareTray.web.tsx
git commit -m "feat: update ShareCard and ShareTray to support profile share items"
```

---

### Task 7: Create PublicProfileScreen

**Files:**
- Create: `src/screens/PublicProfileScreen.tsx`

- [ ] **Step 1: Create the screen component**

Create `src/screens/PublicProfileScreen.tsx`:

```tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileService, PublicProfileData } from '../services/profileService';
import { ProfileImage } from '../components/ProfileImage';
import { ShowCard } from '../components/ShowCard';
import { StarRating } from '../components/StarRating';
import { PlayCountBadge } from '../components/PlayCountBadge';
import { useResponsive } from '../hooks/useResponsive';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';

type ProfileRouteParams = {
  PublicProfile: { username: string };
};

export function PublicProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ProfileRouteParams, 'PublicProfile'>>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { loadTrack } = usePlayer();

  const username = route.params?.username ?? '';
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) {
      setError(true);
      setIsLoading(false);
      return;
    }

    profileService.getPublicProfile(username)
      .then((result) => {
        if (!result) {
          setError(true);
        } else {
          setData(result);
        }
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [username]);

  // Compute top 10 shows and songs by play count
  const topShows = useMemo(() => {
    if (!data) return [];
    const showCounts: Record<string, number> = {};
    for (const pc of data.playCounts) {
      showCounts[pc.showIdentifier] = (showCounts[pc.showIdentifier] || 0) + pc.count;
    }
    return data.favorites.shows
      .map(show => ({
        show,
        totalPlays: showCounts[show.primaryIdentifier] || 0,
      }))
      .filter(s => s.totalPlays > 0)
      .sort((a, b) => b.totalPlays - a.totalPlays)
      .slice(0, 10);
  }, [data]);

  const topSongs = useMemo(() => {
    if (!data) return [];
    const songCounts: Record<string, number> = {};
    for (const pc of data.playCounts) {
      const key = `${pc.trackId}:${pc.showIdentifier}`;
      songCounts[key] = (songCounts[key] || 0) + pc.count;
    }
    return data.favorites.songs
      .map(song => {
        const key = `${song.trackId}:${song.showIdentifier}`;
        return { song, plays: songCounts[key] || 0 };
      })
      .filter(s => s.plays > 0)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
  }, [data]);

  const displayName = data?.profile.display_name
    || username;

  const totalPlays = useMemo(() => {
    if (!data) return 0;
    return data.playCounts.reduce((sum, pc) => sum + pc.count, 0);
  }, [data]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textTertiary} />
          <Text style={styles.errorTitle}>Profile not found</Text>
          <Text style={styles.errorSubtitle}>
            This profile doesn't exist or is private.
          </Text>
        </View>
      </View>
    );
  }

  const handleShowPress = (identifier: string, venue?: string, date?: string) => {
    navigation.navigate('ShowDetail', { identifier, venue, date });
  };

  const sections = [
    // Stats section is rendered as list header
  ];

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop, { paddingTop: insets.top }]}>
      <FlatList
        data={[]} // We use ListHeaderComponent for all content
        renderItem={null}
        ListHeaderComponent={
          <View style={styles.contentContainer}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <ProfileImage
                uri={data.avatarUrl}
                style={styles.avatar}
                size={80}
              />
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.username}>@{data.profile.username}</Text>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <Text style={styles.statText}>
                {data.favorites.shows.length} Shows
              </Text>
              <Text style={styles.statDot}>·</Text>
              <Text style={styles.statText}>
                {data.favorites.songs.length} Songs
              </Text>
              <Text style={styles.statDot}>·</Text>
              <Text style={styles.statText}>
                {totalPlays} Plays
              </Text>
            </View>

            {/* Most Listened Shows */}
            {topShows.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Most Listened Shows</Text>
                {topShows.map((item, index) => (
                  <TouchableOpacity
                    key={item.show.primaryIdentifier}
                    style={styles.rankedItem}
                    onPress={() => handleShowPress(
                      item.show.primaryIdentifier,
                      getVenueFromShow(item.show),
                      item.show.date,
                    )}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                    <View style={styles.rankedItemInfo}>
                      <Text style={styles.rankedItemTitle} numberOfLines={1}>
                        {formatDate(item.show.date)}
                      </Text>
                      <Text style={styles.rankedItemSubtitle} numberOfLines={1}>
                        {getVenueFromShow(item.show)}
                      </Text>
                    </View>
                    <PlayCountBadge count={item.totalPlays} size="small" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Most Listened Songs */}
            {topSongs.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Most Listened Songs</Text>
                {topSongs.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.song.trackId}-${item.song.showIdentifier}`}
                    style={styles.rankedItem}
                    onPress={() => handleShowPress(item.song.showIdentifier)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                    <View style={styles.rankedItemInfo}>
                      <Text style={styles.rankedItemTitle} numberOfLines={1}>
                        {item.song.trackTitle}
                      </Text>
                      <Text style={styles.rankedItemSubtitle} numberOfLines={1}>
                        {formatDate(item.song.showDate)}
                        {item.song.venue ? ` · ${item.song.venue}` : ''}
                      </Text>
                    </View>
                    <PlayCountBadge count={item.plays} size="small" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Favorite Shows */}
            {data.favorites.shows.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>
                  Favorite Shows ({data.favorites.shows.length})
                </Text>
                {data.favorites.shows.map(show => (
                  <ShowCard
                    key={show.primaryIdentifier}
                    show={show}
                    onPress={() => handleShowPress(
                      show.primaryIdentifier,
                      getVenueFromShow(show),
                      show.date,
                    )}
                  />
                ))}
              </View>
            )}

            {/* Favorite Songs */}
            {data.favorites.songs.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>
                  Favorite Songs ({data.favorites.songs.length})
                </Text>
                {data.favorites.songs.map(song => {
                  const performanceRating = getSongPerformanceRating(song.trackTitle, song.showDate);
                  return (
                    <TouchableOpacity
                      key={`${song.trackId}-${song.showIdentifier}`}
                      style={styles.songItem}
                      onPress={() => handleShowPress(song.showIdentifier)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.songInfo}>
                        <Text style={styles.songTitle} numberOfLines={1}>
                          {song.trackTitle}
                        </Text>
                        <View style={styles.songMeta}>
                          <Text style={styles.songDate}>
                            {formatDate(song.showDate)}
                          </Text>
                          {performanceRating && (
                            <StarRating tier={performanceRating} size={12} />
                          )}
                        </View>
                        {song.venue && (
                          <Text style={styles.songVenue} numberOfLines={1}>
                            {song.venue}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        }
        keyExtractor={() => 'profile'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  errorTitle: {
    ...TYPOGRAPHY.heading4,
    marginTop: SPACING.md,
  },
  errorSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  contentContainer: {
    padding: SPACING.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBackground,
    marginBottom: SPACING.md,
  },
  displayName: {
    ...TYPOGRAPHY.heading2,
    textAlign: 'center',
  },
  username: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  statText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statDot: {
    ...TYPOGRAPHY.label,
    color: COLORS.textTertiary,
  },
  listSection: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
  },
  rankedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  rankNumber: {
    ...TYPOGRAPHY.heading4,
    color: COLORS.textTertiary,
    width: 28,
    textAlign: 'center',
  },
  rankedItemInfo: {
    flex: 1,
  },
  rankedItemTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  rankedItemSubtitle: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  songItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  songInfo: {
    gap: 2,
  },
  songTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  songDate: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
  },
  songVenue: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textTertiary,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/PublicProfileScreen.tsx
git commit -m "feat: create PublicProfileScreen for viewing public user profiles"
```

---

### Task 8: Add PublicProfile to navigation and routing

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/navigation/webLinking.ts`
- Modify: `src/navigation/DesktopLayout.tsx`
- Modify: `vercel.json`

- [ ] **Step 1: Add PublicProfile to RootStackParamList**

In `src/navigation/AppNavigator.tsx`, add to the `RootStackParamList` type:

```typescript
export type RootStackParamList = {
  Home: { sort?: string; years?: string; series?: string } | undefined;
  ShowDetail: { identifier: string; trackTitle?: string; venue?: string; date?: string; location?: string; classicTier?: 1 | 2 | 3 };
  Favorites: undefined;
  DiscoverLanding: undefined;
  SongList: undefined;
  SongPerformances: {
    songTitle: string;
    performanceDate?: string;
  };
  Settings: undefined;
  PrivacyPolicy: undefined;
  ResetPassword: undefined;
  MainTabs: undefined;
  PublicProfile: { username: string };  // <-- ADD THIS
};
```

- [ ] **Step 2: Import PublicProfileScreen**

Add the import at the top of `AppNavigator.tsx`:

```typescript
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
```

- [ ] **Step 3: Add screen to RootStack.Navigator**

In the `RootStack.Navigator` (around line 377), add the PublicProfile screen:

```tsx
            <RootStack.Screen
              name="PublicProfile"
              component={PublicProfileScreen}
              options={{
                headerShown: false,
              }}
            />
```

Add this after the `Settings` screen definition.

- [ ] **Step 4: Add to nativeLinking config**

In the `nativeLinking` config object (around line 42), add the PublicProfile screen alongside ShowDetail:

```typescript
          PublicProfile: {
            path: 'profile/:username',
            parse: {
              username: (u: string) => decodeURIComponent(u),
            },
          },
```

Add this inside the `screens` object at the same level as `ShowDetail`.

- [ ] **Step 5: Add to desktopWebLinking**

In `src/navigation/webLinking.ts`, add to the `desktopWebLinking.config.screens`:

```typescript
      PublicProfile: {
        path: 'profile/:username',
        parse: { username: (u: string) => decodeURIComponent(u) },
      },
```

- [ ] **Step 6: Add to mobileWebLinking**

Add at the top level of `mobileWebLinking.config.screens` (alongside `ShowDetail`, `Settings`, etc.):

```typescript
      PublicProfile: {
        path: 'profile/:username',
        parse: { username: (u: string) => decodeURIComponent(u) },
      },
```

- [ ] **Step 7: Add to DesktopLayout Stack.Navigator**

In `src/navigation/DesktopLayout.tsx`, add the screen:

```tsx
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ headerShown: false }} />
```

Add the import at the top:

```typescript
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
```

- [ ] **Step 8: Add SCREEN_TITLES entry**

In `AppNavigator.tsx`, add to `SCREEN_TITLES`:

```typescript
  PublicProfile: 'Profile',
```

- [ ] **Step 9: Add vercel.json rewrite for profile HTML pages**

In `vercel.json`, add a rewrite for the profile route. This should go BEFORE the SPA catch-all rewrite. Add these two entries to the `rewrites` array:

```json
{ "source": "/profile/:username", "destination": "/api/html/profile/:username" },
```

The rewrites array should now be:
```json
"rewrites": [
  { "source": "/show/:identifier/:trackTitle", "destination": "/api/html/song/:identifier/:trackTitle" },
  { "source": "/show/:identifier", "destination": "/api/html/show/:identifier" },
  { "source": "/profile/:username", "destination": "/api/html/profile/:username" },
  { "source": "/((?!assets|favicon|manifest|_expo|.well-known|api|share).*)", "destination": "/index.html" }
]
```

- [ ] **Step 10: Commit**

```bash
git add src/navigation/AppNavigator.tsx src/navigation/webLinking.ts src/navigation/DesktopLayout.tsx vercel.json
git commit -m "feat: add PublicProfile screen to navigation, routing, and Vercel rewrites"
```

---

### Task 9: Create profile OG image endpoint

**Files:**
- Create: `api/og/profile/[username].tsx`

- [ ] **Step 1: Create the OG image endpoint**

Create `api/og/profile/[username].tsx`:

```tsx
import { ImageResponse } from '@vercel/og';
import { renderCard } from '../../_lib/ogTemplate.js';
import { WEB_ORIGIN } from '../../_lib/constants.js';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const fontUrl = `${WEB_ORIGIN}/share/FamiljenGrotesk-SemiBold.ttf`;

async function loadFont(): Promise<ArrayBuffer> {
  const res = await fetch(fontUrl);
  return res.arrayBuffer();
}

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

/**
 * GET /api/og/profile/:username?bg=<1-6>
 *
 * Returns a 1200×1200 PNG share card for a public profile showing
 * "{Display Name}'s Favorites" and stats.
 */
export default async function handler(req: Request): Promise<Response> {
  const rawReq = req as any;
  const host = rawReq.headers?.host ?? rawReq.headers?.get?.('host') ?? 'www.scarletfire.app';
  const url = new URL(rawReq.url, `https://${host}`);
  const username = decodeURIComponent(url.searchParams.get('username') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [fontData, profileResult] = await Promise.all([
    loadFont(),
    supabase
      .from('profiles')
      .select('display_name, is_public, id')
      .eq('username', username.toLowerCase())
      .single(),
  ]);

  const fonts = [{ name: 'FamiljenGrotesk', data: fontData, weight: 500 as const }];

  if (profileResult.error || !profileResult.data || !profileResult.data.is_public) {
    return new ImageResponse(
      renderCard({ title: 'Scarlet Fire', subtitle: 'Grateful Dead Archive', tier: null, bgIndex }),
      { width: 1200, height: 1200, fonts, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
    );
  }

  const profile = profileResult.data;
  const displayName = profile.display_name || username;

  // Fetch counts
  const [favResult] = await Promise.all([
    supabase
      .from('user_favorites')
      .select('shows, songs')
      .eq('user_id', profile.id)
      .single(),
  ]);

  const showCount = favResult.data?.shows?.length ?? 0;
  const songCount = favResult.data?.songs?.length ?? 0;

  return new ImageResponse(
    renderCard({
      title: `${displayName}'s Favorites`,
      subtitle: `${showCount} shows · ${songCount} songs`,
      tier: null,
      bgIndex,
    }),
    {
      width: 1200,
      height: 1200,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add api/og/profile/[username].tsx
git commit -m "feat: add OG image endpoint for public profile share cards"
```

---

### Task 10: Create profile HTML page endpoint

**Files:**
- Create: `api/html/profile/[username].ts`

- [ ] **Step 1: Create the HTML endpoint**

Create `api/html/profile/[username].ts`:

```typescript
import { injectOgTags } from '../../_lib/injectOgTags.js';
import { WEB_ORIGIN } from '../../_lib/constants.js';
import { INDEX_HTML } from '../../_lib/indexHtml.js';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

/**
 * GET /profile/:username (rewritten from SPA route via vercel.json)
 *
 * Returns dist/index.html with OG meta tags injected so social previews
 * show the user's profile card when shared.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const username = decodeURIComponent(url.searchParams.get('username') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  if (!username) {
    return new Response(INDEX_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, is_public')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !profile || !profile.is_public) {
    return new Response(INDEX_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  }

  const displayName = profile.display_name || username;
  const title = `${displayName}'s Favorites — Scarlet Fire`;
  const description = `Check out ${displayName}'s favorite Grateful Dead shows and songs on Scarlet Fire`;
  const imageUrl = `${WEB_ORIGIN}/api/og/profile/${encodeURIComponent(username)}?bg=${bgIndex}`;
  const shareUrl = `${WEB_ORIGIN}/profile/${encodeURIComponent(username)}`;

  const injected = injectOgTags(INDEX_HTML, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
```

- [ ] **Step 2: Add function config to vercel.json**

In `vercel.json`, add to the `functions` object:

```json
"api/html/profile/[username].ts": {
  "maxDuration": 10
}
```

- [ ] **Step 3: Commit**

```bash
git add api/html/profile/[username].ts vercel.json
git commit -m "feat: add HTML page endpoint with OG tags for profile sharing"
```

---

### Task 11: End-to-end testing and polish

**Files:**
- Various (fixes found during testing)

- [ ] **Step 1: Run the SQL migration**

Execute the SQL from `supabase/create_profiles_table.sql` against the Supabase dashboard. Verify the table was created and RLS policies are in place.

- [ ] **Step 2: Test existing favorites sync still works**

After enabling RLS on `user_favorites` and `user_play_counts`, verify that:
- Existing authenticated users can still read/write their favorites
- The app doesn't break for unauthenticated users

- [ ] **Step 3: Test Settings → Public Profile section**

1. Open Settings
2. Set a username (verify validation: too short, invalid chars)
3. Try a taken username
4. Set display name
5. Toggle "Make Profile Public" on
6. Verify URL preview appears and is tappable

- [ ] **Step 4: Test public profile page**

1. Navigate to `/profile/{username}` in the browser
2. Verify header, stats, top shows/songs, and full favorites lists render
3. Verify tapping a show/song navigates to that show detail
4. Test with a non-existent username → "Profile not found"
5. Test with a private profile → "Profile not found"

- [ ] **Step 5: Test share flow from Favorites**

1. Open Favorites tab
2. Tap the share button
3. If profile not set up → verify Alert prompting to Settings
4. If profile is public → verify share tray opens with profile card
5. Verify share card shows "{Name}'s Favorites" with correct counts
6. Test Copy Link → verify URL is correct
7. Test on both mobile and desktop web layouts

- [ ] **Step 6: Test OG image**

1. Visit `/api/og/profile/{username}?bg=3` in a browser
2. Verify the 1200x1200 PNG renders with the user's name and stats
3. Test with non-existent username → fallback card

- [ ] **Step 7: Test deep linking**

1. Open a profile URL on a device with the app installed
2. Verify it opens the PublicProfileScreen in the app

- [ ] **Step 8: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: polish public profile feature from e2e testing"
```
