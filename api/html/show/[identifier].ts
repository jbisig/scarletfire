import { injectOgTags } from '../../_lib/injectOgTags.js';
import {
  lookupShowByDate,
  lookupShowByIdentifier,
} from '../../_lib/showLookup.js';
import { WEB_ORIGIN } from '../../_lib/constants.js';
import { INDEX_HTML } from '../../_lib/indexHtml.js';

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
 * GET /show/:identifier  (rewritten from the SPA route via vercel.json)
 *
 * Returns dist/index.html with <title> and og / twitter meta tags injected
 * so WhatsApp, iMessage, Slack, etc. render a rich preview of the show.
 * Real browsers continue through to SPA hydration; crawlers stop at the
 * meta tags.
 *
 * Uses the NAMED-EXPORT Web API form (`export function GET(request)`)
 * rather than `export default`. Vercel's Node runtime dispatches named
 * HTTP-method exports through its Fetch-API wrapper, which passes a real
 * Web `Request` object and handles the returned `Response` correctly.
 * A `export default` handler here gets wrapped in the legacy (req, res)
 * launcher instead, which ignores returned Response objects and hangs
 * until Lambda timeout.
 *
 * INDEX_HTML is the SPA's index.html inlined as a TS string constant by
 * scripts/generate-index-html.js at build time.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Vercel auto-adds dynamic segments (:identifier) to the query string,
  // so we read them from searchParams rather than parsing the pathname.
  const identifier = decodeURIComponent(url.searchParams.get('identifier') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const show =
    lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);

  if (!show) {
    return new Response(INDEX_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  }

  const title = `${formatDate(show.date)} — Grateful Dead`;
  const description = `${show.venue} — listen to the full show on Scarlet Fire`;
  const imageUrl = `${WEB_ORIGIN}/api/og/show/${show.date}?bg=${bgIndex}`;
  const shareUrl = `${WEB_ORIGIN}/show/${show.date}?bg=${bgIndex}`;

  const injected = injectOgTags(INDEX_HTML, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
