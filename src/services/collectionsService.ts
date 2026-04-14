import { authService } from './authService';
import { logger } from '../utils/logger';
import {
  Collection,
  CollectionItem,
  CollectionItemMetadata,
  CollectionType,
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

function mapCollection(row: CollectionRow, itemCount?: number): Collection {
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
        return mapCollection(data as CollectionRow, 0);
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
    await Promise.all(
      orderedItemIds.map((id, index) =>
        this.supabase
          .from('collection_items')
          .update({ position: index })
          .eq('id', id)
          .eq('collection_id', collectionId),
      ),
    );
  }

  async fetchPublicCollections(userId: string): Promise<Collection[]> {
    return this.fetchCollections(userId);
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
}

export const collectionsService = new CollectionsService();
