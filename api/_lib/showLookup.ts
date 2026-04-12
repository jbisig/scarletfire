/**
 * Node.js-runtime show lookup. Used by the HTML injection endpoints which
 * run on Vercel's Node.js Functions and have access to `fs`.
 *
 * The Edge runtime variant lives at ./showLookupEdge.ts — it uses a
 * bundler-inlined JSON import instead of fs.readFileSync. The two files
 * export the same interface so callers can import either one depending
 * on their runtime.
 *
 * We do NOT use `import showsData from '.../shows.json'` here because
 * Node's ESM loader requires `with { type: 'json' }` on JSON imports,
 * and Vercel's esbuild-based bundler strips that attribute, so the
 * runtime rejects the import. fs.readFileSync sidesteps the whole
 * assertion dance and resolves the catalog via a bundled path.
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

// Resolve src/data/shows.json relative to process.cwd(), which is both:
//  - the project root in Jest (where package.json lives)
//  - /var/task in the Vercel Functions runtime (the bundle's root, where
//    src/data/shows.json is included via functions.includeFiles in vercel.json)
const showsJsonPath = path.resolve(process.cwd(), 'src/data/shows.json');
const showsData = JSON.parse(readFileSync(showsJsonPath, 'utf-8')) as Record<
  string,
  RawShow[]
>;

// Build lookup tables once at module load time.
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
