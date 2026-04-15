# Follow Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let signed-in users follow other public profiles, display follower/following counts on profile screens, and open tappable lists of followers and followees with remove/unfollow controls.

**Architecture:** New `user_follows` Supabase table with RLS gated on `profiles.is_public`. A `followService` wraps all DB access. `getPublicProfile` is extended to bundle counts + viewer follow state. `PublicProfileScreen` grows a Follow button and counts row; a new `FollowListScreen` renders either list with row-level Remove/Unfollow actions. No global state; screens refetch on focus.

**Tech Stack:** Supabase (Postgres + RLS), React Native / Expo, React Navigation (native stack + web linking), Jest for unit tests.

**Spec:** `docs/superpowers/specs/2026-04-15-follow-users-design.md`

---

## Task 1: Database migration — `user_follows` table + RLS

**Files:**
- Create: `supabase/create_user_follows_table.sql`

- [ ] **Step 1: Write the SQL migration**

```sql
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
```

- [ ] **Step 2: Apply the migration**

Run it in the Supabase SQL editor (or via `supabase db push` if that workflow is set up). Verify the table and policies exist via the Supabase dashboard.

- [ ] **Step 3: Commit**

```bash
git add supabase/create_user_follows_table.sql
git commit -m "feat(db): add user_follows table with RLS"
```

---

## Task 2: `followService` — types and empty class

**Files:**
- Create: `src/services/followService.ts`

- [ ] **Step 1: Write the skeleton**

```ts
import { authService } from './authService';
import { logger } from '../utils/logger';

export interface FollowUser {
  id: string;
  username: string;
  display_name: string | null;
  avatarUrl: string | null;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

class FollowService {
  async followUser(targetUserId: string): Promise<void> {
    throw new Error('not implemented');
  }
  async unfollowUser(targetUserId: string): Promise<void> {
    throw new Error('not implemented');
  }
  async removeFollower(followerUserId: string): Promise<void> {
    throw new Error('not implemented');
  }
  async getFollowCounts(userId: string): Promise<FollowCounts> {
    throw new Error('not implemented');
  }
  async getFollowers(userId: string): Promise<FollowUser[]> {
    throw new Error('not implemented');
  }
  async getFollowing(userId: string): Promise<FollowUser[]> {
    throw new Error('not implemented');
  }
  async isFollowing(targetUserId: string): Promise<boolean> {
    throw new Error('not implemented');
  }
}

export const followService = new FollowService();
```

- [ ] **Step 2: Commit**

```bash
git add src/services/followService.ts
git commit -m "feat(follow): scaffold followService interface"
```

---

## Task 3: `followService.followUser` / `unfollowUser` / `removeFollower` + tests

**Files:**
- Modify: `src/services/followService.ts`
- Create: `src/services/__tests__/followService.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/services/__tests__/followService.test.ts
import { followService } from '../followService';
import { authService } from '../authService';

jest.mock('../authService');

function makeSupabaseMock(overrides: Partial<Record<string, any>> = {}) {
  const chain = {
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    in: jest.fn().mockReturnThis(),
    then: undefined,
    ...overrides,
  };
  const from = jest.fn().mockReturnValue(chain);
  (authService.getClient as jest.Mock).mockReturnValue({
    from,
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'me' } }, error: null }) },
    storage: { from: jest.fn() },
  });
  return { from, chain };
}

describe('followService mutations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('followUser inserts (follower=me, following=target)', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.insert.mockReturnValue({ error: null });
    await followService.followUser('target-1');
    expect(from).toHaveBeenCalledWith('user_follows');
    expect(chain.insert).toHaveBeenCalledWith({
      follower_id: 'me',
      following_id: 'target-1',
    });
  });

  it('unfollowUser deletes where follower=me, following=target', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.match.mockReturnValue({ error: null });
    await followService.unfollowUser('target-1');
    expect(from).toHaveBeenCalledWith('user_follows');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.match).toHaveBeenCalledWith({
      follower_id: 'me',
      following_id: 'target-1',
    });
  });

  it('removeFollower deletes where follower=target, following=me', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.match.mockReturnValue({ error: null });
    await followService.removeFollower('other-user');
    expect(chain.match).toHaveBeenCalledWith({
      follower_id: 'other-user',
      following_id: 'me',
    });
  });

  it('followUser throws when signed out', async () => {
    makeSupabaseMock();
    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn(),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });
    await expect(followService.followUser('x')).rejects.toThrow(/signed in/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/services/__tests__/followService.test.ts`
Expected: FAIL (not implemented).

- [ ] **Step 3: Implement the three mutations**

Replace the three methods in `src/services/followService.ts`:

```ts
private async currentUserId(): Promise<string> {
  const supabase = authService.getClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Must be signed in');
  return data.user.id;
}

async followUser(targetUserId: string): Promise<void> {
  const me = await this.currentUserId();
  const supabase = authService.getClient();
  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: me, following_id: targetUserId });
  if (error) {
    logger.profile?.error?.('followUser error', error);
    throw error;
  }
}

async unfollowUser(targetUserId: string): Promise<void> {
  const me = await this.currentUserId();
  const supabase = authService.getClient();
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .match({ follower_id: me, following_id: targetUserId });
  if (error) throw error;
}

async removeFollower(followerUserId: string): Promise<void> {
  const me = await this.currentUserId();
  const supabase = authService.getClient();
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .match({ follower_id: followerUserId, following_id: me });
  if (error) throw error;
}
```

If `logger.profile` does not exist, use `logger.error` or drop the log line — do not invent a namespace.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/services/__tests__/followService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/followService.ts src/services/__tests__/followService.test.ts
git commit -m "feat(follow): implement follow/unfollow/removeFollower"
```

---

## Task 4: `followService.getFollowCounts` + `isFollowing` + tests

**Files:**
- Modify: `src/services/followService.ts`
- Modify: `src/services/__tests__/followService.test.ts`

- [ ] **Step 1: Add failing tests**

Append to the test file:

```ts
describe('followService reads', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getFollowCounts returns followers + following counts', async () => {
    const supabase = {
      from: jest.fn((table: string) => {
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn((col: string, val: string) => {
            // Resolve with count result for whichever column
            return Promise.resolve({ count: col === 'following_id' ? 5 : 7, error: null });
          }),
        };
        return chain;
      }),
      auth: { getUser: jest.fn() },
    };
    (authService.getClient as jest.Mock).mockReturnValue(supabase);

    const result = await followService.getFollowCounts('user-1');
    expect(result).toEqual({ followers: 5, following: 7 });
  });

  it('isFollowing returns true when row exists', async () => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { follower_id: 'me' }, error: null }),
    };
    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(chain),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'me' } }, error: null }) },
    });
    await expect(followService.isFollowing('target-1')).resolves.toBe(true);
  });

  it('isFollowing returns false when not signed in', async () => {
    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn(),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });
    await expect(followService.isFollowing('target-1')).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/services/__tests__/followService.test.ts`
Expected: FAIL on the three new tests.

- [ ] **Step 3: Implement**

Replace the two methods in `src/services/followService.ts`:

```ts
async getFollowCounts(userId: string): Promise<FollowCounts> {
  const supabase = authService.getClient();
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);
  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

async isFollowing(targetUserId: string): Promise<boolean> {
  const supabase = authService.getClient();
  const { data: userData } = await supabase.auth.getUser();
  const me = userData?.user?.id;
  if (!me) return false;
  const { data, error } = await supabase
    .from('user_follows')
    .select('follower_id')
    .match({ follower_id: me, following_id: targetUserId })
    .maybeSingle();
  if (error) return false;
  return data !== null;
}
```

- [ ] **Step 4: Run tests**

Run: `npx jest src/services/__tests__/followService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/followService.ts src/services/__tests__/followService.test.ts
git commit -m "feat(follow): counts and isFollowing"
```

---

## Task 5: `followService.getFollowers` / `getFollowing` (with avatar URLs) + tests

**Files:**
- Modify: `src/services/followService.ts`
- Modify: `src/services/__tests__/followService.test.ts`

- [ ] **Step 1: Add failing test**

Append:

```ts
describe('followService lists', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getFollowers returns joined profile rows (public only)', async () => {
    const joinRows = [
      {
        follower: {
          id: 'a',
          username: 'alice',
          display_name: 'Alice',
          is_public: true,
        },
      },
      {
        follower: {
          id: 'b',
          username: 'bob',
          display_name: null,
          is_public: true,
        },
      },
    ];
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: joinRows, error: null }),
    };
    const storageList = jest.fn().mockResolvedValue({ data: [], error: null });
    const getPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: '' } });
    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(chain),
      storage: { from: jest.fn().mockReturnValue({ list: storageList, getPublicUrl }) },
      auth: { getUser: jest.fn() },
    });

    const result = await followService.getFollowers('target-1');
    expect(result).toEqual([
      { id: 'a', username: 'alice', display_name: 'Alice', avatarUrl: null },
      { id: 'b', username: 'bob', display_name: null, avatarUrl: null },
    ]);
    expect(chain.select).toHaveBeenCalledWith(
      expect.stringContaining('follower:profiles!user_follows_follower_id_fkey'),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/__tests__/followService.test.ts -t getFollowers`
Expected: FAIL.

- [ ] **Step 3: Implement lists**

Add two methods to `followService`:

```ts
private async resolveAvatarUrl(userId: string): Promise<string | null> {
  const supabase = authService.getClient();
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(userId, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
  if (!files || files.length === 0) return null;
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/${files[0].name}`);
  return data.publicUrl || null;
}

async getFollowers(userId: string): Promise<FollowUser[]> {
  const supabase = authService.getClient();
  const { data, error } = await supabase
    .from('user_follows')
    .select('follower:profiles!user_follows_follower_id_fkey(id, username, display_name, is_public)')
    .eq('following_id', userId);
  if (error) throw error;
  const rows = (data ?? [])
    .map((r: any) => r.follower)
    .filter((p: any) => p && p.is_public);
  return Promise.all(
    rows.map(async (p: any) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatarUrl: await this.resolveAvatarUrl(p.id),
    })),
  );
}

async getFollowing(userId: string): Promise<FollowUser[]> {
  const supabase = authService.getClient();
  const { data, error } = await supabase
    .from('user_follows')
    .select('following:profiles!user_follows_following_id_fkey(id, username, display_name, is_public)')
    .eq('follower_id', userId);
  if (error) throw error;
  const rows = (data ?? [])
    .map((r: any) => r.following)
    .filter((p: any) => p && p.is_public);
  return Promise.all(
    rows.map(async (p: any) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatarUrl: await this.resolveAvatarUrl(p.id),
    })),
  );
}
```

**Note:** The PostgREST join aliases (`user_follows_follower_id_fkey`) are the default constraint names Supabase generates for the FKs in Task 1. If they differ in the running DB, check in the dashboard (Database → Tables → user_follows → Foreign keys) and adjust.

- [ ] **Step 4: Run tests**

Run: `npx jest src/services/__tests__/followService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/followService.ts src/services/__tests__/followService.test.ts
git commit -m "feat(follow): getFollowers/getFollowing with avatars"
```

---

## Task 6: Extend `getPublicProfile` to include follow metadata

**Files:**
- Modify: `src/services/profileService.ts`

- [ ] **Step 1: Update `PublicProfileData` and `getPublicProfile`**

In `src/services/profileService.ts`, update the exported interface:

```ts
export interface PublicProfileData {
  profile: UserProfile;
  avatarUrl: string | null;
  favorites: {
    shows: GratefulDeadShow[];
    songs: FavoriteSong[];
  };
  playCounts: Array<{ trackId: string; trackTitle: string; showIdentifier: string; showDate: string; count: number; lastPlayedAt: number; firstPlayedAt: number }>;
  followerCount: number;
  followingCount: number;
  viewerIsFollowing: boolean;
}
```

At the top of the file, add:

```ts
import { followService } from './followService';
```

Replace `getPublicProfile` (the body, keeping the signature) so that after loading the profile it runs the three new calls in parallel with the existing ones:

```ts
async getPublicProfile(username: string): Promise<PublicProfileData | null> {
  const supabase = authService.getClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (profileError || !profile || !profile.is_public) return null;

  const [avatarResult, favResult, playResult, counts, viewerIsFollowing] = await Promise.all([
    supabase.storage
      .from('avatars')
      .list(profile.id, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } }),
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
    followService.getFollowCounts(profile.id),
    followService.isFollowing(profile.id),
  ]);

  let avatarUrl: string | null = null;
  const avatarFiles = avatarResult.data;
  if (avatarFiles && avatarFiles.length > 0) {
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${profile.id}/${avatarFiles[0].name}`);
    avatarUrl = urlData.publicUrl;
  }

  const favorites = {
    shows: favResult.data?.shows || [],
    songs: favResult.data?.songs || [],
  };

  const playCounts = playResult.data?.play_counts || [];

  return {
    profile,
    avatarUrl,
    favorites,
    playCounts,
    followerCount: counts.followers,
    followingCount: counts.following,
    viewerIsFollowing,
  };
}
```

- [ ] **Step 2: Run the existing test suite to catch regressions**

Run: `npx jest`
Expected: PASS (or skip follow-suite failures that don't exist).

- [ ] **Step 3: Commit**

```bash
git add src/services/profileService.ts
git commit -m "feat(follow): extend getPublicProfile with follow metadata"
```

---

## Task 7: `FollowListScreen` — new screen

**Files:**
- Create: `src/screens/FollowListScreen.tsx`

- [ ] **Step 1: Implement the screen**

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { followService, FollowUser } from '../services/followService';
import { profileService } from '../services/profileService';
import { ProfileImage } from '../components/ProfileImage';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type RouteParams = {
  FollowList: {
    userId: string;
    username: string;
    mode: 'followers' | 'following';
  };
};

export function FollowListScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'FollowList'>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { userId, username, mode } = route.params;
  const viewingOwn = user?.id === userId;

  const [rows, setRows] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result =
        mode === 'followers'
          ? await followService.getFollowers(userId)
          : await followService.getFollowing(userId);
      setRows(result);
    } finally {
      setIsLoading(false);
    }
  }, [mode, userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRowPress = (row: FollowUser) => {
    navigation.push('PublicProfile', { username: row.username });
  };

  const handleAction = async (row: FollowUser) => {
    if (!viewingOwn) return;
    try {
      if (mode === 'followers') {
        await followService.removeFollower(row.id);
      } else {
        await followService.unfollowUser(row.id);
      }
      setRows(prev => prev.filter(r => r.id !== row.id));
    } catch (err) {
      Alert.alert('Error', 'Could not complete that action.');
    }
  };

  const title = mode === 'followers' ? 'Followers' : 'Following';
  const emptyText = mode === 'followers' ? 'No followers yet' : 'Not following anyone yet';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>@{username}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.empty}><ActivityIndicator color={COLORS.accent} /></View>
      ) : rows.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>{emptyText}</Text></View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity style={styles.rowMain} onPress={() => handleRowPress(item)}>
                <ProfileImage avatarUrl={item.avatarUrl} size={44} />
                <View style={styles.rowText}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {item.display_name || item.username}
                  </Text>
                  <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
                </View>
              </TouchableOpacity>
              {viewingOwn && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(item)}>
                  <Text style={styles.actionText}>
                    {mode === 'followers' ? 'Remove' : 'Unfollow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rowText: { marginLeft: SPACING.sm, flex: 1 },
  displayName: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '600' },
  username: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  actionBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  actionText: { ...TYPOGRAPHY.caption, color: COLORS.text },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
});
```

**Note:** Read `src/constants/theme.ts` to confirm the exact token names referenced above (`COLORS.text`, `COLORS.textSecondary`, `COLORS.accent`, `COLORS.border`, `TYPOGRAPHY.h2`, `SPACING.xs/sm/md/lg`, `RADIUS.sm`). If any token name differs, fix the import to match. Do not invent new tokens.

Also verify `ProfileImage`'s props — pass `avatarUrl` and `size` to match the signature (open `src/components/ProfileImage.tsx` and adjust if the prop names differ).

- [ ] **Step 2: Commit**

```bash
git add src/screens/FollowListScreen.tsx
git commit -m "feat(follow): add FollowListScreen"
```

---

## Task 8: Register `FollowList` route in native + web navigation

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/navigation/webLinking.ts`

- [ ] **Step 1: Add route type + Stack.Screen**

In `src/navigation/AppNavigator.tsx`:

1. Add import:
```ts
import { FollowListScreen } from '../screens/FollowListScreen';
```

2. Add to `RootStackParamList` (find its `type RootStackParamList = { ... }` and add):
```ts
FollowList: { userId: string; username: string; mode: 'followers' | 'following' };
```

3. Register the screen inside the native root stack (wherever `PublicProfile` is registered):
```tsx
<RootStack.Screen name="FollowList" component={FollowListScreen} options={{ headerShown: false }} />
```

4. In the `nativeLinking.config.screens` object, add:
```ts
FollowList: {
  path: 'profile/:username/:mode(followers|following)',
  parse: { username: (u: string) => decodeURIComponent(u) },
},
```

**Note:** The native linking URL uses `username` because deep links don't carry `userId`. The screen resolves `userId` on mount via `profileService.getProfileIdByUsername`. Update the screen accordingly — see Step 3 below.

- [ ] **Step 2: Add web linking entries**

In `src/navigation/webLinking.ts`, add inside BOTH `desktopWebLinking.config.screens` and `mobileWebLinking.config.screens.MainTabs.screens.DiscoverTab.screens`:

```ts
FollowList: {
  path: 'profile/:username/:mode',
  parse: { username: (u: string) => decodeURIComponent(u) },
},
```

- [ ] **Step 3: Make the screen tolerant of missing `userId` (deep-link path)**

At the top of `FollowListScreen`'s component, replace `const { userId, username, mode } = route.params;` with:

```ts
const { username, mode } = route.params;
const paramUserId = route.params.userId;
const [userId, setUserId] = useState<string | null>(paramUserId ?? null);

useEffect(() => {
  if (userId) return;
  profileService
    .getProfileIdByUsername(username)
    .then((r) => setUserId(r?.id ?? null));
}, [username, userId]);
```

Update `RouteParams.FollowList.userId` to be optional (`userId?: string`) and early-return a spinner while `userId` is null before calling `load()`. Guard `load` with `if (!userId) return;`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no type errors in the files touched.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/AppNavigator.tsx src/navigation/webLinking.ts src/screens/FollowListScreen.tsx
git commit -m "feat(follow): register FollowList route (native + web)"
```

---

## Task 9: Add Follow button + counts row to `PublicProfileScreen`

**Files:**
- Modify: `src/screens/PublicProfileScreen.tsx`

- [ ] **Step 1: Wire imports + hooks**

At the top of `PublicProfileScreen.tsx`, add:

```ts
import { followService } from '../services/followService';
import { useAuth } from '../contexts/AuthContext';
```

Inside the component body (near the existing `useState` calls), add:

```ts
const { user } = useAuth();
const [isFollowing, setIsFollowing] = useState(false);
const [followerCount, setFollowerCount] = useState(0);
const [followingCount, setFollowingCount] = useState(0);
const [followBusy, setFollowBusy] = useState(false);

const isOwnProfile = user?.id === data?.profile?.id;
```

In the `.then((result) => { ... })` block where `getPublicProfile` resolves, after `setData(result)` add:

```ts
setIsFollowing(result.viewerIsFollowing);
setFollowerCount(result.followerCount);
setFollowingCount(result.followingCount);
```

- [ ] **Step 2: Add toggle handler**

```ts
const handleToggleFollow = async () => {
  if (!user) {
    navigation.navigate('Auth' as never);
    return;
  }
  if (!data?.profile?.id || followBusy) return;
  const prevFollowing = isFollowing;
  const prevCount = followerCount;
  setFollowBusy(true);
  setIsFollowing(!prevFollowing);
  setFollowerCount(prevCount + (prevFollowing ? -1 : 1));
  try {
    if (prevFollowing) {
      await followService.unfollowUser(data.profile.id);
    } else {
      await followService.followUser(data.profile.id);
    }
  } catch (err) {
    setIsFollowing(prevFollowing);
    setFollowerCount(prevCount);
  } finally {
    setFollowBusy(false);
  }
};
```

**Note:** `'Auth' as never` matches the project's existing sign-in navigation. If your navigator uses a different route name for the login entry point, grep for existing sign-in CTAs in the codebase and use the same target here.

- [ ] **Step 3: Render the button + counts row**

In the JSX, below the existing profile header (avatar + display name + username), insert:

```tsx
{!isOwnProfile && (
  <TouchableOpacity
    style={[styles.followBtn, isFollowing && styles.followBtnActive]}
    onPress={handleToggleFollow}
    disabled={followBusy}
  >
    <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
      {isFollowing ? 'Following' : 'Follow'}
    </Text>
  </TouchableOpacity>
)}

<View style={styles.countsRow}>
  <TouchableOpacity
    onPress={() => navigation.push('FollowList', {
      userId: data!.profile.id,
      username: data!.profile.username,
      mode: 'followers',
    })}
  >
    <Text style={styles.countText}>
      <Text style={styles.countNum}>{followerCount}</Text> Followers
    </Text>
  </TouchableOpacity>
  <Text style={styles.countSep}> · </Text>
  <TouchableOpacity
    onPress={() => navigation.push('FollowList', {
      userId: data!.profile.id,
      username: data!.profile.username,
      mode: 'following',
    })}
  >
    <Text style={styles.countText}>
      <Text style={styles.countNum}>{followingCount}</Text> Following
    </Text>
  </TouchableOpacity>
</View>
```

- [ ] **Step 4: Add styles**

In the `StyleSheet.create` block, add:

```ts
followBtn: {
  alignSelf: 'flex-start',
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.xs,
  borderRadius: RADIUS.pill ?? 20,
  backgroundColor: COLORS.accent,
  marginTop: SPACING.sm,
},
followBtnActive: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: COLORS.border,
},
followBtnText: { ...TYPOGRAPHY.button, color: COLORS.background },
followBtnTextActive: { color: COLORS.text },
countsRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
countText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
countNum: { color: COLORS.text, fontWeight: '600' },
countSep: { color: COLORS.textSecondary },
```

If `RADIUS.pill` or `TYPOGRAPHY.button` do not exist, substitute the nearest token that does (check `src/constants/theme.ts`). Do not invent new ones.

- [ ] **Step 5: Typecheck + smoke test in browser**

Run: `npx tsc --noEmit`

Then run the web app (`npm run web` or the project's equivalent) and load a signed-in browser window against another user's public profile. Verify: button renders, tapping follows, count goes up, tapping again unfollows.

- [ ] **Step 6: Commit**

```bash
git add src/screens/PublicProfileScreen.tsx
git commit -m "feat(follow): follow button + counts row on profile"
```

---

## Task 10: Surface counts on own-profile view (Settings)

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Add counts + navigation**

At the top of `SettingsScreen.tsx`, add:

```ts
import { followService } from '../services/followService';
import { useFocusEffect } from '@react-navigation/native';
```

Inside the component body:

```ts
const [ownFollowerCount, setOwnFollowerCount] = useState(0);
const [ownFollowingCount, setOwnFollowingCount] = useState(0);

useFocusEffect(useCallback(() => {
  if (!user?.id) return;
  followService.getFollowCounts(user.id)
    .then(c => {
      setOwnFollowerCount(c.followers);
      setOwnFollowingCount(c.following);
    })
    .catch(() => {});
}, [user?.id]));
```

If `useCallback` is not already imported from `react`, add it to the existing react import.

- [ ] **Step 2: Render tappable counts in the profile section of Settings**

Find the existing block that shows the signed-in user's profile summary (avatar + username near the top of Settings). Immediately below the username, add:

```tsx
{user?.id && profile?.username && (
  <View style={styles.settingsCountsRow}>
    <TouchableOpacity
      onPress={() => navigation.navigate('FollowList', {
        userId: user.id,
        username: profile.username,
        mode: 'followers',
      })}
    >
      <Text style={styles.settingsCountText}>
        <Text style={styles.settingsCountNum}>{ownFollowerCount}</Text> Followers
      </Text>
    </TouchableOpacity>
    <Text style={styles.settingsCountSep}> · </Text>
    <TouchableOpacity
      onPress={() => navigation.navigate('FollowList', {
        userId: user.id,
        username: profile.username,
        mode: 'following',
      })}
    >
      <Text style={styles.settingsCountText}>
        <Text style={styles.settingsCountNum}>{ownFollowingCount}</Text> Following
      </Text>
    </TouchableOpacity>
  </View>
)}
```

**Note:** `profile` here refers to whatever local state already holds the user's own profile in `SettingsScreen` (check the existing code — it may be named differently). Match the existing variable. If Settings doesn't already load the profile, reuse `profileService.getUserProfile(user.id)` the same way other parts of the screen do.

- [ ] **Step 3: Add styles**

```ts
settingsCountsRow: { flexDirection: 'row', marginTop: SPACING.xs },
settingsCountText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
settingsCountNum: { color: COLORS.text, fontWeight: '600' },
settingsCountSep: { color: COLORS.textSecondary },
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "feat(follow): show counts on own profile settings"
```

---

## Task 11: Manual verification

**Files:** none

- [ ] **Step 1: Apply migration in Supabase dev, seed two test accounts**

Confirm both accounts have `is_public = true`.

- [ ] **Step 2: Walk the QA checklist from the spec**

From `docs/superpowers/specs/2026-04-15-follow-users-design.md`, execute each manual QA item:

1. User A views User B's profile → taps Follow → button becomes "Following", follower count on B increments, following count on A increments.
2. Tap "Following" → unfollow. Counts reverse.
3. Tap "123 Followers" on any profile → FollowListScreen opens with rows.
4. On own followers list → tap Remove on a row → row disappears, follower count on refresh decrements.
5. On own following list → tap Unfollow → row disappears.
6. Sign out → visit another user's profile → button still renders, tap → lands on sign-in flow.
7. Attempt to self-follow via direct SQL (`insert into user_follows(follower_id, following_id) values ('me','me')`) → CHECK constraint rejects.
8. Flip User B's `is_public` to false in the dashboard → anonymous fetch of their follower list returns empty (RLS).
9. Anonymous browser → visit public profile URL → counts and lists render.
10. Web deep-link `…/profile/alice/followers` loads straight into the list.

- [ ] **Step 3: If any QA item fails, open a defect task inline before claiming done**

- [ ] **Step 4: Final commit (only if anything changed during QA)**

```bash
git add -A
git commit -m "chore(follow): QA fixes" || echo "nothing to commit"
```

---

## Self-review notes

- Covers all spec sections: data model (Task 1), service (Tasks 2–5), profile extension (Task 6), new screen (Task 7), navigation/linking (Task 8), button + counts (Task 9), own-profile surface (Task 10), QA (Task 11).
- Assumes existing tokens in `src/constants/theme.ts` — the plan explicitly tells the implementer to verify each token name before use and to substitute the nearest existing token if a name differs.
- Optimistic follow/unfollow is local to `PublicProfileScreen`; no global store added.
- FK-constraint names in the PostgREST join are the Supabase defaults; plan tells the implementer to verify in the dashboard.
- `FollowListScreen` tolerates a missing `userId` param for deep-link entries by resolving via username.
