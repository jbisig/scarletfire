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
