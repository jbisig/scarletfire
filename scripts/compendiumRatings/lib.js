// Shared helpers for the compendium ratings pipeline.
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', '..', 'src', 'data');
const RATINGS_PATH = path.join(DATA, 'compendiumRatings.ts');
const NOTES_PATH = path.join(DATA, 'showNotes.ts');

/**
 * Pull a `export const NAME: T = { ... };` object literal out of a generated .ts file.
 *
 * This evaluates the literal, which is only safe because the input is a
 * committed, generator-written file in this repo — never user input, never
 * fetched, and only ever run by a developer from the command line. Do not
 * repoint these helpers at untrusted content; add a real parser if that is
 * ever needed.
 */
function loadGeneratedObject(file, exportName) {
  const src = fs.readFileSync(file, 'utf8');
  const i = src.indexOf(exportName);
  if (i < 0) throw new Error(`${exportName} not found in ${file}`);
  const braceStart = src.indexOf('{', i);
  const tail = src.slice(braceStart);
  const end = tail.lastIndexOf('};');
  if (end < 0) throw new Error(`could not find end of ${exportName} in ${file}`);
  return new Function('return ' + tail.slice(0, end + 1))();
}

const loadNotes = () => loadGeneratedObject(NOTES_PATH, 'export const SHOW_NOTES');
const loadRatings = () => loadGeneratedObject(RATINGS_PATH, 'export const COMPENDIUM_RATINGS');

/** Default tier cutoffs on the evidence score. Tier 1 = 3 stars. */
const DEFAULT_CUTS = { t1: 4.8, t2: 4.0, t3: 3.3 };

const tierForScore = (score, cuts = DEFAULT_CUTS) =>
  score === null || score === undefined ? null
    : score >= cuts.t1 ? 1
    : score >= cuts.t2 ? 2
    : score >= cuts.t3 ? 3
    : null;

/**
 * Evidence score for one judged show. Deliberately absolute rather than
 * normalised per era or per batch: batches are date-contiguous, so any
 * batch-relative correction also erases the real quality difference between
 * eras (it demoted Cornell while promoting 35 mid-80s shows when tried).
 */
function scoreEntry(rec) {
  if (rec.verdict === 'insufficient') return null;
  const base = { essential: 4, excellent: 3, notable: 2, ordinary: 1, poor: 0 }[rec.verdict];
  if (base === undefined) return null;
  let s = base;

  if (rec.confidence === 'low') s -= 0.6;
  else if (rec.confidence === 'medium') s -= 0.2;

  if (rec.tapeOnly) s -= 1.0;

  const caveat = (rec.caveat || '').toLowerCase();
  if (/tape|recording|sound quality/.test(caveat)) s -= 0.4;
  if (/anecdote|personal|venue history|history of/.test(caveat)) s -= 0.3;
  if (/only one song|one song|single song|one segment|only the/.test(caveat)) s -= 0.3;
  if (/incomplete|partial|fragment|cut/.test(caveat)) s -= 0.2;
  if (/whole run|the run|not this date|entire run/.test(caveat)) s -= 0.4;

  const hs = rec.highlights || [];
  const strong = hs.filter(h => h.assessment === 'legendary').length;
  const good = hs.filter(h => h.assessment === 'excellent').length;
  const neg = hs.filter(h => h.assessment === 'negative').length;
  s += Math.min(1.0, strong * 0.35 + good * 0.12);
  s -= Math.min(0.6, neg * 0.25);

  if (!(rec.evidence || []).length) s -= 0.8;
  return s;
}

const esc = s => JSON.stringify(String(s == null ? '' : s));

/** Re-emit compendiumRatings.ts from an in-memory {date: entry} map. */
function renderRatings(ratings, disputes, cuts = DEFAULT_CUTS) {
  const dates = Object.keys(ratings).sort();
  const tiered = dates.filter(d => ratings[d].tier !== null);
  const withHl = dates.filter(d => (ratings[d].highlights || []).length);
  const L = [];

  L.push(`// src/data/compendiumRatings.ts`);
  L.push(`/**`);
  L.push(` * Show quality verdicts and per-show song highlights derived from the`);
  L.push(` * Deadhead's Taping Compendium notes in showNotes.ts.`);
  L.push(` *`);
  L.push(` * GENERATED — do not hand-edit. Regenerate or retune with`);
  L.push(` *   node scripts/compendiumRatings/recalibrateTiers.js`);
  L.push(` * Verify with`);
  L.push(` *   node scripts/compendiumRatings/verifyQuotes.js`);
  L.push(` * Every quote here is an exact substring of that date's note.`);
  L.push(` *`);
  L.push(` * ${dates.length} shows judged; ${tiered.length} carry a tier; ${withHl.length} carry highlights.`);
  L.push(` * Tier cutoffs on the evidence score: ${cuts.t1} / ${cuts.t2} / ${cuts.t3}.`);
  L.push(` * Tier 1 = 3 stars, matching ClassicTier elsewhere.`);
  L.push(` *`);
  L.push(` * This is ONE source (a taping guide). It supplements, and never overrides,`);
  L.push(` * the multi-source community consensus in classicShowsTiers.ts.`);
  L.push(` */`);
  L.push(``);
  L.push(`import type { ClassicTier } from './classicShowsTiers';`);
  L.push(``);
  L.push(`export type CompendiumVerdict =`);
  L.push(`  | 'essential' | 'excellent' | 'notable' | 'ordinary' | 'poor' | 'insufficient';`);
  L.push(``);
  L.push(`export type HighlightAssessment =`);
  L.push(`  | 'legendary' | 'excellent' | 'notable' | 'rare' | 'negative';`);
  L.push(``);
  L.push(`export interface ShowHighlight {`);
  L.push(`  /** Song title as the Compendium names it. */`);
  L.push(`  song: string;`);
  L.push(`  /** Catalog title when the song resolves to songs.generated.ts, else undefined. */`);
  L.push(`  canonicalTitle?: string;`);
  L.push(`  assessment: HighlightAssessment;`);
  L.push(`  /** Short display phrase, grounded in \`quote\`. */`);
  L.push(`  reason: string;`);
  L.push(`  /** Verbatim excerpt from that date's show note. */`);
  L.push(`  quote: string;`);
  L.push(`}`);
  L.push(``);
  L.push(`export interface CompendiumEntry {`);
  L.push(`  verdict: CompendiumVerdict;`);
  L.push(`  confidence: 'high' | 'medium' | 'low';`);
  L.push(`  /** Evidence score behind the tier; null when the note is unassessable. */`);
  L.push(`  score: number | null;`);
  L.push(`  tier: ClassicTier | null;`);
  L.push(`  /** True when the note's praise is about the recording, not the playing. */`);
  L.push(`  tapeOnly: boolean;`);
  L.push(`  caveat?: string;`);
  L.push(`  /** One-line description of what stood out. */`);
  L.push(`  summary?: string;`);
  L.push(`  /** Verbatim excerpts backing the verdict. Absent only when the note supports none. */`);
  L.push(`  evidence?: string[];`);
  L.push(`  highlights: ShowHighlight[];`);
  L.push(`}`);
  L.push(``);
  L.push(`export const COMPENDIUM_RATINGS: Record<string, CompendiumEntry> = {`);

  for (const d of dates) {
    const e = ratings[d];
    const p = [];
    p.push(`    verdict: ${esc(e.verdict)}`);
    p.push(`    confidence: ${esc(e.confidence)}`);
    p.push(`    score: ${e.score === null || e.score === undefined ? 'null' : Number(e.score).toFixed(2)}`);
    p.push(`    tier: ${e.tier === null || e.tier === undefined ? 'null' : e.tier}`);
    p.push(`    tapeOnly: ${e.tapeOnly ? 'true' : 'false'}`);
    if (e.caveat) p.push(`    caveat: ${esc(e.caveat)}`);
    if (e.summary) p.push(`    summary: ${esc(e.summary)}`);
    if ((e.evidence || []).length) {
      p.push(`    evidence: [\n${e.evidence.map(x => `      ${esc(x)},`).join('\n')}\n    ]`);
    }
    const hs = e.highlights || [];
    if (!hs.length) p.push(`    highlights: []`);
    else {
      const hl = hs.map(h => {
        const f = [`        song: ${esc(h.song)}`];
        if (h.canonicalTitle) f.push(`        canonicalTitle: ${esc(h.canonicalTitle)}`);
        f.push(`        assessment: ${esc(h.assessment)}`);
        f.push(`        reason: ${esc(h.reason)}`);
        f.push(`        quote: ${esc(h.quote)}`);
        return `      {\n${f.join(',\n')},\n      }`;
      }).join(',\n');
      p.push(`    highlights: [\n${hl},\n    ]`);
    }
    L.push(`  ${esc(d)}: {\n${p.join(',\n')},\n  },`);
  }
  L.push(`};`);
  L.push(``);
  L.push(`/** Compendium-derived tier for a date, or null. */`);
  L.push(`export function getCompendiumTier(date: string): ClassicTier | null {`);
  L.push(`  return COMPENDIUM_RATINGS[date.split('T')[0]]?.tier ?? null;`);
  L.push(`}`);
  L.push(``);
  L.push(`/** Songs the Compendium singles out as standouts of that show. */`);
  L.push(`export function getShowHighlights(date: string): ShowHighlight[] {`);
  L.push(`  return COMPENDIUM_RATINGS[date.split('T')[0]]?.highlights ?? [];`);
  L.push(`}`);
  L.push(``);
  L.push(`/** One-line note on what stood out about that show, when the notes support one. */`);
  L.push(`export function getShowSummary(date: string): string | null {`);
  L.push(`  return COMPENDIUM_RATINGS[date.split('T')[0]]?.summary ?? null;`);
  L.push(`}`);
  L.push(``);
  L.push(`/**`);
  L.push(` * Dates where classicShowsTiers.ts rates a show a classic but its Compendium`);
  L.push(` * note actively undercuts that — the note is weak, or its praise is about the`);
  L.push(` * tape rather than the playing. Surfaced for review; nothing is auto-demoted.`);
  L.push(` */`);
  L.push(`export const CURATED_TIER_DISPUTES: ReadonlyArray<{`);
  L.push(`  date: string; curatedTier: ClassicTier; verdict: CompendiumVerdict;`);
  L.push(`  tapeOnly: boolean; caveat: string; summary: string;`);
  L.push(`}> = [`);
  for (const c of disputes) {
    L.push(`  { date: ${esc(c.date)}, curatedTier: ${c.curatedTier}, verdict: ${esc(c.verdict)}, tapeOnly: ${!!c.tapeOnly}, caveat: ${esc(c.caveat)}, summary: ${esc(c.summary)} },`);
  }
  L.push(`];`);
  L.push(``);
  return L.join('\n');
}

/**
 * Disputes a human has already looked at and settled, so regeneration stops
 * re-raising them. Keyed by date, value is why the curated tier stands.
 *
 * A date here still keeps its curated tier — that was always true — but it is
 * dropped from CURATED_TIER_DISPUTES so the list stays a queue of things that
 * genuinely need judgment rather than a permanent backlog.
 */
const REVIEWED_DISPUTES = {
  '1977-05-09': "Reviewed 2026-08-23: kept at 3 stars. The Compendium note dwells on the tape, but the May '77 run's standing does not rest on this one book.",
  '1972-05-04': 'Reviewed 2026-08-23: kept at 2 stars. The note calls the show unremarkable; the curated Europe ’72 rating stands.',
  '1969-04-05': 'Reviewed 2026-08-23: kept at 1 star. The note pans the second set but still calls the Dark Star a classic; the curated rating stands.',
};

/** Curated tiers from classicShowsTiers.ts, best (lowest) tier per date. */
function loadCuratedTiers() {
  const src = fs.readFileSync(path.join(DATA, 'classicShowsTiers.ts'), 'utf8');
  const map = new Map();
  for (const m of src.matchAll(/date:\s*'(\d{4}-\d{2}-\d{2})',\s*tier:\s*(\d)/g)) {
    const d = m[1], t = Number(m[2]);
    if (!map.has(d) || map.get(d) > t) map.set(d, t);
  }
  return map;
}

module.exports = {
  DATA, RATINGS_PATH, NOTES_PATH,
  loadGeneratedObject, loadNotes, loadRatings, loadCuratedTiers,
  DEFAULT_CUTS, tierForScore, scoreEntry, renderRatings,
  REVIEWED_DISPUTES,
};
