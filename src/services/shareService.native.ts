// Stub — real implementations land in plan Tasks 10 and 11.
// The named exports exist so ShareTray.native can import them at module
// resolution time; calls to these from the tray will no-op silently until
// the real handlers are added.
//
// Re-exports everything from shareService.ts so that when Jest's platform
// resolver picks up this .native.ts file instead of shareService.ts, all
// platform-agnostic helpers (pickRandomBackground, buildShareUrl, etc.)
// remain available to importers of 'shareService'.
export * from './shareService';
import type { ShareItem } from './shareService';

type DestinationArgs = { item: ShareItem; bgIndex: number };

export async function shareToCopyLink(_args: DestinationArgs): Promise<void> {}
export async function shareToWhatsApp(_args: DestinationArgs): Promise<void> {}
export async function shareToInstagramStory(_args: DestinationArgs): Promise<void> {}
export async function shareToMessages(_args: DestinationArgs): Promise<void> {}
