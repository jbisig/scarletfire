// Static require() map for the 6 share card backgrounds + logo.
// Metro can't bundle dynamic require() paths, so this file is the
// canonical place where each asset is pulled in by literal string.
// Other components pick a background by numeric index.

import type { ImageSourcePropType } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bg1: ImageSourcePropType = require('../../../assets/share_images/bg-1.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bg2: ImageSourcePropType = require('../../../assets/share_images/bg-2.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bg3: ImageSourcePropType = require('../../../assets/share_images/bg-3.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bg4: ImageSourcePropType = require('../../../assets/share_images/bg-4.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bg5: ImageSourcePropType = require('../../../assets/share_images/bg-5.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bg6: ImageSourcePropType = require('../../../assets/share_images/bg-6.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo: ImageSourcePropType = require('../../../assets/share_images/logo.png');

const BACKGROUNDS: readonly ImageSourcePropType[] = [bg1, bg2, bg3, bg4, bg5, bg6];

/**
 * Get the background image for a bg index in 1..6.
 * Out-of-range or non-integer inputs clamp to bg-1 (the safe fallback).
 */
/**
 * Stable background index (1–6) for an id, so the same collection/show
 * always gets the same artwork. Unsigned 32-bit hash keeps the modulo
 * positive without the Math.abs → overflow trap.
 */
export function shareBackgroundIndexForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % 6) + 1;
}

/**
 * Background indexes (1–6) for a row of cards: each card gets its id's
 * preferred artwork unless one of the previous five cards already took it,
 * in which case it steps to the next free one. Any six neighbours are
 * therefore all different, while a show keeps its artwork wherever the row
 * order around it hasn't changed.
 */
export function assignShareBackgrounds(ids: readonly string[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < ids.length; i++) {
    const recent = new Set(out.slice(Math.max(0, i - 5)));
    let idx = shareBackgroundIndexForId(ids[i]);
    for (let tries = 0; tries < 6 && recent.has(idx); tries++) {
      idx = (idx % 6) + 1;
    }
    out.push(idx);
  }
  return out;
}

export function getShareBackground(bgIndex: number): ImageSourcePropType {
  if (!Number.isFinite(bgIndex)) return BACKGROUNDS[0];
  const i = Math.floor(bgIndex);
  if (i < 1 || i > 6) return BACKGROUNDS[0];
  return BACKGROUNDS[i - 1];
}

export const SHARE_LOGO: ImageSourcePropType = logo;
