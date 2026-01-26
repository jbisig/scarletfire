const fs = require('fs');
const path = require('path');

const PHASE1_FILE = path.join(__dirname, '../src/data/phase1RatingsToCollect.json');

console.log('🎲 Adding sample ratings for demonstration...\n');

if (!fs.existsSync(PHASE1_FILE)) {
  console.error('❌ Phase 1 file not found!');
  process.exit(1);
}

const phase1Data = JSON.parse(fs.readFileSync(PHASE1_FILE, 'utf-8'));

let addedCount = 0;

// Add sample ratings based on score
phase1Data.forEach(song => {
  song.performances.forEach(perf => {
    if (!perf.rating) { // Only add if not already rated
      // Assign rating based on score:
      // Score 20: Tier 1 (legendary)
      // Score 17: Tier 2 (excellent)
      // Score 15 or less: Tier 3 (solid)
      if (perf.score >= 20) {
        perf.rating = 1;
      } else if (perf.score >= 17) {
        perf.rating = 2;
      } else {
        perf.rating = 3;
      }
      perf.notes = 'Sample rating based on venue/era score';
      addedCount++;
    }
  });
});

// Write back
fs.writeFileSync(PHASE1_FILE, JSON.stringify(phase1Data, null, 2), 'utf-8');

console.log(`✅ Added ${addedCount} sample ratings\n`);

// Summary
console.log('📊 Sample Rating Distribution:');
phase1Data.forEach(song => {
  const tier1 = song.performances.filter(p => p.rating === 1).length;
  const tier2 = song.performances.filter(p => p.rating === 2).length;
  const tier3 = song.performances.filter(p => p.rating === 3).length;

  if (tier1 + tier2 + tier3 > 0) {
    console.log(`   ${song.songTitle}: T1:${tier1} T2:${tier2} T3:${tier3}`);
  }
});

console.log(`\n💡 These are SAMPLE ratings based on era/venue score.`);
console.log(`   You can edit ${PHASE1_FILE} to adjust them.`);
console.log(`\n🚀 Now run: node scripts/applyPhase1Ratings.js`);
