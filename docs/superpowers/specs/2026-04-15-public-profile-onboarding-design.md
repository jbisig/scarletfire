# Public Profile Onboarding — Design

**Date:** 2026-04-15
**Status:** Approved for implementation planning

## Goal

Add an onboarding step shown once after account creation (and once for existing logged-in users without a profile) that:

1. Explains the features unlocked by having a public profile.
2. Lets the user create a public profile by setting a username and optional display name.
3. Lets them dismiss with "Maybe later" without blocking app entry.

## Scope

- New signups going forward.
- Existing signed-in users who do not yet have a `profiles` row.
- Same behavior on native and web.

Out of scope: changing the existing in-Settings profile flow, avatar uploads, follow recommendations, post-onboarding nudges.

## Architecture

### Schema

One new column on the existing `profiles` table:

```sql
ALTER TABLE profiles ADD COLUMN profile_setup_dismissed_at TIMESTAMPTZ;
UPDATE profiles SET profile_setup_dismissed_at = NOW() WHERE profile_setup_dismissed_at IS NULL;
```

Backfilling existing rows means anyone who already engaged with the profile system (via the current `SettingsScreen` lazy-create flow) is treated as past onboarding and will not be prompted.

### Trigger condition

> Show onboarding when the user is authenticated AND no `profiles` row exists for their `auth.uid()`.

After the migration this is sufficient:

- Existing users have a row → skipped.
- New signups have no row → prompted.
- A user who taps "Maybe later" gets a stub row written (`is_public = false`, `profile_setup_dismissed_at = NOW()`), so they are not re-prompted.
- A user who completes the form gets a real row with the same `profile_setup_dismissed_at`.

### Navigation gating

`AppNavigator.tsx` currently switches between `AuthNavigator` and `RootStack`. Add a third branch:

```
if (showAuthFlow)            → AuthNavigator
else if (needsProfileSetup)  → ProfileOnboardingNavigator   (new)
else                         → RootStack (MainTabs)
```

`needsProfileSetup` is sourced from a new `ProfileContext` that fetches the current user's profile row on auth state change. While the fetch is in flight, render the existing auth-boot splash so the user does not flicker into MainTabs and back out.

### Web parity

The same gate runs on web. Anonymous web visitors continue to skip auth entirely. The moment a web user signs in or signs up and has no profile row, they see the onboarding screens before MainTabs renders. Layout matches the existing `AuthNavigator` chrome (centered card with video background) on both platforms.

## Screen 1 — Intro / Explainer

**Route:** `ProfileOnboardingIntro`
**Chrome:** Reuses `AuthNavigator` styling (video background, centered card).

**Content:**

- Headline: **"Make it yours"**
- Subhead: **"Set up a public profile to share what you're listening to with other Heads."**
- Three feature rows (icon + label + one-line description):
  1. **Get a shareable profile** — "Your own URL like `deadplayer.app/yourname`"
  2. **Follow other Heads** — "See what your friends are spinning"
  3. **Show off your top shows** — "Your favorites and most-played shows, on display"
- Primary button: **"Set up my profile"** → navigates to `ProfileOnboardingSetup`.
- Secondary text link: **"Maybe later"** → calls `dismissProfileOnboarding()` (writes the stub row), then routes to MainTabs.

No back/close affordance. The two buttons are the only paths forward.

## Screen 2 — Setup Form

**Route:** `ProfileOnboardingSetup`
**Chrome:** Same as screen 1.

**Content:**

- Headline: **"Pick your username"**
- Subhead: **"This is how other Heads will find you. You can change your display name later."**

**Fields:**

1. **Username** (required)
   - Pre-filled from the email prefix, sanitized to match `^[a-z0-9_-]{3,20}$` (e.g., `jesse.bisignano@gmail.com` → `jessebisignano`).
   - Lowercased and sanitized as the user types — no surprises at submit.
   - Inline status: idle → "Checking..." → "Available" / "Already taken" / "Must be 3–20 chars (letters, numbers, `_`, `-`)".
   - Live availability via the existing `profileService.checkUsernameAvailable()`, debounced 300ms.
   - Submit button disabled until status is "available".
2. **Display name** (optional)
   - Placeholder: "Your name (optional)".
   - Stored as `null` if blank; `PublicProfileScreen` already falls back to username.

**Buttons:**

- Primary: **"Create profile"** → calls `profileService.createProfile({ username, display_name, is_public: true, profile_setup_dismissed_at: NOW() })`, then routes to MainTabs.
- Secondary text link: **"Back"** → returns to intro screen (does not dismiss).

**Submit flow:**

1. Disable button, show inline spinner on the primary button.
2. Call `createProfile`.
3. On success: `needsProfileSetup` flips to false, AppNavigator re-renders into MainTabs. Optional toast: "Profile created."
4. On failure: see Edge Cases.

## Edge Cases

- **Username race (taken between check and submit):** Catch the unique-constraint violation from Supabase, surface as an inline error on the username field ("That username was just taken — try another"), re-enable the form.
- **Network failure on submit:** Inline error banner above the buttons: "Couldn't create your profile. Check your connection and try again." Form stays filled, button re-enabled, no dismissal recorded.
- **Profile fetch fails on app open:** Only treat as "needs setup" on a definitive "no row" response. On transient/network errors, fall through to MainTabs — onboarding must never block app entry over a failed read.
- **Force-quit mid-onboarding:** Either nothing was written, or only the stub (if "Maybe later" was tapped on screen 1). Next launch re-evaluates and lands the user correctly.
- **Auto-suggested username collides:** Live check shows "taken" and the user edits. No auto-numbering.
- **Sign out and sign in as a different user:** `needsProfileSetup` recomputes against the new user id. The context must invalidate on auth state change.
- **Deep links during onboarding:** Gate wins. The user completes onboarding (or dismisses), then lands on the deep link target. Mirrors `AuthNavigator` behavior.

## Files Affected (anticipated)

- `supabase/` — new migration adding `profile_setup_dismissed_at` and backfill.
- `src/services/profileService.ts` — add `dismissProfileOnboarding()`; update `createProfile()` to set the timestamp.
- `src/contexts/ProfileContext.tsx` — new context exposing `profile`, `needsProfileSetup`, and `refresh()`.
- `src/navigation/AppNavigator.tsx` — add the third-branch gate.
- `src/navigation/ProfileOnboardingNavigator.tsx` — new stack with two screens.
- `src/screens/onboarding/ProfileOnboardingIntroScreen.tsx` — new.
- `src/screens/onboarding/ProfileOnboardingSetupScreen.tsx` — new.
- `src/hooks/useUsernameAvailability.ts` — debounced live-check hook (extracted, since `SettingsScreen` may want to share it later).

## Non-Goals / Deferred

- Avatar upload during onboarding.
- Follow recommendations / "find friends" step.
- Re-prompting users who tapped "Maybe later" after some interval.
- Migrating the existing in-Settings profile-creation UI to the new screens.
