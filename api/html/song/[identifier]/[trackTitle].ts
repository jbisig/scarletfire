import { injectOgTags } from '../../../_lib/injectOgTags.js';
import {
  lookupShowByDate,
  lookupShowByIdentifier,
} from '../../../_lib/showLookup.js';
import { fetchTrackList } from '../../../_lib/fetchTrackList.js';
import { matchTrackBySlug } from '../../../_lib/trackMatching.js';
import { WEB_ORIGIN } from '../../../_lib/constants.js';
import { INDEX_HTML } from '../../../_lib/indexHtml.js';

export const config = { runtime: 'nodejs' };

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

const SEARCH_MATCH_THRESHOLD = 0.75;

/**
 * GET /show/:identifier/:trackTitle (rewritten from the SPA route).
 *
 * Same pattern as the show-card handler, but resolves the track slug to
 * a real track title via archive.org metadata so the unfurl shows the
 * actual song name rather than a humanized slug.
 */
// See api/og/show/[identifier].tsx for the req.url / query-param convention.
export default async function handler(req: Request): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawReq = req as any;
  const host = rawReq.headers?.host ?? rawReq.headers?.get?.('host') ?? 'www.scarletfire.app';
  const url = new URL(rawReq.url, `https://${host}`);
  const identifier = decodeURIComponent(url.searchParams.get('identifier') ?? '');
  const trackSlug = decodeURIComponent(url.searchParams.get('trackTitle') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const show =
    lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);

  if (!show) {
    return new Response(INDEX_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  let songTitle = trackSlug.replace(/-/g, ' ');
  const trackList = await fetchTrackList(show.primaryIdentifier);
  if (trackList) {
    const match = matchTrackBySlug(
      trackSlug,
      trackList.tracks.map((t, i) => ({ id: String(i), title: t.title })),
      SEARCH_MATCH_THRESHOLD
    );
    if (match) songTitle = match.title;
  }

  const title = `${songTitle} — ${formatDate(show.date)}`;
  const description = `${show.venue} — listen on Scarlet Fire`;
  const imageUrl = `${WEB_ORIGIN}/api/og/song/${show.date}/${trackSlug}?bg=${bgIndex}`;
  const shareUrl = `${WEB_ORIGIN}/show/${show.date}/${trackSlug}?bg=${bgIndex}`;

  const injected = injectOgTags(INDEX_HTML, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
