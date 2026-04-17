# Native Track Long-Press Menu — Design

**Date:** 2026-04-16
**Status:** Approved for implementation planning

## Goal

On native (iOS/Android), let users long-press a track in `ShowDetailScreen` to open a quick action menu with "Add to Playlist" and "Add to Favorites" (or their remove variants). Today these actions exist only as hover/click icon buttons on web — `TrackItem` hides them entirely when `Platform.OS !== 'web'` (`src/components/TrackItem.tsx:46-48`), so native users have no way to add a track to a playlist or favorites from the show's track list.

## Scope

- Native only (`Platform.OS !== 'web'`). Web behavior is unchanged — the existing hover-revealed `+` and `♥` icon buttons continue to be the entry points there.
- Applies to `TrackItem` as rendered in `ShowDetailScreen`. Other `TrackItem` usages do not currently exist.
- Uses the existing `AddToCollectionPicker` for the playlist picker (already rendered in `ShowDetailScreen`) and the existing favorites-toggle path (already wired via `onToggleSave`).

Out of scope: adding long-press to `SongCard` (it already has a separate long-press menu inside playlists); any rating/share/queue actions; any web changes.

## Trigger

- Long-press a `TrackItem` row on native → show `Alert.alert` with the two actions described below plus Cancel.
- Tap behavior is unchanged: `onPress` still plays the track.

## Menu Contents

Two options, in this order, plus a Cancel at the bottom:

1. **Add to Playlist** (label always "Add to Playlist" regardless of existing membership — consistent with the web `+` button's intent of "open the picker"). Opens `AddToCollectionPicker` with `type: 'playlist'` for the long-pressed track. The picker itself supports both adding and removing via checkmarks.
2. **Add to Favorites** / **Remove from Favorites** — label flips based on the current `isSaved` state of the track. Invokes the same `onToggleSave(track)` already used by the web heart button.
3. **Cancel** — `style: 'cancel'`.

`Alert.alert`'s title is the track title for context.

## Component Changes

### `src/components/TrackItem.tsx`

- Add two new optional props to `TrackItemProps`:
  - `onLongPress?: (track: Track) => void;` — the only new wiring required. Fires on long-press.
- Wire `onLongPress` to the root `TouchableOpacity` with a native-only guard: pass it through only when `Platform.OS !== 'web'`, so web behavior is unaffected.
- No visual change. No new icons, labels, or styles.

Rationale for keeping menu-building out of `TrackItem`: the Alert's labels depend on `isSaved`, and `TrackItem` does not own the add-to-playlist picker. The parent screen is the right place to assemble the menu.

### `src/screens/ShowDetailScreen.tsx`

All the underlying wiring already exists (see `ShowDetailScreen.tsx:727-738`):
- `setPickerTrack(track)` opens the `AddToCollectionPicker` for a specific track (bound to the web `+` button via `onAddToPlaylist`).
- `handleToggleSaveSong(track)` toggles favorite state (bound to the web `♥` button via `onToggleSave`).
- `isSongFavorite(track.id, show.identifier)` returns the current saved state per track.

Add a `handleTrackLongPress(track: Track)` callback:
- Early-return on web (`Platform.OS === 'web'`) so the existing hover/click UX remains the only path there.
- Compute `const saved = isSongFavorite(track.id, show.identifier)`.
- `Alert.alert(track.title, undefined, buttons)` where `buttons` is:
  - `{ text: 'Add to Playlist', onPress: () => setPickerTrack(track) }`
  - `{ text: saved ? 'Remove from Favorites' : 'Add to Favorites', onPress: () => handleToggleSaveSong(track) }`
  - `{ text: 'Cancel', style: 'cancel' }`

Pass `onLongPress={handleTrackLongPress}` to `TrackItem` at the call site (`ShowDetailScreen.tsx:727`).

## Non-Goals

- No new feature flags.
- No changes to `AddToCollectionPicker`.
- No changes to the favorites context or service.
- No new tests — matches the codebase convention (no component-level tests exist for `TrackItem` or `ShowDetailScreen`). Manual verification on native.
- No haptic feedback on long-press (low-effort polish; can be added later without redesign).
