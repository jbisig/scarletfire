import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import {
  buildShareUrl,
  buildShareText,
  type ShareItem,
} from './shareService';
import { haptics } from './hapticService';

/**
 * Native destination handlers for the share tray. Each one takes the current
 * ShareItem and the bg index that was rolled when the tray opened, and:
 *   1. Builds the canonical share URL via shareService.buildShareUrl
 *   2. (For chat destinations) builds the accompanying share text
 *   3. Hands it to the platform's native share surface
 *
 * Instagram Story share-to-stories-sticker is intentionally deferred — see
 * shareToInstagramStory below for the current fallback behavior.
 */
interface DestinationArgs {
  item: ShareItem;
  bgIndex: number;
}

/**
 * Copy the share URL to the system clipboard.
 */
export async function shareToCopyLink({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  await Clipboard.setStringAsync(url);
  haptics.success();
}

/**
 * Open WhatsApp's native compose with the share text and URL pre-filled.
 * Falls back to https://wa.me/ (WhatsApp's universal-link shortener) when
 * the native app isn't installed; wa.me forwards to the App Store / Play
 * Store on devices without WhatsApp and to web.whatsapp.com on desktop.
 */
export async function shareToWhatsApp({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  const text = buildShareText(item);
  const encodedBody = encodeURIComponent(`${text} ${url}`);

  const nativeUrl = `whatsapp://send?text=${encodedBody}`;
  const webFallback = `https://wa.me/?text=${encodedBody}`;

  const canOpen = await Linking.canOpenURL(nativeUrl).catch(() => false);
  await Linking.openURL(canOpen ? nativeUrl : webFallback);
  haptics.light();
}

/**
 * Open the system Messages app with the share text and URL pre-filled.
 * iOS uses the sms:&body= scheme (ampersand is intentional — Apple's
 * documented path when no recipient is specified), Android uses smsto:
 * which is the canonical no-recipient SMS intent on Android.
 */
export async function shareToMessages({ item, bgIndex }: DestinationArgs): Promise<void> {
  const url = buildShareUrl(item, bgIndex);
  const text = buildShareText(item);
  const encodedBody = encodeURIComponent(`${text} ${url}`);

  const smsUrl = Platform.OS === 'ios'
    ? `sms:&body=${encodedBody}`
    : `smsto:?body=${encodedBody}`;

  await Linking.openURL(smsUrl);
  haptics.light();
}

/**
 * Instagram Story share — DEFERRED.
 *
 * The full flow (download OG card PNG via expo-file-system, stash it via
 * react-native-share's instagram-stories adapter so the card appears as a
 * background sticker on a new story) is plan Task 11 and has been deferred
 * until the rest of the share feature is working end-to-end. Instagram's
 * Stories API has shifted several times historically and may require a
 * Facebook App ID registration; revisit after Tasks 12-28 are in place.
 *
 * For now this is a minimal fallback: we just open the Instagram website.
 * The user can upload manually from there — awkward but non-broken. When
 * Task 11 lands, overwrite this function only, not its callers.
 */
export async function shareToInstagramStory(_args: DestinationArgs): Promise<void> {
  await Linking.openURL('https://www.instagram.com/');
  haptics.light();
}
