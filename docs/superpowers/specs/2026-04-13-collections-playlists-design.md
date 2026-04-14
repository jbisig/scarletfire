# Collections & Playlists — Design Spec

**Date:** 2026-04-13
**Status:** Approved, pending implementation plan

## Overview

Add a "Collections" feature that allows users to organize shows and songs into named groups:

- **Show collections** — user-named folders of full Grateful Dead shows (e.g. "Best '77 Shows")
- **Playlists** — user-named folders of individual song tracks (e.g. "Best Dark Stars")

Collections are created, managed, and viewed from a new third tab on the Favorites screen. They are shareable via URL and surface on the user's public profile.

## Goals

- Let users group and name shows/tracks for personal organization.
- Provide a consistent UX for adding items to collections from both show detail screens and song contexts.
- Enable sharing collections via a URL that works universally (independent of profile visibility).
- Expose public collections on the owner's public profile.

## Non-goals (v1)

- Collaborative / multi-user collections.
- Per-collection visibility toggles (visibility is URL-based, see Sharing section).
- Importing/exporting collections.
- Nested collections / folders.
- Bulk actions on collections (bulk share, bulk delete).
- Sort/search within the Collections tab itself (collections list is sorted by most recently updated).

## Data Model

### `collections` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | default `gen_random_uuid()` |
| `user_id` | `uuid` (FK → `auth.users`) | owner |
| `name` | `text` | user-chosen name |
| `type` | `text` | `'show_collection'` or `'playlist'` (check constraint) |
| `description` | `text`, nullable | optional |
| `cover_image_url` | `text`, nullable | optional custom cover |
| `slug` | `text` | URL-safe, unique per user |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, updated via trigger |

- Unique constraint: `(user_id, slug)`.
- Index: `(user_id, updated_at desc)` for listing.

### `collection_items` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | default `gen_random_uuid()` |
| `collection_id` | `uuid` (FK → `collections`, `ON DELETE CASCADE`) | |
| `item_identifier` | `text` | show `primaryIdentifier` for show collections; `{identifier}::{filename}` for playlist tracks |
| `item_metadata` | `jsonb` | denormalized display data (title, date, venue, stream URL, etc.) |
| `position` | `integer` | ordering within the collection |
| `added_at` | `timestamptz` | default `now()` |

- Unique constraint: `(collection_id, item_identifier)` (prevents duplicates).
- Index: `(collection_id, position)` for ordered fetch.

### RLS policies

- **Owner:** full CRUD on their own `collections` and `collection_items`.
- **Public read by link:** anyone can `SELECT` a collection (and its items) when querying by `(username, slug)`. This is independent of the owner's `profiles.is_public` flag — collection links are universally viewable.
- **Public profile listing:** `SELECT` on a user's collections listing is gated by the owner's `profiles.is_public = true`. Private profiles do not expose their collection list.

### TypeScript types

```ts
type CollectionType = 'show_collection' | 'playlist';

interface Collection {
  id: string;
  userId: string;
  name: string;
  type: CollectionType;
  description?: string;
  coverImageUrl?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number; // derived
}

interface ShowCollectionItemMetadata {
  title: string;
  date: string;
  venue?: string;
  location?: string;
  primaryIdentifier: string;
}

interface PlaylistItemMetadata {
  trackId: string;
  trackTitle: string;
  showIdentifier: string;
  showDate: string;
  venue?: string;
  streamUrl: string;
}

interface CollectionItem {
  id: string;
  collectionId: string;
  itemIdentifier: string;
  itemMetadata: ShowCollectionItemMetadata | PlaylistItemMetadata;
  position: number;
  addedAt: string;
}
```

## Service Layer

### `collectionsService.ts`

Supabase CRUD:

- `fetchCollections(userId)` — all collections for a user, sorted by `updated_at desc`.
- `createCollection({ name, type, description? })` — generates slug from name; on collision for that user, append `-2`, `-3`, etc.
- `updateCollection(id, { name?, description?, coverImageUrl? })` — also regenerates slug when name changes (with collision suffix).
- `deleteCollection(id)` — cascade deletes items.
- `fetchCollectionItems(collectionId)` — ordered by `position`.
- `addItemToCollection(collectionId, item)` — inserts with next position value; no-op if duplicate.
- `removeItemFromCollection(collectionId, itemIdentifier)` — removes; positions do not need to be recompacted immediately (gaps are fine; reorder normalizes).
- `reorderCollectionItems(collectionId, orderedItemIds[])` — batch update `position` values.
- `fetchPublicCollections(username)` — used on public profile; gated by `is_public`.
- `fetchPublicCollectionByLink(username, slug)` — used for direct link viewing; not gated by `is_public`.

### `CollectionsContext.tsx`

React context wrapping the service:

- State: `collections: Collection[]`, `loading`, `error`.
- Exposes all service methods + `refreshCollections()`.
- Fetches on mount when authenticated; no local caching (Supabase-only, per architecture decision).

### Slug generation

Lowercase the name, replace spaces with hyphens, strip special characters. On user-scoped collision append numeric suffix. Slugs are URL path segments and re-generate on rename.

## UI

### Favorites Screen — Collections tab

- `FavoritesScreen` gains a third tab: **Shows / Songs / Collections**.
- Collections tab content:
  - Two section headers: **Show Collections** and **Playlists**.
  - Each section renders a list of collection cards: name, item count, and a thumbnail derived from the first item's metadata (or a placeholder for empty collections).
  - "New Collection" button at the top.
  - Empty state when no collections exist.
- Sort order: most recently updated first. No search/filter in v1.
- **Collection card tap:** navigate to `CollectionDetailScreen`.
- **Collection card long-press:** action menu (Rename, Delete, Share).

### Creation modal

- Text input for **Name** (required).
- Selector for **Type** (Show Collection / Playlist).
- Optional **Description** field.
- **Create** button → calls `createCollection`, closes modal, navigates into new collection if invoked from the Collections tab (stays put if invoked from an "Add to Collection" flow after auto-adding the item).

### Collection Detail screen — `CollectionDetailScreen.tsx`

Route: `CollectionDetail`, params `{ collectionId: string }` (or `{ username: string, slug: string }` for public links).

**Header:**
- Collection name (tappable to rename for owner).
- Item count + collection type label.
- Description, if present.
- For public views: "by @username" attribution.
- Share button; overflow menu with Edit / Delete (owner only).

**Show collection body:**
- List of shows styled like the Favorites Shows tab.
- Sort options: date added, performance date, alphabetical.
- Tap → `ShowDetail` as usual.

**Playlist body:**
- List of tracks styled like the Favorites Songs tab.
- Drag-to-reorder handles (owner only).
- Tapping a track loads the playlist as the current playback queue and starts playing from the tapped track (sequential playback through the playlist).
- Shuffle button at the top.

**Editing (owner):**
- Swipe-to-delete on rows, or long-press for remove.
- Rename via header tap.
- Delete collection via overflow menu (confirmation dialog).

**Read-only mode:**
- Triggered for public link views (non-owner).
- Hides rename, delete, add, reorder handles, swipe-to-delete.
- Retains playback and Share actions.

**Empty state:** Message with CTA to browse shows/songs.

### Adding items to collections

Entry points:

- **Show detail screen:** "Add to Collection" icon/button alongside the existing favorite heart.
- **Song contexts (Favorites songs tab rows, now-playing, full player overflow):** "Add to Playlist" action (long-press menu on song rows; explicit action in now-playing/full-player).

**Picker modal:**
- Filtered to the correct type (show collections for shows; playlists for tracks).
- Lists the user's collections of that type with a checkmark next to any collection that already contains this item.
- Tapping a collection toggles the item in/out.
- "New Collection" / "New Playlist" option at the bottom opens the creation modal inline; on create, the item is auto-added and the picker stays open (or closes with a toast confirming the add).

### Public Profile Collections tab

- `PublicProfileScreen` gains a third tab: **Shows / Songs / Collections**.
- Same two-section layout as the owner view (Show Collections / Playlists).
- Read-only collection cards; no create/edit/delete affordances.
- Tap → public `CollectionDetailScreen` in read-only mode.
- Only shown when the profile is public. Private profiles hide this tab.

### URL structure

- `/profile/{username}/collection/{slug}` — public collection detail (works universally, regardless of profile visibility).
- Deep links route into `CollectionDetailScreen` in read-only mode with owner context.

## Sharing

Hooks into existing `ShareSheetContext` / `shareService`.

**New `ShareItem` kind:**

```ts
{
  kind: 'collection',
  collectionId: string,
  ownerUsername: string,
  slug: string,
  name: string,
  type: CollectionType,
  itemCount: number,
}
```

**`shareService` additions:**

- `buildShareUrl` for `kind === 'collection'` → `/profile/{username}/collection/{slug}`.
- `buildShareText` formats per type:
  - Show collection: `"{name} — {itemCount} shows by {displayName}"`
  - Playlist: `"{name} — {itemCount} tracks by {displayName}"`

**Share entry points:**

- Collection Detail screen (owner and public view): share button in header.
- Collection cards: long-press → Share.
- No bulk share on the Collections tab.

**Visibility and sharing:**

- Share button is always available on the owner's view. Users can share links to their own collections at any time.
- Collection links are universally viewable — anyone with the URL can open the collection. The RLS policy for `fetchPublicCollectionByLink` does not check `profiles.is_public`.
- Profile visibility only controls whether collections appear in the public profile *listing* (the Collections tab on `PublicProfileScreen`).

Note on slugs: since link knowledge grants access, slugs are name-derived (not a security boundary). This matches the "unlisted link" mental model (YouTube unlisted, Spotify playlist).

## Navigation

- New screen: `CollectionDetail` in the app navigator (web + native).
- Web linking config gains a route: `profile/:username/collection/:slug` → `CollectionDetail` with read-only props.
- Bottom tabs are unchanged; Collections lives inside the Favorites tab.

## Error handling

- All service calls surface errors via the context's `error` state.
- Mutations use optimistic updates where safe (add/remove item, rename) with rollback on failure.
- Slug collision on create/rename is handled silently by appending a numeric suffix.
- Deleting a collection prompts for confirmation.
- Public link to a nonexistent collection renders a "Collection not found" empty state in `CollectionDetailScreen`.

## Testing

Focus areas:

- `collectionsService` CRUD operations against Supabase (integration tests where infra exists, unit tests with mocked client otherwise).
- Slug generation and collision behavior.
- RLS policies: owner CRUD, public-by-link read, public-listing gated by `is_public`.
- Add/remove/reorder flows in `CollectionDetailScreen`.
- Playlist sequential playback wiring (tapping a track starts the playlist queue).
- Public read-only mode hides all editing affordances.
- Share URL generation and handling of the new `kind: 'collection'` share item.

## Open questions / follow-ups

None outstanding — all resolved during brainstorming:

- Storage: Supabase-only (A).
- Two distinct types: show collection vs. playlist.
- Creation from both Collections tab and item contexts.
- Public via URL, listed on public profile when `is_public`.
- Public profile gets a Collections tab.
- Manual ordering for playlists (drag-to-reorder); sort options for show collections.
- Share links are universally viewable (independent of profile visibility).
