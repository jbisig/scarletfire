// Pure TypeScript: no React Native, no Expo, no platform imports.
// Used by ShareTray, the destination handlers, and is also safe to import
// from web code. Platform-specific destinations live in the .native.ts /
// .web.ts siblings (added in later plan tasks).

export const WEB_ORIGIN = 'https://www.scarletfire.app';

export type ShareItem =
  | {
      kind: 'show';
      showId: string;             // archive identifier (e.g. "gd1982-08-06.sbd.miller.110987")
      date: string;               // ISO "1982-08-06"
      venue: string;
      tier: 1 | 2 | 3 | null;     // classicTier — drives star count on the card
    }
  | {
      kind: 'song';
      showId: string;
      trackId: string;
      trackTitle: string;
      trackSlug: string;          // already slugified (lowercased, hyphenated, URL-encoded)
      date: string;
      venue: string;
      rating: 1 | 2 | 3 | null;   // per-performance rating, falls back to tier
    };

function clampBg(bg: number): number {
  if (!Number.isFinite(bg)) return 1;
  const rounded = Math.round(bg);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

/**
 * Build the public share URL for a ShareItem.
 * - Show: /show/<date>?bg=<n>
 * - Song: /show/<date>/<track-slug>?bg=<n>
 *
 * Uses <date> (not the full archive identifier) to match the existing
 * showDetailRoute in src/navigation/webLinking.ts which stringifies
 * identifiers as dates via its identifierToDate lookup.
 */
export function buildShareUrl(item: ShareItem, bg: number): string {
  const bgSafe = clampBg(bg);
  const base = `${WEB_ORIGIN}/show/${item.date}`;
  if (item.kind === 'show') {
    return `${base}?bg=${bgSafe}`;
  }
  return `${base}/${item.trackSlug}?bg=${bgSafe}`;
}

/**
 * Build the share message body — what gets pre-filled in WhatsApp / Messages.
 * Format: "<title> · <date> · <venue>"
 * The share URL is appended by the destination handler, not by this function.
 */
export function buildShareText(item: ShareItem): string {
  const formattedDate = formatDateMMDDYYYY(item.date);
  if (item.kind === 'show') {
    return `${formattedDate} · ${item.venue}`;
  }
  return `${item.trackTitle} · ${formattedDate} · ${item.venue}`;
}

/**
 * Pick a random integer in [1, 6]. The mobile client calls this once when
 * the share tray opens so the in-tray preview and the chat-unfurl image
 * use the same background.
 */
export function pickRandomBackground(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Format an ISO date ("1982-08-06" or "1982-08-06T...") as MM/DD/YYYY with slashes.
 * Shared by shareService.buildShareText and the ShareCard preview component so
 * the in-tray card and the chat message body always render the same string.
 */
export function formatDateMMDDYYYY(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

/**
 * Derive the URL slug for a track title (lowercased, spaces → hyphens, URL-encoded).
 * Matches stringifyTrackTitle in src/navigation/webLinking.ts so a slug built here
 * survives round-tripping through the SPA router.
 */
export function slugifyTrackTitle(title: string): string {
  return encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'));
}
