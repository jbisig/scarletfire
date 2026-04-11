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
export function getShareBackground(bgIndex: number): ImageSourcePropType {
  if (!Number.isFinite(bgIndex)) return BACKGROUNDS[0];
  const i = Math.floor(bgIndex);
  if (i < 1 || i > 6) return BACKGROUNDS[0];
  return BACKGROUNDS[i - 1];
}

export const SHARE_LOGO: ImageSourcePropType = logo;
