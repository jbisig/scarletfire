// Placeholder. The real implementations are added in plan Task 8:
//  - ShareTray.native.tsx for iOS/Android (@gorhom/bottom-sheet)
//  - ShareTray.web.tsx for desktop/mobile web (portal modal)
//
// This file exists so ShareSheetContext can import a typed ShareTray component
// before Task 8 lands. Once Task 8 creates ShareTray.native.tsx, Metro will
// resolve this name to the .native.tsx variant on iOS/Android and to the
// .web.tsx variant on web. Until then, this no-op renders nothing.
import type { ShareItem } from '../../services/shareService';

export interface ShareTrayProps {
  item: ShareItem | null;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ShareTray(_props: ShareTrayProps): null {
  return null;
}
