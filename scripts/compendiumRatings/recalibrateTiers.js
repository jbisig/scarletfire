#!/usr/bin/env node
/**
 * Retune the Compendium tier cutoffs without re-running any judging agents.
 *
 * compendiumRatings.ts already stores each show's verdict, confidence,
 * tape-only flag, caveat and highlights, so both the evidence score and the
 * tier can be recomputed from the file itself.
 *
 *   node scripts/compendiumRatings/recalibrateTiers.js                 # report only
 *   node scripts/compendiumRatings/recalibrateTiers.js --write         # apply defaults
 *   node scripts/compendiumRatings/recalibrateTiers.js 4.6 3.8 3.1 --write
 */
const fs = require('fs');
const {
  RATINGS_PATH, loadRatings, loadCuratedTiers,
  DEFAULT_CUTS, tierForScore, scoreEntry, renderRatings, REVIEWED_DISPUTES,
} = require('./lib');

const argv = process.argv.slice(2);
const write = argv.includes('--write');
const nums = argv.filter(a => !a.startsWith('--')).map(Number);
const cuts = nums.length === 3
  ? { t1: nums[0], t2: nums[1], t3: nums[2] }
  : { ...DEFAULT_CUTS };

if (nums.length && nums.length !== 3) {
  console.error('pass exactly three cutoffs (t1 t2 t3), highest first');
  process.exit(1);
}
if (!(cuts.t1 > cuts.t2 && cuts.t2 > cuts.t3)) {
  console.error(`cutoffs must be strictly descending, got ${cuts.t1}/${cuts.t2}/${cuts.t3}`);
  process.exit(1);
}

const ratings = loadRatings();
const curated = loadCuratedTiers();

const before = { 1: 0, 2: 0, 3: 0, none: 0 };
const after = { 1: 0, 2: 0, 3: 0, none: 0 };
const moved = [];

for (const [date, e] of Object.entries(ratings)) {
  before[e.tier === null ? 'none' : e.tier]++;
  // Recompute the score too, so a change to scoreEntry() propagates.
  const score = scoreEntry(e);
  const tier = tierForScore(score, cuts);
  if (tier !== e.tier) moved.push({ date, from: e.tier, to: tier, score });
  e.score = score;
  e.tier = tier;
  after[tier === null ? 'none' : tier]++;
}

// Disputes are a property of the notes, not of the cutoffs, so recompute them.
const disputes = Object.entries(ratings)
  .filter(([date, e]) => curated.has(date)
    && !REVIEWED_DISPUTES[date]
    && (e.tapeOnly || ['poor', 'ordinary'].includes(e.verdict)))
  .map(([date, e]) => ({
    date, curatedTier: curated.get(date), verdict: e.verdict,
    tapeOnly: !!e.tapeOnly, caveat: e.caveat || '', summary: e.summary || '',
  }))
  .sort((a, b) => a.curatedTier - b.curatedTier || a.date.localeCompare(b.date));

const fmt = t => `T1 ${t[1]}  T2 ${t[2]}  T3 ${t[3]}  unrated ${t.none}`;
console.log(`cutoffs ${cuts.t1} / ${cuts.t2} / ${cuts.t3}`);
console.log('before:', fmt(before));
console.log('after: ', fmt(after));
console.log('shows changing tier:', moved.length);
console.log('curated-tier disputes:', disputes.length,
  `(${Object.keys(REVIEWED_DISPUTES).length} already reviewed and settled)`);

const newlyRated = moved.filter(m => m.from === null && m.to !== null).length;
const unrated = moved.filter(m => m.from !== null && m.to === null).length;
console.log(`  newly rated ${newlyRated}, dropped to unrated ${unrated}`);

if (!write) {
  console.log('\n(report only — pass --write to apply)');
  process.exit(0);
}

fs.writeFileSync(RATINGS_PATH, renderRatings(ratings, disputes, cuts));
console.log('\nwrote', RATINGS_PATH);
console.log('now run: npx jest src/data/__tests__/compendiumRatings.test.ts');
