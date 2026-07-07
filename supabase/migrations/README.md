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
