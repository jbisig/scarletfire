# Playlist Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let playlist owners reorder songs via drag-and-drop, triggered from a "Reorder" item in the three-dot menu, on iOS/Android/web.

**Architecture:** Add a `reorderMode` state on `CollectionDetailScreen`. When on, the header pill row collapses to a single "Done" pill and playlist rows render through a new `SortableTrackList` component with a platform split — native uses `react-native-draggable-flatlist`, web uses `@dnd-kit`. Persistence generalizes the existing `handleMove` handler to accept an arbitrary full-list ordering; it calls the existing `reorderItems` context method, which is already wired end-to-end.

**Tech Stack:** React Native (Expo), TypeScript, `react-native-draggable-flatlist` (native), `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (web), Jest. Relies on `react-native-gesture-handler` + `react-native-reanimated` (already installed); `GestureHandlerRootView` is already mounted in `App.tsx`.

**Testing note:** This codebase tests pure utilities and services with Jest. It does **not** have screen-level integration tests, and that convention is preserved here. No existing screen has a test file; forcing one for `CollectionDetailScreen` would be a departure from the codebase. Tasks therefore emphasize implementation plus manual verification steps on native and web, with no new unit tests (there is no pure helper to extract — both drag libraries do the array manipulation internally).

---

## File Structure

**New files:**
- `src/components/collections/SortableTrackList.web.tsx` — dnd-kit-based sortable list. Renders children via a render-prop; owns drag handle placement.
- `src/components/collections/SortableTrackList.native.tsx` — react-native-draggable-flatlist-based sortable list. Same public API as the web version.

**Modified files:**
- `src/screens/CollectionDetailScreen.tsx` — add `reorderMode` state, `handleReorder` callback, "Reorder" menu item, Done pill, conditional SortableTrackList rendering. Remove Move up / Move down from the long-press Alert. Delete unused `handleMove`.
- `package.json` — add dependencies.

**Platform resolution:** Metro resolves `.native.tsx` and `.web.tsx` automatically. Callers import from `'../components/collections/SortableTrackList'` with no extension — no re-export module needed.

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install native dep**

Run:
```bash
npm install react-native-draggable-flatlist
```

Expected: installs cleanly, adds to `dependencies`.

- [ ] **Step 2: Install web deps**

Run:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: installs cleanly, adds three entries to `dependencies`.

- [ ] **Step 3: Verify the app still runs**

Run in one terminal: `npm run start`
Expected: Metro bundler starts without errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add drag-and-drop libraries for playlist reorder"
```

---

## Task 2: Create `SortableTrackList.web.tsx`

**Files:**
- Create: `src/components/collections/SortableTrackList.web.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ionicons } from '@expo/vector-icons';
import { CollectionItem } from '../../types/collection.types';
import { COLORS } from '../../constants/theme';

type Props = {
  items: CollectionItem[];
  onReorder: (next: CollectionItem[]) => void;
  renderItem: (item: CollectionItem) => React.ReactNode;
};

function SortableRow({
  item,
  children,
}: {
  item: CollectionItem;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  };

  return (
    // @ts-ignore — dnd-kit uses DOM refs; this file is web-only.
    <div ref={setNodeRef} style={style} {...attributes}>
      <View style={{ flex: 1 }}>{children}</View>
      <TouchableOpacity
        style={styles.handle}
        // @ts-ignore — dnd-kit listeners are DOM event handlers.
        {...listeners}
        accessibilityLabel="Drag to reorder"
      >
        <Ionicons name="reorder-three" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </div>
  );
}

export function SortableTrackList({ items, onReorder, renderItem }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableRow key={item.id} item={item}>
            {renderItem(item)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}

const styles = StyleSheet.create({
  handle: {
    padding: 8,
    // @ts-ignore — web only
    cursor: 'grab',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (The `@ts-ignore` comments cover the DOM/RN boundary intentionally.)

- [ ] **Step 3: Commit**

```bash
git add src/components/collections/SortableTrackList.web.tsx
git commit -m "feat(collections): add SortableTrackList web implementation"
```

---

## Task 3: Create `SortableTrackList.native.tsx`

**Files:**
- Create: `src/components/collections/SortableTrackList.native.tsx`

**Note on nested scrolling:** `CollectionDetailScreen` wraps its content in a `ScrollView`. `DraggableFlatList` is itself a scrollable list, so we render it with `scrollEnabled={false}` — the outer `ScrollView` owns scrolling. This means auto-scroll-near-edges during drag is effectively disabled. For typical playlist sizes (<30 items) this is acceptable; users can release and scroll separately. A future enhancement could hoist scrolling into the list when in reorder mode.

- [ ] **Step 1: Create the file**

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { CollectionItem } from '../../types/collection.types';
import { COLORS } from '../../constants/theme';

type Props = {
  items: CollectionItem[];
  onReorder: (next: CollectionItem[]) => void;
  renderItem: (item: CollectionItem) => React.ReactNode;
};

export function SortableTrackList({ items, onReorder, renderItem }: Props) {
  const renderRow = ({ item, drag, isActive }: RenderItemParams<CollectionItem>) => {
    return (
      <ScaleDecorator>
        <View style={[styles.row, isActive && styles.rowActive]}>
          <View style={{ flex: 1 }}>{renderItem(item)}</View>
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={styles.handle}
            accessibilityLabel="Drag to reorder"
          >
            <Ionicons name="reorder-three" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
      onDragEnd={({ data }) => onReorder(data)}
      activationDistance={10}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowActive: { opacity: 0.85 },
  handle: { padding: 8 },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/collections/SortableTrackList.native.tsx
git commit -m "feat(collections): add SortableTrackList native implementation"
```

---

## Task 4: Add reorder state and handler to `CollectionDetailScreen`

**Files:**
- Modify: `src/screens/CollectionDetailScreen.tsx`

- [ ] **Step 1: Import SortableTrackList**

Near the other component imports in `src/screens/CollectionDetailScreen.tsx` (around line 40, after the `SortDropdown` import), add:

```tsx
import { SortableTrackList } from '../components/collections/SortableTrackList';
```

- [ ] **Step 2: Add `reorderMode` state**

Inside `CollectionDetailScreen()`, next to the other `useState` hooks near the top of the component (around line 145, near `showSortModalVisible`), add:

```tsx
const [reorderMode, setReorderMode] = useState(false);
```

- [ ] **Step 3: Replace `handleMove` with `handleReorder`**

Locate the existing `handleMove` (currently around lines 395–423). Replace the whole `handleMove` definition with:

```tsx
const handleReorder = useCallback(
  async (nextOrder: CollectionItem[]) => {
    if (!collection) return;
    const prev = items;
    setItems(nextOrder);
    try {
      await reorderItems(
        collection.id,
        nextOrder.map((i) => i.id),
      );
    } catch (e) {
      logger.player.error('Reorder failed, reconciling with server', e);
      try {
        const fresh = await fetchItems(collection.id);
        setItems(fresh);
      } catch {
        setItems(prev);
      }
      Alert.alert("Couldn't save new order", 'Please try again.');
    }
  },
  [collection, items, reorderItems, fetchItems],
);
```

- [ ] **Step 4: Auto-exit reorder mode when items drop below 2 or ownership is lost**

Directly after `handleReorder`, add:

```tsx
useEffect(() => {
  if (reorderMode && (!isOwner || items.length < 2)) {
    setReorderMode(false);
  }
}, [reorderMode, isOwner, items.length]);
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: `handleMove` is no longer referenced (step 6 cleans up the call site), so transient TS errors are OK here — fix them in the next steps.

---

## Task 5: Wire "Reorder" into the three-dot menu

**Files:**
- Modify: `src/screens/CollectionDetailScreen.tsx`

- [ ] **Step 1: Add the menu item**

In the three-dot menu `<Modal>` (around lines 744–813), find the `{isOwner && (<> ... Rename ... </>)}` block. Directly after the Rename `TouchableOpacity` and inside the same `isOwner` fragment, add a Reorder item:

```tsx
{isOwner && collection.type === 'playlist' && items.length >= 2 && (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => {
      setMenuVisible(false);
      setReorderMode(true);
    }}
  >
    <Ionicons name="swap-vertical-outline" size={16} color={COLORS.textPrimary} />
    <Text style={styles.menuItemText}>Reorder</Text>
  </TouchableOpacity>
)}
```

The condition is deliberately separate from the outer `isOwner` fragment so the entry hides automatically for show collections and one-item playlists.

- [ ] **Step 2: Manual sanity check**

Run the app on web: `npm run web`
Navigate to one of your own playlists with 2+ songs.
Tap the three-dot menu.
Expected: "Reorder" appears above Duplicate.
Tap Reorder.
Expected: menu closes (reorder mode is on but no visible UI change yet — the next task wires the header, and the following task wires the list).

---

## Task 6: Swap the header pills for "Done" while in reorder mode

**Files:**
- Modify: `src/screens/CollectionDetailScreen.tsx`

- [ ] **Step 1: Replace the `pillsRow` rendering**

In the `header` JSX (around lines 584–625), find the `<View style={styles.pillsRow}>` block. Replace that entire `<View>` (and the conditional children inside it) with a ternary:

```tsx
{reorderMode ? (
  <View style={styles.pillsRow}>
    <TouchableOpacity
      style={styles.pill}
      onPress={() => setReorderMode(false)}
      activeOpacity={0.7}
      accessibilityLabel="Exit reorder mode"
    >
      <Ionicons name="checkmark" size={17} color={COLORS.textPrimary} />
      <Text style={styles.pillText}>Done</Text>
    </TouchableOpacity>
  </View>
) : (
  <View style={styles.pillsRow}>
    {collection.type === 'playlist' && items.length > 0 && (
      <TouchableOpacity style={styles.pill} onPress={handleShuffle} activeOpacity={0.7}>
        <Ionicons name="shuffle" size={17} color={COLORS.textPrimary} />
        <Text style={styles.pillText}>Shuffle</Text>
      </TouchableOpacity>
    )}
    {isNonOwnerViewer && collection && (
      <TouchableOpacity
        style={styles.pill}
        onPress={handleToggleSave}
        activeOpacity={0.7}
        accessibilityLabel={saved ? 'Unsave collection' : 'Save collection'}
      >
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={17}
          color={COLORS.textPrimary}
        />
        <Text style={styles.pillText}>{saved ? 'Saved' : 'Save'}</Text>
      </TouchableOpacity>
    )}
    {collection && ownerUsername && (
      <TouchableOpacity style={styles.pill} onPress={handleShare} activeOpacity={0.7}>
        <Ionicons name="share-outline" size={17} color={COLORS.textPrimary} />
        <Text style={styles.pillText}>Share</Text>
      </TouchableOpacity>
    )}
    {collection && (
      <View ref={menuButtonRef} collapsable={false}>
        <TouchableOpacity
          style={styles.menuCircleBtn}
          activeOpacity={0.7}
          onPress={handleMenuPress}
          accessibilityRole="button"
          accessibilityLabel="More actions"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    )}
  </View>
)}
```

- [ ] **Step 2: Manual verify**

On web: open a playlist, open the three-dot menu, tap Reorder.
Expected: the pills row now shows only a "Done" pill.
Tap Done.
Expected: returns to Shuffle / Share / ⋯.

- [ ] **Step 3: Commit progress so far (tasks 4–6)**

```bash
git add src/screens/CollectionDetailScreen.tsx
git commit -m "feat(collections): add reorder mode state, menu item, and Done pill"
```

---

## Task 7: Render `SortableTrackList` when in reorder mode

**Files:**
- Modify: `src/screens/CollectionDetailScreen.tsx`

- [ ] **Step 1: Extract a row renderer**

Above the `return (...)` statement in `CollectionDetailScreen`, add a helper that renders one playlist row without the × button. It accepts an `interactive` flag that disables tap/long-press when in reorder mode:

```tsx
const renderPlaylistRowContent = useCallback(
  (item: CollectionItem, interactive: boolean) => {
    const md = item.itemMetadata as PlaylistItemMetadata;
    const song = {
      trackId: md.trackId,
      trackTitle: md.trackTitle,
      showIdentifier: md.showIdentifier,
      showDate: md.showDate,
      venue: md.venue,
      streamUrl: md.streamUrl,
    };
    return (
      <SongCard
        song={song}
        onPress={interactive ? () => handleTrackPress(md) : undefined}
        onLongPress={
          interactive && isOwner
            ? () =>
                Alert.alert(md.trackTitle, undefined, [
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => confirmRemoveItem(item),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ])
            : undefined
        }
      />
    );
  },
  [handleTrackPress, confirmRemoveItem, isOwner],
);
```

Note: the long-press Alert no longer lists "Move up" / "Move down" — the whole reorder UX is now the explicit mode. This supersedes the behavior cleanup described in Task 8 below; we're doing it here as part of the same row re-render.

- [ ] **Step 2: Swap the playlist body**

Find the `collection.type === 'show_collection' ? (...) : (...)` ternary that renders the playlist body (around lines 662–733). Replace the playlist (`else`) branch with:

```tsx
<View style={[styles.playlistBody, isDesktop && styles.listBodyDesktop]}>
  {reorderMode ? (
    <SortableTrackList
      items={items}
      onReorder={handleReorder}
      renderItem={(item) => renderPlaylistRowContent(item, false)}
    />
  ) : (
    items.map((item) => (
      <View key={item.id} style={styles.playlistRow}>
        <View style={{ flex: 1 }}>{renderPlaylistRowContent(item, true)}</View>
        {isOwner && (
          <TouchableOpacity
            style={styles.removeIconBtn}
            onPress={() => confirmRemoveItem(item)}
            accessibilityLabel="Remove from playlist"
          >
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    ))
  )}
</View>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. `handleMove` is fully removed (renamed to `handleReorder` in Task 4) and no references remain. If TS reports `handleMove` missing somewhere, search and delete the stale reference.

- [ ] **Step 4: Commit**

```bash
git add src/screens/CollectionDetailScreen.tsx
git commit -m "feat(collections): render SortableTrackList in reorder mode"
```

---

## Task 8: Manual end-to-end verification

**Files:** none — this is verification only.

- [ ] **Step 1: Web verification**

Run: `npm run web`

Verify the following on a playlist with 3+ songs owned by the signed-in user:

1. Three-dot menu shows Rename / **Reorder** / Duplicate / Delete.
2. Tap Reorder → pills collapse to "Done"; each row shows a drag handle on the right; the × button is hidden; tapping a row does nothing.
3. Click-and-hold the drag handle on row #2 and drag it above row #1. Release.
4. Rows visibly swap. Refresh the page — the new order persists.
5. Tap Done → returns to normal mode; Shuffle / Share / ⋯ are back; × buttons are back; tapping a row plays it.
6. Open the menu on a playlist with exactly 1 song → Reorder item is hidden.
7. Open the menu on a show collection → Reorder item is hidden.
8. Open the menu on a playlist owned by someone else (e.g., a saved one) → Reorder item is hidden.

- [ ] **Step 2: iOS verification**

Run: `npm run ios` (or use Expo dev client).

Repeat steps 1–8 from Step 1, with this difference in step 3: long-press the drag handle (activation distance 10) to pick the row up, then drag.

Additionally:
9. Long-press a row in *normal* mode → Alert shows "Remove" and "Cancel" only (no Move up / Move down).

- [ ] **Step 3: Android verification**

Run: `npm run android`.

Repeat steps 1–9 from Steps 1 & 2.

- [ ] **Step 4: Error-path spot check (optional but recommended)**

Temporarily force a failure: in `src/services/collectionsService.ts`, inside `reorderCollectionItems`, add `throw new Error('boom')` at the top of the function body. Reload the app, reorder a playlist.

Expected:
- Alert appears: "Couldn't save new order — Please try again."
- The list snaps back to server state (pre-reorder order) because `fetchItems` reconciles.

Revert the forced throw before committing anything else.

- [ ] **Step 5: Commit the verification pass**

No code changes expected in this task — if the verification surfaced bugs, fix them in a follow-up commit with a clear message. Otherwise proceed.

```bash
git status
# Expect: working tree clean
```

---

## Self-Review Notes

**Spec coverage:**
- Entry point (Reorder menu item, owner/playlist/≥2 items) → Task 5.
- Reorder mode state + header transformation → Tasks 4 & 6.
- Row rendering (drag handle, tap disabled, × hidden, long-press suppressed in reorder mode) → Task 7.
- Exit via Done pill + auto-exit on empty/non-owner → Tasks 4 & 6.
- `SortableTrackList` platform split → Tasks 2 & 3.
- Persistence via `reorderItems` with optimistic update, refetch-on-error, restore fallback, `Alert.alert` notice → Task 4 (and spot-checked in Task 8).
- Long-press cleanup (Move up / Move down removed; Remove kept) → Task 7.
- All three platforms verified → Task 8.

**No placeholders.** Every step contains the actual code/command/expected output.

**Type consistency:** `handleReorder(nextOrder: CollectionItem[])`, `SortableTrackList` props, `CollectionItem`, `PlaylistItemMetadata` — all refer to existing types imported at the top of the files they appear in. The `renderItem` prop signature is the same across web/native implementations.
