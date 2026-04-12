import { ImageResponse } from '@vercel/og';
import { renderCard } from '../../_lib/ogTemplate.js';
import {
  lookupShowByDate,
  lookupShowByIdentifier,
} from '../../_lib/showLookup.js';

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
export default async function handler(req: Request): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawReq = req as any;
  const host = rawReq.headers?.host ?? rawReq.headers?.get?.('host') ?? 'www.scarletfire.app';
  const url = new URL(rawReq.url, `https://${host}`);
  const identifier = decodeURIComponent(url.searchParams.get('identifier') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const show =
    lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);

  if (!show) {
    return new ImageResponse(
      renderCard({
        title: 'Scarlet Fire',
        subtitle: 'Grateful Dead Archive',
        tier: null,
        bgIndex,
      }),
      {
        width: 1200,
        height: 1200,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      }
    );
  }

  return new ImageResponse(
    renderCard({
      title: formatDate(show.date),
      subtitle: show.venue,
      tier: show.classicTier,
      bgIndex,
    }),
    {
      width: 1200,
      height: 1200,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
