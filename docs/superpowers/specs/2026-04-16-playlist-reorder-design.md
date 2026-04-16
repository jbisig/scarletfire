# Playlist Reorder — Design

**Date:** 2026-04-16
**Status:** Approved for implementation planning

## Goal

Let playlist owners put songs in any order they choose. Today the order is fixed to the order of addition: web has no reorder UI, and native only exposes a clunky one-step "Move up / Move down" long-press menu. We replace this with an explicit Reorder mode that uses drag-and-drop with a visible handle on each row, consistent across native and web.

## Scope

- Playlist collections only (`collection.type === 'playlist'`).
- Owner-only feature (`isOwner === true`). Non-owners, saved-collection viewers, and public-link viewers are unaffected.
- All three platforms: iOS, Android, and web.

Out of scope: show collections (they already have a Sort dropdown), multi-select reorder, "Move to top / bottom" shortcuts, keyboard reordering, haptic feedback on drop.

## Entry Point

- Add a **"Reorder"** item to the existing three-dot menu in `CollectionDetailScreen`.
- Visibility conditions: `isOwner && collection.type === 'playlist' && items.length >= 2`. Hidden otherwise.
- Positioned above "Duplicate", below "Rename" in the owner-menu ordering.
- Tapping "Reorder" closes the menu and sets `reorderMode = true`.

## Reorder Mode

A single new piece of screen state: `reorderMode: boolean`, owned by `CollectionDetailScreen`.

### Header transformation
While `reorderMode` is on, the `pillsRow` collapses to a single right-aligned **Done** pill. Shuffle / Save / Share / ⋯ pills are hidden.

### Row rendering while in reorder mode
- The drag handle (`Ionicons "reorder-three"`) replaces the × (remove) button on the right of each row.
- `SongCard` is rendered with `onPress={undefined}` so tapping a row does nothing — no accidental playback.
- The `onLongPress` Alert menu is suppressed.

### Exiting reorder mode
- Explicit: tap the **Done** pill → `reorderMode = false`.
- Automatic: on route change (leaving the screen), on the playlist becoming empty, or if `isOwner` transitions to `false` (e.g., session ends). These are defensive; the normal path is the Done pill.

## Draggable List Component

New component `SortableTrackList` with a platform split matching the existing `.native.ts` / `.web.ts` pattern in this codebase:

- `src/components/collections/SortableTrackList.native.tsx`
- `src/components/collections/SortableTrackList.web.tsx`

Metro resolves these automatically by platform; no explicit re-export module is needed. Callers `import { SortableTrackList } from '../components/collections/SortableTrackList'`.

### Shared props

```ts
type SortableTrackListProps = {
  items: CollectionItem[];
  onReorder: (next: CollectionItem[]) => void;
  renderItem: (item: CollectionItem) => React.ReactNode;
};
```

`renderItem` returns a fully-rendered row (SongCard with tap disabled). The sortable wrapper is responsible for positioning, the drag handle, and the drop interaction. This keeps row presentation in one place (`CollectionDetailScreen`) and platform-specific concerns inside the sortable component.

### Native implementation

- Library: `react-native-draggable-flatlist`. Built on `react-native-gesture-handler` and `react-native-reanimated`, both already installed in this project.
- Press-and-hold the ≡ handle to pick up a row.
- Library handles auto-scroll near list edges and the lift animation.
- On drop, call `onReorder(nextOrder)` with the new array.

### Web implementation

- Libraries: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- `useSortable` hook per row, with drag listeners attached to the handle element only (not the row), so normal page scroll and row content remain unaffected.
- `DndContext` + `SortableContext` wrap the list.
- On drop, call `onReorder(nextOrder)` with the new array.

## Persistence

Generalize the existing `handleMove` into `handleReorder(nextOrder: CollectionItem[])`:

1. Snapshot `prev = items`.
2. Optimistically `setItems(nextOrder)`.
3. `await reorderItems(collection.id, nextOrder.map(i => i.id))` via `CollectionsContext`. This API already supports full-list reorder; no schema or context changes are required.
4. On error: refetch items via `fetchItems(collection.id)` to reconcile any partial DB writes. If refetch itself fails, restore `prev`. Log via `logger.player.error`. Surface a non-blocking notice via `Alert.alert("Couldn't save new order", "Please try again.")` — matching the existing cross-platform error pattern elsewhere in this screen.

The existing `handleMove(item, direction)` call-site is deleted along with the "Move up"/"Move down" options in the long-press Alert (see next section).

## Long-Press Menu Cleanup (Native)

The long-press Alert in `CollectionDetailScreen` currently offers:
- Move up
- Move down
- Remove
- Cancel

After this change:
- Move up / Move down are removed (obsoleted by Reorder mode).
- Remove and Cancel remain.

## Files Affected

- `src/screens/CollectionDetailScreen.tsx`
  - Add `reorderMode` state, `handleReorder` callback.
  - Add "Reorder" menu item to the three-dot menu.
  - Swap `pillsRow` to the Done-pill variant when in reorder mode.
  - Route playlist rows through `SortableTrackList` when in reorder mode; keep the current `map(...)` rendering otherwise.
  - Remove Move up / Move down options from the long-press Alert.
  - Delete the now-unused `handleMove`.
- `src/components/collections/SortableTrackList.native.tsx` — new file.
- `src/components/collections/SortableTrackList.web.tsx` — new file.
- `package.json` — add `react-native-draggable-flatlist` (native) and `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (web).

No context changes. No service-layer changes. No schema changes.

## Non-Goals

- No reorder on show collections.
- No multi-select reorder.
- No "Move to top / Move to bottom" shortcut actions.
- No keyboard-based reordering on web (revisit if requested for a11y).
- No haptic feedback on pickup or drop (small polish; can add later without redesign).
