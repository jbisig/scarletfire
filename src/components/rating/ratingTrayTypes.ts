// Shared prop type for the cross-platform RatingTray. Lives in its own
// non-platform-split file for the same reason as shareTrayTypes.ts:
// tsconfig's native-first `moduleSuffixes` would make a bare './RatingTray'
// specifier resolve to RatingTray.native.tsx for all importers, turning a
// type import into a self-import.
import type { RatingItem } from '../../contexts/RatingOverlayContext';

export interface RatingTrayProps {
  item: RatingItem | null;
  onClose: () => void;
}

/** Stable identity for one tray open — used to memoize the background roll. */
export function ratingItemKey(item: RatingItem | null): string {
  if (!item) return 'none';
  return item.kind === 'show'
    ? `show|${item.date}`
    : `performance|${item.songTitle}|${item.date}`;
}
