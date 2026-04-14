# Collections & Playlists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-created Collections (groups of shows) and Playlists (groups of tracks) with Supabase-backed storage, surfaced on Favorites + public profile, shareable via universally-viewable URLs.

**Architecture:** Two new Supabase tables (`collections`, `collection_items`) with RLS. A `collectionsService` wraps CRUD; a `CollectionsContext` exposes state to the UI. New Favorites tab for collection management, a new `CollectionDetailScreen` (owner + read-only modes), a picker modal for "Add to Collection/Playlist" surfaced from show/song contexts, a Collections tab on the public profile, and extensions to `shareService`/`ShareSheetContext` for the new `kind: 'collection'` share item.

**Tech Stack:** React Native/Expo, TypeScript, Supabase, React Navigation, existing `FavoritesContext` / `ShareSheetContext` / `ToastContext` patterns, Jest for unit tests on pure logic.

**Spec:** `docs/superpowers/specs/2026-04-13-collections-playlists-design.md`

**Notes:**
- Test coverage in this repo is thin (`src/__tests__/utils/formatters.test.ts` is representative). Plan writes Jest unit tests for pure logic (slug generation, share URL/text builders, position helpers). UI/service integration is validated by manual test steps on device/web.
- Package manager: `npm`.
- SQL migrations live as loose files in `supabase/` (no Supabase CLI versioning).

---

## File Structure

**New files:**
- `supabase/create_collections_tables.sql` — schema, RLS, indexes
- `src/types/collection.types.ts` — `Collection`, `CollectionItem`, metadata types, `CollectionType`
- `src/services/collectionsService.ts` — Supabase CRUD singleton
- `src/services/__tests__/collectionsService.slug.test.ts` — slug generation tests
- `src/contexts/CollectionsContext.tsx` — React context
- `src/screens/CollectionDetailScreen.tsx` — owner + read-only collection view
- `src/components/collections/CollectionCard.tsx` — list card used in Favorites + profile
- `src/components/collections/CollectionsTab.tsx` — Collections tab body for Favorites + profile
- `src/components/collections/CreateCollectionModal.tsx` — modal for creating a collection
- `src/components/collections/AddToCollectionPicker.tsx` — picker modal for "Add to Collection/Playlist"
- `src/services/__tests__/shareService.collection.test.ts` — share URL/text tests for collections

**Modified files:**
- `App.tsx` — wrap `<CollectionsProvider>` into provider tree
- `src/services/shareService.ts` — add `kind: 'collection'` to `ShareItem`; extend `buildShareUrl`/`buildShareText`
- `src/screens/FavoritesScreen.tsx` — add "Collections" tab
- `src/screens/PublicProfileScreen.tsx` — add "Collections" tab (public variant)
- `src/screens/ShowDetailScreen.tsx` — add "Add to Collection" affordance in header actions
- `src/screens/FullPlayerScreen.tsx` (or wherever song overflow lives) — add "Add to Playlist" action
- `src/navigation/AppNavigator.tsx` — register `CollectionDetail` route
- `src/navigation/webLinking.ts` — route `/profile/:username/collection/:slug`
- `src/contexts/FavoritesContext.tsx` — no structural change (reference only)

---

## Phase 1 — Database schema

### Task 1: Create collections tables migration

**Files:**
- Create: `supabase/create_collections_tables.sql`

- [ ] **Step 1: Write the SQL file**

```sql
-- supabase/create_collections_tables.sql
-- Collections & collection_items for user-organized show/playlist groupings.

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('show_collection', 'playlist')),
  description text,
  cover_image_url text,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists collections_user_updated_idx
  on public.collections (user_id, updated_at desc);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  item_identifier text not null,
  item_metadata jsonb not null,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  unique (collection_id, item_identifier)
);

create index if not exists collection_items_collection_position_idx
  on public.collection_items (collection_id, position);

-- updated_at trigger for collections
create or replace function public.set_collection_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_collection_updated_at();

-- Also bump parent collection updated_at when items change
create or replace function public.touch_collection_from_items()
returns trigger as $$
begin
  update public.collections
    set updated_at = now()
    where id = coalesce(new.collection_id, old.collection_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists collection_items_touch_parent on public.collection_items;
create trigger collection_items_touch_parent
  after insert or update or delete on public.collection_items
  for each row execute function public.touch_collection_from_items();

-- RLS
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

-- Owners: full CRUD on own collections
drop policy if exists "collections_owner_select" on public.collections;
create policy "collections_owner_select" on public.collections
  for select using (auth.uid() = user_id);

drop policy if exists "collections_owner_insert" on public.collections;
create policy "collections_owner_insert" on public.collections
  for insert with check (auth.uid() = user_id);

drop policy if exists "collections_owner_update" on public.collections;
create policy "collections_owner_update" on public.collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "collections_owner_delete" on public.collections;
create policy "collections_owner_delete" on public.collections
  for delete using (auth.uid() = user_id);

-- Public read by direct link (independent of profile visibility)
drop policy if exists "collections_public_select_by_link" on public.collections;
create policy "collections_public_select_by_link" on public.collections
  for select using (true);

-- Note: we rely on querying by (user_id, slug) from the client for the "by-link"
-- flow, and by user_id (after resolving username) for the public profile listing.
-- The profile-listing access is gated at the query level by first joining on
-- profiles.is_public = true. Because the public_select_by_link policy is OR'd
-- with owner_select, any authenticated or anonymous reader can SELECT collections;
-- sensitive user relationships are not exposed (user_id is a UUID, not identifying).

-- Owners: full CRUD on items of own collections
drop policy if exists "collection_items_owner_select" on public.collection_items;
create policy "collection_items_owner_select" on public.collection_items
  for select using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "collection_items_owner_insert" on public.collection_items;
create policy "collection_items_owner_insert" on public.collection_items
  for insert with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "collection_items_owner_update" on public.collection_items;
create policy "collection_items_owner_update" on public.collection_items
  for update using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "collection_items_owner_delete" on public.collection_items;
create policy "collection_items_owner_delete" on public.collection_items
  for delete using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- Public items read (universal link access)
drop policy if exists "collection_items_public_select" on public.collection_items;
create policy "collection_items_public_select" on public.collection_items
  for select using (true);
```

- [ ] **Step 2: Apply migration manually in Supabase SQL editor**

Run the SQL in the Supabase project's SQL editor (dashboard). Verify in the Table Editor that both `collections` and `collection_items` exist with the expected columns and that RLS is enabled on both tables.

- [ ] **Step 3: Commit**

```bash
git add supabase/create_collections_tables.sql
git commit -m "feat(db): add collections and collection_items tables"
```

---

## Phase 2 — Types & service layer

### Task 2: Add Collection types

**Files:**
- Create: `src/types/collection.types.ts`

- [ ] **Step 1: Write the types**

```ts
// src/types/collection.types.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/collection.types.ts
git commit -m "feat(types): add Collection and CollectionItem types"
```

### Task 3: Add slug generation utility (TDD)

**Files:**
- Create: `src/services/collectionsSlug.ts`
- Test: `src/services/__tests__/collectionsService.slug.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/services/__tests__/collectionsService.slug.test.ts
import { slugifyName, nextAvailableSlug } from '../collectionsSlug';

describe('slugifyName', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugifyName('My Best 77 Shows')).toBe('my-best-77-shows');
  });

  it('strips special characters', () => {
    expect(slugifyName("Dark Star's Greatest!")).toBe('dark-stars-greatest');
  });

  it('collapses multiple hyphens and trims them', () => {
    expect(slugifyName('  --Foo   Bar-- ')).toBe('foo-bar');
  });

  it('falls back to "collection" when name is empty after stripping', () => {
    expect(slugifyName('!!!')).toBe('collection');
  });
});

describe('nextAvailableSlug', () => {
  it('returns the base slug when not taken', () => {
    expect(nextAvailableSlug('my-list', new Set())).toBe('my-list');
  });

  it('appends -2 on first collision', () => {
    expect(nextAvailableSlug('my-list', new Set(['my-list']))).toBe('my-list-2');
  });

  it('increments until unused', () => {
    const taken = new Set(['x', 'x-2', 'x-3']);
    expect(nextAvailableSlug('x', taken)).toBe('x-4');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- collectionsService.slug`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the slug utility**

```ts
// src/services/collectionsSlug.ts
export function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base : 'collection';
}

export function nextAvailableSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- collectionsService.slug`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/collectionsSlug.ts src/services/__tests__/collectionsService.slug.test.ts
git commit -m "feat(collections): add slug generation utility"
```

### Task 4: Implement `collectionsService`

**Files:**
- Create: `src/services/collectionsService.ts`

The service wraps the existing Supabase client used by other services. Mirror the singleton pattern from `profileService.ts`. Inspect `src/services/favoritesCloudService.ts` to reuse the same `supabase` client import.

- [ ] **Step 1: Write the service**

```ts
// src/services/collectionsService.ts
import { supabase } from '../lib/supabase'; // match import path used by favoritesCloudService.ts
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

async function fetchTakenSlugs(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('collections')
    .select('slug')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { slug: string }) => r.slug));
}

class CollectionsService {
  async fetchCollections(userId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*, collection_items(count)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) {
      logger.error('fetchCollections failed', error);
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
    const taken = await fetchTakenSlugs(userId);
    const slug = nextAvailableSlug(slugifyName(name), taken);
    const { data, error } = await supabase
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
    if (error) throw error;
    return mapCollection(data as CollectionRow, 0);
  }

  async updateCollection(
    id: string,
    userId: string,
    updates: { name?: string; description?: string | null; coverImageUrl?: string | null },
  ): Promise<Collection> {
    const patch: Partial<CollectionRow> = {};
    if (updates.name !== undefined) {
      const taken = await fetchTakenSlugs(userId);
      // Allow keeping own current slug: drop current row's slug from taken set.
      const { data: current } = await supabase
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

    const { data, error } = await supabase
      .from('collections')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapCollection(data as CollectionRow);
  }

  async deleteCollection(id: string): Promise<void> {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw error;
  }

  async fetchCollectionItems(collectionId: string): Promise<CollectionItem[]> {
    const { data, error } = await supabase
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
    // Compute next position.
    const { data: maxRows } = await supabase
      .from('collection_items')
      .select('position')
      .eq('collection_id', collectionId)
      .order('position', { ascending: false })
      .limit(1);
    const nextPosition = ((maxRows?.[0]?.position as number) ?? -1) + 1;
    const { data, error } = await supabase
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
      // Unique constraint violation = already present; no-op.
      if ((error as any).code === '23505') return null;
      throw error;
    }
    return mapItem(data as CollectionItemRow);
  }

  async removeItemFromCollection(
    collectionId: string,
    itemIdentifier: string,
  ): Promise<void> {
    const { error } = await supabase
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
    // Batch: update each item's position based on its index.
    // Supabase doesn't support multi-row UPDATE by id in one call; do a Promise.all.
    await Promise.all(
      orderedItemIds.map((id, index) =>
        supabase
          .from('collection_items')
          .update({ position: index })
          .eq('id', id)
          .eq('collection_id', collectionId),
      ),
    );
  }

  async fetchPublicCollections(userId: string): Promise<Collection[]> {
    // Caller must have already resolved username → userId and confirmed is_public.
    return this.fetchCollections(userId);
  }

  async fetchPublicCollectionByLink(
    userId: string,
    slug: string,
  ): Promise<{ collection: Collection; items: CollectionItem[] } | null> {
    const { data, error } = await supabase
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
```

- [ ] **Step 2: Verify the supabase client import path**

Open `src/services/favoritesCloudService.ts` and confirm the `supabase` import path. Update the import in `collectionsService.ts` to match if different (e.g. `from '../lib/supabase'` vs `from './supabase'`).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors related to `collectionsService.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/services/collectionsService.ts
git commit -m "feat(collections): add collectionsService with CRUD + slug handling"
```

---

## Phase 3 — Context

### Task 5: Create `CollectionsContext`

**Files:**
- Create: `src/contexts/CollectionsContext.tsx`

- [ ] **Step 1: Write the context**

```tsx
// src/contexts/CollectionsContext.tsx
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
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCollections = useCallback(async () => {
    if (!user) {
      setCollections([]);
      return;
    }
    setLoading(true);
    try {
      const data = await collectionsService.fetchCollections(user.id);
      setCollections(data);
      setError(null);
    } catch (e) {
      logger.error('refreshCollections failed', e);
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
      await collectionsService.addItemToCollection(collectionId, itemIdentifier, itemMetadata);
      // bump the collection in state so item count / order updates
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
```

- [ ] **Step 2: Mount the provider in `App.tsx`**

Open `App.tsx`. Find the existing provider stack (contains `ShowsProvider`, `FavoritesProvider`, `AuthProvider`, `ShareSheetProvider`, etc.). Import `CollectionsProvider` and nest it **inside** `AuthProvider` (needs user) and **around** whatever renders the navigator.

```tsx
// App.tsx (imports)
import { CollectionsProvider } from './src/contexts/CollectionsContext';

// In the provider tree, inside AuthProvider and outside ShareSheetProvider:
<AuthProvider>
  <CollectionsProvider>
    {/* existing children */}
  </CollectionsProvider>
</AuthProvider>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/contexts/CollectionsContext.tsx App.tsx
git commit -m "feat(collections): add CollectionsContext and mount provider"
```

---

## Phase 4 — Favorites Collections tab

### Task 6: Add `CollectionCard` component

**Files:**
- Create: `src/components/collections/CollectionCard.tsx`

The card should visually match existing favorite/show cards in the app. Inspect `src/screens/FavoritesScreen.tsx` `renderShowsTab` to mirror the style (row layout, typography tokens from `constants/registry`).

- [ ] **Step 1: Write the component**

```tsx
// src/components/collections/CollectionCard.tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Collection } from '../../types/collection.types';
import { COLORS } from '../../constants/registry';

interface Props {
  collection: Collection;
  onPress: () => void;
  onLongPress?: () => void;
}

export function CollectionCard({ collection, onPress, onLongPress }: Props) {
  const typeLabel = collection.type === 'playlist' ? 'Playlist' : 'Show Collection';
  const countLabel = `${collection.itemCount ?? 0} item${
    (collection.itemCount ?? 0) === 1 ? '' : 's'
  }`;
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${collection.name}, ${typeLabel}, ${countLabel}`}
    >
      <View style={styles.thumb}>
        <Ionicons
          name={collection.type === 'playlist' ? 'musical-notes' : 'albums'}
          size={24}
          color={COLORS.textSecondary}
        />
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>{collection.name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {typeLabel} · {countLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated ?? '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/CollectionCard.tsx
git commit -m "feat(collections): add CollectionCard component"
```

### Task 7: Add `CreateCollectionModal`

**Files:**
- Create: `src/components/collections/CreateCollectionModal.tsx`

- [ ] **Step 1: Write the modal**

```tsx
// src/components/collections/CreateCollectionModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CollectionType } from '../../types/collection.types';
import { useCollections } from '../../contexts/CollectionsContext';
import { COLORS } from '../../constants/registry';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialType?: CollectionType;
  onCreated?: (collectionId: string) => void;
}

export function CreateCollectionModal({
  visible,
  onClose,
  initialType = 'show_collection',
  onCreated,
}: Props) {
  const { createCollection } = useCollections();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CollectionType>(initialType);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setDescription('');
    setType(initialType);
    setSubmitting(false);
  };

  const handleCreate = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await createCollection({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      });
      reset();
      onClose();
      onCreated?.(created.id);
    } catch (e) {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <Text style={styles.title}>New Collection</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Best 77 Shows"
            placeholderTextColor={COLORS.textSecondary}
            autoFocus
            maxLength={80}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {(['show_collection', 'playlist'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => setType(t)}
              >
                <Text style={type === t ? styles.typeTextActive : styles.typeText}>
                  {t === 'playlist' ? 'Playlist' : 'Show Collection'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder=""
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={280}
          />

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!name.trim() || submitting}
              style={[styles.createBtn, (!name.trim() || submitting) && styles.disabledBtn]}
            >
              <Text style={styles.createText}>{submitting ? 'Creating…' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.surface ?? '#111',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },
  input: {
    backgroundColor: COLORS.surfaceElevated ?? '#222',
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMulti: { minHeight: 60, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated ?? '#222',
  },
  typeChipActive: { backgroundColor: COLORS.accent ?? '#4a90e2' },
  typeText: { color: COLORS.textSecondary, fontSize: 13 },
  typeTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: COLORS.textSecondary, fontSize: 15 },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.accent ?? '#4a90e2',
  },
  disabledBtn: { opacity: 0.5 },
  createText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/CreateCollectionModal.tsx
git commit -m "feat(collections): add CreateCollectionModal"
```

### Task 8: Build `CollectionsTab` body

**Files:**
- Create: `src/components/collections/CollectionsTab.tsx`

This component is used by both the Favorites screen (with ownership actions) and the public profile (read-only). Parametrize with `collections`, `onCardPress`, `onCardLongPress?`, `onCreate?`.

- [ ] **Step 1: Write the component**

```tsx
// src/components/collections/CollectionsTab.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Collection, CollectionType } from '../../types/collection.types';
import { CollectionCard } from './CollectionCard';
import { COLORS } from '../../constants/registry';

interface Props {
  collections: Collection[];
  onCardPress: (c: Collection) => void;
  onCardLongPress?: (c: Collection) => void;
  onCreate?: (type: CollectionType) => void;
  emptyMessage?: string;
}

export function CollectionsTab({
  collections,
  onCardPress,
  onCardLongPress,
  onCreate,
  emptyMessage = 'No collections yet.',
}: Props) {
  const showCollections = collections.filter((c) => c.type === 'show_collection');
  const playlists = collections.filter((c) => c.type === 'playlist');

  const renderSection = (
    label: string,
    type: CollectionType,
    items: Collection[],
  ) => (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{label}</Text>
        {onCreate && (
          <TouchableOpacity
            onPress={() => onCreate(type)}
            accessibilityRole="button"
            accessibilityLabel={`New ${label.slice(0, -1)}`}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        items.map((c) => (
          <CollectionCard
            key={c.id}
            collection={c}
            onPress={() => onCardPress(c)}
            onLongPress={onCardLongPress ? () => onCardLongPress(c) : undefined}
          />
        ))
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {renderSection('Show Collections', 'show_collection', showCollections)}
      {renderSection('Playlists', 'playlist', playlists)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120 },
  section: { marginTop: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  headerText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  addBtn: { padding: 4 },
  empty: {
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/CollectionsTab.tsx
git commit -m "feat(collections): add CollectionsTab shared component"
```

### Task 9: Add Collections tab to `FavoritesScreen`

**Files:**
- Modify: `src/screens/FavoritesScreen.tsx`

- [ ] **Step 1: Extend `TabType` and tab array**

Find the `TabType` type declaration (near line 153). Change it to include `'collections'`:

```ts
type TabType = 'shows' | 'songs' | 'collections';
```

Find the tab rendering loop (around lines 814–831, the `['shows', 'songs'] as const`). Change to:

```tsx
{(['shows', 'songs', 'collections'] as const).map((tab) => (
  <TouchableOpacity
    key={`${tab}-${activeTab}`}
    style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
    onPress={() => setActiveTab(tab)}
    activeOpacity={0.7}
    accessibilityRole="tab"
    accessibilityLabel={`${tab} tab`}
    accessibilityState={{ selected: activeTab === tab }}
    accessibilityHint={`Double tap to view ${tab}`}
  >
    <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
      {tab === 'shows' ? 'Shows' : tab === 'songs' ? 'Songs' : 'Collections'}
    </Text>
  </TouchableOpacity>
))}
```

- [ ] **Step 2: Render Collections tab content**

Add imports at the top of the file:

```tsx
import { CollectionsTab } from '../components/collections/CollectionsTab';
import { CreateCollectionModal } from '../components/collections/CreateCollectionModal';
import { useCollections } from '../contexts/CollectionsContext';
import { CollectionType, Collection } from '../types/collection.types';
```

Inside the component body, add state + hook usage near other hooks:

```tsx
const { collections, deleteCollection, refreshCollections } = useCollections();
const [createModalVisible, setCreateModalVisible] = useState(false);
const [createModalType, setCreateModalType] = useState<CollectionType>('show_collection');
```

Add a handler:

```tsx
const handleCollectionLongPress = (c: Collection) => {
  Alert.alert(c.name, undefined, [
    { text: 'Rename', onPress: () => { /* deferred: inline rename in Task 11 */ } },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        Alert.alert('Delete collection?', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteCollection(c.id) },
        ]);
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
};
```

Find the conditional `{activeTab === 'shows' ? renderShowsTab() : renderSongsTab()}` (around line 855). Replace with:

```tsx
{activeTab === 'shows'
  ? renderShowsTab()
  : activeTab === 'songs'
  ? renderSongsTab()
  : (
    <>
      <CollectionsTab
        collections={collections}
        onCardPress={(c) => navigation.navigate('CollectionDetail', { collectionId: c.id })}
        onCardLongPress={handleCollectionLongPress}
        onCreate={(type) => {
          setCreateModalType(type);
          setCreateModalVisible(true);
        }}
        emptyMessage="Tap + to create one."
      />
      <CreateCollectionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        initialType={createModalType}
      />
    </>
  )}
```

Ensure `Alert` is imported from `react-native`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: expect an error about `CollectionDetail` not being on the navigator param list — we'll fix that in Task 10. Acceptable to leave it for the next commit.

- [ ] **Step 4: Commit**

```bash
git add src/screens/FavoritesScreen.tsx
git commit -m "feat(favorites): add Collections tab with create/delete"
```

---

## Phase 5 — Collection detail screen

### Task 10: Register `CollectionDetail` route

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`
- Create: `src/screens/CollectionDetailScreen.tsx` (minimal placeholder for this task; fleshed out in Task 11)

- [ ] **Step 1: Create placeholder screen**

```tsx
// src/screens/CollectionDetailScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';

export function CollectionDetailScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Collection detail (coming soon)</Text>
    </View>
  );
}
```

- [ ] **Step 2: Register in `AppNavigator.tsx`**

Extend the `RootStackParamList`:

```ts
export type RootStackParamList = {
  // ...existing routes,
  CollectionDetail: {
    collectionId?: string;
    username?: string;
    slug?: string;
    readOnly?: boolean;
  };
};
```

Add a `<Stack.Screen>` for `CollectionDetail` next to `ShowDetail`:

```tsx
import { CollectionDetailScreen } from '../screens/CollectionDetailScreen';
// ...
<Stack.Screen
  name="CollectionDetail"
  component={CollectionDetailScreen}
  options={{ title: 'Collection' }}
/>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (except for CollectionDetail navigation call in FavoritesScreen should now be valid).

- [ ] **Step 4: Commit**

```bash
git add src/screens/CollectionDetailScreen.tsx src/navigation/AppNavigator.tsx
git commit -m "feat(nav): register CollectionDetail route"
```

### Task 11: Implement owner Collection detail screen

**Files:**
- Modify: `src/screens/CollectionDetailScreen.tsx`

Owner mode: renders list of items, swipe-to-delete, header with name (tap to rename), overflow menu (delete collection), share button. Playlist items get drag-to-reorder via `react-native-draggable-flatlist` if already in deps; otherwise use a simple up/down arrow pair.

- [ ] **Step 1: Inspect deps**

Open `package.json`. Note whether `react-native-draggable-flatlist` is installed. If yes → use it. If no → use a simple reorder via long-press context menu with "Move up" / "Move down" actions on each row (keeps scope tight).

- [ ] **Step 2: Write the screen (no-drag fallback)**

```tsx
// src/screens/CollectionDetailScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCollections } from '../contexts/CollectionsContext';
import { useAuth } from '../contexts/AuthContext';
import { useShareSheet } from '../contexts/ShareSheetContext';
import { collectionsService } from '../services/collectionsService';
import { profileService } from '../services/profileService';
import {
  Collection,
  CollectionItem,
  PlaylistItemMetadata,
  ShowCollectionItemMetadata,
} from '../types/collection.types';
import { COLORS } from '../constants/registry';

type Nav = StackNavigationProp<RootStackParamList, 'CollectionDetail'>;
type RouteT = RouteProp<RootStackParamList, 'CollectionDetail'>;

export function CollectionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { user } = useAuth();
  const {
    collections,
    fetchItems,
    removeItem,
    reorderItems,
    renameCollection,
    deleteCollection,
  } = useCollections();
  const { openShareTray } = useShareSheet();

  const readOnly = !!route.params?.readOnly;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);

  // Load collection + items
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (route.params?.collectionId) {
          const found = collections.find((c) => c.id === route.params!.collectionId);
          setCollection(found ?? null);
          if (found) setItems(await fetchItems(found.id));
        } else if (route.params?.username && route.params?.slug) {
          // Public link flow: resolve user → fetch public collection
          const profile = await profileService.getPublicProfile(route.params.username);
          if (profile?.profile?.id) {
            const result = await collectionsService.fetchPublicCollectionByLink(
              profile.profile.id,
              route.params.slug,
            );
            if (result) {
              setCollection(result.collection);
              setItems(result.items);
              setOwnerUsername(route.params.username);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [collections, fetchItems, route.params]);

  // Load owner username for share builder
  useEffect(() => {
    (async () => {
      if (!collection || ownerUsername) return;
      if (user && user.id === collection.userId) {
        const me = await profileService.getUserProfile(user.id);
        setOwnerUsername(me?.username ?? null);
      }
    })();
  }, [collection, user, ownerUsername]);

  const isOwner = !readOnly && !!user && !!collection && user.id === collection.userId;

  const handleShare = useCallback(() => {
    if (!collection || !ownerUsername) return;
    openShareTray({
      kind: 'collection',
      collectionId: collection.id,
      ownerUsername,
      slug: collection.slug,
      name: collection.name,
      type: collection.type,
      itemCount: items.length,
    });
  }, [collection, items.length, openShareTray, ownerUsername]);

  const handleDelete = useCallback(() => {
    if (!collection) return;
    Alert.alert('Delete collection?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCollection(collection.id);
          navigation.goBack();
        },
      },
    ]);
  }, [collection, deleteCollection, navigation]);

  const handleRemoveItem = useCallback(
    async (item: CollectionItem) => {
      if (!collection) return;
      await removeItem(collection.id, item.itemIdentifier);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    },
    [collection, removeItem],
  );

  const handleMove = useCallback(
    async (item: CollectionItem, direction: -1 | 1) => {
      if (!collection) return;
      const idx = items.findIndex((i) => i.id === item.id);
      const targetIdx = idx + direction;
      if (idx < 0 || targetIdx < 0 || targetIdx >= items.length) return;
      const next = [...items];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      setItems(next);
      await reorderItems(
        collection.id,
        next.map((i) => i.id),
      );
    },
    [collection, items, reorderItems],
  );

  const handleItemPress = useCallback(
    (item: CollectionItem) => {
      if (!collection) return;
      if (collection.type === 'show_collection') {
        const md = item.itemMetadata as ShowCollectionItemMetadata;
        navigation.navigate('ShowDetail', {
          identifier: md.primaryIdentifier,
          date: md.date,
          venue: md.venue,
          location: md.location,
        });
      } else {
        const md = item.itemMetadata as PlaylistItemMetadata;
        // Tapping a track loads the playlist and plays this one.
        // Hook into existing player — call the same loader the Favorites Songs tab uses.
        // See FavoritesScreen.renderSongsTab → player.playTrack(...) for the shape.
        navigation.navigate('ShowDetail', {
          identifier: md.showIdentifier,
          trackTitle: md.trackTitle,
          date: md.showDate,
          venue: md.venue,
        });
      }
    },
    [collection, navigation],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: collection?.name ?? 'Collection',
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {collection && ownerUsername && (
            <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
              <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity
              onPress={() => {
                if (!collection) return;
                Alert.alert(collection.name, undefined, [
                  {
                    text: 'Rename',
                    onPress: () => {
                      setRenameText(collection.name);
                      setRenameOpen(true);
                    },
                  },
                  { text: 'Delete', style: 'destructive', onPress: handleDelete },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              style={styles.headerBtn}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [collection, isOwner, handleDelete, handleShare, navigation, ownerUsername]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!collection) return <Text style={styles.empty}>Collection not found.</Text>;

  return (
    <View style={styles.container}>
      {collection.description ? (
        <Text style={styles.description}>{collection.description}</Text>
      ) : null}
      {!isOwner && ownerUsername && (
        <Text style={styles.attribution}>by @{ownerUsername}</Text>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.empty}>No items yet.</Text>}
        renderItem={({ item, index }) => {
          const md = item.itemMetadata as any;
          const title =
            collection.type === 'playlist' ? md.trackTitle : md.title;
          const subtitle =
            collection.type === 'playlist'
              ? `${md.showDate}${md.venue ? ` · ${md.venue}` : ''}`
              : `${md.date}${md.venue ? ` · ${md.venue}` : ''}`;
          return (
            <View style={styles.row}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleItemPress(item)}
                onLongPress={
                  isOwner
                    ? () =>
                        Alert.alert(title, undefined, [
                          ...(collection.type === 'playlist'
                            ? [
                                { text: 'Move up', onPress: () => handleMove(item, -1) },
                                { text: 'Move down', onPress: () => handleMove(item, 1) },
                              ]
                            : []),
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => handleRemoveItem(item),
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ])
                    : undefined
                }
              >
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {renameOpen && collection && (
        <View style={styles.renameOverlay}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Rename Collection</Text>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              maxLength={80}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setRenameOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!renameText.trim()) return;
                  await renameCollection(collection.id, renameText.trim());
                  setRenameOpen(false);
                  setCollection({ ...collection, name: renameText.trim() });
                }}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background ?? '#000' },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  description: {
    color: COLORS.textSecondary,
    padding: 16,
    fontSize: 14,
  },
  attribution: {
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  title: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  renameOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  renameCard: {
    backgroundColor: COLORS.surface ?? '#111',
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  renameTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  renameInput: {
    backgroundColor: COLORS.surfaceElevated ?? '#222',
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  cancelText: { color: COLORS.textSecondary, fontSize: 15, padding: 10 },
  saveText: { color: COLORS.accent ?? '#4a90e2', fontSize: 15, fontWeight: '600', padding: 10 },
});
```

- [ ] **Step 3: Wire playlist playback**

Find how `FavoritesScreen` starts track playback from the Songs tab (search for `playTrack` or `setCurrentTrack` usage in `FavoritesScreen.tsx`). In `handleItemPress` for `'playlist'` collections, replace the `navigation.navigate('ShowDetail', …)` branch with the equivalent player call to start sequential playback using the playlist's items as the queue. Expect to call something like `player.loadQueue(items.map(i => i.itemMetadata as PlaylistItemMetadata), startIndex)`. If no queue API exists in the current player context, fall back to playing the single track (same call the favorites Songs tab uses); leave a `// TODO: queue` comment referencing this plan.

- [ ] **Step 4: Typecheck & manually verify**

Run: `npx tsc --noEmit` — expect clean.
Manual: on the Favorites > Collections tab, create a show collection, navigate into it, verify header actions (rename / delete / share), verify empty state text.

- [ ] **Step 5: Commit**

```bash
git add src/screens/CollectionDetailScreen.tsx
git commit -m "feat(collections): implement CollectionDetailScreen (owner + read-only modes)"
```

---

## Phase 6 — Add-to-collection picker

### Task 12: Build `AddToCollectionPicker`

**Files:**
- Create: `src/components/collections/AddToCollectionPicker.tsx`

- [ ] **Step 1: Write the picker**

```tsx
// src/components/collections/AddToCollectionPicker.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollections } from '../../contexts/CollectionsContext';
import { CreateCollectionModal } from './CreateCollectionModal';
import {
  CollectionType,
  CollectionItemMetadata,
  CollectionItem,
} from '../../types/collection.types';
import { collectionsService } from '../../services/collectionsService';
import { COLORS } from '../../constants/registry';

interface Props {
  visible: boolean;
  onClose: () => void;
  type: CollectionType;
  itemIdentifier: string;
  itemMetadata: CollectionItemMetadata;
}

export function AddToCollectionPicker({
  visible,
  onClose,
  type,
  itemIdentifier,
  itemMetadata,
}: Props) {
  const { collections, addItem, removeItem } = useCollections();
  const filtered = useMemo(
    () => collections.filter((c) => c.type === type),
    [collections, type],
  );
  const [createVisible, setCreateVisible] = useState(false);
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});

  // Load which of the user's collections already contain this item.
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const entries = await Promise.all(
        filtered.map(async (c) => {
          const items = await collectionsService.fetchCollectionItems(c.id);
          return [c.id, items.some((i) => i.itemIdentifier === itemIdentifier)] as const;
        }),
      );
      setMemberships(Object.fromEntries(entries));
    })();
  }, [visible, filtered, itemIdentifier]);

  const toggle = async (collectionId: string) => {
    if (memberships[collectionId]) {
      await removeItem(collectionId, itemIdentifier);
      setMemberships((prev) => ({ ...prev, [collectionId]: false }));
    } else {
      await addItem(collectionId, itemIdentifier, itemMetadata);
      setMemberships((prev) => ({ ...prev, [collectionId]: true }));
    }
  };

  const title = type === 'playlist' ? 'Add to Playlist' : 'Add to Collection';
  const newLabel = type === 'playlist' ? 'New Playlist' : 'New Collection';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            ListEmptyComponent={
              <Text style={styles.empty}>No {type === 'playlist' ? 'playlists' : 'collections'} yet.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => toggle(item.id)}>
                <Text style={styles.rowText}>{item.name}</Text>
                {memberships[item.id] && (
                  <Ionicons name="checkmark" size={20} color={COLORS.accent ?? '#4a90e2'} />
                )}
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.newBtn} onPress={() => setCreateVisible(true)}>
            <Ionicons name="add" size={20} color={COLORS.accent ?? '#4a90e2'} />
            <Text style={styles.newText}>{newLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CreateCollectionModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        initialType={type}
        onCreated={async (createdId) => {
          await addItem(createdId, itemIdentifier, itemMetadata);
          setMemberships((prev) => ({ ...prev, [createdId]: true }));
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.surface ?? '#111',
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: { color: COLORS.textPrimary, fontSize: 15 },
  empty: { color: COLORS.textSecondary, paddingHorizontal: 16, paddingVertical: 12 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceElevated ?? '#222',
  },
  newText: { color: COLORS.accent ?? '#4a90e2', fontSize: 15, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collections/AddToCollectionPicker.tsx
git commit -m "feat(collections): add AddToCollectionPicker modal"
```

### Task 13: Wire "Add to Collection" into `ShowDetailScreen`

**Files:**
- Modify: `src/screens/ShowDetailScreen.tsx`

- [ ] **Step 1: Add state and imports**

```tsx
import { AddToCollectionPicker } from '../components/collections/AddToCollectionPicker';
```

Inside the component body:

```tsx
const [addToCollectionVisible, setAddToCollectionVisible] = useState(false);
```

- [ ] **Step 2: Extend header actions**

Find the `navigation.setOptions({ headerRight: ... })` block (around lines 373–390). Replace the `headerRight` to include a folder-add button alongside the existing share button:

```tsx
headerRight: () => (
  <View style={{ flexDirection: 'row' }}>
    <TouchableOpacity
      onPress={() => setAddToCollectionVisible(true)}
      style={{ paddingHorizontal: 12, paddingVertical: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Add to collection"
    >
      <Ionicons name="folder-open-outline" size={22} color={COLORS.textPrimary} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={handleShareShow}
      style={{ paddingHorizontal: 12, paddingVertical: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Share show"
    >
      <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
    </TouchableOpacity>
  </View>
),
```

- [ ] **Step 3: Render the picker**

At the bottom of the screen's JSX (inside the root container, after existing content):

```tsx
<AddToCollectionPicker
  visible={addToCollectionVisible}
  onClose={() => setAddToCollectionVisible(false)}
  type="show_collection"
  itemIdentifier={show.primaryIdentifier}
  itemMetadata={{
    title: show.title,
    date: String(show.date),
    venue: show.venue,
    location: show.location,
    primaryIdentifier: show.primaryIdentifier,
  }}
/>
```

Adjust prop names (`show.title`, `show.date`, etc.) to match whatever the screen already destructures.

- [ ] **Step 4: Manual verify**

Open a show detail, tap the folder icon, pick a collection, verify item appears in that collection (check DB or navigate to Favorites > Collections > the collection).

- [ ] **Step 5: Commit**

```bash
git add src/screens/ShowDetailScreen.tsx
git commit -m "feat(show-detail): add 'Add to Collection' header action"
```

### Task 14: Wire "Add to Playlist" from song rows

**Files:**
- Modify: `src/screens/FavoritesScreen.tsx` (songs tab long-press)
- Modify: `src/screens/FullPlayerScreen.tsx` (overflow action — only if file exists; otherwise skip)

- [ ] **Step 1: Find the songs-tab row renderer**

In `FavoritesScreen.tsx`, locate `renderSongsTab` and the per-row `TouchableOpacity` or `Pressable`. Identify if there is already an `onLongPress` handler.

- [ ] **Step 2: Add picker state + handler**

Near existing state:

```tsx
const [pickerSong, setPickerSong] = useState<FavoriteSong | null>(null);
```

In the row component:

```tsx
onLongPress={() =>
  Alert.alert(song.trackTitle, undefined, [
    { text: 'Add to Playlist', onPress: () => setPickerSong(song) },
    { text: 'Cancel', style: 'cancel' },
  ])
}
```

- [ ] **Step 3: Render picker**

After the main content (inside the screen root, alongside `CreateCollectionModal`):

```tsx
{pickerSong && (
  <AddToCollectionPicker
    visible
    onClose={() => setPickerSong(null)}
    type="playlist"
    itemIdentifier={`${pickerSong.showIdentifier}::${pickerSong.trackId}`}
    itemMetadata={{
      trackId: pickerSong.trackId,
      trackTitle: pickerSong.trackTitle,
      showIdentifier: pickerSong.showIdentifier,
      showDate: pickerSong.showDate,
      venue: pickerSong.venue,
      streamUrl: pickerSong.streamUrl,
    }}
  />
)}
```

Add import:

```tsx
import { AddToCollectionPicker } from '../components/collections/AddToCollectionPicker';
```

- [ ] **Step 4: FullPlayerScreen overflow (optional)**

Check if `src/screens/FullPlayerScreen.tsx` exists and has an overflow/more menu. If yes, add an "Add to Playlist" action that opens the picker with the currently playing track as `itemMetadata`. If no such screen or no obvious overflow UI, skip this step and note it in the commit body.

- [ ] **Step 5: Manual verify**

Long-press a favorite song → tap "Add to Playlist" → pick a playlist → verify it's added (open the playlist in Collections tab).

- [ ] **Step 6: Commit**

```bash
git add src/screens/FavoritesScreen.tsx
git commit -m "feat(favorites): long-press song → Add to Playlist"
```

---

## Phase 7 — Public profile integration

### Task 15: Add Collections tab to `PublicProfileScreen`

**Files:**
- Modify: `src/screens/PublicProfileScreen.tsx`

- [ ] **Step 1: Fetch public collections**

Near existing state (around line 140):

```tsx
import { collectionsService } from '../services/collectionsService';
import { CollectionsTab } from '../components/collections/CollectionsTab';
import { Collection } from '../types/collection.types';

const [publicCollections, setPublicCollections] = useState<Collection[]>([]);
```

After the existing profile fetch effect, add:

```tsx
useEffect(() => {
  (async () => {
    if (!profile?.profile?.is_public) {
      setPublicCollections([]);
      return;
    }
    try {
      const data = await collectionsService.fetchPublicCollections(profile.profile.id);
      setPublicCollections(data);
    } catch {
      setPublicCollections([]);
    }
  })();
}, [profile]);
```

- [ ] **Step 2: Extend `TabType` and tab array**

Change `type TabType = 'shows' | 'songs';` → `'shows' | 'songs' | 'collections'`.

Update the tab rendering loop (around lines 563–578) similarly to Task 9:

```tsx
{(['shows', 'songs', 'collections'] as const).map((tab) => ( ... ))}
```

Include the label mapping `tab === 'collections' ? 'Collections' : ...`.

- [ ] **Step 3: Render Collections tab content**

Where the Shows/Songs tab content is selected, add:

```tsx
{activeTab === 'collections' && (
  <CollectionsTab
    collections={publicCollections}
    onCardPress={(c) =>
      navigation.navigate('CollectionDetail', {
        username: route.params.username,
        slug: c.slug,
        readOnly: true,
      })
    }
    emptyMessage="No public collections."
  />
)}
```

- [ ] **Step 4: Hide the Collections tab when profile is private**

Change the tab array to `['shows', 'songs', ...(profile?.profile?.is_public ? ['collections'] as const : [])]` or guard with a conditional inside the `.map`. Ensure `is_public` is already reflected in the existing public-profile render path.

- [ ] **Step 5: Manual verify**

Open your own public profile by URL, verify Collections tab shows your collections and navigates into read-only collection view.

- [ ] **Step 6: Commit**

```bash
git add src/screens/PublicProfileScreen.tsx
git commit -m "feat(profile): add Collections tab to public profile"
```

---

## Phase 8 — Sharing integration

### Task 16: Extend `shareService` for collections (TDD)

**Files:**
- Modify: `src/services/shareService.ts`
- Create: `src/services/__tests__/shareService.collection.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/shareService.collection.test.ts
import { buildShareUrl, buildShareText } from '../shareService';

describe('shareService — collection', () => {
  const base = {
    kind: 'collection' as const,
    collectionId: 'abc',
    ownerUsername: 'jerry',
    slug: 'best-77',
    name: 'Best 77',
    type: 'show_collection' as const,
    itemCount: 5,
  };

  it('builds a collection URL with bg param', () => {
    expect(buildShareUrl(base, 2)).toMatch(/\/profile\/jerry\/collection\/best-77\?bg=2$/);
  });

  it('builds share text for show collections', () => {
    expect(buildShareText(base)).toBe('Best 77 — 5 shows by @jerry');
  });

  it('builds share text for playlists', () => {
    expect(
      buildShareText({ ...base, type: 'playlist', name: 'Dark Stars', itemCount: 12 }),
    ).toBe('Dark Stars — 12 tracks by @jerry');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- shareService.collection`
Expected: FAIL (collection kind not handled).

- [ ] **Step 3: Extend `ShareItem`**

In `src/services/shareService.ts`, add a new union arm to `ShareItem`:

```ts
export type ShareItem =
  | { kind: 'show'; /* existing */ }
  | { kind: 'song'; /* existing */ }
  | { kind: 'profile'; /* existing */ }
  | {
      kind: 'collection';
      collectionId: string;
      ownerUsername: string;
      slug: string;
      name: string;
      type: 'show_collection' | 'playlist';
      itemCount: number;
    };
```

- [ ] **Step 4: Extend `buildShareUrl`**

Add a branch before the existing `show`/`song` handling:

```ts
if (item.kind === 'collection') {
  return `${WEB_ORIGIN}/profile/${item.ownerUsername}/collection/${item.slug}?bg=${clampBg(bg)}`;
}
```

- [ ] **Step 5: Extend `buildShareText`**

```ts
if (item.kind === 'collection') {
  const noun = item.type === 'playlist' ? 'tracks' : 'shows';
  return `${item.name} — ${item.itemCount} ${noun} by @${item.ownerUsername}`;
}
```

- [ ] **Step 6: Run tests — should pass**

Run: `npm test -- shareService.collection`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/services/shareService.ts src/services/__tests__/shareService.collection.test.ts
git commit -m "feat(share): extend shareService for collection items"
```

### Task 17: Update `ShareTray` to handle `kind: 'collection'`

**Files:**
- Modify: `src/components/share/ShareTray.tsx` (or wherever ShareTray lives)

- [ ] **Step 1: Locate ShareTray**

Open `src/components/share/ShareTray.tsx`. Inspect how it branches on `item.kind` to render headlines, preview image, etc.

- [ ] **Step 2: Add `collection` handling**

Mirror the `profile` case. The preview can reuse the profile-style card with the collection name as the headline, `"{itemCount} {noun}"` as the subhead, and the owner's username as a footer.

```tsx
case 'collection': {
  const noun = item.type === 'playlist' ? 'tracks' : 'shows';
  return (
    <View /* same style as profile preview */>
      <Text style={styles.headline}>{item.name}</Text>
      <Text style={styles.sub}>{item.itemCount} {noun}</Text>
      <Text style={styles.footer}>by @{item.ownerUsername}</Text>
    </View>
  );
}
```

Add the case to the main switch/branching, and ensure the share URL/text builders from Task 16 are used for the final share payload (the tray should already call `buildShareUrl`/`buildShareText`).

- [ ] **Step 3: Manual verify**

Open a collection detail → tap share → verify the share sheet opens with a preview, correct URL, and correct share text. Send to Messages and verify the link looks right.

- [ ] **Step 4: Commit**

```bash
git add src/components/share/ShareTray.tsx
git commit -m "feat(share): render collection preview in ShareTray"
```

---

## Phase 9 — Web URL routing

### Task 18: Add public collection link to `webLinking.ts`

**Files:**
- Modify: `src/navigation/webLinking.ts`

- [ ] **Step 1: Add the route**

Add to the linking config alongside `PublicProfile`:

```ts
CollectionDetail: {
  path: 'profile/:username/collection/:slug',
  parse: {
    username: (v: string) => decodeURIComponent(v),
    slug: (v: string) => decodeURIComponent(v),
  },
  stringify: {
    username: (v: string) => encodeURIComponent(v),
    slug: (v: string) => encodeURIComponent(v),
  },
},
```

Ensure the route config passes `readOnly: true` when entered from web. If the linking config does not support static param injection, handle this in `CollectionDetailScreen`: treat any navigation arriving with `username && slug && !collectionId` as implicitly read-only (this matches how `CollectionDetailScreen` already computes `readOnly` from route params — update the fallback: `const readOnly = !!route.params?.readOnly || (!!route.params?.username && !user);`).

- [ ] **Step 2: Manual verify (web)**

Run the web app locally. Navigate to `/profile/<username>/collection/<slug>` for a known collection. Verify the page loads in read-only mode.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/webLinking.ts src/screens/CollectionDetailScreen.tsx
git commit -m "feat(web): route /profile/:username/collection/:slug to CollectionDetail"
```

---

## Phase 10 — Final verification

### Task 19: End-to-end manual test pass

- [ ] **Step 1: Sign in as a test user (native or web)**

- [ ] **Step 2: Create a show collection**

Favorites → Collections → + under Show Collections → name it → Create. Verify it appears in the list.

- [ ] **Step 3: Add a show to it**

Open a show detail → folder-icon in header → check the collection → close picker. Go to Favorites > Collections > that collection → verify the show is present.

- [ ] **Step 4: Rename the collection**

From the detail screen overflow → Rename → verify the name updates and the slug updates (check by tapping share → inspecting URL).

- [ ] **Step 5: Share**

Tap share → verify URL has the form `/profile/<username>/collection/<slug>`. Paste it in another browser window — verify the read-only public view loads.

- [ ] **Step 6: Create a playlist**

Favorites → Collections → + under Playlists. Long-press a favorite song → Add to Playlist → pick the new playlist. Open it and verify order and reorder (long-press → Move up/Move down).

- [ ] **Step 7: Remove an item**

Long-press an item → Remove. Verify it disappears and the item count updates.

- [ ] **Step 8: Public profile tab**

Navigate to your own public profile via URL. Verify Collections tab shows both the collection and playlist. Tap into each — verify read-only.

- [ ] **Step 9: Private profile check**

Toggle your profile to private. Reload the public profile URL → verify the Collections tab is hidden. But: open the direct collection link — it should still load.

- [ ] **Step 10: Delete a collection**

From the detail screen overflow → Delete. Confirm. Verify the collection disappears and that the direct link now shows "Collection not found."

- [ ] **Step 11: Commit any minor fixes found**

If bugs surfaced and were fixed, commit per-bug with `fix(...)` prefix.

---

## Self-review notes

- Every spec requirement is covered:
  - Data model → Task 1, Task 2
  - Service layer → Tasks 3, 4
  - Context → Task 5
  - Favorites Collections tab + creation → Tasks 6, 7, 8, 9
  - Collection Detail screen → Tasks 10, 11
  - Add to collection picker + entry points → Tasks 12, 13, 14
  - Public profile Collections tab → Task 15
  - Sharing → Tasks 16, 17
  - Web URL routing → Task 18
  - End-to-end verification → Task 19

- Type consistency verified: `Collection`, `CollectionItem`, `CollectionType`, `CollectionItemMetadata`, `ShowCollectionItemMetadata`, `PlaylistItemMetadata` all defined in Task 2 and reused consistently in Tasks 4, 5, 6, 7, 8, 11, 12, 14, 16.

- Item identifier scheme: shows use `primaryIdentifier`; playlist tracks use `${showIdentifier}::${trackId}` — applied consistently in Tasks 13 and 14.

- All share-path strings use `/profile/{username}/collection/{slug}` (Task 16, Task 18).
