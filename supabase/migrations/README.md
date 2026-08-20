# Migrations

## Apply order

Apply files in filename (timestamp) order. The only hard dependency between
them is:

- `20260706120500_popular_collections_is_shared.sql` requires
  `20260706120000_collections_sharing_flag.sql` to already be applied (it
  adds a `c.is_shared = true` gate that references the `is_shared` column
  the earlier migration creates). Applying 120500 before 120000 is a no-op
  error.

All other migrations in this batch are independent of each other, but
filename order is still the recommended apply order since that's the order
they were reviewed in.

## Pre-apply checklist

- **`20260706120100_support_requests_limits.sql`** adds CHECK constraints on
  `support_requests.message` (<=5000 chars), `.subject` (<=200 chars), and
  `.email` (<=320 chars, must contain `@` with at least one character before
  it). Adding a CHECK constraint validates every existing row by default (this
  migration does not use `NOT VALID`). **Before applying**, audit existing
  `support_requests` rows against these limits:

  ```sql
  select id, char_length(message), char_length(subject), char_length(email)
  from public.support_requests
  where char_length(message) > 5000
     or char_length(subject) > 200
     or char_length(email) > 320
     or position('@' in email) <= 1;
  ```

  If any rows violate the limits, the migration will fail to apply until
  those rows are cleaned up (or the migration is changed to use `NOT VALID`
  plus a follow-up `VALIDATE CONSTRAINT`).

- **`20260706120200_avatar_bucket_storage_policies.sql`** creates
  INSERT/UPDATE/DELETE/SELECT policies on `storage.objects` scoped to the
  `avatars` bucket. The bucket may already have equivalent policies created
  by hand via the Supabase Studio UI (Storage > Policies), possibly under
  different names. Applying this migration on top of dashboard-authored
  policies won't conflict (Postgres ORs together all matching permissive
  policies), but it will leave duplicate policies doing the same job.
  **Before applying**, reconcile with the dashboard:

  ```sql
  select policyname, cmd, qual, with_check
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects';
  ```

  Drop or reconcile any existing avatars-scoped policies so there's exactly
  one INSERT/UPDATE/DELETE/SELECT policy per bucket after this migration
  lands.

## Old-binary compatibility windows

- **`is_shared` (collections sharing, 120000/120500):** binaries that predate
  the client change (`collectionsService.markCollectionShared`,
  `CollectionDetailScreen.handleShare`) never call the RPC/update that sets
  `is_shared = true`. Collections shared from an old binary stay private
  (not selectable via the `is_shared = true` policies, and excluded from
  `get_popular_collections`) until the owner re-shares from an updated app
  version. This is a UX gap, not a security one — nothing leaks, a
  previously-working share link just goes quiet until the owner updates and
  re-shares.

- **`get_activity_feed` / `search_profiles` (120300/120400):** these
  migrations drop the old `viewer_id`-accepting signatures and add them back
  as thin transition shims (SECURITY INVOKER wrappers that ignore the
  supplied `viewer_id` and delegate to the new `auth.uid()`-based function),
  so already-shipped native binaries that still call the old signatures
  keep working. The shims are intended to be dropped in a future migration
  once old binaries have aged out of the install base — don't remove them
  opportunistically without confirming client-side telemetry shows the old
  call sites are gone.

## Known residual gap

`support_requests` gets size caps in 120100 but **no rate or volume
limiting** — an anon-key holder can still submit an unbounded number of
appropriately-sized requests. This is out of scope for this migration batch.
Recommended follow-up: Supabase project-level rate limits, or move the
insert path behind an edge function that can apply its own throttling.

## Rule

**Never edit a migration file after it has been applied anywhere** — create
a new migration instead. Every file in this directory currently carries a
header comment confirming it has not yet been applied to any database; once
that stops being true for a given file, treat it as immutable.

## Apply log

**2026-07-06 — applied to production project `fftvyuykqbixzupxzlmo` ("Grateful
Dead Player")** via `supabase db query --linked -f <file>`, in filename order:

| Migration | Result |
|---|---|
| 120000 collections_sharing_flag | ✅ Applied. 16/16 existing collections grandfathered `is_shared = true`; public SELECT now gated; `updated_at` watermark verified unchanged (trigger guard worked). |
| 120100 support_requests_limits | ✅ Applied. Pre-audit: 0 of 2 existing rows violated the new limits. All 3 CHECK constraints verified present. |
| 120200 avatar_bucket_storage_policies | ⏭️ **Intentionally NOT applied.** Dashboard already had four equivalent folder-scoped policies (see the file's STATUS header). File retained as documentation. |
| 120300 get_activity_feed_auth_uid | ✅ Applied. New 2-arg function + old-signature transition shim both verified resolving and executing. |
| 120400 search_profiles_auth_uid | ✅ Applied. New 3-arg function + old-signature transition shim both verified. |
| 120500 popular_collections_is_shared | ✅ Applied. `is_shared = true` filter confirmed in function body; smoke query returned shared collections only. |

Post-apply: `supabase db advisors` reports no findings caused by this batch
(the collections multiple-permissive-SELECT lint is the intended owner+public
OR design; the support_requests INSERT advisor is the documented residual gap;
all other findings pre-date these migrations).

**2026-07-30 — applied to production project `fftvyuykqbixzupxzlmo`** via
`supabase db push --linked` (custom ratings feature):

| Migration | Result |
|---|---|
| 20260729120000 user_ratings_table | ✅ Applied. Table shape (user_id/shows/performances/updated_at), RLS enabled, all 4 per-user policies, both `octet_length` size constraints, PK + FK-cascade verified post-apply. `supabase db advisors`: no findings on `user_ratings`. |

Migration-history note: the 2026-07-06 batch was applied with `db query -f`,
which records nothing in `supabase_migrations.schema_migrations`. Before this
push, all seven 2026-07-06 files were marked applied via
`supabase migration repair --status applied <versions>` — including 120200,
which remains **not executed** at the SQL level (see its entry above) but is
marked applied in history so `db push` never replays it. From here on, plain
`supabase db push` is the apply path; history and reality are in sync.

The transition shims (old `get_activity_feed`/`search_profiles` signatures)
should be dropped in a future migration once pre-2026-07 native binaries have
aged out.

**2026-07-06 (merge of punch-list → main)** — `20260706130000_feed_streams_search_avatar_auth_uid.sql` applied to production. Fuses main's PR #8 feed/search rework (per-stream cursors, actor denorm, avatar_url — whose function SQL had never been applied) with the auth.uid() hardening. Drops the short-lived 2-arg `get_activity_feed`; recreates both legacy shims with widened (superset) return shapes. Verified: all four function paths execute; PR #8's other SQL (dedupe index, self-follow check, activity_events RLS) confirmed already present in production.

**Pending — not yet applied:** `20260820120000_user_preferences_table` (source preference engine). Apply with `supabase db push --linked` from the personal Supabase account (see the 2026-07 note about the wrong-org login), then verify: table shape (user_id/prefs/pins/updated_at), RLS enabled, four per-user policies using `(select auth.uid())`, both size constraints, FK cascade. Until applied, the app syncs nothing for this feature (the cloud service's upsert will fail and surface the "saved locally" toast once per 30 s while signed in).
