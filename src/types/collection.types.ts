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
