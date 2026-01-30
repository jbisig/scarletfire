# Settings Screen with Profile Picture Upload

## Overview
Settings screen accessible from profile dropdown allowing users to upload and manage their profile picture.

**Status**: ✅ Completed

---

## Architecture

### Storage: Supabase Auth User Metadata
- Uses `user.user_metadata.avatar_url`
- No additional database table needed
- Google OAuth users have `avatar_url` auto-populated

### Navigation: Modal Presentation
- Settings presented as full-screen modal via RootStack
- Accessible from any tab via PageHeader dropdown

---

## Files Created/Modified

| File | Action |
|------|--------|
| `src/services/profileService.ts` | Created |
| `src/screens/SettingsScreen.tsx` | Created |
| `src/contexts/AuthContext.tsx` | Modified - added refreshUser |
| `src/navigation/AppNavigator.tsx` | Modified - added RootStack |
| `src/components/PageHeader.tsx` | Modified - added navigation |

---

## Supabase Storage Setup

Bucket `avatars` with policies:
- Users can upload/update/delete their own folder
- Public read access for all avatars
