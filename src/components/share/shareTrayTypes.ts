// Shared prop type for the cross-platform ShareTray. Extracted into its own
// non-platform-split file (matching the pattern used by audioPlayerTypes.ts)
// because tsconfig's `moduleSuffixes` (native-first: .ios/.android/.native/"")
// makes a bare `./ShareTray` specifier resolve to `ShareTray.native.tsx` for
// ALL importers, including `ShareTray.native.tsx` itself. That turned an
// import of `ShareTrayProps` from './ShareTray' inside ShareTray.native.tsx
// into a self-import (TS2303 circular definition), and made the type
// unexported as far as ShareTray.web.tsx was concerned (TS2459). Importing
// from this dedicated file sidesteps the ambiguous platform-suffixed
// specifier entirely.
import type { ShareItem } from '../../services/shareService';

export interface ShareTrayProps {
  item: ShareItem | null;
  onClose: () => void;
}
