import type {
  Collection,
  LibraryCollectionEntry,
  SavedCollection,
} from '../types/collection.types';

export function duplicateCollectionName(name: string): string {
  return `${name.trimEnd()} (Copy)`;
}

export function mergeLibraryEntries(
  owned: Collection[],
  saved: SavedCollection[],
  liveCollectionsById: Map<string, Collection>,
): LibraryCollectionEntry[] {
  const entries: LibraryCollectionEntry[] = [];

  for (const c of owned) {
    entries.push({ kind: 'owned', collection: c, sortKey: c.updatedAt });
  }

  for (const s of saved) {
    if (s.collectionId === null) {
      entries.push({
        kind: 'tombstone',
        savedId: s.id,
        name: s.lastKnownName,
        type: s.lastKnownType,
        ownerUsername: s.lastKnownOwnerUsername,
        savedAt: s.savedAt,
        sortKey: s.savedAt,
      });
      continue;
    }
    const live = liveCollectionsById.get(s.collectionId);
    if (!live) continue; // hidden or missing — skip silently
    entries.push({
      kind: 'saved',
      collection: live,
      ownerUsername: s.lastKnownOwnerUsername,
      savedAt: s.savedAt,
      sortKey: s.savedAt,
    });
  }

  entries.sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));
  return entries;
}
