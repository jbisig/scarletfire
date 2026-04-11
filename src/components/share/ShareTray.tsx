// Cross-platform entry point for the share tray. Metro resolves this to:
//   ShareTray.native.tsx on iOS/Android
//   ShareTray.web.tsx on web (added in plan Task 15)
// This file exports the shared prop types and re-exports the default
// implementation so non-platform-specific consumers (ShareSheetContext)
// can import { ShareTray } from './ShareTray'.
import type { ShareItem } from '../../services/shareService';

export interface ShareTrayProps {
  item: ShareItem | null;
  onClose: () => void;
}

export { ShareTray } from './ShareTray.native';
