#!/usr/bin/env node
/**
 * Parse tapers_compendium_vol_1.md and generate src/data/showNotes.ts
 *
 * Strategy:
 * 1. Find reviewer name (backward from end)
 * 2. Find first metadata block (Source through Highlights/Comments)
 * 3. Extract review text between metadata block and reviewer
 * 4. Clean up remnants
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'reference_files', 'tapers_compendium_vol_1.md');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'showNotes.ts');

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split('\n');

function convertDate(dateStr) {
  const match = dateStr.match(/^0?(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!match) return null;
  let [, month, day, year] = match;
  const yearNum = parseInt(year);
  const fullYear = yearNum >= 59 ? 1900 + yearNum : 2000 + yearNum;
  if (fullYear < 1959 || fullYear > 1974) return null;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function isReviewerLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[A-Z][A-Z .']+$/.test(trimmed) && trimmed.split(/\s+/).length >= 2 && trimmed.length >= 6 && trimmed.length <= 30) return true;
  return false;
}

function isJunkLine(line) {
  const t = line.trim();
  if (t.match(/^\(photo credit:/i)) return true;
  if (t.match(/^Pigpen,?\s+\d{4}/)) return true;
  if (t.match(/^At the .+\(photo/i)) return true;
  if (t.match(/^R\.e\.v\.i/)) return true;
  if (t.match(/^[.•]{5,}$/)) return true;
  if (t.match(/^[lI1]{3,}[•.1lI]*$/)) return true;
  if (t.match(/^\d+[lI]{2,}[•.]+/)) return true;
  if (t.match(/^J\s*y$/)) return true;
  if (t.match(/^[•.]{3,}.*[•.]{3,}$/)) return true;
  return false;
}

function isFootnote(line) {
  const trimmed = line.trim();
  return /^\d+\.\s+[A-Z]/.test(trimmed) && (
    trimmed.includes(',') || trimmed.includes('interview') || trimmed.includes('vol.') ||
    trimmed.includes('p.') || trimmed.includes('pp.') || trimmed.includes('no.') ||
    trimmed.includes('credit')
  );
}

// Find all entries
const entries = [];
const headerRegex = /^### 0?(\d{1,2}\/\d{1,2}\/\d{2})$/;
const mergedHeaderRegex = /^### 0?(\d{1,2}\/\d{1,2}\/\d{2})### 0?(\d{1,2}\/\d{1,2}\/\d{2})$/;

for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (i < 6100) continue; // Skip TOC, photo list, and "Commonly Mislabeled Tapes" section
  const mergedMatch = trimmed.match(mergedHeaderRegex);
  if (mergedMatch) {
    entries.push({ lineIndex: i, dateStr: mergedMatch[1] });
    entries.push({ lineIndex: i, dateStr: mergedMatch[2] });
    continue;
  }
  const match = trimmed.match(headerRegex);
  if (match) {
    entries.push({ lineIndex: i, dateStr: match[1] });
  }
}

console.log(`Found ${entries.length} entries`);

const showNotes = {};
let skipped = 0;
let extracted = 0;

for (let e = 0; e < entries.length; e++) {
  const entry = entries[e];
  const startLine = entry.lineIndex;
  const endLine = e + 1 < entries.length ? entries[e + 1].lineIndex : lines.length;

  const isoDate = convertDate(entry.dateStr);
  if (!isoDate) { skipped++; continue; }

  const entryLines = lines.slice(startLine + 1, endLine);

  // Step 1: Find reviewer name (backward from end)
  let reviewerIdx = -1;
  for (let i = entryLines.length - 1; i >= 0; i--) {
    if (isReviewerLine(entryLines[i])) {
      reviewerIdx = i;
      break;
    }
  }
  if (reviewerIdx === -1) reviewerIdx = entryLines.length;

  // Step 2: Find first Source: line
  let firstSourceIdx = -1;
  for (let i = 0; i < reviewerIdx; i++) {
    if (/^\s*(Source:|1\.\s*Source:|\d+\.\.\s*Source:)/.test(entryLines[i])) {
      firstSourceIdx = i;
      break;
    }
  }
  if (firstSourceIdx === -1) { skipped++; continue; }

  // Step 3: Find the end of the FIRST metadata block.
  // Scan from firstSourceIdx forward. The metadata block includes:
  // - Source lines (possibly multiple numbered sources before Highlights)
  // - Highlights line(s)
  // - Comments line(s)
  // - Personnel/Taper line(s)
  // We look for Highlights: or Comments: as the terminal metadata keyword,
  // since they always come last in the metadata block.
  // If neither exists, the metadata block ends after all Source/technical lines.

  let highlightsIdx = -1;
  let commentsIdx = -1;

  for (let i = firstSourceIdx; i < reviewerIdx; i++) {
    const t = entryLines[i].trim();
    if (/^Highlights:/.test(t)) {
      highlightsIdx = i;
      // Don't break — Comments might follow
    }
    if (/^Comments:/.test(t)) {
      commentsIdx = i;
      break; // Comments is always the last metadata field
    }
    // Stop scanning if we hit a line that's clearly review prose
    // (after finding at least Highlights)
    if (highlightsIdx !== -1 && i > highlightsIdx + 2) break;
    if (i > firstSourceIdx + 20) break; // Safety: metadata shouldn't be more than ~20 lines
  }

  // Determine where review starts based on what we found
  let reviewStart;

  if (commentsIdx !== -1) {
    // Comments: found — scan past its value to find review start
    reviewStart = commentsIdx + 1;
    while (reviewStart < reviewerIdx) {
      const t = entryLines[reviewStart].trim();
      if (t === '') { reviewStart++; break; }

      // Check if this looks like the start of review prose
      const startsWithProse = /^(This|The|A |An |Although|While|Not|After|From|As |What|Here|With|One|It |In |Bob|Bobby|Jerry|Garcia|Phil|Pig|Pigpen|Weir|Mickey|Keith|Donna|Bill|Bear|Lesh|Kreutz|Every|Perhaps|Much|For|We |On )/i.test(t);
      const mentionsTapeStuff = /\b(tape|source|SBD|AUD|genealogy|circulate|copy|copies|generation|bootleg|recording|reel|mike|deck|taper|FM-SBD|mislabel|label)\b/i.test(t);

      if (startsWithProse && !mentionsTapeStuff && t.length > 40) {
        break;
      }
      reviewStart++;
    }
  } else if (highlightsIdx !== -1) {
    // Highlights: found, no Comments — review starts after Highlights
    reviewStart = highlightsIdx + 1;
    // Skip Highlights continuation (song titles)
    while (reviewStart < reviewerIdx) {
      const t = entryLines[reviewStart].trim();
      if (t === '') { reviewStart++; break; }
      // If short and looks like more song titles, skip
      if (t.length < 60 && !t.match(/^(This|The|A |An |Although|While|Not|After|From|Here|Every|Perhaps|Bob|Jerry|Phil)/i)) {
        reviewStart++;
        continue;
      }
      break;
    }
  } else {
    // No Highlights/Comments — review starts after source metadata
    reviewStart = firstSourceIdx + 1;
    while (reviewStart < reviewerIdx) {
      const t = entryLines[reviewStart].trim();
      if (t === '') { reviewStart++; break; }
      // Skip source metadata continuation
      if (t.length < 80 && (
        /\b(Genealogy|Quality|Length|Taper|Source|SBD|AUD|ADD|FM|DAT|PCM|mike|deck|reel)\b/i.test(t) ||
        /^[A-Z]{2,5}\s*>/.test(t) || /^MR\b/.test(t)
      )) {
        reviewStart++;
        continue;
      }
      break;
    }
  }

  // Skip blank lines
  while (reviewStart < reviewerIdx && entryLines[reviewStart].trim() === '') {
    reviewStart++;
  }

  // Collect review lines
  const reviewLines = [];
  for (let i = reviewStart; i < reviewerIdx; i++) {
    const line = entryLines[i];
    const t = line.trim();
    // Stop at secondary source info AFTER the review
    if (/^\d+\.\s*Source:/.test(t)) break;
    if (t.startsWith('## ') || t.startsWith('# ')) break;
    if (/^Other\s+Re[uv]iew/i.test(t)) break;
    if (isJunkLine(line)) continue;
    reviewLines.push(line);
  }

  // Build review text
  let reviewText = reviewLines.join('\n').trim();
  reviewText = reviewText.replace(/\n{3,}/g, '\n\n');

  // Post-processing: strip leading metadata remnants
  const resultLines = reviewText.split('\n');
  while (resultLines.length > 0) {
    const first = resultLines[0].trim();
    if (first === '') { resultLines.shift(); continue; }
    if (/^(MR|SBD|AUD|ADD|FM|RR|DAT|PCM)\b/.test(first) && first.length < 60) { resultLines.shift(); continue; }
    if (/\bGenealogy:\s/.test(first)) { resultLines.shift(); continue; }
    if (/^Taper:\s/.test(first)) { resultLines.shift(); continue; }
    if (/^[A-Z]{2,5}\s*>\s*[A-Z]{2,5}/.test(first) && first.length < 40) { resultLines.shift(); continue; }
    if (/^(Highlights|Comments|Personnel|Source):/.test(first)) { resultLines.shift(); continue; }
    if (/^\d+\.\s*Source:/.test(first)) { resultLines.shift(); continue; }
    if (first.length < 40 && /\b(mike|deck|taper|Sony|ECM)\b/i.test(first)) { resultLines.shift(); continue; }
    // Strip setlist remnant lines (song titles with > notation)
    if (/\s*>\s*/.test(first) && first.length < 60 && !first.match(/^(This|The|A |An |It |In )/i)) { resultLines.shift(); continue; }
    // Strip lines that are clearly taper info (name with equipment)
    if (/\b(Falanga|Sony TC|ECM-?\d|Revox|reel-to-reel)\b/i.test(first) && first.length < 80) { resultLines.shift(); continue; }
    // Strip short orphan lines at the start (continuation of previous metadata)
    if (first.length < 30 && /^[a-z]/.test(first)) { resultLines.shift(); continue; }
    break;
  }

  // Strip trailing footnotes
  while (resultLines.length > 0) {
    const last = resultLines[resultLines.length - 1].trim();
    if (last === '' || isFootnote(last) || /^\d+\.$/.test(last)) {
      resultLines.pop();
    } else {
      break;
    }
  }

  reviewText = resultLines.join('\n').trim();
  reviewText = reviewText.replace(/\n{3,}/g, '\n\n');

  if (reviewText.length < 50) { skipped++; continue; }

  if (showNotes[isoDate]) {
    showNotes[isoDate] += '\n\n' + reviewText;
  } else {
    showNotes[isoDate] = reviewText;
  }
  extracted++;
}

console.log(`Extracted ${extracted} reviews for ${Object.keys(showNotes).length} unique dates`);
console.log(`Skipped ${skipped} entries`);

// Generate TypeScript
function escapeForTS(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

let tsContent = `// Auto-generated from The Deadhead's Taping Compendium, Vol. 1
// Do not edit manually — regenerate with: node scripts/parseCompendium.js

export const SHOW_NOTES_CITATION = 'Source: The Deadhead\\'s Taping Compendium, Vol. 1 — Michael M. Getz & John R. Dwork (Henry Holt and Company, 1998)';

/**
 * Show notes keyed by date (YYYY-MM-DD).
 * Review text extracted from The Deadhead's Taping Compendium, Volume 1.
 */
export const SHOW_NOTES: Record<string, string> = {\n`;

const sortedDates = Object.keys(showNotes).sort();
for (const date of sortedDates) {
  tsContent += `  '${date}': '${escapeForTS(showNotes[date])}',\n`;
}

tsContent += `};\n`;

fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log(`Written to ${outputPath}`);

// Verify
const checkDates = ['1962-11-10', '1966-01-08', '1966-01-29', '1966-03-25', '1966-07-03', '1966-12-01',
  '1969-02-14', '1969-02-27', '1970-01-02', '1970-01-03', '1970-02-14',
  '1972-04-08', '1973-02-09', '1974-10-17', '1974-10-18', '1974-10-20', '1974-11-11'];
console.log('\nVerify entries:');
for (const date of checkDates) {
  if (showNotes[date]) {
    console.log(`  ${date}: ${showNotes[date].substring(0, 130).replace(/\n/g, '\\n')}...`);
  } else {
    console.log(`  ${date}: MISSING`);
  }
}
