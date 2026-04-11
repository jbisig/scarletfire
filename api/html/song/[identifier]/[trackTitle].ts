import fs from 'node:fs/promises';
import path from 'node:path';
import { injectOgTags } from '../../../_lib/injectOgTags';
import {
  lookupShowByDate,
  lookupShowByIdentifier,
} from '../../../_lib/showLookup';
import { fetchTrackList } from '../../../_lib/fetchTrackList';
import { matchTrackBySlug } from '../../../../src/utils/trackMatching';
import { WEB_ORIGIN } from '../../../_lib/constants';

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

let cachedIndexHtml: string | null = null;
async function loadIndexHtml(): Promise<string> {
  if (cachedIndexHtml) return cachedIndexHtml;
  const indexPath = path.resolve(process.cwd(), 'dist', 'index.html');
  cachedIndexHtml = await fs.readFile(indexPath, 'utf-8');
  return cachedIndexHtml;
}

/**
 * GET /show/:identifier/:trackTitle (rewritten from the SPA route).
 *
 * Same pattern as the show-card handler, but resolves the track slug to
 * a real track title via archive.org metadata so the unfurl shows the
 * actual song name rather than a humanized slug.
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const trackSlug = decodeURIComponent(segments[segments.length - 1] ?? '');
  const identifier = decodeURIComponent(segments[segments.length - 2] ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const show =
    lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);
  const html = await loadIndexHtml();

  if (!show) {
    return new Response(html, {
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

  const injected = injectOgTags(html, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
