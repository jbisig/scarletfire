import { ImageResponse } from '@vercel/og';
import { renderCard } from '../../../_lib/ogTemplate.js';
import {
  lookupShowByDate,
  lookupShowByIdentifier,
} from '../../../_lib/showLookup.js';
import { fetchTrackList } from '../../../_lib/fetchTrackList.js';
import { matchTrackBySlug } from '../../../_lib/trackMatching.js';

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

// Match SIMILARITY_THRESHOLDS.SEARCH_MATCH from src/constants/thresholds.ts
// (hardcoded here so the function bundle doesn't pull in that module).
const SEARCH_MATCH_THRESHOLD = 0.75;

/**
 * GET /api/og/song/:identifier/:trackTitle?bg=<1-6>
 *
 * Returns a 1200×1200 PNG of the song share card. Resolves the track slug
 * to a real track title via archive.org metadata (edge-cached by the CDN).
 * If the show isn't in the bundled catalog OR the archive.org lookup fails,
 * falls back to a humanized slug — still cacheable, just less specific.
 */
// See show/[identifier].tsx for the req.url / query-param convention.
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

  // Humanize the slug as a fallback title ("franklins-tower" → "franklins tower")
  let songTitle = trackSlug.replace(/-/g, ' ');

  if (show) {
    const trackList = await fetchTrackList(show.primaryIdentifier);
    if (trackList) {
      // matchTrackBySlug expects MinimalTrack { id: string; title: string }
      const match = matchTrackBySlug(
        trackSlug,
        trackList.tracks.map((t, i) => ({ id: String(i), title: t.title })),
        SEARCH_MATCH_THRESHOLD
      );
      if (match) songTitle = match.title;
    }
  }

  return new ImageResponse(
    renderCard({
      title: songTitle,
      subtitle: show?.venue ?? 'Grateful Dead',
      metaLine: show ? formatDate(show.date) : undefined,
      tier: show?.classicTier ?? null,
      bgIndex,
    }),
    {
      width: 1200,
      height: 1200,
      headers: {
        'Cache-Control': show
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=300, s-maxage=300',
      },
    }
  );
}
