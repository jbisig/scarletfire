import { authService } from './authService';
import { activityService } from './activityService';
import { logger } from '../utils/logger';
import {
  Collection,
  CollectionItem,
  CollectionItemMetadata,
  CollectionType,
  SavedCollection,
} from '../types/collection.types';
import { slugifyName, nextAvailableSlug } from './collectionsSlug';

interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  type: CollectionType;
  description: string | null;
  cover_image_url: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

interface CollectionItemRow {
  id: string;
  collection_id: string;
  item_identifier: string;
  item_metadata: CollectionItemMetadata;
  position: number;
  added_at: string;
}

function mapCollection(
  row: CollectionRow,
  itemCount?: number,
  saveCount?: number,
): Collection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    description: row.description ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    itemCount,
    saveCount,
  };
}

interface SavedCollectionRow {
  id: string;
  user_id: string;
  collection_id: string | null;
  last_known_name: string;
  last_known_type: CollectionType;
  last_known_owner_username: string;
  saved_at: string;
}

function mapSavedCollection(row: SavedCollectionRow): SavedCollection {
  return {
    id: row.id,
    userId: row.user_id,
    collectionId: row.collection_id,
    lastKnownName: row.last_known_name,
    lastKnownType: row.last_known_type,
    lastKnownOwnerUsername: row.last_known_owner_username,
    savedAt: row.saved_at,
  };
}

function mapItem(row: CollectionItemRow): CollectionItem {
  return {
    id: row.id,
    collectionId: row.collection_id,
    itemIdentifier: row.item_identifier,
    itemMetadata: row.item_metadata,
    position: row.position,
    addedAt: row.added_at,
  };
}

class CollectionsService {
  private get supabase() {
    return authService.getClient();
  }

  private async fetchTakenSlugs(userId: string): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from('collections')
      .select('slug')
      .eq('user_id', userId);
    if (error) throw error;
    return new Set((data ?? []).map((r: { slug: string }) => r.slug));
  }

  async fetchCollections(userId: string): Promise<Collection[]> {
    const { data, error } = await this.supabase
      .from('collections')
      .select('*, collection_items(count)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) {
      logger.api.error('fetchCollections failed', error);
      throw error;
    }
    return (data ?? []).map((row: any) =>
      mapCollection(row, row.collection_items?.[0]?.count ?? 0),
    );
  }

  async createCollection(params: {
    userId: string;
    name: string;
    type: CollectionType;
    description?: string;
  }): Promise<Collection> {
    const { userId, name, type, description } = params;
    // Retry up to 3 times on unique-constraint collision (covers the race
    // between fetchTakenSlugs and insert when two creates happen concurrently).
    let attempt = 0;
    let taken = await this.fetchTakenSlugs(userId);
    let lastError: unknown = null;
    while (attempt < 3) {
      const slug = nextAvailableSlug(slugifyName(name), taken);
      const { data, error } = await this.supabase
        .from('collections')
        .insert({
          user_id: userId,
          name,
          type,
          description: description ?? null,
          slug,
        })
        .select('*')
        .single();
      if (!error) {
        const created = data as CollectionRow;
        activityService.emitEvent('created_collection', 'collection', created.id, {
          name: created.name,
          type: created.type,
        }).catch(() => {});
        return mapCollection(created, 0);
      }
      lastError = error;
      if ((error as { code?: string }).code !== '23505') break;
      // Collision — fetch updated slug set and try again.
      taken = await this.fetchTakenSlugs(userId);
      taken.add(slug);
      attempt += 1;
    }
    throw lastError;
  }

  async updateCollection(
    id: string,
    userId: string,
    updates: { name?: string; description?: string | null; coverImageUrl?: string | null },
  ): Promise<Collection> {
    const patch: Partial<CollectionRow> = {};
    if (updates.name !== undefined) {
      const taken = await this.fetchTakenSlugs(userId);
      const { data: current } = await this.supabase
        .from('collections')
        .select('slug')
        .eq('id', id)
        .single();
      if (current?.slug) taken.delete(current.slug);
      patch.name = updates.name;
      patch.slug = nextAvailableSlug(slugifyName(updates.name), taken);
    }
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.coverImageUrl !== undefined) patch.cover_image_url = updates.coverImageUrl;

    const { data, error } = await this.supabase
      .from('collections')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapCollection(data as CollectionRow);
  }

  async deleteCollection(id: string): Promise<void> {
    const { error } = await this.supabase.from('collections').delete().eq('id', id);
    if (error) throw error;
  }

  async fetchCollectionItems(collectionId: string): Promise<CollectionItem[]> {
    const { data, error } = await this.supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .order('position', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapItem);
  }

  async addItemToCollection(
    collectionId: string,
    itemIdentifier: string,
    itemMetadata: CollectionItemMetadata,
  ): Promise<CollectionItem | null> {
    const { data: maxRows } = await this.supabase
      .from('collection_items')
      .select('position')
      .eq('collection_id', collectionId)
      .order('position', { ascending: false })
      .limit(1);
    const nextPosition = ((maxRows?.[0]?.position as number) ?? -1) + 1;
    const { data, error } = await this.supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        item_identifier: itemIdentifier,
        item_metadata: itemMetadata,
        position: nextPosition,
      })
      .select('*')
      .single();
    if (error) {
      if ((error as { code?: string }).code === '23505') return null;
      throw error;
    }
    return mapItem(data as CollectionItemRow);
  }

  async removeItemFromCollection(
    collectionId: string,
    itemIdentifier: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('item_identifier', itemIdentifier);
    if (error) throw error;
  }

  async reorderCollectionItems(
    collectionId: string,
    orderedItemIds: string[],
  ): Promise<void> {
    // Run sequentially so a partial failure stops cleanly instead of racing
    // other updates to completion. If any update fails we throw — the caller
    // is expected to refresh items from the server to reconcile state.
    for (let i = 0; i < orderedItemIds.length; i++) {
      const id = orderedItemIds[i];
      const { error } = await this.supabase
        .from('collection_items')
        .update({ position: i })
        .eq('id', id)
        .eq('collection_id', collectionId);
      if (error) {
        logger.api.error('reorderCollectionItems failed at index', i, error);
        throw error;
      }
    }
  }

  /**
   * For a given item, return the set of the user's collection IDs that already
   * contain it. One round-trip, replacing the N+1 `fetchCollectionItems` loop
   * that the "Add to collection/playlist" picker used to do.
   */
  async fetchCollectionIdsContainingItem(
    userId: string,
    itemIdentifier: string,
  ): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from('collection_items')
      .select('collection_id, collections!inner(user_id)')
      .eq('item_identifier', itemIdentifier)
      .eq('collections.user_id', userId);
    if (error) throw error;
    return new Set(
      (data ?? []).map((r: { collection_id: string }) => r.collection_id),
    );
  }

  /**
   * Return a map of item_identifier → count across all of the user's collections.
   * Used to badge UI (e.g. "Added (2)") without fetching each collection's items.
   */
  async fetchItemCountsByIdentifier(userId: string): Promise<Record<string, number>> {
    const { data: cols, error: colsErr } = await this.supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId);
    if (colsErr) throw colsErr;
    const ids = (cols ?? []).map((r: { id: string }) => r.id);
    if (ids.length === 0) return {};
    const { data: rows, error: rowsErr } = await this.supabase
      .from('collection_items')
      .select('item_identifier')
      .in('collection_id', ids);
    if (rowsErr) throw rowsErr;
    const counts: Record<string, number> = {};
    for (const row of rows ?? []) {
      const key = (row as { item_identifier: string }).item_identifier;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * Most-saved collections of a given type from users with public profiles.
   * Backed by the `get_popular_collections` RPC so the cross-user save-count
   * aggregation can run with elevated privileges (SECURITY DEFINER).
   */
  async fetchPopularCollections(
    type: CollectionType,
    limit = 10,
  ): Promise<Collection[]> {
    const { data, error } = await this.supabase.rpc('get_popular_collections', {
      p_type: type,
      p_limit: limit,
    });
    if (error) {
      logger.api.error('fetchPopularCollections failed', error);
      throw error;
    }
    return (data ?? []).map(
      (row: CollectionRow & { item_count: number | string; save_count: number | string }) =>
        mapCollection(row, Number(row.item_count ?? 0), Number(row.save_count ?? 0)),
    );
  }

  async fetchCollectionSaveCount(collectionId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('get_collection_save_count', {
      p_collection_id: collectionId,
    });
    if (error) {
      logger.api.error('fetchCollectionSaveCount failed', error);
      return 0;
    }
    return Number(data ?? 0);
  }

  async fetchCollectionById(collectionId: string): Promise<Collection | null> {
    const { data, error } = await this.supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapCollection(data as CollectionRow);
  }

  async fetchPublicCollectionByLink(
    userId: string,
    slug: string,
  ): Promise<{ collection: Collection; items: CollectionItem[] } | null> {
    const { data, error } = await this.supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const collection = mapCollection(data as CollectionRow);
    const items = await this.fetchCollectionItems(collection.id);
    return { collection, items };
  }

  /**
   * Save a reference to another user's collection. Snapshots the collection's
   * name, type, and owner username at save time; snapshots are refreshed on
   * subsequent fetches while the source still exists.
   *
   * Returns null if the caller owns the collection (defensive — UI hides).
   * Returns the existing row if the collection is already saved (idempotent).
   */
  async saveCollection(params: {
    userId: string;
    collectionId: string;
  }): Promise<SavedCollection | null> {
    const { userId, collectionId } = params;

    const { data: col, error: colErr } = await this.supabase
      .from('collections')
      .select('id, user_id, name, type')
      .eq('id', collectionId)
      .maybeSingle();
    if (colErr) throw colErr;
    if (!col) throw new Error('Collection not found');
    if (col.user_id === userId) return null; // can't save your own

    const { data: ownerProfile, error: profErr } = await this.supabase
      .from('profiles')
      .select('username')
      .eq('id', col.user_id)
      .maybeSingle();
    if (profErr) throw profErr;
    if (!ownerProfile?.username) throw new Error('Owner profile not found');

    const { data, error } = await this.supabase
      .from('saved_collections')
      .insert({
        user_id: userId,
        collection_id: collectionId,
        last_known_name: col.name,
        last_known_type: col.type,
        last_known_owner_username: ownerProfile.username,
      })
      .select('*')
      .single();

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        // Already saved — fetch and return existing row.
        const { data: existing, error: fetchErr } = await this.supabase
          .from('saved_collections')
          .select('*')
          .eq('user_id', userId)
          .eq('collection_id', collectionId)
          .single();
        if (fetchErr) throw fetchErr;
        return mapSavedCollection(existing as SavedCollectionRow);
      }
      throw error;
    }
    activityService.emitEvent('saved_collection', 'collection', collectionId, {
      name: col.name,
      type: col.type,
      creator_username: ownerProfile.username,
    }).catch(() => {});
    return mapSavedCollection(data as SavedCollectionRow);
  }

  async unsaveCollection(userId: string, collectionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('saved_collections')
      .delete()
      .eq('user_id', userId)
      .eq('collection_id', collectionId);
    if (error) throw error;
  }

  /** Remove a saved row by id — used by the tombstone "Remove" action. */
  async deleteSavedCollection(userId: string, savedId: string): Promise<void> {
    const { error } = await this.supabase
      .from('saved_collections')
      .delete()
      .eq('user_id', userId)
      .eq('id', savedId);
    if (error) throw error;
  }

  async isCollectionSaved(userId: string, collectionId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('saved_collections')
      .select('id')
      .eq('user_id', userId)
      .eq('collection_id', collectionId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  /**
   * Fetch all of the user's saved collections along with the current state of
   * each underlying live collection. Refreshes snapshot columns (name, type,
   * owner username) in the background when they drift from the live row.
   *
   * Returns:
   *  - `saved`: SavedCollection rows (source of truth for kind/tombstone).
   *  - `liveCollections`: Map from collection_id → current `Collection`. Only
   *    includes non-tombstoned saves.
   */
  async fetchSavedCollections(userId: string): Promise<{
    saved: SavedCollection[];
    liveCollections: Map<string, Collection>;
  }> {
    const { data, error } = await this.supabase
      .from('saved_collections')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as SavedCollectionRow[];
    const saved = rows.map(mapSavedCollection);

    const liveIds = saved
      .map((s) => s.collectionId)
      .filter((id): id is string => id !== null);

    const liveCollections = new Map<string, Collection>();
    if (liveIds.length > 0) {
      const { data: cols, error: colsErr } = await this.supabase
        .from('collections')
        .select('*, collection_items(count)')
        .in('id', liveIds);
      if (colsErr) throw colsErr;

      const ownerIds = Array.from(
        new Set((cols ?? []).map((r: { user_id: string }) => r.user_id)),
      );
      const usernamesByOwnerId = new Map<string, string>();
      if (ownerIds.length > 0) {
        const { data: profs, error: profsErr } = await this.supabase
          .from('profiles')
          .select('id, username')
          .in('id', ownerIds);
        if (profsErr) throw profsErr;
        for (const p of profs ?? []) {
          const row = p as { id: string; username: string };
          usernamesByOwnerId.set(row.id, row.username);
        }
      }

      const snapshotUpdates: Array<Promise<unknown>> = [];
      for (const raw of cols ?? []) {
        const row = raw as CollectionRow & {
          collection_items?: { count: number }[];
        };
        const count = row.collection_items?.[0]?.count ?? 0;
        liveCollections.set(row.id, mapCollection(row, count));

        const match = saved.find((s) => s.collectionId === row.id);
        const ownerUsername = usernamesByOwnerId.get(row.user_id);
        if (
          match &&
          ownerUsername &&
          (match.lastKnownName !== row.name ||
            match.lastKnownType !== row.type ||
            match.lastKnownOwnerUsername !== ownerUsername)
        ) {
          snapshotUpdates.push(
            this.supabase
              .from('saved_collections')
              .update({
                last_known_name: row.name,
                last_known_type: row.type,
                last_known_owner_username: ownerUsername,
              })
              .eq('id', match.id),
          );
        }
      }
      // Fire-and-forget; snapshot drift is self-healing on subsequent fetches.
      void Promise.allSettled(snapshotUpdates);
    }

    return { saved, liveCollections };
  }

  /**
   * Create a fully owned copy of an existing collection. Copies all items
   * preserving their order and metadata. Name becomes "{original} (Copy)"
   * with slug collision handling; no back-reference to the original.
   *
   * The source collection must be readable by the caller (owner, saver of a
   * public-by-link view). We don't enforce that here — RLS will gate the
   * underlying reads.
   */
  async duplicateCollection(params: {
    userId: string;
    sourceCollectionId: string;
  }): Promise<Collection> {
    const { userId, sourceCollectionId } = params;

    // 1. Fetch source collection + items.
    const { data: src, error: srcErr } = await this.supabase
      .from('collections')
      .select('*')
      .eq('id', sourceCollectionId)
      .maybeSingle();
    if (srcErr) throw srcErr;
    if (!src) throw new Error('Source collection not found');

    const srcRow = src as CollectionRow;
    const items = await this.fetchCollectionItems(sourceCollectionId);

    // 2. Create the new owned collection with "(Copy)" suffix, slug-collision handled.
    const copyName = `${srcRow.name.trimEnd()} (Copy)`;
    const created = await this.createCollection({
      userId,
      name: copyName,
      type: srcRow.type,
      description: srcRow.description ?? undefined,
    });

    // 3. Copy cover image if present.
    if (srcRow.cover_image_url) {
      const { error: updErr } = await this.supabase
        .from('collections')
        .update({ cover_image_url: srcRow.cover_image_url })
        .eq('id', created.id);
      if (updErr) logger.api.error('duplicateCollection cover copy failed', updErr);
    }

    // 4. Bulk-insert items preserving position order.
    if (items.length > 0) {
      const rows = items.map((it, idx) => ({
        collection_id: created.id,
        item_identifier: it.itemIdentifier,
        item_metadata: it.itemMetadata,
        position: idx,
      }));
      const { error: insErr } = await this.supabase
        .from('collection_items')
        .insert(rows);
      if (insErr) {
        // Best-effort rollback: delete the (now empty-ish) collection.
        await this.supabase.from('collections').delete().eq('id', created.id);
        throw insErr;
      }
    }

    return {
      ...created,
      coverImageUrl: srcRow.cover_image_url ?? undefined,
      itemCount: items.length,
    };
  }
}

export const collectionsService = new CollectionsService();
