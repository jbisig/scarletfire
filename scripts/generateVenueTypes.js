/**
 * Regenerate src/data/venueTypes.ts from scripts/data/venue-types.tsv.
 * Edit the TSV (it is the source of truth), then: npm run generate:venue-types
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TSV = path.join(ROOT, 'scripts/data/venue-types.tsv');
const OUT = path.join(ROOT, 'src/data/venueTypes.ts');
const PHYSICAL = new Set(['theater', 'arena', 'stadium', 'amphitheater']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);

const lines = fs.readFileSync(TSV, 'utf8').split('\n').filter(Boolean);
const header = lines.shift().split('\t');
if (header.join(',') !== 'normalized_venue,type,confidence,international,note') {
  throw new Error(`Unexpected TSV header: ${header.join(',')}`);
}

const typed = [];
const international = [];
for (const line of lines) {
  const [venue, type, confidence, intl] = line.split('\t');
  if (!venue) continue;
  if (type) {
    if (!PHYSICAL.has(type)) throw new Error(`Bad type "${type}" for ${venue}`);
    if (!CONFIDENCE.has(confidence)) throw new Error(`Bad confidence "${confidence}" for ${venue}`);
    typed.push({ venue, type, confidence });
  }
  if (intl === 'yes') international.push(venue);
}

const q = s => JSON.stringify(s);
const body = [
  '// GENERATED FILE — do not edit. Source: scripts/data/venue-types.tsv',
  '// Regenerate with: npm run generate:venue-types',
  "import type { VenuePhysicalType } from '../constants/tags';",
  '',
  "export interface VenueTypeEntry { type: VenuePhysicalType; confidence: 'high' | 'medium' | 'low' }",
  '',
  '/** Keys are normalizeVenue(show.venue). Venues with no physical type (clubs, parks, unknowns) are absent. */',
  'export const VENUE_TYPES: Readonly<Record<string, VenueTypeEntry>> = {',
  ...typed.map(t => `  ${q(t.venue)}: { type: ${q(t.type)}, confidence: ${q(t.confidence)} },`),
  '};',
  '',
  'export const INTERNATIONAL_VENUES: ReadonlySet<string> = new Set<string>([',
  ...international.map(v => `  ${q(v)},`),
  ']);',
  '',
].join('\n');

fs.writeFileSync(OUT, body);
console.log(`Wrote ${OUT}: ${typed.length} typed venues, ${international.length} international`);
