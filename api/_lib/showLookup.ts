/**
 * Lookup a show's canonical metadata by either ISO date (e.g. "1977-05-08")
 * or archive.org identifier (e.g. "gd1977-05-08.137955.sbd.jjoregon.flacf").
 *
 * Reads the static catalog bundled at src/data/shows.json ONCE at module
 * load time (Vercel Fluid Compute reuses warm instances, so this runs at
 * most once per cold start) and enriches each entry with the classicTier
 * from the local api/_lib/classicShowsTiers copy so OG image endpoints and
 * HTML injection endpoints can render the correct star count without an
 * extra lookup.
 *
 * No network calls. In the Vercel Functions runtime, src/data/shows.json
 * is included in the bundle via functions.includeFiles in vercel.json and
 * lives at the same relative path on disk. We load it via fs.readFileSync
 * rather than `import ... from '...json' with { type: 'json' }` to avoid
 * ESM JSON-import compatibility quirks across Vercel's bundler.
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
// Using cwd() sidesteps ESM's import.meta.url (unsupported by Jest's Hermes
// engine) while still resolving correctly at runtime.
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
