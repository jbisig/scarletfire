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
} from '../types/collection.types';
import { logger } from '../utils/logger';

interface CollectionsContextValue {
  collections: Collection[];
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
}

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const user = state.user;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [itemCountsByIdentifier, setItemCountsByIdentifier] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCollections = useCallback(async () => {
    if (!user) {
      setCollections([]);
      setItemCountsByIdentifier({});
      return;
    }
    setLoading(true);
    try {
      const [data, counts] = await Promise.all([
        collectionsService.fetchCollections(user.id),
        collectionsService.fetchItemCountsByIdentifier(user.id),
      ]);
      setCollections(data);
      setItemCountsByIdentifier(counts);
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
            ? { ...c, itemCount: Math.max(0, (c.itemCount ?? 1) - 1) }
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

  const value = useMemo<CollectionsContextValue>(
    () => ({
      collections,
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
    }),
    [
      collections,
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
