/**
 * Edge-runtime show lookup. Used by the /api/og/* endpoints which run on
 * Vercel's Edge Functions (V8 isolates) and don't have access to `fs`.
 *
 * Mirrors the public interface of ./showLookup.ts (the Node variant). Both
 * files read from the same underlying src/data/shows.json catalog, but the
 * loading mechanism differs:
 *   - Node (showLookup.ts): fs.readFileSync + JSON.parse
 *   - Edge (showLookupEdge.ts): plain JSON import, inlined by esbuild at
 *     build time into the function bundle
 *
 * Edge's esbuild bundler accepts `import ... from '.json'` without an
 * `assert` / `with` attribute — it treats .json files as a JSON loader.
 * Node's ESM loader rejects such imports without an attribute, which is
 * why this file can't be used from the Node-runtime HTML endpoints.
 */
import showsData from '../../src/data/shows.json';
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

// Build lookup tables once at module load time.
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
