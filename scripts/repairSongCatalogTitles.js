#!/usr/bin/env node
/**
 * Repair corrupted titles in src/constants/songs.generated.ts and merge the
 * duplicate song entries they created.
 *
 * The damage: escapeString() in the generators does `.replace(/\\/g, '\\\\')`
 * with no guard against already-escaped input, so regenerating the catalog from
 * its own output doubles every backslash. An apostrophe that arrived escaped
 * became 2, 4, 8 … 64 backslashes over successive passes. Separately, one title
 * carries Windows-1252 0x92 mis-decoded as UTF-8 ("Truckin" + U+00E2 U+0092).
 *
 * Each damaged title also split its song in two — a 3-performance orphan beside
 * the real entry — so repairing the string alone would leave two entries with
 * the same name. This merges them and recomputes performanceCount.
 *
 * Regenerating from Archive.org is not a viable fix here: it needs the network,
 * churns all 33,370 performances, and the generators still carry the escaping
 * bug. escapeString() is fixed separately; this repairs the committed data.
 *
 *   node scripts/repairSongCatalogTitles.js            # dry run, prints the plan
 *   node scripts/repairSongCatalogTitles.js --write
 *
 * Idempotent: a second run reports nothing to do.
 */
const fs = require('fs');
const path = require('path');

const CATALOG = path.join(__dirname, '..', 'src', 'constants', 'songs.generated.ts');
const write = process.argv.includes('--write');

/**
 * Titles the repair cannot infer. Restoring an apostrophe is a judgement about
 * the song's real name, not a mechanical unescape, so the intended spellings
 * are listed rather than guessed.
 */
const CANONICAL_TITLE = {
  truckin: "Truckin'",
  unclejohnsband: "Uncle John's Band",
  playingintheband: 'Playing in the Band',
  playingintheband_reprise: 'Playing in the Band Reprise',
};

const src = fs.readFileSync(CATALOG, 'utf8');

// ---- parse -----------------------------------------------------------------
const marker = 'export const GRATEFUL_DEAD_SONGS';
const start = src.indexOf(marker);
if (start < 0) throw new Error('GRATEFUL_DEAD_SONGS not found');
// Seek past the `=`, not just to the next `[` — the declaration is
// `: Song[] = [`, so the first bracket belongs to the type annotation.
const assign = src.indexOf('=', start);
if (assign < 0) throw new Error('GRATEFUL_DEAD_SONGS assignment not found');
const arrayStart = src.indexOf('[', assign);
const arrayEnd = src.lastIndexOf('];');
if (arrayStart < 0 || arrayEnd < 0) throw new Error('end of GRATEFUL_DEAD_SONGS not found');

const header = src.slice(0, arrayStart);
const footer = src.slice(arrayEnd + 2);
// Trusted, committed, generator-written input — see scripts/compendiumRatings/lib.js
// for the same caveat. Never point this at content from elsewhere.
const songs = new Function('return ' + src.slice(arrayStart, arrayEnd + 1))();

console.log('parsed songs:', songs.length);

// ---- detect damage ---------------------------------------------------------
const isDamaged = t => /\\/.test(t) || /[â][-]/.test(t) || /[-]/.test(t);

function repairTitle(t) {
  return t
    // A run of backslashes stands in for one apostrophe.
    .replace(/\\+/g, "'")
    // Windows-1252 right single quote read as UTF-8.
    .replace(/â|â|â[-]/g, "'")
    .replace(/[]/g, "'")
    .replace(/[]/g, '"')
    .replace(/'{2,}/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const damaged = songs.filter(s => isDamaged(s.title));
console.log('damaged titles:', damaged.length);
damaged.forEach(s => console.log(
  `   ${JSON.stringify(s.title.slice(0, 46))} (${s.performances.length} perfs) -> ${JSON.stringify(repairTitle(s.title))}`
));

// ---- merge key: what the app already treats as the same song ---------------
// Mirrors the meaningful parts of normalizeSongTitleForLookup so the merge
// groups exactly what getSongPerformanceRating would collapse anyway.
const mergeKey = t => repairTitle(t)
  .toLowerCase()
  .replace(/playin'/g, 'playing')
  .replace(/truckin'/g, 'truckin')
  .replace(/lovin'/g, 'loving')
  .replace(/&/g, 'and')
  .replace(/'/g, '')
  .replace(/[^a-z0-9]/g, '');

const groups = new Map();
for (const song of songs) {
  const k = mergeKey(song.title);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(song);
}

const merging = [...groups.entries()].filter(([, g]) => g.length > 1);
console.log('\nmerge groups:', merging.length);
for (const [k, g] of merging) {
  console.log('  key', JSON.stringify(k));
  g.forEach(s => console.log(`     ${String(s.performances.length).padStart(4)} perfs  ${JSON.stringify(s.title.slice(0, 46))}`));
}

// ---- rebuild ---------------------------------------------------------------
const out = [];
let mergedPerfs = 0, retitled = 0;

for (const [k, group] of groups) {
  // Keep the entry with the most performances as the base.
  const ordered = group.slice().sort((a, b) => b.performances.length - a.performances.length);
  const base = ordered[0];

  const seen = new Set();
  const performances = [];
  for (const song of ordered) {
    for (const p of song.performances) {
      const id = `${p.identifier}|${p.date}`;
      if (seen.has(id)) continue;
      seen.add(id);
      performances.push(p);
    }
  }
  mergedPerfs += performances.length - base.performances.length;
  performances.sort((a, b) => a.date.localeCompare(b.date) || a.identifier.localeCompare(b.identifier));

  const repaired = repairTitle(base.title);
  const title = CANONICAL_TITLE[k] || repaired;
  if (title !== base.title) retitled++;

  out.push({ ...base, title, performanceCount: performances.length, performances });
}

out.sort((a, b) => a.title.localeCompare(b.title));

console.log('\nresult:');
console.log('   songs', songs.length, '->', out.length);
console.log('   performances folded into a surviving entry:', mergedPerfs);
console.log('   titles changed:', retitled);

const stillDamaged = out.filter(s => isDamaged(s.title));
console.log('   damaged titles remaining:', stillDamaged.length);
if (stillDamaged.length) throw new Error('repair left damaged titles: ' + stillDamaged.map(s => s.title).join(', '));

const keyCount = new Set(out.map(s => mergeKey(s.title))).size;
if (keyCount !== out.length) throw new Error('repair left duplicate songs');

// ---- emit ------------------------------------------------------------------
// JSON.stringify does the escaping, so re-running the generator over this file
// can never double a backslash again.
const q = s => JSON.stringify(String(s));
const lines = [];
for (const song of out) {
  lines.push('  {');
  lines.push(`    title: ${q(song.title)},`);
  lines.push(`    performanceCount: ${song.performanceCount},`);
  lines.push('    performances: [');
  for (const p of song.performances) {
    lines.push('      {');
    lines.push(`        date: ${q(p.date)},`);
    lines.push(`        identifier: ${q(p.identifier)},`);
    if (p.venue !== undefined) lines.push(`        venue: ${q(p.venue)},`);
    if (p.rating !== undefined) lines.push(`        rating: ${p.rating},`);
    lines.push('      },');
  }
  lines.push('    ],');
  lines.push('  },');
}

const next = header + '[\n' + lines.join('\n') + '\n];' + footer;

// The header is sliced by offset, so an off-by-one silently truncates the
// declaration (`Song[] = [` losing its `] = `). Re-check the shape before
// writing rather than discovering it in a diff.
if (!/export const GRATEFUL_DEAD_SONGS:\s*Song\[\]\s*=\s*\[/.test(next)) {
  throw new Error('emitted file lost the GRATEFUL_DEAD_SONGS declaration — refusing to write');
}
for (const decl of ['export interface Song ', 'export interface SongPerformance ']) {
  if (!next.includes(decl)) throw new Error(`emitted file lost "${decl}" — refusing to write`);
}
const reparsed = new Function('return ' + next.slice(
  next.indexOf('[', next.indexOf('=', next.indexOf(marker))),
  next.lastIndexOf('];') + 1
))();
if (reparsed.length !== out.length) {
  throw new Error(`round-trip lost songs: emitted ${out.length}, re-parsed ${reparsed.length}`);
}

if (!write) {
  console.log('\n(dry run — pass --write to apply)');
  process.exit(0);
}

fs.writeFileSync(CATALOG, next);
console.log('\nwrote', CATALOG, (next.length / 1024 / 1024).toFixed(2) + 'MB');
