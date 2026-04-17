# Native Track Long-Press Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On native (iOS/Android), let users long-press a `TrackItem` in `ShowDetailScreen` to open an `Alert.alert` menu with "Add to Playlist", "Add to Favorites" (label flips to "Remove from Favorites" when already saved), and Cancel.

**Architecture:** Add an optional `onLongPress` prop to `TrackItem` and pass it through to the root `TouchableOpacity` only when `Platform.OS !== 'web'`. In `ShowDetailScreen`, add a `handleTrackLongPress` callback that assembles the Alert using the already-existing `setPickerTrack`, `handleToggleSaveSong`, and `isSongFavorite` handlers. Web behavior is untouched — the existing hover/click icon buttons remain the entry point there.

**Tech Stack:** React Native (Expo), TypeScript. No new dependencies.

**Testing note:** This codebase does not have component-level tests for `TrackItem` or `ShowDetailScreen`. Matching the codebase convention: no unit tests; manual verification on native (Task 3).

---

## File Structure

**Modified files:**
- `src/components/TrackItem.tsx` — add optional `onLongPress` prop and wire it to the root `TouchableOpacity`, native-only.
- `src/screens/ShowDetailScreen.tsx` — add `handleTrackLongPress` callback and pass it to `TrackItem`.

**New files:** none.

---

## Task 1: Add `onLongPress` to `TrackItem`

**Files:**
- Modify: `src/components/TrackItem.tsx`

- [ ] **Step 1: Add the prop to `TrackItemProps`**

In `src/components/TrackItem.tsx`, find the `TrackItemProps` interface (starts at line 10). Add a new optional prop directly after `onAddToPlaylist` (currently line 20). The full interface should look like this after the edit:

```tsx
interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPress: (track: Track) => void;
  rating?: 1 | 2 | 3 | null;
  /** Web only: whether this song is saved as a favorite */
  isSaved?: boolean;
  /** Web only: callback to toggle save state */
  onToggleSave?: (track: Track) => void;
  /** Web only: callback to open Add-to-Playlist picker for this track */
  onAddToPlaylist?: (track: Track) => void;
  /** Native only: callback for long-press — parent assembles the action menu */
  onLongPress?: (track: Track) => void;
  /** Web only: number of playlists this track is currently in (for pill badge) */
  playlistCount?: number;
  /**
   * True when this track was selected by URL-driven navigation (share link
   * or pasted URL). Renders a sustained highlight distinct from `isPlaying`.
   * When `isPlaying` becomes true on the same track, the playing state wins
   * and the selected highlight is hidden.
   */
  isSelected?: boolean;
}
```

- [ ] **Step 2: Destructure `onLongPress` from props**

Find the destructuring in `React.memo<TrackItemProps>(({...}) => {` (line 36). Add `onLongPress` alongside the other props. Result:

```tsx
export const TrackItem = React.memo<TrackItemProps>(({ track, isPlaying, onPress, rating, isSaved, onToggleSave, onAddToPlaylist, onLongPress, playlistCount = 0, isSelected }) => {
```

- [ ] **Step 3: Wire `onLongPress` to the root `TouchableOpacity`**

Find the root `TouchableOpacity` (starts at line 51). Add an `onLongPress` handler that is active only on native. Insert it directly after the `onPress` line (line 60). The relevant JSX should look like:

```tsx
<TouchableOpacity
  style={[
    styles.container,
    isDesktop && styles.containerDesktop,
    isPlaying && styles.playing,
    isPlaying && isDesktop && styles.playingDesktop,
    isSelected && !isPlaying && styles.selected,
    isDesktop && isHovered && !isPlaying && !isSelected && styles.hovered,
  ]}
  onPress={() => onPress(track)}
  onLongPress={Platform.OS !== 'web' && onLongPress ? () => onLongPress(track) : undefined}
  activeOpacity={0.7}
  accessibilityRole="button"
  accessibilityLabel={accessibilityLabel}
  accessibilityHint="Double tap to play this track"
  accessibilityState={{ selected: isPlaying || isSelected }}
  // @ts-ignore - web only mouse events
  onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
  onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
>
```

The guard `Platform.OS !== 'web' && onLongPress` ensures two things: (1) web never fires a long-press (web keeps its hover/click buttons), and (2) if a parent doesn't pass `onLongPress`, the prop is `undefined` and `TouchableOpacity` treats the row as non-long-pressable (no no-op handler installed).

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`

Expected: no new errors from `TrackItem.tsx`. Pre-existing unrelated errors (platform-split module resolution, `outlineStyle` issues in `AnimatedSearchBar`, etc.) remain unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/TrackItem.tsx
git commit -m "$(cat <<'EOF'
feat(tracks): add onLongPress prop to TrackItem (native only)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Wire `handleTrackLongPress` in `ShowDetailScreen`

**Files:**
- Modify: `src/screens/ShowDetailScreen.tsx`

**Prerequisite context (already present in the file, do not re-add):**
- `isSongFavorite`, `addFavoriteSong`, `removeFavoriteSong` are destructured from `useFavorites()` at line 99.
- `handleToggleSaveSong` is a `useCallback` defined at lines 333–348.
- `setPickerTrack` state setter is declared at line 380.
- `Alert` must be imported from `react-native`. Check the top of the file and add to the existing react-native import if not already present.
- `useCallback` is already imported from `'react'`.

- [ ] **Step 1: Ensure `Alert` is imported from `react-native`**

At the top of `src/screens/ShowDetailScreen.tsx`, locate the existing `react-native` import. If `Alert` is not already listed, add it. Example (only showing the relevant import):

```tsx
import {
  // ... existing names
  Alert,
  // ... existing names
} from 'react-native';
```

Run `grep -n "Alert" src/screens/ShowDetailScreen.tsx` — if the first match is the import line and subsequent matches are existing `Alert.alert(...)` call sites, no change is needed and you can skip this step.

- [ ] **Step 2: Add the `handleTrackLongPress` callback**

Insert the following `useCallback` definition directly after `handleToggleSaveSong` (currently ends at line 348, with `], [show, isSongFavorite, removeFavoriteSong, addFavoriteSong]);`). Add a blank line, then:

```tsx
const handleTrackLongPress = useCallback(
  (track: Track) => {
    if (Platform.OS === 'web') return;
    if (!show) return;
    const saved = isSongFavorite(track.id, show.identifier);
    Alert.alert(track.title, undefined, [
      { text: 'Add to Playlist', onPress: () => setPickerTrack(track) },
      {
        text: saved ? 'Remove from Favorites' : 'Add to Favorites',
        onPress: () => handleToggleSaveSong(track),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  },
  [show, isSongFavorite, handleToggleSaveSong],
);
```

Notes:
- `setPickerTrack` is a stable state setter so it is not needed in the dependency array.
- `Platform` is already imported from `react-native` elsewhere in the file (verify with `grep -n "^import" src/screens/ShowDetailScreen.tsx | grep Platform`). If not, add it to the existing `react-native` import alongside `Alert`.
- `show` in the closure is captured from state. `handleToggleSaveSong` already guards `if (!show) return`, so the inner handler is safe.

- [ ] **Step 3: Pass `onLongPress` to `TrackItem`**

At the `TrackItem` render site (currently lines 727–741), add `onLongPress={handleTrackLongPress}` directly after the `onAddToPlaylist` prop (line 738). Full block after edit:

```tsx
<TrackItem
  key={track.id}
  track={track}
  isPlaying={
    playerState.currentTrack?.id === track.id ||
    justPressedTrackId === track.id
  }
  onPress={handleTrackPress}
  rating={trackRatings[track.id]}
  isSaved={isSongFavorite(track.id, show.identifier)}
  onToggleSave={handleToggleSaveSong}
  onAddToPlaylist={(t) => setPickerTrack(t)}
  onLongPress={handleTrackLongPress}
  playlistCount={itemCountsByIdentifier[`${show.identifier}::${track.id}`] ?? 0}
  isSelected={track.id === selectedTrackId}
/>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`

Expected: no new errors from `ShowDetailScreen.tsx`. Pre-existing unrelated errors remain.

- [ ] **Step 5: Commit**

```bash
git add src/screens/ShowDetailScreen.tsx
git commit -m "$(cat <<'EOF'
feat(show-detail): long-press track on native to add to playlist or favorites

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Manual end-to-end verification

**Files:** none — this is verification only.

- [ ] **Step 1: iOS verification**

Run: `npm run ios` (or use an Expo dev client build).

On a show detail screen with a track that is NOT currently favorited:
1. Tap the track once → it plays. (Tap behavior unchanged.)
2. Long-press the track → Alert appears titled with the track title.
3. Alert options are: "Add to Playlist", "Add to Favorites", "Cancel".
4. Tap "Add to Favorites" → alert closes, the track now shows as favorited if you navigate where favorites render (confirm via the Favorites tab).
5. Long-press the same track again → option now reads "Remove from Favorites". Tap it → favorite is removed.
6. Long-press a track → tap "Add to Playlist" → `AddToCollectionPicker` opens for that track. Add it to a playlist, close the picker, navigate to that playlist — the track is there.
7. Long-press → tap "Cancel" → alert closes, nothing changes.

- [ ] **Step 2: Android verification**

Run: `npm run android` (or an Android dev client).

Repeat all 7 checks from Step 1 on Android.

- [ ] **Step 3: Web regression check**

Run: `npm run web`.

1. Confirm the existing hover-to-reveal `+` and `♥` icon buttons on each track still appear and function.
2. Confirm long-pressing (click-and-hold) a track does NOT open any alert. (A browser may show its own context menu or do nothing; no Alert should appear from the app.)

- [ ] **Step 4: Close out**

No code changes expected in this task — if a bug surfaces, fix it in a follow-up commit with a clear message.

```bash
git status
# Expect: working tree clean
```

---

## Self-Review Notes

**Spec coverage:**
- Trigger on native via long-press → Task 1 (prop + wiring with native guard) and Task 2 (handler).
- Menu contents: Add to Playlist, dynamic Favorites label, Cancel → Task 2 Step 2.
- Uses existing `setPickerTrack`, `handleToggleSaveSong`, `isSongFavorite` → Task 2 Step 2 call sites match spec exactly.
- Web behavior untouched → enforced by `Platform.OS !== 'web'` guards in both TrackItem and the handler itself.
- Manual verification on iOS + Android plus web regression → Task 3.

**No placeholders.** Every step contains the code or command to run.

**Type consistency:** `onLongPress?: (track: Track) => void;` declared in Task 1 Step 1 matches the handler signature used in Task 2 Step 2 and the prop passed in Task 2 Step 3.
