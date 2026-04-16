# Feed "My Profile" Button (Native) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a right-side "My Profile" pill to the native Feed screen header that navigates to the signed-in user's own `PublicProfile`.

**Architecture:** Single-file UI change. Adds a `headerRight` slot with a pill-shaped `TouchableOpacity` that wires directly into the existing `useProfileDropdown().handleViewProfile` — no new state, no new hook, no new network calls. Gated to native (`Platform.OS !== 'web'`) so the desktop/web `WebProfileAvatar` dropdown is untouched.

**Tech Stack:** React Native, `@expo/vector-icons` (Ionicons), existing `useProfileDropdown` hook.

**Spec:** `docs/superpowers/specs/2026-04-16-feed-my-profile-button-design.md`

---

## File Structure

**Modify:**
- `src/screens/FeedScreen.tsx` — add `Ionicons` import, restructure header row for right-aligned action, add the `headerRight` pill, add matching styles.

No new files, no deletions, no test files (UI-only change; verification is manual per spec).

---

### Task 1: Add the "My Profile" pill

**Files:**
- Modify: `src/screens/FeedScreen.tsx`

- [ ] **Step 1: Add the Ionicons import**

At the top of `src/screens/FeedScreen.tsx` (currently line 10 imports theme tokens), add the `Ionicons` import alongside the existing `@expo/vector-icons` consumers in this repo:

```tsx
import { Ionicons } from '@expo/vector-icons';
```

The full import block (with the addition) should read:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { ProfileImage } from '../components/ProfileImage';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { ActivityList } from '../components/feed/ActivityList';
import { PeopleList } from '../components/feed/PeopleList';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
```

- [ ] **Step 2: Make the header row space the left and right slots apart**

In the `styles` block (near the end of the file), change the `header` style to justify content to both ends:

Before:
```tsx
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
```

After:
```tsx
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
```

- [ ] **Step 3: Render the "My Profile" pill in a new `headerRight` slot**

In the component JSX, the header currently ends after `</View>` closing `headerLeft`. Add the pill immediately after that closing tag, inside the existing `<View style={[styles.header, …]}>`. The pill is gated on `Platform.OS !== 'web'` so neither desktop-web nor mobile-web renders it (per the spec — web keeps `WebProfileAvatar`). `Platform` is already imported at the top of the file.

Before:
```tsx
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <View style={styles.headerLeft}>
            {!isDesktop && (
              <TouchableOpacity
                ref={profileButtonRef}
                onPress={handleProfilePress}
                activeOpacity={0.8}
              >
                <ProfileImage
                  uri={isAuthenticated ? avatarUrl : null}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Feed</Text>
          </View>
        </View>
```

After:
```tsx
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <View style={styles.headerLeft}>
            {!isDesktop && (
              <TouchableOpacity
                ref={profileButtonRef}
                onPress={handleProfilePress}
                activeOpacity={0.8}
              >
                <ProfileImage
                  uri={isAuthenticated ? avatarUrl : null}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Feed</Text>
          </View>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.myProfileButton}
              onPress={handleViewProfile}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="My Profile"
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={COLORS.textPrimary}
                style={styles.myProfileIcon}
              />
              <Text style={styles.myProfileLabel}>My Profile</Text>
            </TouchableOpacity>
          )}
        </View>
```

- [ ] **Step 4: Add the pill styles**

Add the three new style entries to the `styles` block. Place them immediately after `headerTitle` and before `tabContainer`:

```tsx
  myProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMedium,
  },
  myProfileIcon: {
    marginRight: 6,
  },
  myProfileLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no NEW errors introduced by this file. Pre-existing unrelated errors elsewhere (`AnimatedSearchBar.tsx`, `FullPlayer.tsx`, etc.) are out of scope — only verify that `src/screens/FeedScreen.tsx` is clean.

- [ ] **Step 6: Run any related test suites to confirm no regression**

Run: `npx jest src/__tests__ src/components src/services 2>&1 | tail -20`
Expected: PASS (the existing suites don't reference `FeedScreen`; this is a smoke check).

- [ ] **Step 7: Manual verification on the native simulator**

1. Start the dev server: `cd /Users/jessebisignano/projects/grateful-dead-player && npm start`.
2. Open the app on the iOS simulator, sign in.
3. Tap the Feed tab.
4. Expected: the header shows the avatar + "Feed" title on the left, and a rounded dark-gray "My Profile" pill (person-outline icon + label) on the right.
5. Tap the pill.
6. Expected: navigates to your own `PublicProfile` screen (same destination as tapping the avatar → dropdown → "View Profile").
7. Open the app on the web (`npm run web`) at both mobile and desktop breakpoints — expected: the pill is NOT rendered on either (web keeps the existing `WebProfileAvatar` dropdown).

- [ ] **Step 8: Commit**

```bash
git add src/screens/FeedScreen.tsx
git commit -m "feat(feed): add native 'My Profile' pill to header"
```

---

## Out of Scope (do not add)

- Changes to the avatar dropdown itself.
- Any web-side changes (mobile web or desktop web).
- Adding the pill to other native tabs.
- Extracting the pill into a shared component (only one consumer).
