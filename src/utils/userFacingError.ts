import type { DownloadError } from '../types/downloads.types';

/**
 * Turn a thrown load error into copy a listener can act on.
 *
 * Everything the app streams comes from archive.org, so the message names
 * it: "couldn't reach archive.org" tells the user it's the connection (or
 * the Archive), not the app, and what to do next. Raw `err.message` values
 * like "getShowDetail: HTTP 404" or "Unexpected metadata response format"
 * never reach the screen.
 */
export function describeLoadError(
  err: unknown,
  subject: string = 'this show',
  opts: { offline?: boolean } = {},
): string {
  // Offline is a device state, not an archive.org state: say where the
  // music that *does* work lives.
  if (opts.offline) {
    return "You're offline. Downloaded shows are in Saved → Downloads.";
  }
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const msg = raw.toLowerCase();

  if (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('network error') ||
    msg.includes('offline')
  ) {
    return "Couldn't reach archive.org. Check your connection and try again.";
  }

  if (/\b(http )?404\b/.test(msg) || msg.includes('not found')) {
    return "This recording isn't on archive.org anymore.";
  }

  if (/\bhttp 5\d\d\b/.test(msg) || msg.includes('server error')) {
    return 'archive.org is having trouble right now. Try again in a moment.';
  }

  return `Couldn't load ${subject}.`;
}

/** Copy for a failed offline download, keyed by the engine's error code. */
export function describeDownloadError(error?: DownloadError): string {
  switch (error) {
    case 'disk-full':
      return 'Not enough space on this device.';
    case 'not-found':
      return "This recording isn't on archive.org anymore.";
    case 'network':
      return "Couldn't reach archive.org. Check your connection and try again.";
    default:
      return "Couldn't download this show.";
  }
}
