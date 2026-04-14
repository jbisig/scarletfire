# Public Profile Feature — Design Spec

## Overview

Allow users to share a public profile page displaying their favorite shows, favorite songs, and most-listened-to content. Profiles are off by default and opt-in via Settings.

## Database Schema

### New `profiles` table

```sql
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text UNIQUE NOT NULL,
  display_name text,
  is_public    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Username format constraint: lowercase alphanumeric + underscores + hyphens, 3-20 chars
ALTER TABLE profiles ADD CONSTRAINT username_format
  CHECK (username ~ '^[a-z0-9_-]{3,20}$');
```

### Row Level Security policies

**`profiles` table:**
- Anyone can SELECT rows where `is_public = true`
- Authenticated users can SELECT/UPDATE their own row (`id = auth.uid()`)
- Authenticated users can INSERT their own row (`id = auth.uid()`)

**`user_favorites` table:**
- Anyone can SELECT rows where the corresponding `profiles.is_public = true` (join on `user_id = profiles.id`)
- Authenticated users can SELECT/INSERT/UPDATE their own row (`user_id = auth.uid()`)

**`user_play_counts` table:**
- Same pattern as `user_favorites`

### Profile row lifecycle

- Row is created when the user first sets a username in Settings (not at sign-up)
- `is_public` defaults to `false` — user must explicitly toggle it on
- Deleting the user account cascades to delete the profile row

## Settings Page Changes

New "Public Profile" section added below the existing Account section. Hidden if user is not authenticated.

### Fields

1. **Username** — text input, validates on blur
   - Format: lowercase alphanumeric, underscores, hyphens. 3-20 characters.
   - Inline validation feedback: too short, invalid characters, already taken
   - Uniqueness check via Supabase query on blur
   - Stored lowercase, case-insensitive matching

2. **Display Name** — optional text input
   - If empty, the profile page shows the email prefix (e.g. "jesse" from "jesse@email.com")
   - Free-form text, reasonable max length (~50 chars)

3. **"Make Profile Public" toggle** — switch component
   - Disabled until a username is set
   - Toggling on sets `is_public = true`
   - Toggling off sets `is_public = false` (profile URL returns "profile not found")

4. **Profile URL preview** — shown when public and username is set
   - Displays `scarletfire.app/profile/username`
   - Tappable/copyable

### Save behavior

Changes save on blur/toggle (no explicit save button), matching native settings feel.

## Public Profile Page

### Route

`/profile/:username`

### Data fetching

1. Resolve username to `user_id` via the `profiles` table
2. Fetch favorites and play counts using that `user_id`
3. If profile doesn't exist or `is_public = false`, show "Profile not found" state

### Layout (top to bottom)

1. **Header** — avatar (from Supabase Storage, using existing avatar URL resolution), display name (or email prefix fallback), username (`@username`)

2. **Stats bar** — compact row: "42 Shows · 128 Songs · 312 Plays"

3. **Most Listened Shows** — ranked list of top 10 shows by total play count
   - Shows: rank number, date, venue, play count badge

4. **Most Listened Songs** — ranked list of top 10 songs by play count
   - Shows: rank number, title, date, venue, play count badge

5. **Favorite Shows** — full list, same card style as Favorites screen Shows tab
   - Shows: date, venue, classic tier rating

6. **Favorite Songs** — full list, same card style as Favorites screen Songs tab
   - Shows: title, date, venue, performance rating, play count

### Platform behavior

- **Web desktop:** Uses existing DesktopLayout shell (sidebar, header, player bar)
- **Mobile web:** Full-width layout
- **Native app:** Deep links open a new ProfileScreen; falls back to web browser if not installed

### Interactivity

- Tapping a show or song navigates to that show/song detail page (same behavior as Favorites)

## Favorites Screen Changes

### Share button

- Added to the Favorites screen header, to the left of the existing search button
- Same icon style as existing share icons
- **Always visible** when user is authenticated (regardless of profile setup status)

### Tap behavior

- **Profile is set up** (username set + `is_public = true`): Opens the share tray with the profile share item
- **Profile not set up**: Shows a toast prompting the user to set up their public profile in Settings (e.g. "Set up your public profile in Settings to share your favorites")

## Share Card & OG Image

### New ShareItem kind

```typescript
{
  kind: 'profile';
  username: string;
  displayName: string;
  showCount: number;
  songCount: number;
}
```

### Share card design

Same 1:1 format as existing show/song share cards:
- Random background image (bg-1 through bg-6)
- Logo at top
- Title: `"{Display Name}'s Favorites"`
- Stats line: `"42 shows · 128 songs"`
- Dark gradient overlay for text contrast

### OG image route

`/api/og/profile/[username].tsx`
- Same `@vercel/og` + Satori approach as existing show/song OG routes
- Fetches profile + favorite/play count totals from Supabase server-side
- Returns image if profile is public; 404 otherwise

### Share URL

`scarletfire.app/profile/{username}`

### Share text

`"{Display Name}'s Favorites · scarletfire.app/profile/{username}"`

### Share destinations

Same as existing: copy link, WhatsApp, Instagram Story, Messages.

## Profile Service Changes

Extend existing `profileService.ts` with new methods:

- `createProfile(userId, username)` — inserts row into `profiles` table
- `updateUsername(userId, username)` — updates username, returns error if taken
- `updateDisplayName(userId, displayName)` — updates display name
- `setProfilePublic(userId, isPublic)` — toggles `is_public`
- `checkUsernameAvailable(username)` — queries `profiles` for matching username
- `getPublicProfile(username)` — fetches profile + favorites + play counts for a public user (used by profile page)
- `getUserProfile(userId)` — fetches the authenticated user's own profile row (used by Settings)

Avatar continues to live in Supabase Storage and `user_metadata` — the `profiles` table does not duplicate it.

## URL / Navigation

- Web route: `/profile/:username` added to web linking config
- Native deep link: `scarletfire://profile/:username` and `https://scarletfire.app/profile/:username`
- New screen: `ProfileScreen` added to the modal/stack navigator (not a new tab — accessible via deep links and shared profile URLs)

## Out of Scope

- Following/followers feature (planned as separate follow-up)
- Profile customization beyond display name and avatar
- Private profile viewing by other authenticated users
- Search/discovery of public profiles
