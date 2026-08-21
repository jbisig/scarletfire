export type CollectionType = 'show_collection' | 'playlist';

export interface Collection {
  id: string;
  userId: string;
  name: string;
  type: CollectionType;
  description?: string;
  coverImageUrl?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Whether the collection is readable by anyone with the share link (anon
   * key included). Defaults false for new collections; flips to true the
   * first time the owner shares it (see collectionsService.markCollectionShared).
   * Backed by the `collections.is_shared` column — existing rows were
   * grandfathered to true when the column was introduced.
   */
  isShared: boolean;
  /**
   * Whether the collection is discoverable: listed on the owner's public
   * profile, eligible for Popular Collections, and announced to followers in
   * the activity feed. Independent of `isShared` — a Private collection that
   * has been shared is unlisted: the link still opens it, nobody else finds
   * it. Going Public also sets `isShared` so the link works. Backed by
   * `collections.is_public`; existing rows were backfilled from `is_shared`.
   */
  isPublic: boolean;
  itemCount?: number;
  saveCount?: number;
}

export interface ShowCollectionItemMetadata {
  title: string;
  date: string;
  venue?: string;
  location?: string;
  primaryIdentifier: string;
}

export interface PlaylistItemMetadata {
  trackId: string;
  trackTitle: string;
  showIdentifier: string;
  showDate: string;
  venue?: string;
  streamUrl: string;
}

export type CollectionItemMetadata =
  | ShowCollectionItemMetadata
  | PlaylistItemMetadata;

export interface CollectionItem {
  id: string;
  collectionId: string;
  itemIdentifier: string;
  itemMetadata: CollectionItemMetadata;
  position: number;
  addedAt: string;
}

export interface SavedCollection {
  id: string;
  userId: string;
  /** null when the source collection has been deleted (tombstone). */
  collectionId: string | null;
  lastKnownName: string;
  lastKnownType: CollectionType;
  lastKnownOwnerUsername: string;
  savedAt: string;
}

/**
 * Unified entry used by the Collections tab to render the user's library,
 * which is a merge of owned collections, saved (live) collections, and
 * tombstones for saved collections whose source has been deleted.
 */
export type LibraryCollectionEntry =
  | { kind: 'owned'; collection: Collection; sortKey: string }
  | {
      kind: 'saved';
      collection: Collection;
      ownerUsername: string;
      savedAt: string;
      sortKey: string;
    }
  | {
      kind: 'tombstone';
      savedId: string;
      name: string;
      type: CollectionType;
      ownerUsername: string;
      savedAt: string;
      sortKey: string;
    };
