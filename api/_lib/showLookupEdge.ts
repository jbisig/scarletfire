/**
 * Edge-runtime show lookup. Used by the /api/og/* endpoints.
 *
 * Mirrors showLookup.ts (the Node variant) but loads the catalog via
 * a bundler-inlined JSON import. Edge's esbuild bundler treats `.json`
 * imports as a JSON loader and inlines the content at build time —
 * no runtime assertion needed and no fs required (Edge has no `fs`).
 *
 * Both variants exist because Vercel's bundlers produce incompatible
 * outputs for the two runtimes: Node builds preserve the `import`
 * statement which Node ESM rejects without `with { type: 'json' }`;
 * Edge builds inline the JSON directly. See showLookup.ts for the
 * Node-side rationale.
 */
import showsData from './shows.json';
import { getClassicTier } from './classicShowsTiers.js';

export interface ShowMetadata {
  primaryIdentifier: string;
  date: string;                 // "1977-05-08" (ISO date, no timestamp)
  venue: string;
  classicTier: 1 | 2 | 3 | null;
}

interface RawShow {
  primaryIdentifier?: string;
  date?: string;                // may include "T00:00:00Z" suffix in raw data
  venue?: string;
  [key: string]: unknown;
}

const showsCatalog = showsData as unknown as Record<string, RawShow[]>;

const byDate: Map<string, ShowMetadata> = new Map();
const byIdentifier: Map<string, ShowMetadata> = new Map();

for (const yearShows of Object.values(showsCatalog)) {
  for (const raw of yearShows) {
    if (!raw.primaryIdentifier || !raw.date) continue;
    const isoDate = raw.date.slice(0, 10);
    const meta: ShowMetadata = {
      primaryIdentifier: raw.primaryIdentifier,
      date: isoDate,
      venue: raw.venue ?? '',
      classicTier: getClassicTier(isoDate) ?? null,
    };
    if (!byDate.has(isoDate)) {
      byDate.set(isoDate, meta);
    }
    byIdentifier.set(raw.primaryIdentifier, meta);
  }
}

export function lookupShowByDate(date: string): ShowMetadata | null {
  return byDate.get(date) ?? null;
}

export function lookupShowByIdentifier(identifier: string): ShowMetadata | null {
  return byIdentifier.get(identifier) ?? null;
}
