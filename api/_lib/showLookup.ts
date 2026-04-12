/**
 * Node.js-runtime show lookup. Used by the HTML injection endpoints.
 *
 * Loads api/_lib/shows.json via fs.readFileSync. Node ESM requires
 * `with { type: 'json' }` for JSON imports, which Vercel's bundler
 * strips, so we can't use the bare `import` syntax here. The Edge
 * variant (api/_lib/showLookupEdge.ts) uses `import showsData from
 * './shows.json'` because Edge's esbuild bundler inlines JSON at
 * build time.
 *
 * api/_lib/shows.json is a COPY of src/data/shows.json kept here so
 * Vercel's function bundler auto-includes it without relying on a
 * `functions.includeFiles` glob (which has proven unreliable across
 * the various Vercel CLI versions we've deployed against).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
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

// Resolve api/_lib/shows.json relative to process.cwd():
//  - Jest (project root): api/_lib/shows.json resolves correctly
//  - Vercel Node runtime (/var/task): api/_lib/shows.json is in the
//    function bundle alongside this file, so the relative path works
const showsJsonPath = path.resolve(process.cwd(), 'api/_lib/shows.json');
const showsData = JSON.parse(readFileSync(showsJsonPath, 'utf-8')) as Record<
  string,
  RawShow[]
>;

// Build lookup tables once at module load time. Vercel Fluid Compute
// reuses warm instances, so this loop runs at most once per cold start.
const byDate: Map<string, ShowMetadata> = new Map();
const byIdentifier: Map<string, ShowMetadata> = new Map();

for (const yearShows of Object.values(showsData)) {
  for (const raw of yearShows) {
    if (!raw.primaryIdentifier || !raw.date) continue;
    const isoDate = raw.date.slice(0, 10);  // strip the "T00:00:00Z" suffix if present
    const meta: ShowMetadata = {
      primaryIdentifier: raw.primaryIdentifier,
      date: isoDate,
      venue: raw.venue ?? '',
      classicTier: getClassicTier(isoDate) ?? null,
    };
    // A given date may have multiple shows (different recordings). For the
    // date lookup we keep the FIRST we encounter — shows.json is ordered by
    // best-known recording per date, so this is the right pick.
    if (!byDate.has(isoDate)) {
      byDate.set(isoDate, meta);
    }
    byIdentifier.set(raw.primaryIdentifier, meta);
  }
}

/**
 * Lookup a show by ISO date like "1977-05-08". If multiple recordings exist
 * for the date, the first one in shows.json (typically the best-known) wins.
 */
export function lookupShowByDate(date: string): ShowMetadata | null {
  return byDate.get(date) ?? null;
}

/**
 * Lookup a show by archive.org identifier.
 */
export function lookupShowByIdentifier(identifier: string): ShowMetadata | null {
  return byIdentifier.get(identifier) ?? null;
}
