// Cross-platform entry point for the share tray. Metro resolves this to:
//   ShareTray.native.tsx on iOS/Android
//   ShareTray.web.tsx on web (added in plan Task 15)
// This file re-exports the shared prop type (declared in shareTrayTypes.ts —
// see that file for why it isn't declared here) and the default
// implementation so non-platform-specific consumers (ShareSheetContext)
// can import { ShareTray } from './ShareTray'.
export type { ShareTrayProps } from './shareTrayTypes';
export { ShareTray } from './ShareTray.native';
