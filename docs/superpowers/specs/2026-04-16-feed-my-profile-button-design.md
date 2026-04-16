# Feed Screen — "My Profile" Button (Native) — Design

**Date:** 2026-04-16
**Status:** Approved for implementation planning

## Goal

Restore an explicit "My Profile" entry point to the native Feed screen. Today the affordance is hidden inside the avatar dropdown. Web keeps its existing `WebProfileAvatar` dropdown unchanged.

## Scope

- Native only (`Platform.OS !== 'web'`).
- A single visible pill in the Feed screen header that navigates to the signed-in user's own `PublicProfile`.

Out of scope: changes to the avatar dropdown, web behavior, mobile-web behavior, parity across Shows / Songs / Favorites tabs.

## Behavior

- **Label:** "My Profile".
- **Leading icon:** Ionicons `person-outline`, inline with the label.
- **Tap:** calls `handleViewProfile` from the existing `useProfileDropdown` hook. This preserves the current navigation contract: navigate to `PublicProfile` with the signed-in user's username, falling back to `Settings` if the user has no profile row.
- **Disabled / loading states:** none. The hook handles fetch-then-navigate; no new UI state is introduced.
- **Auth gating:** none needed. Native users past onboarding are always authenticated and have a profile row.

## Placement and Style

- Header row becomes a two-slot flex row: existing `headerLeft` (avatar + "Feed" title) and a new `headerRight` slot.
- Pill style matches the prior "My Profile badge":
  - Background: `COLORS.surfaceMedium`.
  - Corner radius: `RADIUS.full`.
  - Padding: ~12px vertical, ~16px horizontal.
  - Icon size: 16–18px, color `COLORS.textPrimary`, margin-right ~6px.
  - Label: `TYPOGRAPHY.body`, weight 600, color `COLORS.textPrimary`.
- Pressed feedback via `activeOpacity={0.7}`, matching other header buttons.

## Files Affected

- `src/screens/FeedScreen.tsx` — add the pill to the header block, add supporting styles, gate on `Platform.OS !== 'web'`.

No new files, no context changes, no schema changes.

## Non-Goals

- Changing what the avatar-tap dropdown does.
- Adding "My Profile" to other native tabs.
- Any web-side changes.
- Any design-system extraction of the pill component (only one consumer).
