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

/**
 * Catalog titles that are simply the wrong name for the song, keyed by the
 * damaged title. Each is corroborated by BOTH independent vocabularies — the
 * Compendium's prose and HeadyVersion's titles — and has no competing entry it
 * could be confused with.
 *
 * Deliberately NOT renamed, though they look similar:
 *   "It's All Over Now" (255)  — a real Dead song (Womack/Stones), distinct
 *                                from "Baby Blue" (3); renaming would merge two
 *                                different songs.
 *   "Smokestack Lightning"     — the query spelling varies, the catalog is right.
 *   "The Mighty Quinn"         — the query carries a parenthetical, not the title.
 */
const RENAME = {
  Estimated: 'Estimated Prophet',
  'Mind Left Body': 'Mind Left Body Jam',
  // Editorial renames (2026-08-25): spell out the ampersand, drop the
  // parenthetical (and its stray lowercase "i").
  '& We Bid You Goodnight': 'And We Bid You Goodnight',
  "(i Can't Get No) Satisfaction": "I Can't Get No Satisfaction",
};

/**
 * Distinct catalog entries that are the same song under two spellings the
 * mergeKey can't unify (one carried a parenthetical the other lacked). The
 * source entry's performances fold into the target entry, deduped by
 * identifier|date, and the source entry is dropped. Idempotent: once folded,
 * the source title no longer exists and the mapping is a no-op.
 *
 * Downstream keyed data must follow a fold — see songTags.ts (key removed),
 * songLookup.ts FORMER_TITLES, and normalizeSongTitleForLookup's canonical
 * alias in songPerformanceRatings.ts.
 */
const MERGE_INTO = {
  Satisfaction: "I Can't Get No Satisfaction",
};

/**
 * A track literally titled "X > Y" becomes its own catalog entry, so a song
 * that Archive almost always labels inside a segue never gets a standalone
 * entry. "Drums" and "Space" are the casualties: neither exists on its own,
 * despite being played at nearly every post-1978 show.
 *
 * The catalog already models composites and their parts side by side — 31 of
 * the 138 "China Cat Sunflower > I Know You Rider" performances also sit in the
 * standalone "China Cat Sunflower" — so this follows the existing shape rather
 * than inventing one.
 *
 * COVERAGE IS PARTIAL BY CONSTRUCTION. These entries can only carry the
 * performances whose track title names the segment, which is far short of how
 * often the band actually played it. They make the song findable; they are not
 * a performance census.
 */
const SPLIT_COMPOSITES = true;

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

// ---- rename catalog titles that are simply wrong -------------------------
let renamed = 0;
for (const song of out) {
  const next = RENAME[song.title];
  if (!next) continue;
  if (out.some(o => o !== song && mergeKey(o.title) === mergeKey(next))) {
    throw new Error(`rename "${song.title}" -> "${next}" would collide with an existing entry`);
  }
  song.title = next;
  renamed++;
}
if (renamed) console.log('\ncatalog titles renamed:', renamed);

// ---- fold distinct-spelling duplicates into their canonical entry ----------
for (const [from, to] of Object.entries(MERGE_INTO)) {
  const srcIdx = out.findIndex(s => s.title === from);
  const dst = out.find(s => s.title === to);
  if (srcIdx < 0 || !dst) continue; // already folded on a previous run
  const src = out[srcIdx];
  const seen = new Set(dst.performances.map(p => `${p.identifier}|${p.date}`));
  let added = 0;
  for (const p of src.performances) {
    const id = `${p.identifier}|${p.date}`;
    if (seen.has(id)) continue;
    seen.add(id);
    dst.performances.push(p);
    added++;
  }
  dst.performances.sort((a, b) => a.date.localeCompare(b.date) || a.identifier.localeCompare(b.identifier));
  dst.performanceCount = dst.performances.length;
  out.splice(srcIdx, 1);
  console.log(`\nfolded "${from}" (${src.performances.length} perfs, ${added} new) into "${to}" -> ${dst.performances.length} perfs`);
}

// ---- give segue-only songs a standalone entry ----------------------------
if (SPLIT_COMPOSITES) {
  const have = new Set(out.map(s => mergeKey(s.title)));
  const created = new Map();

  for (const song of out) {
    if (!song.title.includes('>')) continue;
    const parts = [...new Set(song.title.split('>').map(p => p.trim()).filter(Boolean))];
    for (const part of parts) {
      const k = mergeKey(part);
      if (!k || have.has(k)) continue;
      if (!created.has(k)) created.set(k, { title: part, performances: [], seen: new Set() });
      const target = created.get(k);
      for (const p of song.performances) {
        const id = `${p.identifier}|${p.date}`;
        if (target.seen.has(id)) continue;
        target.seen.add(id);
        // Drop the parent's rating: it was voted on the segue, not this part.
        const { rating, ...rest } = p;
        target.performances.push(rest);
      }
    }
  }

  for (const { title, performances } of created.values()) {
    performances.sort((a, b) => a.date.localeCompare(b.date) || a.identifier.localeCompare(b.identifier));
    out.push({ title, performanceCount: performances.length, performances });
    console.log(`   created standalone "${title}" from segue titles (${performances.length} perfs, partial coverage)`);
  }
  if (created.size) console.log('standalone entries created:', created.size);
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
