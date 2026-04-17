# Support Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a web support page with a simple form (email + subject + message) that writes to Supabase. Native apps open the web support URL in a browser.

**Architecture:** New `SupportScreen` is reachable at `/support` on desktop web and mobile web via a Stack route registered in `DesktopLayout` / `webLinking.ts`. A new `supportService` inserts rows into a new `support_requests` Supabase table. A "Support" item is added to the avatar dropdown in two places — the web-only `Sidebar` dropdown (desktop web) and the shared `ProfileDropdown` (mobile web + native) — with native routing to `Linking.openURL(SUPPORT_URL)`.

**Tech Stack:** React Native + Expo, React Navigation (Stack), Supabase (`authService.getClient()`), TypeScript, existing theme tokens.

**Testing posture:** The existing codebase has service-level Jest tests for meaningful logic and no UI tests for screens. The `supportService` is a single insert with no branching logic worth testing in isolation, and `SupportScreen` is straightforward form UI. Per the spec, verification is manual. No automated tests are added in this plan.

**Source spec:** `docs/superpowers/specs/2026-04-16-support-page-design.md`

---

## File Structure

**New**
- `supabase/create_support_requests_table.sql` — migration SQL
- `src/services/supportService.ts` — `submitSupportRequest({ email, subject, message })`
- `src/screens/SupportScreen.tsx` — form UI

**Modified**
- `src/constants/config.ts` — add `SUPPORT_URL` export
- `src/navigation/DesktopLayout.tsx` — register `Support` route
- `src/navigation/webLinking.ts` — add `/support` path in both configs
- `src/components/web/Sidebar.tsx` — add "Support" item to dropdown (both auth states)
- `src/components/ProfileDropdown.tsx` — add `onSupport` prop + "Support" row (both auth states)
- `src/hooks/useProfileDropdown.ts` — add `handleSupport` with platform branch
- Every screen that renders `<ProfileDropdown>` — pass `onSupport={handleSupport}`

---

## Task 1: Supabase migration — `support_requests` table

**Files:**
- Create: `supabase/create_support_requests_table.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/create_support_requests_table.sql
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null
);

alter table public.support_requests enable row level security;

-- Anyone (anon + authenticated) may insert a support request.
-- No select/update/delete policies: the owner reads rows via the Supabase dashboard.
create policy "anyone can insert support requests"
  on public.support_requests
  for insert
  to anon, authenticated
  with check (true);
```

- [ ] **Step 2: Apply the migration in Supabase**

Run the SQL in the Supabase SQL editor (Dashboard → SQL Editor → paste → Run), matching how other migrations in `supabase/` are applied in this repo. Verify in the Table Editor that `public.support_requests` exists with the expected columns.

- [ ] **Step 3: Commit**

```bash
git add supabase/create_support_requests_table.sql
git commit -m "feat(support): add support_requests table"
```

---

## Task 2: Add `SUPPORT_URL` constant

**Files:**
- Modify: `src/constants/config.ts`

- [ ] **Step 1: Append a new export at the bottom of `src/constants/config.ts`**

Add these lines after the `validateConfig` function (i.e., after the last line of the current file):

```ts
/**
 * Public URL of the in-app support page on the web.
 * Used by native clients to open the support form in the system browser.
 */
export const SUPPORT_URL = 'https://www.scarletfire.app/support';
```

- [ ] **Step 2: Typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors introduced by the edit.

- [ ] **Step 3: Commit**

```bash
git add src/constants/config.ts
git commit -m "feat(support): add SUPPORT_URL constant"
```

---

## Task 3: Support service — insert a row

**Files:**
- Create: `src/services/supportService.ts`

- [ ] **Step 1: Create the service**

Write `src/services/supportService.ts` with this exact content:

```ts
import { authService } from './authService';
import { logger } from '../utils/logger';

const log = logger.create('Support');

export interface SupportRequestInput {
  email: string;
  subject: string;
  message: string;
}

/**
 * Insert a support request into Supabase. Attaches the current auth user_id
 * when available; otherwise stores the row with user_id = null.
 *
 * Throws on Supabase error so the caller can surface it to the user.
 */
export async function submitSupportRequest(input: SupportRequestInput): Promise<void> {
  const supabase = authService.getClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('support_requests').insert({
    user_id: user?.id ?? null,
    email: input.email,
    subject: input.subject,
    message: input.message,
  });

  if (error) {
    log.error('Failed to insert support_request', error);
    throw error;
  }
}
```

- [ ] **Step 2: Typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/supportService.ts
git commit -m "feat(support): add submitSupportRequest service"
```

---

## Task 4: SupportScreen — form UI

**Files:**
- Create: `src/screens/SupportScreen.tsx`

- [ ] **Step 1: Create the screen**

Write `src/screens/SupportScreen.tsx` with this exact content:

```tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { submitSupportRequest } from '../services/supportService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

const SUBJECT_MAX = 200;
const MESSAGE_MAX = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function SupportScreen() {
  const { state: authState } = useAuth();
  const initialEmail = authState.user?.email ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (!email.trim()) return 'Email is required.';
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    return null;
  }, [email]);
  const subjectError = useMemo(() => {
    if (!subject.trim()) return 'Subject is required.';
    if (subject.length > SUBJECT_MAX) return `Subject must be ${SUBJECT_MAX} characters or fewer.`;
    return null;
  }, [subject]);
  const messageError = useMemo(() => {
    if (!message.trim()) return 'Message is required.';
    if (message.length > MESSAGE_MAX) return `Message must be ${MESSAGE_MAX} characters or fewer.`;
    return null;
  }, [message]);

  const canSubmit = !emailError && !subjectError && !messageError && status !== 'submitting';

  const handleSubmit = useCallback(async () => {
    setAttempted(true);
    if (!canSubmit) return;

    // Honeypot: silently succeed, do not insert.
    if (website.trim().length > 0) {
      setStatus('success');
      return;
    }

    setStatus('submitting');
    setErrorMessage(null);
    try {
      await submitSupportRequest({
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  }, [canSubmit, email, subject, message, website]);

  const handleSendAnother = useCallback(() => {
    setEmail(initialEmail);
    setSubject('');
    setMessage('');
    setWebsite('');
    setAttempted(false);
    setStatus('idle');
    setErrorMessage(null);
  }, [initialEmail]);

  if (status === 'success') {
    return (
      <ScrollView contentContainerStyle={styles.outer}>
        <View style={styles.card}>
          <Text style={styles.title}>Thanks!</Text>
          <Text style={styles.body}>
            We got your message and will get back to you as soon as we can.
          </Text>
          <TouchableOpacity onPress={handleSendAnother} style={styles.secondaryButton} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Send another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.outer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Support</Text>
          <Text style={styles.body}>
            Found a bug, have a feature request, or just want to say hi? Send us a note.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={status !== 'submitting'}
            />
            {attempted && emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              style={styles.input}
              placeholder="Short summary"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={SUBJECT_MAX}
              editable={status !== 'submitting'}
            />
            {attempted && subjectError && <Text style={styles.fieldError}>{subjectError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              style={[styles.input, styles.textarea]}
              placeholder="Tell us what's going on…"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={MESSAGE_MAX}
              editable={status !== 'submitting'}
            />
            {attempted && messageError && <Text style={styles.fieldError}>{messageError}</Text>}
          </View>

          {/* Honeypot: hidden from real users via display:none. Bots that blindly
              fill every input will trip this and be silently dropped. */}
          <View style={styles.honeypot} pointerEvents="none">
            <TextInput
              value={website}
              onChangeText={setWebsite}
              autoComplete="off"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...({ tabIndex: -1 } as any)}
            />
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
            accessibilityRole="button"
          >
            {status === 'submitting' ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.primaryButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 640,
    gap: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.heading1,
    color: COLORS.textPrimary,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  field: {
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textarea: {
    minHeight: 160,
  },
  fieldError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
  },
  errorBanner: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.accent,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  errorBannerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
  primaryButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    // @ts-ignore - web only
    cursor: 'pointer',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.background,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
    // @ts-ignore - web only
    cursor: 'pointer',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
  honeypot: {
    // @ts-ignore - web only: remove the honeypot from layout and a11y.
    display: 'none',
  },
});
```

> **Note on theme tokens:** If any of `TYPOGRAPHY.heading1`, `TYPOGRAPHY.caption`, `COLORS.textTertiary`, or `COLORS.textSecondary` don't exist in this codebase, use the nearest equivalent from `src/constants/theme.ts`. Inspect that file once while implementing and substitute a consistent token (e.g., `TYPOGRAPHY.heading2`, `COLORS.textSecondary`, a hex like `#999`) rather than inventing new tokens.

- [ ] **Step 2: Typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors. If theme-token lookups fail, adjust per the note above and re-run.

- [ ] **Step 3: Commit**

```bash
git add src/screens/SupportScreen.tsx
git commit -m "feat(support): add SupportScreen form"
```

---

## Task 5: Register `Support` route (desktop web stack + linking)

**Files:**
- Modify: `src/navigation/DesktopLayout.tsx`
- Modify: `src/navigation/webLinking.ts`

- [ ] **Step 1: Add the screen to `DesktopLayout.tsx`**

Open `src/navigation/DesktopLayout.tsx`.

Add an import next to the other screen imports (alphabetical with the existing block):

```ts
import { SupportScreen } from '../screens/SupportScreen';
```

Inside the `<Stack.Navigator>` block (after the `<Stack.Screen name="Settings" ... />` line), add:

```tsx
<Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
```

- [ ] **Step 2: Add the route to both link configs in `webLinking.ts`**

Open `src/navigation/webLinking.ts`.

In `desktopWebLinking.config.screens`, add after `Settings: 'settings',`:

```ts
Support: 'support',
```

In `mobileWebLinking.config.screens`, add after the existing `Settings: 'settings',` entry (it sits at the top level, a sibling of `MainTabs`):

```ts
Support: 'support',
```

- [ ] **Step 3: Typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Smoke test the route**

Start the dev server (`npm run web` or the project's usual web command) and navigate manually to `/support`. The `SupportScreen` should render with the form.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/DesktopLayout.tsx src/navigation/webLinking.ts
git commit -m "feat(support): register /support route on web"
```

---

## Task 6: Desktop Sidebar dropdown — add "Support" item

**Files:**
- Modify: `src/components/web/Sidebar.tsx`

- [ ] **Step 1: Add the navigation handler**

In `src/components/web/Sidebar.tsx`, after the existing `handleSettingsNav` callback, add:

```ts
const handleSupportNav = useCallback(() => {
  setShowDropdown(false);
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.navigate({ name: 'Support' })
    );
  }
}, []);
```

- [ ] **Step 2: Insert the "Support" row in both auth states**

Find the `<Modal>` block at the bottom of the component. Update both branches of the `authState.isAuthenticated ? ... : ...` ternary.

**Authenticated branch** — add a Support item between Settings and Log Out. The block should look like this:

```tsx
<TouchableOpacity style={styles.dropdownItem} onPress={handleSettingsNav} activeOpacity={0.7}>
  <Text style={styles.dropdownText}>Settings</Text>
</TouchableOpacity>
<View style={styles.dropdownDivider} />
<TouchableOpacity style={styles.dropdownItem} onPress={handleSupportNav} activeOpacity={0.7}>
  <Text style={styles.dropdownText}>Support</Text>
</TouchableOpacity>
<View style={styles.dropdownDivider} />
<TouchableOpacity style={styles.dropdownItem} onPress={handleLogout} activeOpacity={0.7}>
  <Text style={styles.dropdownTextRed}>Log Out</Text>
</TouchableOpacity>
```

**Signed-out branch** — add a Support item below Sign Up. The block should look like this:

```tsx
<TouchableOpacity style={styles.dropdownItem} onPress={handleLogin} activeOpacity={0.7}>
  <Text style={styles.dropdownText}>Log In</Text>
</TouchableOpacity>
<View style={styles.dropdownDivider} />
<TouchableOpacity style={styles.dropdownItem} onPress={handleSignup} activeOpacity={0.7}>
  <Text style={styles.dropdownText}>Sign Up</Text>
</TouchableOpacity>
<View style={styles.dropdownDivider} />
<TouchableOpacity style={styles.dropdownItem} onPress={handleSupportNav} activeOpacity={0.7}>
  <Text style={styles.dropdownText}>Support</Text>
</TouchableOpacity>
```

- [ ] **Step 3: Typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test (desktop web, ≥1024px)**

Open the web app at a desktop width. Click the Settings gear icon in the sidebar to open the dropdown. Verify:
- Signed out: Log In / Sign Up / Support — Support opens `/support`.
- Signed in: My Profile (if public) / Settings / Support / Log Out — Support opens `/support`.

- [ ] **Step 5: Commit**

```bash
git add src/components/web/Sidebar.tsx
git commit -m "feat(support): add Support to desktop sidebar dropdown"
```

---

## Task 7: Shared `ProfileDropdown` + hook — add Support entry

**Files:**
- Modify: `src/components/ProfileDropdown.tsx`
- Modify: `src/hooks/useProfileDropdown.ts`
- Modify: every screen that renders `<ProfileDropdown>` (enumerated below; re-grep to confirm)

- [ ] **Step 1: Update the hook `useProfileDropdown.ts`**

Open `src/hooks/useProfileDropdown.ts`.

Add to the top imports (merge with existing `react-native` import if possible):

```ts
import { Linking } from 'react-native';
import { SUPPORT_URL } from '../constants/config';
```

Add a new field to the `UseProfileDropdownReturn` interface:

```ts
handleSupport: () => void;
```

Inside the hook body, add a callback (place it after `handleViewProfile`):

```ts
const handleSupport = useCallback(() => {
  setIsVisible(false);
  if (Platform.OS === 'web') {
    navigation.navigate('Support' as never);
  } else {
    Linking.openURL(SUPPORT_URL).catch(() => {
      // No handler available; nothing we can do. Fail silently.
    });
  }
}, [navigation]);
```

Return `handleSupport` from the hook — add it to the returned object alongside the other handlers.

- [ ] **Step 2: Update `ProfileDropdown.tsx`**

Open `src/components/ProfileDropdown.tsx`.

Add `onSupport` to the prop interface:

```ts
interface ProfileDropdownProps {
  state: ProfileDropdownState;
  isAuthenticated: boolean;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onSettings: () => void;
  onSupport: () => void;
  onViewProfile?: (() => void) | null;
}
```

Destructure it in the component signature:

```ts
export const ProfileDropdown = React.memo<ProfileDropdownProps>(function ProfileDropdown({
  state,
  isAuthenticated,
  onClose,
  onLogin,
  onLogout,
  onSettings,
  onSupport,
  onViewProfile,
}) {
```

Render the Support row in **both** branches of the `isAuthenticated ?` ternary.

**Authenticated branch** — insert a Support item between Settings and Log Out (i.e., after the divider below Settings):

```tsx
<TouchableOpacity
  style={styles.item}
  onPress={onSettings}
  activeOpacity={0.7}
  accessibilityRole="button"
  accessibilityLabel="Settings"
  accessibilityHint="Double tap to open settings"
>
  <Text style={styles.itemText}>Settings</Text>
</TouchableOpacity>
<View style={styles.divider} />
<TouchableOpacity
  style={styles.item}
  onPress={onSupport}
  activeOpacity={0.7}
  accessibilityRole="button"
  accessibilityLabel="Support"
  accessibilityHint="Double tap to contact support"
>
  <Text style={styles.itemText}>Support</Text>
</TouchableOpacity>
<View style={styles.divider} />
<TouchableOpacity
  style={styles.item}
  onPress={onLogout}
  activeOpacity={0.7}
  accessibilityRole="button"
  accessibilityLabel="Log Out"
  accessibilityHint="Double tap to log out of your account"
>
  <Text style={styles.itemTextRed}>Log Out</Text>
</TouchableOpacity>
```

**Signed-out branch** — wrap the existing Log In row and add a Support row below it:

```tsx
<TouchableOpacity
  style={styles.item}
  onPress={onLogin}
  activeOpacity={0.7}
  accessibilityRole="button"
  accessibilityLabel="Log In"
  accessibilityHint="Double tap to log in to your account"
>
  <Text style={styles.itemText}>Log In</Text>
</TouchableOpacity>
<View style={styles.divider} />
<TouchableOpacity
  style={styles.item}
  onPress={onSupport}
  activeOpacity={0.7}
  accessibilityRole="button"
  accessibilityLabel="Support"
  accessibilityHint="Double tap to contact support"
>
  <Text style={styles.itemText}>Support</Text>
</TouchableOpacity>
```

- [ ] **Step 3: Wire `onSupport` through every `<ProfileDropdown>` consumer**

Run a fresh grep to list every file that renders `<ProfileDropdown`:

```bash
rg -l '<ProfileDropdown' src
```

Known consumers (verify with the grep above — update every file the grep returns):

- `src/components/PageHeader.tsx`
- `src/screens/FeedScreen.tsx`
- `src/screens/FavoritesScreen.tsx`
- `src/screens/SongListScreen.tsx`
- `src/screens/HomeScreen.tsx`

For each file, do two edits:

1. Destructure `handleSupport` from `useProfileDropdown()`.
2. Pass `onSupport={handleSupport}` as a prop to `<ProfileDropdown ... />`.

Example diff pattern, shown using `PageHeader.tsx`:

```ts
const {
  profileButtonRef,
  avatarUrl,
  isAuthenticated,
  dropdownState,
  handleProfilePress,
  handleLogout,
  handleLogin,
  handleSettings,
  handleSupport,        // <-- added
  handleViewProfile,
  closeDropdown,
} = useProfileDropdown();
```

```tsx
<ProfileDropdown
  state={dropdownState}
  isAuthenticated={isAuthenticated}
  onClose={closeDropdown}
  onLogin={handleLogin}
  onLogout={handleLogout}
  onSettings={handleSettings}
  onSupport={handleSupport}     // <-- added
  onViewProfile={handleViewProfile}
/>
```

- [ ] **Step 4: Typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors. A missing `onSupport` prop on any remaining consumer will surface here — if so, update that consumer the same way.

- [ ] **Step 5: Manual smoke test**

**Mobile web** (browser at <768px width): open avatar dropdown on Home/Favorites/Songs/Feed — Support row is present in both auth states, tapping it routes to `/support`.

**Native (iOS/Android)** (simulator or device): open avatar dropdown on the same screens — Support row is present; tapping it opens `https://www.scarletfire.app/support` in the system browser; the dropdown closes; the app stays alive in the background.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProfileDropdown.tsx src/hooks/useProfileDropdown.ts \
  src/components/PageHeader.tsx src/screens/FeedScreen.tsx \
  src/screens/FavoritesScreen.tsx src/screens/SongListScreen.tsx \
  src/screens/HomeScreen.tsx
git commit -m "feat(support): add Support to shared avatar dropdown"
```

> If the grep returned additional consumers beyond the list above, include them in the `git add` and adjust accordingly.

---

## Task 8: End-to-end verification

- [ ] **Step 1: Desktop web, signed-out**

Start the dev server. Visit the site at a desktop width. Open the sidebar dropdown → Support. Submit with empty fields → inline field errors appear. Fill with valid values → Send. Expect: thank-you state. In the Supabase dashboard, confirm a new row in `support_requests` with `user_id = null` and your submitted `email`/`subject`/`message`.

- [ ] **Step 2: Desktop web, signed-in**

Sign in. Open the sidebar dropdown → Support. Confirm email is prefilled with the account email and is editable. Submit. Confirm a row in Supabase with `user_id` matching your auth user.

- [ ] **Step 3: Mobile web**

Resize the browser below 768px (or use device emulation). Open the avatar dropdown → Support. Submit successfully. Confirm row in Supabase.

- [ ] **Step 4: Native**

On an iOS or Android build, open the avatar dropdown → Support. Confirm the system browser launches at `https://www.scarletfire.app/support` and the app remains running.

- [ ] **Step 5: Honeypot**

In dev, temporarily add `value={'not empty'}` to the honeypot `TextInput` (or set `website` to a non-empty string via React DevTools). Submit. Expect: thank-you state appears, but no row is inserted in Supabase. Revert the change before committing anything else.

- [ ] **Step 6 (optional): Final cleanup commit**

No code changes expected at this stage. If anything was adjusted during verification, commit it as a follow-up with a descriptive message.

---

## Self-review notes

- **Spec coverage:** All spec sections map to tasks — table (T1), constant (T2), service (T3), screen (T4), route/linking (T5), desktop dropdown (T6), shared dropdown + hook + consumers (T7), verification including honeypot (T8).
- **No placeholders:** All code is written inline; theme-token fallbacks are documented as a guided substitution rather than a TBD.
- **Type consistency:** `submitSupportRequest` signature is consistent across service and screen. `handleSupport` / `onSupport` naming is consistent across hook, component, and consumers. Route name `Support` is identical in `DesktopLayout`, `webLinking.ts`, and `navigation.navigate` / `navigationRef.dispatch` calls.
