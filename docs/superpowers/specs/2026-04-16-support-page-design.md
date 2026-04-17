# Support Page Design

**Date:** 2026-04-16
**Branch:** `feat/playlist-reorder` (to be rebased onto `main` or developed on a fresh branch)

## Goal

Add a simple, form-based support page to the web app so users can send support requests. On native, the avatar dropdown opens the web support URL in a browser.

## User stories

- As a signed-out visitor on desktop or mobile web, I can open the avatar dropdown, tap "Support", fill out a form (email, subject, message), and submit it.
- As a signed-in user on any platform, the email field is prefilled with my account email.
- As a native iOS/Android user, tapping "Support" in the avatar dropdown opens the web support page in my default browser.
- As the app owner, submitted requests land in a Supabase table I can read from the dashboard.

## Architecture

### Components and files

**New**

- `src/screens/SupportScreen.tsx` — the form UI. Used on desktop web and mobile web; not registered on native.
- `src/services/supportService.ts` — exports `submitSupportRequest({ email, subject, message })` that inserts one row into the `support_requests` table via the existing Supabase client.
- Supabase migration — creates the `support_requests` table and RLS policy.

**Edited**

- `src/constants/config.ts` — add `SUPPORT_URL = 'https://www.scarletfire.app/support'`.
- `src/navigation/DesktopLayout.tsx` — register `Support` on the Stack.
- `src/navigation/webLinking.ts` — add `Support: 'support'` to both `desktopWebLinking` and `mobileWebLinking` (top-level in each, same structural slot as `Settings`).
- `src/components/web/Sidebar.tsx` — add "Support" row to the inline dropdown in both auth states. Tap → `navigation.navigate('Support')`.
- `src/components/ProfileDropdown.tsx` — add `onSupport` prop and a "Support" row in both auth states.
- `src/hooks/useProfileDropdown.ts` — add `handleSupport`: on web, `navigation.navigate('Support')`; on native, `Linking.openURL(SUPPORT_URL)`. Closes the dropdown in both cases. Return it from the hook.
- Consumers of `useProfileDropdown` that render `ProfileDropdown` — wire `handleSupport` through the new `onSupport` prop. The implementation plan will grep for `<ProfileDropdown` across `src/` and update every consumer; based on a quick grep the relevant screens include `HomeScreen`, `FavoritesScreen`, `SongListScreen`, `SongPerformancesScreen`, `ShowDetailScreen`, `PublicProfileScreen`, `FollowListScreen`, `CollectionDetailScreen`, `FeedScreen`. The plan must re-grep to avoid missing any.

### Data flow

1. User taps avatar → dropdown opens.
2. User taps "Support":
   - Web: `navigation.navigate('Support')` → `SupportScreen` mounts.
   - Native: `Linking.openURL('https://www.scarletfire.app/support')` — dropdown closes, app remains in foreground; system hands off to the browser.
3. In `SupportScreen`, user fills the form and taps Submit.
4. `submitSupportRequest` inserts a row into `support_requests`. `user_id` is attached when the caller is authenticated; otherwise it's `null`.
5. On success, the form is replaced with a thank-you block that offers a "Send another" action to reset the form.
6. On error, an inline banner appears above the Submit button with a retry-friendly message; form values are preserved.

### Supabase table

```sql
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null
);

alter table public.support_requests enable row level security;

create policy "anyone can insert support requests"
  on public.support_requests
  for insert
  to anon, authenticated
  with check (true);
```

No `select`, `update`, or `delete` policies — the owner reads from the Supabase dashboard.

### Form behavior

Fields:

- **Email** — required; validated with a basic regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Prefilled from `authState.user.email` when logged in, editable.
- **Subject** — required; single-line; max 200 chars.
- **Message** — required; multiline, 8 rows tall; max 5000 chars.
- **Website** (honeypot) — hidden via CSS (`display: none`). The form is only ever rendered on web, so native styling isn't a concern. If non-empty at submit time, the handler short-circuits, shows the success state, and does not insert.

Submission:

- Submit button is disabled while in flight and shows a spinner label ("Sending…").
- On success: render a thank-you block: "Thanks — we'll get back to you as soon as we can." with a "Send another" link that resets form state.
- On insert error: show an inline red error banner ("Something went wrong. Please try again.") above the Submit button. Values are preserved.

### Styling

- Dark theme using existing tokens from `src/constants/theme.ts` (`COLORS`, `SPACING`, `TYPOGRAPHY`, `RADIUS`).
- Content max width ~640px, centered in the content area. Visual language mirrors `SettingsScreen`.
- Page title "Support" rendered in-page (no nav header — `headerShown: false` matches the other screens in `DesktopLayout`).

## Non-goals / out of scope

- Email notifications to a support inbox. The owner checks the Supabase dashboard manually.
- Rate limiting beyond the honeypot. If spam becomes a problem, revisit.
- A dedicated native in-app support screen. Native uses `Linking.openURL`.
- File uploads / screenshots.
- Ticket status tracking or replies from within the app.

## Open questions

None — URL is hardcoded as `https://www.scarletfire.app/support` per user decision.

## Testing

- **Manual, desktop web** (≥1024px): signed-out → dropdown → Support → submit fails validation on empty fields → fill → submit → success state → "Send another" resets.
- **Manual, desktop web, signed-in**: email field is prefilled with `authState.user.email` and editable.
- **Manual, mobile web** (<768px): same flow via `ProfileDropdown`.
- **Manual, native (iOS sim or device)**: dropdown → Support → browser opens at `https://www.scarletfire.app/support`; dropdown closes; app remains in foreground.
- **Supabase**: verify a row appears in `support_requests` after a successful submit; verify the honeypot path does NOT produce a row but still shows success; verify `user_id` is populated for signed-in submits and null otherwise.
- No unit tests planned — the component is thin and the service is a one-line insert.
