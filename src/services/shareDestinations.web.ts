import {
  buildShareUrl,
  buildShareText,
  type ShareItem,
} from './shareService';

/**
 * Web destination handlers for the share tray. None of these have
 * platform-specific availability problems the way the native handlers do,
 * but their availability IS context-dependent:
 *   - Copy link: everywhere
 *   - WhatsApp: everywhere (https://wa.me/ works on both desktop and mobile)
 *   - Messages: only meaningful on mobile browsers — the ShareTray.web
 *     component hides the Messages button on desktop
 *   - Instagram Story: not possible on web at all — the tray hides the
 *     button entirely on web, and this module exports a no-op for symmetry
 *     with the native module's 4-handler interface.
 */
interface DestinationArgs {
  item: ShareItem;
  bgIndex: number;
}

export async function shareToCopyLink({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
  } else {
    // Older browsers / non-secure contexts: fall back to creating a temp
    // textarea and document.execCommand('copy'). Acceptable because:
    //  - this only runs on web (typeof document is defined)
    //  - execCommand is deprecated but still universally supported
    //  - the share tray can't open without a user gesture, so the copy call
    //    is always inside one
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

export async function shareToWhatsApp({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  const text = buildShareText(item);
  const encodedBody = encodeURIComponent(`${text} ${url}`);
  // wa.me is WhatsApp's universal-link host: on mobile browsers it opens
  // the native app (or redirects to the store if not installed); on desktop
  // it opens web.whatsapp.com with the text pre-filled.
  window.open(`https://wa.me/?text=${encodedBody}`, '_blank', 'noopener,noreferrer');
}

export async function shareToMessages({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  const text = buildShareText(item);
  const encodedBody = encodeURIComponent(`${text} ${url}`);
  // sms: URL scheme. Only meaningful on mobile browsers — the tray hides
  // this button on desktop so we don't need to guard here.
  window.location.href = `sms:?body=${encodedBody}`;
}

/**
 * Instagram Story share is not possible on the web. The ShareTray.web component
 * hides the Instagram button entirely so this function is never actually called
 * in production — but keep it as a no-op so the exported shape matches
 * shareService.native.ts and any future caller that imports by name doesn't
 * break the TypeScript build.
 */
export async function shareToInstagramStory(_args: DestinationArgs): Promise<void> {
  // no-op: hidden by ShareTray.web
}
