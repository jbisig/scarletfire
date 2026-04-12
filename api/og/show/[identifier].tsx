import { ImageResponse } from '@vercel/og';
import { renderCard } from '../../_lib/ogTemplate.js';
import {
  lookupShowByDate,
  lookupShowByIdentifier,
} from '../../_lib/showLookupEdge.js';
import { WEB_ORIGIN } from '../../_lib/constants.js';

// @vercel/og is designed for and best supported on Edge runtime — Node
// runtime hangs on Satori's internal image fetches. Edge uses V8 isolates
// with Web APIs, supports fetch natively, and has sub-millisecond cold
// starts. The tradeoff is no Node APIs (no fs, no path) — but this endpoint
// doesn't need them; shows.json is imported via the ESM JSON-assertion path.
export const config = { runtime: 'edge' };

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

/**
 * GET /api/og/show/:identifier?bg=<1-6>
 *
 * Returns a 1200×1200 PNG of the show share card. The identifier can be
 * either the show's ISO date ("1977-05-08") or its archive.org identifier
 * ("gd1977-05-08.137955.sbd.jjoregon.flacf") — we try the date lookup first
 * because that's what webLinking.ts produces for share URLs.
 *
 * Cache-Control is immutable on success (same URL = same PNG forever);
 * short TTL on fallback cards so a temporarily-missing show eventually
 * picks up its real metadata.
 */
// Vercel's Node.js runtime passes an IncomingMessage-like request where
// req.url is a RELATIVE path like "/api/og/show/1977-05-08?bg=3&identifier=1977-05-08",
// not a full URL. We synthesize an absolute URL using the host header so
// new URL() works, which also handles the Web API case (req.url already
// absolute → base arg is ignored). Dynamic route params are also appended
// to the query string by Vercel (note the "&identifier=..." above), so we
// can read them directly from searchParams without parsing the path.
const fontUrl = `${WEB_ORIGIN}/share/FamiljenGrotesk-SemiBold.ttf`;

async function loadFont(): Promise<ArrayBuffer> {
  const res = await fetch(fontUrl);
  return res.arrayBuffer();
}

export default async function handler(req: Request): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawReq = req as any;
  const host = rawReq.headers?.host ?? rawReq.headers?.get?.('host') ?? 'www.scarletfire.app';
  const url = new URL(rawReq.url, `https://${host}`);
  const identifier = decodeURIComponent(url.searchParams.get('identifier') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const [fontData, show] = await Promise.all([
    loadFont(),
    Promise.resolve(lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier)),
  ]);

  const fonts = [{ name: 'FamiljenGrotesk', data: fontData, weight: 500 as const }];

  if (!show) {
    return new ImageResponse(
      renderCard({ title: 'Scarlet Fire', subtitle: 'Grateful Dead Archive', tier: null, bgIndex }),
      { width: 1200, height: 1200, fonts, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
    );
  }

  return new ImageResponse(
    renderCard({ title: formatDate(show.date), subtitle: show.venue, tier: show.classicTier, bgIndex }),
    { width: 1200, height: 1200, fonts, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  );
}
