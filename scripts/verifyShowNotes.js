#!/usr/bin/env node
/**
 * Validate src/data/showNotes.ts after regenerating it with
 *   python3 scripts/parse_compendium_pdf.py
 *
 * The notes are extracted from an OCR of a printed book, so the failure modes
 * are structural: one show's note picking up another entry's text, page
 * furniture (metadata blocks, footnotes, running heads) surviving the clean, or
 * the reflow leaving the text as hard-wrapped fragments.
 *
 * Exits non-zero if any check fails. Pass a .ts path to check a file other than
 * the generated one, and --sample [date] to print a note.
 */

const fs = require('fs');
const path = require('path');

const pathArg = process.argv.slice(2).find((a) => a.endsWith('.ts'));
const notesPath = pathArg || path.join(__dirname, '..', 'src', 'data', 'showNotes.ts');
const source = fs.readFileSync(notesPath, 'utf8');

// The file is generated one entry per line, so parse it without executing TS.
const notes = {};
for (const line of source.split('\n')) {
  const m = line.match(/^ {2}'(\d{4}-\d{2}-\d{2})': '(.*)',$/);
  if (!m) continue;
  notes[m[1]] = m[2]
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

const dates = Object.keys(notes);
const failures = [];
const warnings = [];

function fail(check, detail) { failures.push(`${check}: ${detail}`); }
function warn(check, detail) { warnings.push(`${check}: ${detail}`); }

// --- structural contamination ----------------------------------------------

const METADATA = /(^|\n)\s*(?:\d+\s*\.+\s*)?(Source|Highlights|Genealogy|Personnel|Taper|Comments):/;
const BYLINE_MIDTEXT = /\n[A-Z][A-Z .'&-]{4,40}\n/;
const RUNNING_HEAD = /Reviews:\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:19\d{2}|The Acid Tests)/;
const FOOTNOTE = /(^|\n)\d{1,2}\.\s+[A-Z][^\n]{20,}?(?:\bp{1,2}\.\s*\d|interviewed by|quoted in|\(New York)/;

for (const [date, text] of Object.entries(notes)) {
  if (METADATA.test(text)) fail('metadata block leaked', date);
  if (BYLINE_MIDTEXT.test(text)) fail('reviewer byline mid-text', date);
  if (RUNNING_HEAD.test(text)) fail('running head not stripped', date);
  if (FOOTNOTE.test(text)) fail('footnote not stripped', date);
  if (/\bibid\b/i.test(text)) warn('possible citation fragment', date);
}

// --- formatting -------------------------------------------------------------

for (const [date, text] of Object.entries(notes)) {
  // The reflow should have produced flowing paragraphs. A note whose average
  // line is around the printed column width was not reflowed.
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const avg = lines.reduce((n, l) => n + l.length, 0) / lines.length;
  if (lines.length > 3 && avg < 90) fail('still hard-wrapped', `${date} (avg line ${Math.round(avg)})`);

  if (/\n{3,}/.test(text)) fail('blank-line run', date);
  if (/[ \t]\n|\n[ \t]/.test(text)) fail('whitespace around newline', date);
  if (text !== text.trim()) fail('untrimmed', date);
  if (/,,/.test(text)) warn('unrepaired OCR quote', date);
  if (!/—\s/.test(text)) warn('no byline', date);
}

// --- plausibility -----------------------------------------------------------

const lengths = dates.map((d) => notes[d].length).sort((a, b) => a - b);
const median = lengths[Math.floor(lengths.length / 2)];

for (const [date, text] of Object.entries(notes)) {
  // A note far past the median is the signature of a run-on that swallowed
  // neighbouring entries. Genuinely long multi-review notes exist, so this is a
  // warning to eyeball, not a hard failure — except at absurd sizes.
  if (text.length > 60000) fail('implausibly long (swallowed other entries?)', `${date} (${text.length} chars)`);
  else if (text.length > median * 6) warn('unusually long', `${date} (${text.length} chars)`);
  if (text.length < 200) warn('very short', `${date} (${text.length} chars)`);
}

for (const date of dates) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('malformed date key', date);
  const year = parseInt(date.slice(0, 4), 10);
  if (year < 1959 || year > 1995) fail('date outside the Compendium range', date);
}

const sorted = [...dates].sort();
if (JSON.stringify(sorted) !== JSON.stringify(dates)) fail('keys not sorted', 'showNotes.ts');

// --- report -----------------------------------------------------------------

const sampleFlag = process.argv.indexOf('--sample');
if (sampleFlag !== -1) {
  const wanted = process.argv[sampleFlag + 1];
  const picks = wanted && /^\d{4}-/.test(wanted)
    ? [wanted]
    : [dates[0], dates[Math.floor(dates.length / 3)], dates[Math.floor(dates.length / 2)], dates[dates.length - 1]];
  for (const d of picks) {
    console.log(`\n${'='.repeat(70)}\n${d}\n${'='.repeat(70)}\n${notes[d] || '(no note)'}`);
  }
  console.log('');
}

console.log(`Notes:  ${dates.length}`);
console.log(`Length: min ${lengths[0]} / median ${median} / p90 ${lengths[Math.floor(lengths.length * 0.9)]} / max ${lengths[lengths.length - 1]}`);
console.log(`Years:  ${sorted[0]} .. ${sorted[sorted.length - 1]}`);

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings.slice(0, 40)) console.log(`  - ${w}`);
  if (warnings.length > 40) console.log(`  ... and ${warnings.length - 40} more`);
}

if (failures.length) {
  console.log(`\nFAILURES (${failures.length}):`);
  for (const f of failures.slice(0, 60)) console.log(`  - ${f}`);
  if (failures.length > 60) console.log(`  ... and ${failures.length - 60} more`);
  process.exit(1);
}

console.log('\nAll checks passed.');
