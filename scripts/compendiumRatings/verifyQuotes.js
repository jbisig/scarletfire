#!/usr/bin/env node
/**
 * Verify every quote in compendiumRatings.ts is an exact substring of the
 * showNotes.ts note it cites. This is the guarantee the whole dataset rests on:
 * a rating or a highlight is only trustworthy if the text backing it is real.
 *
 * Also reports, for any quote that fails, whether the text exists in a
 * DIFFERENT date's note — cross-date contamination is the failure mode that
 * looks most convincing and is the most important to catch.
 *
 *   node scripts/compendiumRatings/verifyQuotes.js
 */
const { loadNotes, loadRatings } = require('./lib');

const notes = loadNotes();
const ratings = loadRatings();

const norm = s => s.replace(/\s+/g, ' ').toLowerCase();
const normNotes = Object.fromEntries(Object.entries(notes).map(([d, t]) => [d, norm(t)]));

let evidence = 0, highlights = 0;
const bad = [];
const missingNote = [];

for (const [date, entry] of Object.entries(ratings)) {
  const note = notes[date];
  if (note === undefined) { missingNote.push(date); continue; }

  const checks = [
    ...(entry.evidence || []).map(q => ['evidence', q]),
    ...(entry.highlights || []).map(h => [`highlight:${h.song}`, h.quote]),
  ];

  for (const [kind, quote] of checks) {
    if (kind === 'evidence') evidence++; else highlights++;
    if (typeof quote === 'string' && note.includes(quote)) continue;

    let where = 'NOT FOUND ANYWHERE';
    const nq = norm(String(quote || ''));
    if (nq && normNotes[date].includes(nq)) where = 'whitespace-only mismatch';
    else if (nq) {
      const other = Object.keys(normNotes).find(d => d !== date && normNotes[d].includes(nq));
      if (other) where = `BELONGS TO ${other}`;
    }
    bad.push({ date, kind, where, quote: String(quote || '').slice(0, 100) });
  }
}

console.log(`dates: ${Object.keys(ratings).length}`);
console.log(`quotes checked: ${evidence + highlights} (evidence ${evidence}, highlights ${highlights})`);
if (missingNote.length) console.log(`dates with no matching note: ${missingNote.length}`, missingNote.slice(0, 10));
console.log(`failures: ${bad.length}`);

for (const b of bad.slice(0, 40)) {
  console.log(`  ${b.date}  ${b.kind}  [${b.where}]\n    ${JSON.stringify(b.quote)}`);
}
if (bad.length > 40) console.log(`  ... and ${bad.length - 40} more`);

process.exit(bad.length || missingNote.length ? 1 : 0);
