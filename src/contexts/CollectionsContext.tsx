import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { collectionsService } from '../services/collectionsService';
import {
  Collection,
  CollectionItem,
  CollectionItemMetadata,
  CollectionType,
  LibraryCollectionEntry,
  SavedCollection,
} from '../types/collection.types';
import { logger } from '../utils/logger';
import { mergeLibraryEntries } from '../utils/collectionsLibrary';

interface CollectionsContextValue {
  collections: Collection[];
  savedCollections: SavedCollection[];
  liveSavedCollectionsById: Map<string, Collection>;
  libraryEntries: LibraryCollectionEntry[];
  /** How many of the user's collections contain a given item_identifier. */
  itemCountsByIdentifier: Record<string, number>;
  loading: boolean;
  error: string | null;
  refreshCollections: () => Promise<void>;
  createCollection: (input: {
    name: string;
    type: CollectionType;
    description?: string;
  }) => Promise<Collection>;
  renameCollection: (id: string, name: string) => Promise<void>;
  updateCollectionDescription: (id: string, description: string | null) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  fetchItems: (collectionId: string) => Promise<CollectionItem[]>;
  addItem: (
    collectionId: string,
    itemIdentifier: string,
    itemMetadata: CollectionItemMetadata,
  ) => Promise<void>;
  removeItem: (collectionId: string, itemIdentifier: string) => Promise<void>;
  reorderItems: (collectionId: string, orderedItemIds: string[]) => Promise<void>;
  saveCollection: (collectionId: string) => Promise<void>;
  unsaveCollection: (collectionId: string) => Promise<void>;
  isCollectionSaved: (collectionId: string) => boolean;
  removeTombstone: (savedId: string) => Promise<void>;
  duplicateCollection: (sourceCollectionId: string) => Promise<Collection>;
}

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const user = state.user;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);
  const [liveSavedCollectionsById, setLiveSavedCollectionsById] = useState<
    Map<string, Collection>
  >(new Map());
  const [itemCountsByIdentifier, setItemCountsByIdentifier] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // collectionIds flipped to "saved" optimistically while the server request
  // is in flight, so the Save pill toggles instantly.
  const [optimisticSavedIds, setOptimisticSavedIds] = useState<Set<string>>(new Set());

  const refreshCollections = useCallback(async () => {
    if (!user) {
      setCollections([]);
      setSavedCollections([]);
      setLiveSavedCollectionsById(new Map());
      setItemCountsByIdentifier({});
      return;
    }
    setLoading(true);
    try {
      const [data, counts, savedResult] = await Promise.all([
        collectionsService.fetchCollections(user.id),
        collectionsService.fetchItemCountsByIdentifier(user.id),
        collectionsService.fetchSavedCollections(user.id),
      ]);
      setCollections(data);
      setItemCountsByIdentifier(counts);
      setSavedCollections(savedResult.saved);
      setLiveSavedCollectionsById(savedResult.liveCollections);
      setError(null);
    } catch (e) {
      logger.api.error('refreshCollections failed', e);
      setError(e instanceof Error ? e.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCollections();
  }, [refreshCollections]);

  const createCollection: CollectionsContextValue['createCollection'] = useCallback(
    async ({ name, type, description }) => {
      if (!user) throw new Error('Must be signed in to create a collection');
      const created = await collectionsService.createCollection({
        userId: user.id,
        name,
        type,
        description,
      });
      setCollections((prev) => [created, ...prev]);
      return created;
    },
    [user],
  );

  const renameCollection: CollectionsContextValue['renameCollection'] = useCallback(
    async (id, name) => {
      if (!user) throw new Error('Must be signed in');
      const updated = await collectionsService.updateCollection(id, user.id, { name });
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    },
    [user],
  );

  const updateCollectionDescription: CollectionsContextValue['updateCollectionDescription'] =
    useCallback(
      async (id, description) => {
        if (!user) throw new Error('Must be signed in');
        const updated = await collectionsService.updateCollection(id, user.id, {
          description,
        });
        setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      },
      [user],
    );

  const deleteCollection: CollectionsContextValue['deleteCollection'] = useCallback(
    async (id) => {
      await collectionsService.deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
    },
    [],
  );

  const fetchItems: CollectionsContextValue['fetchItems'] = useCallback(
    (collectionId) => collectionsService.fetchCollectionItems(collectionId),
    [],
  );

  const addItem: CollectionsContextValue['addItem'] = useCallback(
    async (collectionId, itemIdentifier, itemMetadata) => {
      // addItemToCollection returns null on duplicate (unique violation) — don't
      // inflate the count in that case.
      const added = await collectionsService.addItemToCollection(
        collectionId,
        itemIdentifier,
        itemMetadata,
      );
      if (!added) return;
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                itemCount: (c.itemCount ?? 0) + 1,
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
      setItemCountsByIdentifier((prev) => ({
        ...prev,
        [itemIdentifier]: (prev[itemIdentifier] ?? 0) + 1,
      }));
    },
    [],
  );

  const removeItem: CollectionsContextValue['removeItem'] = useCallback(
    async (collectionId, itemIdentifier) => {
      await collectionsService.removeItemFromCollection(collectionId, itemIdentifier);
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, itemCount: Math.max(0, (c.itemCount ?? 0) - 1) }
            : c,
        ),
      );
      setItemCountsByIdentifier((prev) => {
        const current = prev[itemIdentifier] ?? 0;
        const next = Math.max(0, current - 1);
        const copy = { ...prev };
        if (next === 0) delete copy[itemIdentifier];
        else copy[itemIdentifier] = next;
        return copy;
      });
    },
    [],
  );

  const reorderItems: CollectionsContextValue['reorderItems'] = useCallback(
    async (collectionId, orderedItemIds) => {
      await collectionsService.reorderCollectionItems(collectionId, orderedItemIds);
    },
    [],
  );

  const saveCollection: CollectionsContextValue['saveCollection'] = useCallback(
    async (collectionId) => {
      if (!user) throw new Error('Must be signed in to save a collection');
      setOptimisticSavedIds((prev) => {
        const next = new Set(prev);
        next.add(collectionId);
        return next;
      });
      try {
        const saved = await collectionsService.saveCollection({ userId: user.id, collectionId });
        if (!saved) return; // owner of the collection — no-op
        await refreshCollections();
      } catch (e) {
        setOptimisticSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
        throw e;
      } finally {
        // After refresh hydrates savedCollections (or after owner no-op), drop
        // the optimistic flag so the Set doesn't accumulate stale entries.
        setOptimisticSavedIds((prev) => {
          if (!prev.has(collectionId)) return prev;
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      }
    },
    [user, refreshCollections],
  );

  const unsaveCollection: CollectionsContextValue['unsaveCollection'] = useCallback(
    async (collectionId) => {
      if (!user) throw new Error('Must be signed in');
      await collectionsService.unsaveCollection(user.id, collectionId);
      setSavedCollections((prev) => prev.filter((s) => s.collectionId !== collectionId));
      setLiveSavedCollectionsById((prev) => {
        const next = new Map(prev);
        next.delete(collectionId);
        return next;
      });
    },
    [user],
  );

  const isCollectionSaved: CollectionsContextValue['isCollectionSaved'] = useCallback(
    (collectionId) =>
      optimisticSavedIds.has(collectionId) ||
      savedCollections.some((s) => s.collectionId === collectionId),
    [savedCollections, optimisticSavedIds],
  );

  const removeTombstone: CollectionsContextValue['removeTombstone'] = useCallback(
    async (savedId) => {
      if (!user) throw new Error('Must be signed in');
      await collectionsService.deleteSavedCollection(user.id, savedId);
      setSavedCollections((prev) => prev.filter((s) => s.id !== savedId));
    },
    [user],
  );

  const duplicateCollection: CollectionsContextValue['duplicateCollection'] = useCallback(
    async (sourceCollectionId) => {
      if (!user) throw new Error('Must be signed in to duplicate');
      const created = await collectionsService.duplicateCollection({
        userId: user.id,
        sourceCollectionId,
      });
      setCollections((prev) => [created, ...prev]);
      return created;
    },
    [user],
  );

  const libraryEntries = useMemo(
    () => mergeLibraryEntries(collections, savedCollections, liveSavedCollectionsById),
    [collections, savedCollections, liveSavedCollectionsById],
  );

  const value = useMemo<CollectionsContextValue>(
    () => ({
      collections,
      savedCollections,
      liveSavedCollectionsById,
      libraryEntries,
      itemCountsByIdentifier,
      loading,
      error,
      refreshCollections,
      createCollection,
      renameCollection,
      updateCollectionDescription,
      deleteCollection,
      fetchItems,
      addItem,
      removeItem,
      reorderItems,
      saveCollection,
      unsaveCollection,
      isCollectionSaved,
      removeTombstone,
      duplicateCollection,
    }),
    [
      collections,
      savedCollections,
      liveSavedCollectionsById,
      libraryEntries,
      itemCountsByIdentifier,
      loading,
      error,
      refreshCollections,
      createCollection,
      renameCollection,
      updateCollectionDescription,
      deleteCollection,
      fetchItems,
      addItem,
      removeItem,
      reorderItems,
      saveCollection,
      unsaveCollection,
      isCollectionSaved,
      removeTombstone,
      duplicateCollection,
    ],
  );

  return (
    <CollectionsContext.Provider value={value}>{children}</CollectionsContext.Provider>
  );
}

export function useCollections(): CollectionsContextValue {
  const ctx = useContext(CollectionsContext);
  if (!ctx) throw new Error('useCollections must be used inside <CollectionsProvider>');
  return ctx;
}
