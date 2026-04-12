import fs from 'node:fs/promises';
import path from 'node:path';
import { injectOgTags } from '../../_lib/injectOgTags.js';
import {
  lookupShowByDate,
  lookupShowByIdentifier,
} from '../../_lib/showLookup.js';
import { WEB_ORIGIN } from '../../_lib/constants.js';

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

// Cache dist/index.html in module scope. Vercel Fluid Compute reuses warm
// instances, so this file read happens at most once per cold start.
let cachedIndexHtml: string | null = null;
async function loadIndexHtml(): Promise<string> {
  if (cachedIndexHtml) return cachedIndexHtml;
  // functions.includeFiles in vercel.json ships dist/index.html alongside
  // the function bundle; process.cwd() points at the repo root at runtime.
  const indexPath = path.resolve(process.cwd(), 'dist', 'index.html');
  cachedIndexHtml = await fs.readFile(indexPath, 'utf-8');
  return cachedIndexHtml;
}

/**
 * GET /show/:identifier  (rewritten from the SPA route via vercel.json)
 *
 * Returns dist/index.html with <title> and og / twitter meta tags injected
 * so WhatsApp, iMessage, Slack, etc. render a rich preview of the show.
 * Real browsers continue through to SPA hydration; crawlers stop at the
 * meta tags.
 *
 * If the show isn't in the catalog, returns the unmodified index.html so
 * the SPA still handles the route normally (which might show a "not found"
 * state). Short TTL on misses, 1-hour SWR on hits.
 */
// See api/og/show/[identifier].tsx for the req.url / query-param convention.
export default async function handler(req: Request): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawReq = req as any;
  const host = rawReq.headers?.host ?? rawReq.headers?.get?.('host') ?? 'www.scarletfire.app';
  const url = new URL(rawReq.url, `https://${host}`);
  const identifier = decodeURIComponent(url.searchParams.get('identifier') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const show =
    lookupShowByDate(identifier) ?? lookupShowByIdentifier(identifier);
  const html = await loadIndexHtml();

  if (!show) {
    return new Response(html, {
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

  const injected = injectOgTags(html, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
