# Follow Users — Design

Date: 2026-04-15

## Goal

Let users follow other users' public profiles. Surface follower/following counts on every profile with tappable lists.

## Scope

- One-way follows (no approval, no mutual requirement).
- Only public profiles can be followed.
- Counts and lists are publicly viewable (consistent with existing `is_public` model).
- Authenticated users can follow/unfollow, remove a follower from their own followers list.
- No notifications, no activity feed — just the social graph primitive.

Out of scope: activity feeds, notifications, blocking, private/approved follow requests, follow suggestions.

## Data Model

New table `user_follows`:

```sql
CREATE TABLE user_follows (
  follower_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX idx_follows_following ON user_follows (following_id);
CREATE INDEX idx_follows_follower  ON user_follows (follower_id);
```

### RLS

- **SELECT** — allowed when the *other* side of the edge is a public profile, so anonymous and authenticated readers can view counts/lists for public profiles.
- **INSERT** — `auth.uid() = follower_id` AND target profile (`following_id`) has `is_public = true`.
- **DELETE** — `auth.uid() = follower_id` (unfollow) OR `auth.uid() = following_id` (remove follower).

The `CHECK (follower_id <> following_id)` constraint prevents self-follow.

## Service Layer

`src/services/followService.ts`:

```ts
followUser(targetUserId: string): Promise<void>
unfollowUser(targetUserId: string): Promise<void>
removeFollower(followerUserId: string): Promise<void>
getFollowCounts(userId: string): Promise<{ followers: number; following: number }>
getFollowers(userId: string): Promise<FollowUser[]>
getFollowing(userId: string): Promise<FollowUser[]>
isFollowing(targetUserId: string): Promise<boolean>
```

`FollowUser` = `{ id, username, display_name, avatarUrl }`. List methods join against `profiles` and filter to `is_public = true`. Counts use `select('*', { count: 'exact', head: true })`. Each method returns plain data; screens own their loading/error UI.

Extend `getPublicProfile` to also return `{ followerCount, followingCount, viewerIsFollowing }` in a single parallel fetch so the profile header renders in one pass.

## UI

### PublicProfileScreen

- **Follow / Following button** next to the display name.
  - Hidden when viewing own profile.
  - Signed-out users see the button but tapping prompts sign-in (no follow occurs).
  - Tap toggles follow state; optimistic update on button + count, reverts on error.
- **Counts row** under the header: `123 Followers · 45 Following`, both tappable.
- Tapping a count navigates to `FollowListScreen` with `{ userId, username, mode: 'followers' | 'following' }`.

### FollowListScreen (new)

- Title: "Followers" or "Following".
- FlatList rows: avatar + display name + `@username`. Tap → navigate to that profile.
- When viewing **your own** followers: each row has a "Remove" action (swipe on native, trailing button on web).
- When viewing **your own** following: each row has an "Unfollow" action.
- Empty state: "No followers yet" / "Not following anyone yet."

### Own-profile surface

Settings/Profile editing screen gets the same counts row so users can reach their own followers/following lists from their own view.

## Navigation / Linking

- Add `FollowList` to the native stack.
- `webLinking.ts`: `/u/:username/followers` and `/u/:username/following`.

## State & Caching

- Optimistic local state for follow/unfollow and the count.
- Refetch on screen focus.
- No global store in v1. `isFollowing` + counts travel with `getPublicProfile`.

## Testing

- Unit tests for `followService` methods (mocked Supabase client): follow, unfollow, removeFollower, counts, lists, isFollowing.
- Manual QA:
  - Follow → count increments on both viewer's following and target's followers.
  - Unfollow reverses.
  - Remove-follower works from own followers list.
  - Signed-out follow attempt prompts sign-in.
  - Self-follow blocked by CHECK.
  - Follow attempt on private profile blocked by RLS.
  - Counts and lists render for anonymous viewers on public profiles.

## Files Touched

- `supabase/create_user_follows_table.sql` (new)
- `src/services/followService.ts` (new)
- `src/services/profileService.ts` (extend `getPublicProfile`)
- `src/screens/PublicProfileScreen.tsx` (button + counts row)
- `src/screens/FollowListScreen.tsx` (new)
- `src/screens/SettingsScreen.tsx` (counts row on own profile)
- `src/navigation/*` (register route)
- `src/navigation/webLinking.ts` (URL paths)
