#!/usr/bin/env node
/**
 * Parse tapers_compendium_vol_1.md and generate src/data/showNotes.ts
 *
 * The source is an OCR of a printed book. Its structure, per entry:
 *
 *     ### 11/10/62                 <- date header (optional; many entries are undated)
 *     Jerry Garcia                 <- performer
 *     College of San Mateo, ...    <- venue
 *     Introduction, Man of ...     <- setlist
 *     Source: SBD, Quality: B-,    <- metadata block (always present)
 *     Highlights: all
 *
 *     Thanks to David Gans' ...    <- review prose, hard-wrapped to the column
 *     NICK MERIWETHER              <- reviewer byline, terminates the entry
 *
 * Two things make naive parsing wrong:
 *
 *  1. There are ~465 entries but only ~344 date headers. Delimiting on headers
 *     alone glues every undated entry onto the previous date. We delimit on the
 *     metadata block instead, and only give a date the entry that directly
 *     follows its header — undated entries are dropped, not merged.
 *
 *  2. The OCR lost paragraph indents, so blank lines are page breaks, not
 *     paragraph breaks (they routinely split a sentence). Paragraphs are
 *     recovered from the justified column instead: a line that ends a paragraph
 *     is short of the column width. See reflow().
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'reference_files', 'tapers_compendium_vol_1.md');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'showNotes.ts');

// The reviews run from here to the acknowledgments. Everything before is front
// matter, the interview section, "Symbols and Terms", and the "Commonly
// Mislabeled Tapes" appendix — all of which contain Source:/### date lines.
const BODY_START = 6100;
const BODY_END_MARKER = /^## Acknowledgments/;

// ---------------------------------------------------------------------------
// Reviewer bylines
// ---------------------------------------------------------------------------

// Every review closes with its reviewer's name set in caps, which makes the end
// of an entry unambiguous. The set below is the complete roster of such lines in
// the body of the book, including the several the OCR mangled ("NICK
// M.ERIWETHER", "JEFF TIED RICH", "WILUAM E.").
const REVIEWERS = new Set([
  'ADAM HUNTER BAUER', 'ANDREW J. LEMIEUX', 'ANDY LEMIEUX', 'BART WISE',
  'BILL KRISTI', 'BILL KRISTY', 'BLAIR JACKSON', 'BRIAN DYKE', 'BRYAN DYKE',
  'CHERIE CLARK-KING', 'CHRIS ALLEN', 'CHRISTIAN CRUMLISH',
  'COREY SANDERSON', 'DAN DASARO', 'DAN DESARO', 'DANIEL DASARO',
  'DARIO WOLFISH', 'DARREN E. MASON', 'DARREN MASON', 'DAVID R. CECCHI',
  'DENNIS DONLEY', 'DENNIS. DONLEY', 'DON OLDENBURG', 'DOUGAL DONALDSON',
  'DWIGHT HOLMES', 'DWIGHT R. HOLMES', 'ELIZA BUNDLEDEE', 'ERIC DOHERTY',
  'ERIC TAYLOR', 'ERIC VANDERCAR', 'EVELYNN GETZ', 'HARRY HAHN',
  'HARVEY LUBAR', 'HUGH BARROLL', 'IHOR SLABICKY', 'JAKE FROST',
  'JAMES SWIFT', 'JAMIE JOHANSEN', 'JAY KERLEY', 'JAY STRAUSS',
  'JEFF TIED RICH', 'JEFF TIEDRICH', 'JOHN OLEYNICK', 'JOHN R. DWORK',
  'JOHN R. DWORK AND MICHAEL PARRISH', 'JOHN R. DWORK WITH JEFF MATTSON',
  'JOHN R. DWORK WITH KIPP ARMSTRONG', 'JOHN WOOD', 'JOLIE GOODMAN',
  'JOUE GOODMAN', 'LARRY STEIN', 'MARC BLAKER', 'MICHAEL M. GETZ',
  'MICHAEL PARRISH', 'NICK M.ERIWETHER', 'NICK MERIWETHER', 'PAUL BODENHAM',
  'PAUL J. PEARAH', 'PAUL PEARAH', 'PETER KAYE', 'ROB EATON',
  'ROBERT A. GOETZ', 'SCOTT HAYMAKER', 'STEPHEN WADE', 'STEVE SILBERMAN',
  'TODD ELLENBERG', 'TOM FERRARO', 'WILLIAM POLITZ', 'WILLIAM POUTS',
  'WILUAM E.',
]);

// Names as printed, restored where the OCR damaged them.
const BYLINE_FIXES = {
  'NICK M.ERIWETHER': 'NICK MERIWETHER',
  'JEFF TIED RICH': 'JEFF TIEDRICH',
  'BRYAN DYKE': 'BRIAN DYKE',
  'DENNIS. DONLEY': 'DENNIS DONLEY',
  'JOUE GOODMAN': 'JOLIE GOODMAN',
  'BILL KRISTI': 'BILL KRISTY',
  'DAN DASARO': 'DAN DESARO',
  'DANIEL DASARO': 'DAN DESARO',
  'WILLIAM POUTS': 'WILLIAM POLITZ',
  'ANDREW J. LEMIEUX': 'ANDY LEMIEUX',
};

const ALL_CAPS = /^[A-Z][A-Z ,.'&-]{4,60}$/;

// A few features are credited to a lead reviewer and a team, which the book sets
// as one long line — "JOHN R. DWORK WITH ALEX THOMSON, JEFF MATTSON, ...".
function compoundByline(name) {
  const m = name.match(/^(.+?)\s+(?:WITH|AND|&)\s+[A-Z]/);
  return m && REVIEWERS.has(m[1]) ? m[1] : null;
}

function isByline(line) {
  const t = line.trim().replace(/[.,]+$/, '');
  if (!ALL_CAPS.test(t)) return false;
  return REVIEWERS.has(t) || compoundByline(t) !== null;
}

function bylineName(line) {
  const t = line.trim().replace(/[.,]+$/, '');
  return BYLINE_FIXES[t] || t;
}

// Every other all-caps line in the body is poster or caption text lifted off a
// photo plate — band names, "AN EVENING WITH THE", "JOE'S LIGHTS", the thanks
// under a feature. None of it belongs in a show note.
function isPosterText(line) {
  const t = line.trim();
  return ALL_CAPS.test(t) && !isByline(t);
}

// ---------------------------------------------------------------------------
// Metadata blocks
// ---------------------------------------------------------------------------

// Both forms a date header takes in the OCR.
function isDateHeaderLine(line) {
  const t = typeof line === 'string' ? line.trim() : '';
  return /^###/.test(t) || /^[~=\-]{1,3}\s*\d{1,2}\/\d{1,2}\/\d{2}\b/.test(t);
}

const SOURCE_LINE = /^\s*(?:\d+\s*\.+\s*)?Source:/;
const METADATA_KEY = /^\s*(?:\d+\s*\.+\s*)?(Source|Highlights|Comments|Personnel|Taper|Genealogy|Quality|Length|Notes|Equipment|Lineage):/i;
const GENEALOGY_FRAGMENT = /^\s*[A-Z]{1,6}\s*\d?\s*>/;

/**
 * Given the index of a `Source:` line, return the index of the first line after
 * the whole metadata block (Source / Highlights / Comments / Personnel and
 * their wrapped values).
 *
 * The block is found by walking the keys — they sit within a few lines of one
 * another — and then consuming the last key's wrapped value. A value ends where
 * any paragraph in a justified column ends: on a line short of the measure.
 * `Comments:` in particular runs to several sentences of prose, so a
 * "does this look like prose?" test cannot find its end; the column can.
 */
const MAX_KEY_GAP = 8;

function endOfMetadata(lines, start, limit) {
  // A date header means the next entry has begun; the block cannot run past it.
  let window = Math.min(limit, start + 40);
  for (let i = start; i < window; i++) {
    if (isDateHeaderLine(lines[i])) { window = i; break; }
  }

  // Widths of the block's own lines approximate the printed measure.
  const widths = [];
  for (let i = start; i < window; i++) {
    const len = lines[i].trim().length;
    if (len >= 30) widths.push(len);
  }
  const measure = widths.length
    ? widths.sort((a, b) => a - b)[Math.floor(widths.length * 0.9)]
    : 55;

  let lastKey = start;
  for (let i = start; i < window && i - lastKey <= MAX_KEY_GAP; i++) {
    if (METADATA_KEY.test(lines[i].trim())) lastKey = i;
  }

  let i = lastKey + 1;
  const valueLimit = Math.min(limit, lastKey + MAX_KEY_GAP);
  while (i < valueLimit) {
    const t = lines[i].trim();
    if (t === '') break;
    if (METADATA_KEY.test(t)) { i++; continue; }
    if (GENEALOGY_FRAGMENT.test(t)) { i++; continue; }
    i++;
    // A line short of the measure closes the value.
    if (t.length < measure - 7) break;
  }
  return i;
}

// ---------------------------------------------------------------------------
// Junk, footnotes, running heads
// ---------------------------------------------------------------------------

// Running heads printed at the top of each page, which the OCR glued into
// whatever word happened to be adjacent.
const RUNNING_HEAD = /Reviews:\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:19\d{2}|The Acid Tests)\.?/g;

const CITATION_SIGNAL = /(\bp{1,2}\.\s*\d+|\bno\.\s*\d+|\bvol\.|\bIbid|interviewed by|quoted in|e-mail to author|\((?:New York|San Francisco|Berkeley|Boston|London|Carbondale)|University Press|\bPress,|\b(?:19|20)\d{2}\)|liner notes|op\. cit)/i;

// Footnotes are set at the foot of a printed page, so in a linear OCR they land
// in the middle of whatever paragraph the page happened to break on. Nothing
// else in a review begins a line with a numeral and a period — the only other
// such lines in the body are the numbered `Source:` entries of a metadata
// block, which are excluded here.
function isFootnoteStart(line) {
  const t = line.trim();
  if (!/^\d{1,2}\.\s+["“\[A-Z]/.test(t)) return false;
  return !METADATA_KEY.test(t);
}

// A dangling tail of a citation left on its own line after a page break.
function isCitationTail(line) {
  const t = line.trim();
  if (/^p+[.,]?\s*\d+[.,]?$/i.test(t)) return true;                       // "p.152."
  if (/^(19|20)\d{2}\)[.,]?$/.test(t)) return true;                        // "1996)."
  if (/^\(?(New York|San Francisco|Berkeley|Boston|London)[:,]/.test(t)) return true;
  return false;
}

/**
 * Is this line part of an entry's heading rather than its review — a date, a
 * venue, a setlist? Song titles and place names are set in title case, which
 * separates them from prose far more reliably than punctuation does: the OCR
 * regularly cuts a review off mid-sentence at a page break, so "ends with a full
 * stop" would discard real text.
 */
function isHeadingLine(line) {
  const t = line.trim();
  if (t === '') return true;
  if (isDateHeaderLine(t)) return true;
  if (/^((First|Second|Third|Acoustic|Electric)\s+)?Sets?\s*\d*\s*:/i.test(t)) return true;
  if (/^(Encore|Early Show|Late Show)\b/i.test(t)) return true;
  if (METADATA_KEY.test(t) || GENEALOGY_FRAGMENT.test(t)) return true;
  if (isPosterText(t)) return true;

  const words = t.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  if (words.length < 3) return true;                     // a stray venue fragment
  const capitalised = words.filter((w) => /^[A-Z]/.test(w)).length;
  return capitalised / words.length >= 0.55;
}

// The citation itself, printed on the line after a bare footnote number.
function isBareCitation(line) {
  const t = line.trim();
  if (t.length > 110 || !/[.)]$/.test(t)) return false;
  if (!/^[A-Z][A-Za-z.'-]*(,|\s+[A-Z])/.test(t)) return false;
  return /(interviewed by|e-mail to author|quoted in|\bIbid|\bp{1,2}\.\s*\d+|\bno\.\s*\d+|liner notes)/i.test(t);
}

function isJunkLine(line) {
  const t = line.trim();
  if (t === '') return false;
  if (/photo credit/i.test(t)) return true;
  if (/^(Back row|Front row|Left to right|Top row|Clockwise)[,:]/i.test(t)) return true;
  if (/\b(left to right|back row|front row)\b/i.test(t) && t.length < 120) return true;
  if (/^(photo|poster|ticket stub|handbill)s?\s*(by|:)/i.test(t)) return true;
  if (/^\d{1,3}$/.test(t)) return true;                                    // page number
  if (/^\d{1,2}\.$/.test(t)) return true;                                  // orphaned footnote number
  if (isBareCitation(t)) return true;
  if (/^~\s*\d{4}/.test(t)) return true;                                   // "~ 1963 [?]"
  // Plate captions: a venue and a date, set on their own short line and never
  // closed with a full stop — "At the Fillmore West 311/69".
  if (t.length < 70 && !/[.!?]$/.test(t) && /\//.test(t) && /\d{3}/.test(t)
      && t.split(/\s+/).length <= 9 && /^[A-Z]/.test(t)) return true;
  if (/^R\.e\.v\.i/.test(t)) return true;                                  // OCR of "Reviews"
  if (/^[.•]{4,}$/.test(t)) return true;
  if (/^[lI1|]{3,}[•.1lI|\s]*$/.test(t)) return true;
  if (/^\d+[lI]{2,}[•.]+/.test(t)) return true;
  if (/^[•.]{3,}.*[•.]{3,}$/.test(t)) return true;
  if (isPosterText(t)) return true;
  if (isCitationTail(t)) return true;
  return false;
}

/**
 * Strip footnote blocks wherever they appear. Footnotes are set at the foot of
 * a printed page, so in a linear OCR they land in the middle of a paragraph.
 * A block runs from the numbered citation line to the next blank line.
 */
function stripFootnotes(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isFootnoteStart(lines[i])) { out.push(lines[i]); continue; }
    // Consume the citation and its wrapped continuations.
    i++;
    while (i < lines.length && lines[i].trim() !== '') {
      // Another numbered citation continues the block.
      if (/^\d{1,2}\.\s+\S/.test(lines[i].trim())) { i++; continue; }
      // A wrapped continuation of the citation we are inside.
      if (CITATION_SIGNAL.test(lines[i]) || lines[i].trim().length < 60) { i++; continue; }
      break;
    }
    i--; // the for-loop will advance past the terminator
  }
  return out;
}

// ---------------------------------------------------------------------------
// OCR repair
// ---------------------------------------------------------------------------

function repairOcr(text) {
  return text
    // The OCR reads a closing double quote followed by a superscript footnote
    // number as `,,N` — e.g. `passed the Acid Test.,,2`.
    .replace(/[.,]?,,(\d{1,2})\b/g, '."')
    .replace(/,,(?=[\s"])/g, '"')
    // Superscript footnote digits glued to the end of a quotation or sentence.
    .replace(/([”"])\s?\d{1,2}(?=[\s.,;:]|$)/g, '$1')
    .replace(/([.!?])\s?\d{1,2}(?=\s+["“(]?[A-Z])/g, '$1')
    // Spacing debris.
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

// ---------------------------------------------------------------------------
// Reflow
// ---------------------------------------------------------------------------

/**
 * The OCR preserves the printed column's hard line breaks and drops the
 * paragraph indents. In justified type every line of a paragraph fills the
 * column except the last, so a short line that ends a sentence is a paragraph
 * break. Indented block quotations are set in a narrower measure, so they are
 * detected as their own runs and reflowed against their own width.
 *
 * Lines that the OCR merged (it joined a hyphenated word across a line break)
 * are longer than the column; their trailing physical line is what matters, so
 * we compare `length - columnWidth` for those.
 */

// The OCR often leaves a space before a closing quote, so allow one.
const SENTENCE_END = /[.!?:]\s*["”’')\]]?$/;

// Marker left where a running head was printed through a word, telling the
// reflow to rejoin the two halves without a space.
const SPLIT = '\u0000';

function columnWidth(lengths) {
  if (lengths.length === 0) return 60;
  const sorted = [...lengths].sort((a, b) => a - b);
  // 90th percentile of the un-merged lines approximates the printed measure.
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
}

/** Split lines into runs set in the same measure (body vs. indented quote). */
function segmentByMeasure(lines) {
  const lens = lines.map((l) => l.length);
  const bodyW = columnWidth(lens.filter((n) => n >= 30));
  const narrowCut = bodyW - 8;

  const runs = [];
  let cur = { narrow: null, lines: [] };
  for (let i = 0; i < lines.length; i++) {
    const len = lines[i].length;
    // Merged lines and blank lines inherit the current measure.
    const isNarrow = len > 0 && len <= bodyW + 6 ? len < narrowCut : null;

    // A single short line is a paragraph ending, not a change of measure. Only
    // a run of three or more consecutive narrow lines is an indented block.
    if (isNarrow === null || cur.narrow === null || isNarrow === cur.narrow) {
      if (cur.narrow === null && isNarrow !== null) cur.narrow = isNarrow;
      cur.lines.push(lines[i]);
      continue;
    }
    runs.push(cur);
    cur = { narrow: isNarrow, lines: [lines[i]] };
  }
  if (cur.lines.length) runs.push(cur);

  // Merge runs shorter than three lines back into their neighbour: they are
  // ordinary paragraph endings, not a change of measure.
  const merged = [];
  for (const run of runs) {
    if (merged.length && run.lines.length < 3) {
      merged[merged.length - 1].lines.push(...run.lines);
    } else {
      merged.push(run);
    }
  }
  return merged;
}

function bare(line) {
  return line.split(SPLIT).join('');
}

function reflowRun(lines) {
  const real = lines.filter((l) => l.trim() !== '');
  if (real.length === 0) return [];
  const width = columnWidth(real.map((l) => bare(l).length).filter((n) => n >= 20));

  const paragraphs = [];
  let buf = [];
  const flush = () => {
    if (buf.length) { paragraphs.push(buf.join(' ')); buf = []; }
  };

  for (const line of real) {
    const t = line.trimEnd();
    buf.push(t);

    // How much of the printed column did the last physical line fill? A line
    // the OCR merged (it joined a hyphenated word across the break) runs past
    // the measure; what matters is the remainder on its second half.
    const len = bare(t).length;
    const tail = len > width + 6 ? len - width : len;
    if (tail < width - 7 && SENTENCE_END.test(bare(t).trim())) flush();
  }
  flush();
  return paragraphs;
}

/**
 * A paragraph that does not end on a full stop was not finished — the break came
 * from a change of measure (an indented quotation starting or ending) rather
 * than from the end of the paragraph. Fold it back into the next one.
 */
function mergeUnfinished(paragraphs) {
  const out = [];
  for (const p of paragraphs) {
    const prev = out[out.length - 1];
    if (prev && !SENTENCE_END.test(prev)) out[out.length - 1] = `${prev} ${p}`;
    else out.push(p);
  }
  return out;
}

/** Rejoin the halves of a word a running head was printed through. */
function joinSplitWords(text) {
  return text.split(new RegExp(SPLIT + '\\s*', 'g')).join('');
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

const content = fs.readFileSync(inputPath, 'utf8');
const allLines = content.split('\n');

let bodyEnd = allLines.length;
for (let i = BODY_START; i < allLines.length; i++) {
  if (BODY_END_MARKER.test(allLines[i])) { bodyEnd = i; break; }
}

const DATE_HEADER = /^###\s*/;
const DATE_TOKEN = /0?(\d{1,2}\/\d{1,2}\/\d{2})/g;

function headerDates(line) {
  const t = line.trim();
  // Most headers came through as "### 11/10/62"; a handful the OCR read off the
  // decorative rule above them instead, as "~ 8/27/72 '." — Veneta among them.
  if (!DATE_HEADER.test(t) && !/^[~=\-]{1,3}\s*\d{1,2}\/\d{1,2}\/\d{2}\b/.test(t)) return null;
  const found = t.replace(/^(###|[~=\-]{1,3})\s*/, '').match(/0?\d{1,2}\/\d{1,2}\/\d{2}/g);
  if (!found) return null;
  // "### 11/10/67### 11/11/67" — one entry covering two nights.
  return [...new Set(found)];
}

function toIso(dateStr) {
  const m = dateStr.match(/^0?(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!m) return null;
  const [, month, day, year] = m;
  const y = parseInt(year, 10);
  const fullYear = y >= 59 ? 1900 + y : 2000 + y;
  if (fullYear < 1959 || fullYear > 1974) return null;
  const mo = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${fullYear}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Pass 1 — locate every entry by its metadata block.
const entries = [];
for (let i = BODY_START; i < bodyEnd; i++) {
  if (!SOURCE_LINE.test(allLines[i])) continue;
  // Consecutive numbered sources belong to one block; skip ahead past them.
  const metaStart = i;
  const reviewStart = endOfMetadata(allLines, metaStart, bodyEnd);
  entries.push({ metaStart, reviewStart });
  i = reviewStart - 1;
}

// Pass 2 — bound each review and claim its date header.
//
// A date header belongs to the entry that follows it, so an entry may claim the
// nearest header above it as long as no other entry's metadata block sits in
// between. Bylines deliberately play no part here: the OCR sometimes lifts a
// byline out of place (it can land above the heading of the next entry), and an
// entry whose header the OCR dropped must stay undated rather than inherit its
// neighbour's date.
//
// The longest heading — performer, venue and a three-set setlist — runs to
// about sixty lines. A header further above than that is stranded inside a
// review, where the OCR left it, and claims nothing.
const MAX_HEADING_LINES = 70;

// `--explain YYYY-MM-DD` traces how one date's note was extracted.
const explainFlag = process.argv.indexOf('--explain');
const EXPLAIN_DATE = explainFlag === -1 ? null : process.argv[explainFlag + 1];
const stats = { entries: entries.length, dated: 0, undated: 0, tooShort: 0 };
const showNotes = {};
const claimedHeaders = new Set();
const dropped = [];

for (let e = 0; e < entries.length; e++) {
  const entry = entries[e];
  const hardEnd = e + 1 < entries.length ? entries[e + 1].metaStart : bodyEnd;

  // The review ends at its byline. A byline before any prose is one the OCR
  // displaced from the previous entry, so keep looking.
  let reviewEnd = hardEnd;
  let byline = null;
  let prose = 0;
  for (let i = entry.reviewStart; i < hardEnd; i++) {
    const line = allLines[i];
    if (isByline(line)) {
      if (prose < 120) continue;
      reviewEnd = i;
      byline = bylineName(line);
      // A team credit wraps onto a second all-caps line; keep the comma that
      // ends the first half.
      if (/,$/.test(line.trim()) && ALL_CAPS.test((allLines[i + 1] || '').trim())) {
        byline = `${line.trim()} ${allLines[i + 1].trim().replace(/[.,]+$/, '')}`;
      }
      break;
    }
    if (!isJunkLine(line)) prose += line.trim().length;
  }

  const gapStart = e === 0 ? BODY_START : entries[e - 1].metaStart + 1;
  const searchFrom = Math.max(gapStart, entry.metaStart - MAX_HEADING_LINES);
  let dates = null;
  for (let i = entry.metaStart - 1; i >= searchFrom; i--) {
    const found = headerDates(allLines[i]);
    if (found) { dates = found; claimedHeaders.add(i); break; }
  }

  if (!dates) { stats.undated++; continue; }

  const isoDates = dates.map(toIso).filter(Boolean);
  if (isoDates.length === 0) { stats.undated++; continue; }

  // ---- extract and clean -------------------------------------------------
  let lines = allLines.slice(entry.reviewStart, reviewEnd);

  // Running heads first: they were glued into a word, so removing one leaves a
  // marker telling the reflow to rejoin without a space.
  lines = lines.map((l) => {
    if (!RUNNING_HEAD.test(l)) return l;
    RUNNING_HEAD.lastIndex = 0;
    const cleaned = l.replace(RUNNING_HEAD, '');
    // The head was glued into a word; if it sat at the line end, the word
    // continues on the next line, so mark the join as space-free.
    return /[A-Za-z']$/.test(cleaned) ? cleaned + SPLIT : cleaned;
  });

  const explain = EXPLAIN_DATE && isoDates.includes(EXPLAIN_DATE);
  const trace = (stage) => {
    if (explain) console.log(`[${EXPLAIN_DATE}] ${stage}: ${lines.length} lines`);
  };
  if (explain) {
    console.log(`\n[${EXPLAIN_DATE}] source lines ${entry.metaStart + 1} (metadata) / ` +
      `${entry.reviewStart + 1}..${reviewEnd} (review), byline ${byline || 'none'}`);
  }
  trace('extracted');
  lines = stripFootnotes(lines);
  trace('footnotes stripped');
  lines = lines.filter((l) => !isJunkLine(l));
  trace('junk removed');

  // Trim leading debris: metadata the block scanner did not absorb, and the tail
  // of a setlist the OCR printed after it.
  while (lines.length) {
    const t = lines[0].trim();
    if (t === '' || METADATA_KEY.test(t) || GENEALOGY_FRAGMENT.test(t)) { lines.shift(); continue; }
    if (/^(MR|SBD|AUD|ADD|FM|RR|DAT|PCM|AVD|DR|C)\b/.test(t) && t.length < 60) { lines.shift(); continue; }
    if (t.length < 30 && /^[a-z]/.test(t)) { lines.shift(); continue; }
    if (isHeadingLine(t)) { lines.shift(); continue; }
    break;
  }
  trace('leading debris trimmed');

  // Without a byline the review is bounded only by the next entry's metadata, so
  // it runs on into that entry's heading. Even with one, the OCR sometimes
  // prints a stray line of setlist just above the byline. Trim either back off.
  while (lines.length && isHeadingLine(lines[lines.length - 1])) lines.pop();
  trace('trailing heading trimmed');
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  if (lines.length === 0) { stats.tooShort++; dropped.push(isoDates.join(',')); continue; }

  // ---- reflow ------------------------------------------------------------
  const paragraphs = [];
  for (const run of segmentByMeasure(lines)) {
    paragraphs.push(...reflowRun(run.lines));
  }

  let text = mergeUnfinished(paragraphs.map((p) => repairOcr(joinSplitWords(p))))
    .filter((p) => p.length > 0)
    .join('\n\n');

  if (text.length < 120) { stats.tooShort++; dropped.push(isoDates.join(',')); continue; }

  if (byline) text += `\n\n— ${byline}`;

  for (const iso of isoDates) {
    // A show can legitimately carry more than one reviewed tape.
    showNotes[iso] = showNotes[iso] ? `${showNotes[iso]}\n\n${text}` : text;
  }
  stats.dated++;
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

function escapeForTS(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

let ts = `// Auto-generated from The Deadhead's Taping Compendium, Vol. 1
// Do not edit manually — regenerate with: node scripts/parseCompendium.js
// Validate with: node scripts/verifyShowNotes.js

export const SHOW_NOTES_CITATION = 'Source: The Deadhead\\'s Taping Compendium, Vol. 1 — Michael M. Getz & John R. Dwork (Henry Holt and Company, 1998)';

/**
 * Show notes keyed by date (YYYY-MM-DD).
 * Review text extracted from The Deadhead's Taping Compendium, Volume 1.
 * Paragraphs are separated by a blank line; each review ends with its byline.
 */
export const SHOW_NOTES: Record<string, string> = {\n`;

for (const date of Object.keys(showNotes).sort()) {
  ts += `  '${date}': '${escapeForTS(showNotes[date])}',\n`;
}
ts += `};\n`;

fs.writeFileSync(outputPath, ts, 'utf8');

const dates = Object.keys(showNotes);
const lengths = dates.map((d) => showNotes[d].length).sort((a, b) => a - b);
console.log(`Entries found:      ${stats.entries}`);
console.log(`  dated (kept):     ${stats.dated}`);
console.log(`  undated (dropped):${stats.undated}`);
console.log(`  too short:        ${stats.tooShort}`);
console.log(`Unique dates:       ${dates.length}`);
console.log(`Note length min/median/max: ${lengths[0]} / ${lengths[Math.floor(lengths.length / 2)]} / ${lengths[lengths.length - 1]}`);

// Any date header the OCR stranded inside a review, or whose entry the OCR
// mangled beyond recovery, ends up here. Report it rather than losing it
// silently — a growing list means the parser has drifted.
const unclaimed = [];
for (let i = BODY_START; i < bodyEnd; i++) {
  if (claimedHeaders.has(i)) continue;
  const found = headerDates(allLines[i]);
  if (found) unclaimed.push(`${found.join(',')}@${i + 1}`);
}
console.log(`Headers with no usable entry: ${unclaimed.length}`);
if (dropped.length && process.argv.includes('--verbose')) {
  console.log(`Dated entries dropped as too short: ${dropped.join(' ')}`);
}
if (unclaimed.length && process.argv.includes('--verbose')) {
  console.log(`  ${unclaimed.join('  ')}`);
}
console.log(`Written to ${outputPath}`);
