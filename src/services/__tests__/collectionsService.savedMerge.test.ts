import { mergeLibraryEntries } from '../../utils/collectionsLibrary';
import type { Collection, SavedCollection } from '../../types/collection.types';

function owned(overrides: Partial<Collection> = {}): Collection {
  return {
    id: overrides.id ?? 'o1',
    userId: 'me',
    name: overrides.name ?? 'Owned',
    type: overrides.type ?? 'show_collection',
    slug: overrides.slug ?? 'owned',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-04-10T00:00:00Z',
    ...overrides,
  } as Collection;
}

function savedRow(overrides: Partial<SavedCollection> = {}): SavedCollection {
  return {
    id: overrides.id ?? 's1',
    userId: 'me',
    collectionId: overrides.collectionId ?? 'c1',
    lastKnownName: overrides.lastKnownName ?? 'Saved',
    lastKnownType: overrides.lastKnownType ?? 'show_collection',
    lastKnownOwnerUsername: overrides.lastKnownOwnerUsername ?? 'alice',
    savedAt: overrides.savedAt ?? '2026-04-12T00:00:00Z',
    ...overrides,
  };
}

describe('mergeLibraryEntries', () => {
  it('returns owned entries sorted by updatedAt desc', () => {
    const a = owned({ id: 'a', updatedAt: '2026-04-05T00:00:00Z' });
    const b = owned({ id: 'b', updatedAt: '2026-04-10T00:00:00Z' });
    const result = mergeLibraryEntries([a, b], [], new Map());
    expect(result.map((e) => e.kind === 'owned' && e.collection.id)).toEqual(['b', 'a']);
  });

  it('interleaves saved entries using savedAt as sort key', () => {
    const own = owned({ id: 'o', updatedAt: '2026-04-11T00:00:00Z' });
    const saved = savedRow({ collectionId: 'c1', savedAt: '2026-04-12T00:00:00Z' });
    const liveCollections = new Map<string, Collection>([
      ['c1', owned({ id: 'c1', name: 'Live Saved', userId: 'alice', updatedAt: '2026-04-09T00:00:00Z' })],
    ]);
    const result = mergeLibraryEntries([own], [saved], liveCollections);
    expect(result[0].kind).toBe('saved');
    expect(result[1].kind).toBe('owned');
  });

  it('emits a tombstone entry when collectionId is null', () => {
    const tomb = savedRow({ collectionId: null, lastKnownName: 'Gone', savedAt: '2026-04-13T00:00:00Z' });
    const result = mergeLibraryEntries([], [tomb], new Map());
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      kind: 'tombstone',
      name: 'Gone',
      ownerUsername: 'alice',
    });
  });

  it('drops saved entries whose live collection is missing from the live map', () => {
    // e.g. RLS hid the row or a stale cache. We skip rather than tombstone —
    // the tombstone flag is driven exclusively by collectionId === null.
    const saved = savedRow({ collectionId: 'missing' });
    const result = mergeLibraryEntries([], [saved], new Map());
    expect(result).toEqual([]);
  });
});
