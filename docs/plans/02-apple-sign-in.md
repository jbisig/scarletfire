# Apple Sign-In Implementation

## Overview
Add Apple Sign-In to the existing Supabase authentication flow. This is **required for App Store compliance** since the app offers Google Sign-In.

**Status**: ✅ Completed

---

## Implementation Summary

### Dependencies Added
- `expo-apple-authentication`

### Configuration
- Added `expo-apple-authentication` plugin to `app.config.js`
- Added iOS entitlements for Sign in with Apple

### Code Changes
- `authService.ts` - Added `loginWithApple()` method
- `AuthContext.tsx` - Exposed Apple login in context
- `LoginScreen.tsx` / `SignupScreen.tsx` - Added Apple button (iOS only)

---

## Apple Developer Setup Required

1. Enable "Sign in with Apple" on App ID `com.scarletfire.app`
2. Create Service ID: `com.scarletfire.app.auth`
3. Create and download `.p8` key file
4. Configure Supabase Apple provider with Service ID, Key ID, Team ID

---

## Notes

- **iOS only** - Apple Sign-In not available on Android
- Requires EAS build (native code)
- Handles cancellation gracefully (no error shown)
