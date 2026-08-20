/**
 * Regenerate the bundled show catalog from the Internet Archive.
 *
 *   npm run build:catalog
 *
 * One advancedsearch request per year (1965–1995). Writes:
 *   src/data/shows.json            — the app catalog (all recordings, parsed tags)
 *   api/_lib/shows.json            — byte-identical twin for the Vercel functions
 *   scripts/output/recordings-raw.json — raw source/lineage/taper/transferer per
 *                                       identifier; audit only, never imported
 *   scripts/output/catalog-report.md   — format/lineage distribution and coverage
 */
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ArchiveDoc, ArchiveSearchResponse } from '../src/types/archive.types';
import { buildRawDump, buildReport, groupDocsIntoShows } from './lib/catalogBuilder';

const ARCHIVE_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const START_YEAR = 1965;
const END_YEAR = 1995;
const ROWS_PER_REQUEST = 5000; // the busiest year has well under 1,000 items
const DELAY_MS = 500;
const FIELDS = [
  'identifier', 'title', 'date', 'venue', 'coverage', 'year', 'downloads',
  'source', 'taper', 'transferer', 'lineage', 'avg_rating', 'num_reviews',
];

const ROOT = path.resolve(__dirname, '..');
const APP_CATALOG = path.join(ROOT, 'src/data/shows.json');
const API_CATALOG = path.join(ROOT, 'api/_lib/shows.json');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

function buildQueryString(year: number): string {
  const params = new URLSearchParams();
  params.set('q', `collection:GratefulDead AND mediatype:etree AND year:${year}`);
  FIELDS.forEach(f => params.append('fl[]', f));
  params.set('sort', 'date asc');
  params.set('rows', String(ROWS_PER_REQUEST));
  params.set('output', 'json');
  return params.toString();
}

async function fetchYear(year: number): Promise<ArchiveDoc[]> {
  const response = await fetch(`${ARCHIVE_SEARCH_URL}?${buildQueryString(year)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for year ${year}`);
  const data = (await response.json()) as ArchiveSearchResponse;
  if (!Array.isArray(data?.response?.docs)) throw new Error(`Unexpected response for year ${year}`);
  if (data.response.numFound > ROWS_PER_REQUEST) {
    throw new Error(`Year ${year} has ${data.response.numFound} items; raise ROWS_PER_REQUEST`);
  }
  return data.response.docs;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function mb(file: string): string {
  return `${(statSync(file).size / 1024 / 1024).toFixed(2)} MB`;
}

async function main(): Promise<void> {
  console.log('Fetching Grateful Dead recordings year by year...\n');
  const allDocs: ArchiveDoc[] = [];
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    process.stdout.write(`  ${year}... `);
    const docs = await fetchYear(year);
    allDocs.push(...docs);
    console.log(`${docs.length} recordings`);
    await sleep(DELAY_MS);
  }
  console.log(`\nFetched ${allDocs.length} recordings total`);

  const showsByYear = groupDocsIntoShows(allDocs);
  const catalogJson = JSON.stringify(showsByYear, null, 2);
  writeFileSync(APP_CATALOG, catalogJson);
  writeFileSync(API_CATALOG, catalogJson);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(path.join(OUTPUT_DIR, 'recordings-raw.json'), JSON.stringify(buildRawDump(allDocs), null, 1));
  const report = buildReport(showsByYear, allDocs.length);
  writeFileSync(path.join(OUTPUT_DIR, 'catalog-report.md'), report);

  console.log(`\nWrote ${APP_CATALOG} (${mb(APP_CATALOG)})`);
  console.log(`Wrote ${API_CATALOG} (${mb(API_CATALOG)})`);
  console.log(`Wrote ${path.join(OUTPUT_DIR, 'recordings-raw.json')}`);
  console.log(`Wrote ${path.join(OUTPUT_DIR, 'catalog-report.md')}\n`);
  console.log(report);
}

main().catch(error => {
  console.error('\nCatalog build failed:', error);
  process.exit(1);
});
