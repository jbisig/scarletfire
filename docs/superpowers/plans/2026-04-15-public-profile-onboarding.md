# Public Profile Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-time post-signup onboarding step that pitches the public profile feature and lets the user create one (username + optional display name) or dismiss it.

**Architecture:** A new `ProfileContext` fetches the signed-in user's `profiles` row; `AppNavigator` gates a new `ProfileOnboardingNavigator` (a two-screen stack — Intro → Setup) between `AuthNavigator` and `RootStack` whenever no row exists. Dismissal writes a stub `profiles` row with a generated placeholder username and a new `profile_setup_dismissed_at` timestamp, so the user is never re-prompted. A schema backfill grants existing users the same "already past onboarding" state.

**Tech Stack:** React Native / Expo, TypeScript, Supabase (Postgres + RLS), `@react-navigation/stack`, Jest + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-04-15-public-profile-onboarding-design.md`

---

## File Structure

**Create:**
- `supabase/add_profile_setup_dismissed_at.sql` — schema migration + backfill
- `src/services/__tests__/profileService.onboarding.test.ts` — service unit tests
- `src/hooks/useUsernameAvailability.ts` — debounced availability hook
- `src/hooks/__tests__/useUsernameAvailability.test.ts` — hook tests
- `src/contexts/ProfileContext.tsx` — `profile` + `needsProfileSetup` state
- `src/contexts/__tests__/ProfileContext.test.tsx` — context tests
- `src/screens/onboarding/ProfileOnboardingIntroScreen.tsx` — screen 1 (pitch)
- `src/screens/onboarding/ProfileOnboardingSetupScreen.tsx` — screen 2 (form)
- `src/navigation/ProfileOnboardingNavigator.tsx` — two-screen stack with video chrome

**Modify:**
- `src/services/profileService.ts` — add `completeProfileOnboarding` + `dismissProfileOnboarding`
- `App.tsx` — wrap providers with `<ProfileProvider>` inside `<AuthProvider>`
- `src/navigation/AppNavigator.tsx` — add the `needsProfileSetup` gate as the middle branch

---

### Task 1: Schema migration

**Files:**
- Create: `supabase/add_profile_setup_dismissed_at.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/add_profile_setup_dismissed_at.sql
-- Adds a dismissal timestamp so the profile-onboarding prompt shows at most once.
-- Existing rows are backfilled to NOW() so already-enrolled users are treated as
-- "already past onboarding" and will not be prompted.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_setup_dismissed_at timestamptz;

UPDATE profiles
  SET profile_setup_dismissed_at = NOW()
  WHERE profile_setup_dismissed_at IS NULL;
```

- [ ] **Step 2: Run the migration against the dev Supabase project**

This project applies migrations manually via the Supabase SQL editor (see other files in `supabase/`). Paste the contents into the SQL editor for the dev project and run. Verify with:

```sql
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'profile_setup_dismissed_at';
```

Expected: one row `profile_setup_dismissed_at | timestamp with time zone`.

- [ ] **Step 3: Commit**

```bash
git add supabase/add_profile_setup_dismissed_at.sql
git commit -m "feat(profiles): add profile_setup_dismissed_at column"
```

---

### Task 2: Extend `UserProfile` type + add `completeProfileOnboarding`

**Files:**
- Modify: `src/services/profileService.ts`
- Create: `src/services/__tests__/profileService.onboarding.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/services/__tests__/profileService.onboarding.test.ts
jest.mock('../authService', () => ({
  authService: { getClient: jest.fn() },
}));

import { profileService } from '../profileService';
import { authService } from '../authService';

function makeSupabaseMock() {
  const chain = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'u1',
        username: 'jesse',
        display_name: 'Jesse B',
        is_public: true,
        profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
        created_at: '2026-04-15T00:00:00Z',
        updated_at: '2026-04-15T00:00:00Z',
      },
      error: null,
    }),
  };
  const from = jest.fn().mockReturnValue(chain);
  (authService.getClient as jest.Mock).mockReturnValue({ from });
  return { from, chain };
}

describe('completeProfileOnboarding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts username (lowercased), display name, is_public=true, and dismissal timestamp', async () => {
    const { from, chain } = makeSupabaseMock();
    const result = await profileService.completeProfileOnboarding('u1', {
      username: 'Jesse',
      displayName: 'Jesse B',
    });
    expect(from).toHaveBeenCalledWith('profiles');
    const insertArg = (chain.insert as jest.Mock).mock.calls[0][0];
    expect(insertArg).toMatchObject({
      id: 'u1',
      username: 'jesse',
      display_name: 'Jesse B',
      is_public: true,
    });
    expect(typeof insertArg.profile_setup_dismissed_at).toBe('string');
    expect(result.username).toBe('jesse');
  });

  it('stores display_name as null when blank', async () => {
    const { chain } = makeSupabaseMock();
    await profileService.completeProfileOnboarding('u1', { username: 'jesse', displayName: '' });
    expect((chain.insert as jest.Mock).mock.calls[0][0].display_name).toBeNull();
  });

  it('throws on unique-constraint violation so UI can surface a conflict', async () => {
    const { chain } = makeSupabaseMock();
    chain.single.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });
    await expect(
      profileService.completeProfileOnboarding('u1', { username: 'jesse' }),
    ).rejects.toMatchObject({ code: '23505' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/__tests__/profileService.onboarding.test.ts`
Expected: FAIL — `profileService.completeProfileOnboarding is not a function`.

- [ ] **Step 3: Extend the type and add the method**

Edit `src/services/profileService.ts`. First, add the new column to `UserProfile`:

```ts
export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  is_public: boolean;
  profile_setup_dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

Then add the method to the `ProfileService` class (below the existing `createProfile`):

```ts
  /**
   * Insert a fully-formed profile row from the onboarding flow. Sets the
   * dismissal timestamp so the prompt never fires for this user again.
   */
  async completeProfileOnboarding(
    userId: string,
    input: { username: string; displayName?: string },
  ): Promise<UserProfile> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: input.username.toLowerCase(),
        display_name: input.displayName?.trim() ? input.displayName.trim() : null,
        is_public: true,
        profile_setup_dismissed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/__tests__/profileService.onboarding.test.ts`
Expected: PASS (all three tests green).

- [ ] **Step 5: Commit**

```bash
git add src/services/profileService.ts src/services/__tests__/profileService.onboarding.test.ts
git commit -m "feat(profiles): add completeProfileOnboarding service method"
```

---

### Task 3: Add `dismissProfileOnboarding`

**Files:**
- Modify: `src/services/profileService.ts`
- Modify: `src/services/__tests__/profileService.onboarding.test.ts`

Dismissal has to write a real `profiles` row, but the `username` column is `NOT NULL UNIQUE` with a format constraint. Generate a low-collision placeholder (`user_<8 hex>`). The user can rename it later in Settings.

- [ ] **Step 1: Write the failing tests**

Append to `src/services/__tests__/profileService.onboarding.test.ts`:

```ts
describe('dismissProfileOnboarding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts a stub row with a generated username matching user_[a-f0-9]{8}', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.single.mockResolvedValueOnce({
      data: {
        id: 'u1',
        username: 'user_abcdef01',
        display_name: null,
        is_public: false,
        profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
        created_at: '2026-04-15T00:00:00Z',
        updated_at: '2026-04-15T00:00:00Z',
      },
      error: null,
    });
    await profileService.dismissProfileOnboarding('u1');
    expect(from).toHaveBeenCalledWith('profiles');
    const insertArg = (chain.insert as jest.Mock).mock.calls[0][0];
    expect(insertArg.id).toBe('u1');
    expect(insertArg.username).toMatch(/^user_[a-f0-9]{8}$/);
    expect(insertArg.is_public).toBe(false);
    expect(typeof insertArg.profile_setup_dismissed_at).toBe('string');
  });

  it('retries once with a new username on unique-constraint collision', async () => {
    const { chain } = makeSupabaseMock();
    chain.single
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } })
      .mockResolvedValueOnce({
        data: {
          id: 'u1',
          username: 'user_11111111',
          display_name: null,
          is_public: false,
          profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
          created_at: '2026-04-15T00:00:00Z',
          updated_at: '2026-04-15T00:00:00Z',
        },
        error: null,
      });
    await profileService.dismissProfileOnboarding('u1');
    expect((chain.insert as jest.Mock).mock.calls.length).toBe(2);
    const first = (chain.insert as jest.Mock).mock.calls[0][0].username;
    const second = (chain.insert as jest.Mock).mock.calls[1][0].username;
    expect(first).not.toBe(second);
  });

  it('throws when retry also collides', async () => {
    const { chain } = makeSupabaseMock();
    chain.single
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } })
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } });
    await expect(profileService.dismissProfileOnboarding('u1')).rejects.toMatchObject({
      code: '23505',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/services/__tests__/profileService.onboarding.test.ts`
Expected: FAIL — `profileService.dismissProfileOnboarding is not a function`.

- [ ] **Step 3: Implement**

Add to `ProfileService` in `src/services/profileService.ts`:

```ts
  /**
   * Record that the user declined the profile-onboarding prompt.
   * Writes a stub row with a generated placeholder username so the dismissal
   * persists and syncs across devices. The user can rename the placeholder in
   * Settings at any time.
   */
  async dismissProfileOnboarding(userId: string): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const supabase = authService.getClient();
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: generatePlaceholderUsername(),
          is_public: false,
          profile_setup_dismissed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error) return;
      // 23505 = unique_violation. Retry once with a fresh random suffix.
      if (error.code !== '23505' || attempt === 1) throw error;
    }
  }
```

At the top of the file (just below the imports), add the helper:

```ts
function generatePlaceholderUsername(): string {
  const hex = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return `user_${hex}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/services/__tests__/profileService.onboarding.test.ts`
Expected: PASS (all six tests green).

- [ ] **Step 5: Commit**

```bash
git add src/services/profileService.ts src/services/__tests__/profileService.onboarding.test.ts
git commit -m "feat(profiles): add dismissProfileOnboarding with retry on username collision"
```

---

### Task 4: `useUsernameAvailability` hook

**Files:**
- Create: `src/hooks/useUsernameAvailability.ts`
- Create: `src/hooks/__tests__/useUsernameAvailability.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/hooks/__tests__/useUsernameAvailability.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useUsernameAvailability } from '../useUsernameAvailability';
import { profileService } from '../../services/profileService';

jest.mock('../../services/profileService', () => ({
  profileService: { checkUsernameAvailable: jest.fn() },
}));

describe('useUsernameAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns idle for empty input', () => {
    const { result } = renderHook(() => useUsernameAvailability(''));
    expect(result.current).toEqual({ state: 'idle' });
  });

  it('returns invalid when too short', () => {
    const { result } = renderHook(() => useUsernameAvailability('ab'));
    expect(result.current.state).toBe('invalid');
  });

  it('returns invalid for uppercase or illegal characters', () => {
    const { result } = renderHook(() => useUsernameAvailability('No!'));
    expect(result.current.state).toBe('invalid');
  });

  it('returns checking immediately and available after debounce when free', async () => {
    (profileService.checkUsernameAvailable as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useUsernameAvailability('jesse'));
    expect(result.current.state).toBe('checking');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.state).toBe('available');
    expect(profileService.checkUsernameAvailable).toHaveBeenCalledWith('jesse');
  });

  it('returns taken when the service reports the name is in use', async () => {
    (profileService.checkUsernameAvailable as jest.Mock).mockResolvedValue(false);
    const { result } = renderHook(() => useUsernameAvailability('jesse'));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.state).toBe('taken');
  });

  it('cancels an in-flight check when the input changes before the debounce fires', async () => {
    (profileService.checkUsernameAvailable as jest.Mock).mockResolvedValue(true);
    const { result, rerender } = renderHook(
      ({ value }) => useUsernameAvailability(value),
      { initialProps: { value: 'jesse' } },
    );
    expect(result.current.state).toBe('checking');
    rerender({ value: 'jesseb' });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(profileService.checkUsernameAvailable).toHaveBeenCalledTimes(1);
    expect(profileService.checkUsernameAvailable).toHaveBeenCalledWith('jesseb');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/hooks/__tests__/useUsernameAvailability.test.ts`
Expected: FAIL — cannot find module `../useUsernameAvailability`.

- [ ] **Step 3: Implement the hook**

```ts
// src/hooks/useUsernameAvailability.ts
import { useEffect, useState } from 'react';
import { profileService } from '../services/profileService';

export type UsernameStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'taken' }
  | { state: 'invalid'; message: string };

const DEBOUNCE_MS = 300;

function validate(value: string): string | null {
  if (value.length < 3) return 'Must be at least 3 characters';
  if (value.length > 20) return 'Must be 20 characters or less';
  if (!/^[a-z0-9_-]+$/.test(value)) return 'Use lowercase letters, numbers, _ and -';
  return null;
}

export function useUsernameAvailability(username: string): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>({ state: 'idle' });
  const trimmed = username.trim();

  useEffect(() => {
    if (!trimmed) {
      setStatus({ state: 'idle' });
      return;
    }
    const invalidMessage = validate(trimmed);
    if (invalidMessage) {
      setStatus({ state: 'invalid', message: invalidMessage });
      return;
    }

    setStatus({ state: 'checking' });
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const available = await profileService.checkUsernameAvailable(trimmed);
        if (!cancelled) setStatus({ state: available ? 'available' : 'taken' });
      } catch {
        // Network/transient error — revert to idle so the user can retry by typing.
        if (!cancelled) setStatus({ state: 'idle' });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [trimmed]);

  return status;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/hooks/__tests__/useUsernameAvailability.test.ts`
Expected: PASS (all six tests green).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUsernameAvailability.ts src/hooks/__tests__/useUsernameAvailability.test.ts
git commit -m "feat(profiles): add useUsernameAvailability hook"
```

---

### Task 5: `ProfileContext`

**Files:**
- Create: `src/contexts/ProfileContext.tsx`
- Create: `src/contexts/__tests__/ProfileContext.test.tsx`

The context fetches the current user's profile row on auth-state change. It treats a `null` return from `getUserProfile` (Supabase PGRST116 "no rows") as "needs setup," and treats thrown errors as transient (fall through to MainTabs — onboarding must never block the app over a failed read).

- [ ] **Step 1: Write the failing tests**

```tsx
// src/contexts/__tests__/ProfileContext.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { ProfileProvider, useProfile } from '../ProfileContext';
import { profileService } from '../../services/profileService';

jest.mock('../../services/profileService', () => ({
  profileService: { getUserProfile: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function Probe() {
  const { needsProfileSetup, isProfileLoading, profile } = useProfile();
  return (
    <>
      <Text testID="loading">{String(isProfileLoading)}</Text>
      <Text testID="needs">{String(needsProfileSetup)}</Text>
      <Text testID="username">{profile?.username ?? 'none'}</Text>
    </>
  );
}

describe('ProfileContext', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports needsProfileSetup=true when the user has no row', async () => {
    mockUseAuth.mockReturnValue({ state: { user: { id: 'u1' }, isAuthenticated: true } });
    (profileService.getUserProfile as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(getByTestId('needs').props.children).toBe('true');
    expect(getByTestId('username').props.children).toBe('none');
  });

  it('reports needsProfileSetup=false when a row exists', async () => {
    mockUseAuth.mockReturnValue({ state: { user: { id: 'u1' }, isAuthenticated: true } });
    (profileService.getUserProfile as jest.Mock).mockResolvedValue({
      id: 'u1',
      username: 'jesse',
      display_name: null,
      is_public: false,
      profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
      created_at: '2026-04-15T00:00:00Z',
      updated_at: '2026-04-15T00:00:00Z',
    });

    const { getByTestId } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(getByTestId('needs').props.children).toBe('false');
    expect(getByTestId('username').props.children).toBe('jesse');
  });

  it('reports needsProfileSetup=false on a transient fetch error (fall through)', async () => {
    mockUseAuth.mockReturnValue({ state: { user: { id: 'u1' }, isAuthenticated: true } });
    (profileService.getUserProfile as jest.Mock).mockRejectedValue(new Error('network'));

    const { getByTestId } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(getByTestId('needs').props.children).toBe('false');
  });

  it('clears state and does not fetch when no user is signed in', async () => {
    mockUseAuth.mockReturnValue({ state: { user: null, isAuthenticated: false } });

    const { getByTestId } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(getByTestId('needs').props.children).toBe('false');
    expect(profileService.getUserProfile).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/contexts/__tests__/ProfileContext.test.tsx`
Expected: FAIL — cannot find module `../ProfileContext`.

- [ ] **Step 3: Implement the context**

```tsx
// src/contexts/ProfileContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { profileService, UserProfile } from '../services/profileService';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  profile: UserProfile | null;
  needsProfileSetup: boolean;
  isProfileLoading: boolean;
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const userId = authState.user?.id ?? null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const load = useCallback(async (id: string) => {
    setIsProfileLoading(true);
    try {
      const p = await profileService.getUserProfile(id);
      setProfile(p);
      setNeedsProfileSetup(p === null);
    } catch {
      // Transient error — never block the app. Fall through to MainTabs.
      setProfile(null);
      setNeedsProfileSetup(false);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setNeedsProfileSetup(false);
      setIsProfileLoading(false);
      return;
    }
    load(userId);
  }, [userId, load]);

  const refresh = useCallback(async () => {
    if (userId) await load(userId);
  }, [userId, load]);

  const value = useMemo(
    () => ({ profile, needsProfileSetup, isProfileLoading, refresh }),
    [profile, needsProfileSetup, isProfileLoading, refresh],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/contexts/__tests__/ProfileContext.test.tsx`
Expected: PASS (all four tests green).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/ProfileContext.tsx src/contexts/__tests__/ProfileContext.test.tsx
git commit -m "feat(profiles): add ProfileContext with needsProfileSetup"
```

---

### Task 6: Mount `ProfileProvider` in `App.tsx`

**Files:**
- Modify: `App.tsx`

`ProfileProvider` reads from `AuthContext`, so it must nest *inside* `<AuthProvider>`. Place it right after `<WebAuthModalProvider>` and before `<ShowsProvider>` — it has no dependency on the data providers and needs to be available to `AppNavigator`.

- [ ] **Step 1: Add the import**

At the top of `App.tsx`, add the import next to the other context imports:

```tsx
import { ProfileProvider } from './src/contexts/ProfileContext';
```

- [ ] **Step 2: Wrap the tree**

Change the provider stack so `ProfileProvider` wraps everything below `WebAuthModalProvider`:

```tsx
            <AuthProvider>
              <WebAuthModalProvider>
                <ProfileProvider>
                  <ShowsProvider>
                    <ShowOfTheDayProvider>
                      <FavoritesProvider>
                        <CollectionsProvider>
                          <PlayCountsProvider>
                          <PlayerProvider>
                            <VideoBackgroundProvider>
                              <ShareSheetProvider>
                                <ErrorBoundary>
                                  <AppNavigator />
                                </ErrorBoundary>
                                {Platform.OS !== 'web' && <StatusBar style="light" />}
                              </ShareSheetProvider>
                            </VideoBackgroundProvider>
                          </PlayerProvider>
                          </PlayCountsProvider>
                        </CollectionsProvider>
                      </FavoritesProvider>
                    </ShowOfTheDayProvider>
                  </ShowsProvider>
                </ProfileProvider>
              </WebAuthModalProvider>
            </AuthProvider>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors from `App.tsx`.

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat(profiles): mount ProfileProvider in app provider tree"
```

---

### Task 7: `ProfileOnboardingIntroScreen`

**Files:**
- Create: `src/screens/onboarding/ProfileOnboardingIntroScreen.tsx`

- [ ] **Step 1: Implement the screen**

```tsx
// src/screens/onboarding/ProfileOnboardingIntroScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { profileService } from '../../services/profileService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import type { ProfileOnboardingStackParamList } from '../../navigation/ProfileOnboardingNavigator';

export function ProfileOnboardingIntroScreen() {
  const navigation = useNavigation<NavigationProp<ProfileOnboardingStackParamList>>();
  const { state: authState } = useAuth();
  const { refresh } = useProfile();
  const [isDismissing, setIsDismissing] = useState(false);

  const handleSkip = async () => {
    const userId = authState.user?.id;
    if (!userId || isDismissing) return;
    setIsDismissing(true);
    try {
      await profileService.dismissProfileOnboarding(userId);
      await refresh();
      // On success, ProfileContext flips needsProfileSetup=false and
      // AppNavigator unmounts this stack into MainTabs. No explicit nav needed.
    } catch {
      setIsDismissing(false);
      Alert.alert(
        "Couldn't save",
        'There was a problem. Check your connection and try again.',
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Make it yours</Text>
        <Text style={styles.subtitle}>
          Set up a public profile to share what you're listening to with other Heads.
        </Text>

        <View style={styles.featureList}>
          <FeatureRow
            icon="link-outline"
            title="Get a shareable profile"
            description="Your own URL like deadplayer.app/yourname"
          />
          <FeatureRow
            icon="people-outline"
            title="Follow other Heads"
            description="See what your friends are spinning"
          />
          <FeatureRow
            icon="flame-outline"
            title="Show off your top shows"
            description="Your favorites and most-played shows, on display"
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('ProfileOnboardingSetup')}
          activeOpacity={0.8}
          disabled={isDismissing}
        >
          <Text style={styles.primaryButtonText}>Set up my profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isDismissing}
        >
          <Text style={styles.skipText}>{isDismissing ? 'Saving...' : 'Maybe later'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={22} color={COLORS.accent} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xxxxl,
    paddingVertical: SPACING.xxxxl,
  },
  title: {
    ...TYPOGRAPHY.display,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxxxl,
  },
  featureList: {
    gap: SPACING.xl,
    marginBottom: SPACING.xxxxl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
  },
  featureIcon: {
    width: 36,
    alignItems: 'center',
    paddingTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
});
```

- [ ] **Step 2: Typecheck** (the navigator types don't exist yet — this will fail until Task 9)

Run: `npx tsc --noEmit`
Expected: a reference to `ProfileOnboardingStackParamList` that resolves later in Task 9. Leave the file as-is.

- [ ] **Step 3: Commit**

```bash
git add src/screens/onboarding/ProfileOnboardingIntroScreen.tsx
git commit -m "feat(profiles): add ProfileOnboardingIntroScreen"
```

---

### Task 8: `ProfileOnboardingSetupScreen`

**Files:**
- Create: `src/screens/onboarding/ProfileOnboardingSetupScreen.tsx`

Pre-fills the username from the email prefix (sanitized to match the profile username constraint). Runs `useUsernameAvailability` and disables submit until the status is `available`.

- [ ] **Step 1: Implement the screen**

```tsx
// src/screens/onboarding/ProfileOnboardingSetupScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { profileService } from '../../services/profileService';
import { useUsernameAvailability } from '../../hooks/useUsernameAvailability';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

function suggestUsername(email: string | undefined): string {
  const prefix = (email?.split('@')[0] ?? '').toLowerCase();
  return prefix.replace(/[^a-z0-9_-]/g, '').slice(0, 20);
}

export function ProfileOnboardingSetupScreen() {
  const navigation = useNavigation();
  const { state: authState } = useAuth();
  const { refresh } = useProfile();

  const [username, setUsername] = useState(() => suggestUsername(authState.user?.email));
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const status = useUsernameAvailability(username);
  const canSubmit = status.state === 'available' && !submitting;

  const statusMessage = useMemo(() => {
    switch (status.state) {
      case 'idle': return '';
      case 'checking': return 'Checking...';
      case 'available': return 'Available';
      case 'taken': return 'Already taken';
      case 'invalid': return status.message;
    }
  }, [status]);

  const statusColor = useMemo(() => {
    if (status.state === 'available') return COLORS.success ?? '#4ade80';
    if (status.state === 'taken' || status.state === 'invalid') return COLORS.danger ?? '#f87171';
    return COLORS.textTertiary;
  }, [status.state]);

  const handleUsernameChange = (v: string) => {
    // Mirror the profile-username format: lowercase + only allowed chars.
    setUsername(v.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
  };

  const handleSubmit = async () => {
    const userId = authState.user?.id;
    if (!userId || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await profileService.completeProfileOnboarding(userId, {
        username,
        displayName: displayName.trim() || undefined,
      });
      await refresh();
      // ProfileContext flips needsProfileSetup=false → AppNavigator shows MainTabs.
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') {
        setSubmitError('That username was just taken — try another.');
      } else {
        setSubmitError("Couldn't create your profile. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Pick your username</Text>
        <Text style={styles.subtitle}>
          This is how other Heads will find you. You can change your display name later.
        </Text>

        <View style={styles.fieldGroup}>
          <View style={styles.inputWrapper}>
            <BlurView intensity={12} tint="light" style={styles.inputBlur}>
              <Text style={styles.prefix}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="username"
                placeholderTextColor={COLORS.textPlaceholder}
                selectionColor={COLORS.textPrimary}
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                maxLength={20}
              />
              {status.state === 'checking' && (
                <ActivityIndicator style={styles.statusIcon} color={COLORS.textTertiary} />
              )}
              {status.state === 'available' && (
                <Ionicons
                  style={styles.statusIcon}
                  name="checkmark-circle"
                  size={20}
                  color={statusColor}
                />
              )}
            </BlurView>
          </View>
          {!!statusMessage && (
            <Text style={[styles.statusText, { color: statusColor }]}>{statusMessage}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.inputWrapper}>
            <BlurView intensity={12} tint="light" style={styles.inputBlur}>
              <TextInput
                style={[styles.input, styles.inputWithoutPrefix]}
                placeholder="Your name (optional)"
                placeholderTextColor={COLORS.textPlaceholder}
                selectionColor={COLORS.textPrimary}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                maxLength={50}
              />
            </BlurView>
          </View>
        </View>

        {!!submitError && <Text style={styles.errorBanner}>{submitError}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.textPrimary} />
            : <Text style={styles.primaryButtonText}>Create profile</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xxxxl,
    paddingVertical: SPACING.xxxxl,
  },
  title: {
    ...TYPOGRAPHY.display,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxxxl,
  },
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  inputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMedium,
    paddingHorizontal: 28,
  },
  prefix: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textTertiary,
    marginRight: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  inputWithoutPrefix: {
    paddingLeft: 0,
  },
  statusIcon: {
    marginLeft: SPACING.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.sm,
    marginLeft: SPACING.lg,
  },
  errorBanner: {
    ...TYPOGRAPHY.body,
    color: COLORS.danger ?? '#f87171',
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  backText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
});
```

- [ ] **Step 2: Verify `COLORS.success` and `COLORS.danger` exist**

Run: `grep -n "success\\|danger" src/constants/theme.ts`

If either is missing, the inline `?? '#4ade80'` / `?? '#f87171'` fallback keeps the code working. If both exist, remove the `??` fallback. Do NOT add a new color token here — that's out of scope.

- [ ] **Step 3: Commit**

```bash
git add src/screens/onboarding/ProfileOnboardingSetupScreen.tsx
git commit -m "feat(profiles): add ProfileOnboardingSetupScreen with live username check"
```

---

### Task 9: `ProfileOnboardingNavigator`

**Files:**
- Create: `src/navigation/ProfileOnboardingNavigator.tsx`

Uses the same video-background chrome as `AuthNavigator` so screens feel like a continuation of signup.

- [ ] **Step 1: Implement the navigator**

```tsx
// src/navigation/ProfileOnboardingNavigator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { AUTH_VIDEO_SOURCE } from '../screens/auth/authVideoSource';
import { ProfileOnboardingIntroScreen } from '../screens/onboarding/ProfileOnboardingIntroScreen';
import { ProfileOnboardingSetupScreen } from '../screens/onboarding/ProfileOnboardingSetupScreen';
import { COLORS } from '../constants/theme';

export type ProfileOnboardingStackParamList = {
  ProfileOnboardingIntro: undefined;
  ProfileOnboardingSetup: undefined;
};

const Stack = createStackNavigator<ProfileOnboardingStackParamList>();

export function ProfileOnboardingNavigator() {
  return (
    <View style={styles.container}>
      <Video
        source={AUTH_VIDEO_SOURCE}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      <LinearGradient
        colors={['transparent', 'rgba(18, 18, 18, 0.8)', COLORS.background]}
        locations={[0, 0.5, 0.75]}
        style={StyleSheet.absoluteFillObject}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen
          name="ProfileOnboardingIntro"
          component={ProfileOnboardingIntroScreen}
        />
        <Stack.Screen
          name="ProfileOnboardingSetup"
          component={ProfileOnboardingSetupScreen}
        />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors related to the onboarding files (Intro screen's `ProfileOnboardingStackParamList` import now resolves).

- [ ] **Step 3: Commit**

```bash
git add src/navigation/ProfileOnboardingNavigator.tsx
git commit -m "feat(profiles): add ProfileOnboardingNavigator with video chrome"
```

---

### Task 10: Gate `AppNavigator` on `needsProfileSetup`

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Add imports**

Near the top of `src/navigation/AppNavigator.tsx`, alongside the other navigator imports:

```tsx
import { ProfileOnboardingNavigator } from './ProfileOnboardingNavigator';
import { useProfile } from '../contexts/ProfileContext';
```

- [ ] **Step 2: Read the profile state inside `AppNavigator`**

Inside the `AppNavigator` function, right below `const { state: authState } = useAuth();`, add:

```tsx
  const { needsProfileSetup, isProfileLoading } = useProfile();
```

- [ ] **Step 3: Extend the loading guard**

Change the existing `if (authState.isLoading)` block (line ~428) to also wait for the profile fetch when the user is signed in. The block becomes:

```tsx
  // Show loading while checking auth or while fetching profile for a signed-in user
  if (authState.isLoading || (authState.isAuthenticated && isProfileLoading)) {
    return (
      <NavigationContainer ref={navigationRef} linking={linking} documentTitle={documentTitle}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </NavigationContainer>
    );
  }
```

- [ ] **Step 4: Add the third branch**

Change the conditional JSX inside the bottom `<NavigationContainer>` (currently `showAuthFlow ? <AuthNavigator /> : <RootStack.Navigator>…`). Replace that ternary with:

```tsx
        {showAuthFlow ? (
          <AuthNavigator />
        ) : authState.isAuthenticated && needsProfileSetup ? (
          <ProfileOnboardingNavigator />
        ) : (
          <RootStack.Navigator screenOptions={{ headerShown: false, cardStyle: webCardStyle }}>
            {/* …existing RootStack.Screen list unchanged… */}
          </RootStack.Navigator>
        )}
```

- [ ] **Step 5: Mirror the branch in the desktop-web path**

The desktop-web branch (line ~443, `if (useDesktopLayout) { return … <DesktopLayout />`) renders before the main conditional. A signed-in desktop-web user with no profile row should *also* see onboarding, not land straight into `DesktopLayout`. Change that block to:

```tsx
  if (useDesktopLayout) {
    return (
      <ErrorBoundary>
        <NavigationContainer ref={navigationRef} linking={linking} documentTitle={documentTitle}>
          {authState.isAuthenticated && needsProfileSetup
            ? <ProfileOnboardingNavigator />
            : <DesktopLayout />}
        </NavigationContainer>
      </ErrorBoundary>
    );
  }
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Run the full test suite**

Run: `npm test -- --watchAll=false`
Expected: PASS. No existing suite touches these code paths.

- [ ] **Step 8: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat(profiles): gate onboarding navigator between auth and main app"
```

---

### Task 11: Manual verification

The project has few UI-integration tests — verify the user-facing flow by hand on both a simulator and web. Fix any issue before declaring done.

**Files:**
- None

- [ ] **Step 1: Start the dev server**

Run: `npm start` (native) and in another terminal `npm run web`.

- [ ] **Step 2: Brand-new signup on native (iOS simulator)**

1. Launch the app; tap "Create Account."
2. Sign up with a fresh email.
3. Expected: `ProfileOnboardingIntroScreen` appears with the video background and three feature rows.

- [ ] **Step 3: Complete the flow**

1. Tap "Set up my profile."
2. Expected: `ProfileOnboardingSetupScreen` with the username pre-filled from the email prefix.
3. Expected: Status indicator cycles idle → checking → available within ~300ms.
4. Type an invalid character (e.g., "."); expected inline "Use lowercase letters, numbers, _ and -".
5. Fix the input, type a known-taken username (use one you've seeded), expect "Already taken" and disabled submit.
6. Tap "Create profile"; expected brief spinner, then app enters MainTabs.
7. Open Settings → verify the username + display name are present and `is_public = true`.

- [ ] **Step 4: Skip the flow on a second brand-new account**

1. Sign up again with a different email.
2. Tap "Maybe later"; expect brief "Saving..." then app enters MainTabs.
3. Kill and relaunch the app. Expect MainTabs on launch (no re-prompt).
4. In the DB, verify the user has a `profiles` row with `username` matching `/^user_[a-f0-9]{8}$/`, `is_public = false`, `profile_setup_dismissed_at` populated.

- [ ] **Step 5: Existing user (post-migration) never sees the prompt**

1. Sign out; sign back in with a pre-existing account that has a `profiles` row.
2. Expect MainTabs with no onboarding interstitial.

- [ ] **Step 6: Web parity**

1. In web, click "Sign In" and create a new account (or log in as a user with no profile row — you may need to temporarily delete a row via the SQL editor to simulate).
2. Expect the onboarding screens in the web layout (centered card with video).
3. Complete or skip; expect the same MainTabs transition.

- [ ] **Step 7: Deep-link precedence**

1. Sign out. Open `scarletfire://profile/someuser` (or the universal link) on device.
2. Expect: if you land on an authenticated user with no profile row, onboarding shows first. After completing/dismissing, the deep link's `PublicProfileScreen` target appears.

- [ ] **Step 8: Error path**

1. Turn off Wi-Fi. Start a fresh signup.
2. Tap "Set up my profile," enter a username, tap "Create profile."
3. Expect the inline red banner "Couldn't create your profile. Check your connection and try again." and the form remains filled in.

- [ ] **Step 9: Commit any fixes surfaced during verification (only if needed)**

```bash
git add -p
git commit -m "fix(profiles): <specific fix>"
```

---

## Out of Scope (do not add)

- Avatar upload during onboarding.
- "Find friends" / follow recommendations step.
- Re-prompting users who tapped "Maybe later."
- Porting the existing in-Settings profile UI over to the new screens.
