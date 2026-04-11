import { ImageResponse } from '@vercel/og';
import { renderCard } from '../../_lib/ogTemplate';
import {
  lookupShowByDate,
  lookupShowByIdentifier,
} from '../../_lib/showLookup';

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
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const identifier = decodeURIComponent(segments[segments.length - 1] ?? '');
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
