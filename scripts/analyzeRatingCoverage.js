const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');

console.log('📊 Analyzing rating coverage across songs...\n');

const content = fs.readFileSync(SONGS_FILE, 'utf-8');
const lines = content.split('\n');

const songs = [];
let currentSong = null;

for (const line of lines) {
  const titleMatch = line.match(/^\s*title:\s*"([^"]+)"/);
  if (titleMatch) {
    currentSong = {
      title: titleMatch[1],
      totalPerformances: 0,
      ratedPerformances: 0,
      ratings: { tier1: 0, tier2: 0, tier3: 0 }
    };
    songs.push(currentSong);
    continue;
  }

  const perfCountMatch = line.match(/^\s*performanceCount:\s*(\d+)/);
  if (perfCountMatch && currentSong) {
    currentSong.totalPerformances = parseInt(perfCountMatch[1]);
  }

  const ratingMatch = line.match(/^\s*rating:\s*(\d+)/);
  if (ratingMatch && currentSong) {
    currentSong.ratedPerformances++;
    const tier = parseInt(ratingMatch[1]);
    if (tier === 1) currentSong.ratings.tier1++;
    if (tier === 2) currentSong.ratings.tier2++;
    if (tier === 3) currentSong.ratings.tier3++;
  }
}

// Analysis
const songsWithNoRatings = songs.filter(s => s.ratedPerformances === 0);
const songsWithSomeRatings = songs.filter(s => s.ratedPerformances > 0);
const songsFullyRated = songs.filter(s => s.ratedPerformances === s.totalPerformances);

console.log('=== RATING COVERAGE ANALYSIS ===\n');
console.log(`Total songs: ${songs.length}`);
console.log(`Songs with NO ratings: ${songsWithNoRatings.length} (${((songsWithNoRatings.length/songs.length)*100).toFixed(1)}%)`);
console.log(`Songs with SOME ratings: ${songsWithSomeRatings.length} (${((songsWithSomeRatings.length/songs.length)*100).toFixed(1)}%)`);
console.log(`Songs FULLY rated: ${songsFullyRated.length} (${((songsFullyRated.length/songs.length)*100).toFixed(1)}%)\n`);

// Top songs by performance count with no ratings
console.log('=== TOP SONGS WITH NO RATINGS (by performance count) ===\n');
songsWithNoRatings
  .sort((a, b) => b.totalPerformances - a.totalPerformances)
  .slice(0, 20)
  .forEach((s, i) => {
    console.log(`${i + 1}. ${s.title} (${s.totalPerformances} performances)`);
  });

// Songs with partial ratings
console.log('\n=== SONGS WITH PARTIAL RATINGS (need more) ===\n');
const partiallyRated = songsWithSomeRatings
  .filter(s => s.ratedPerformances < s.totalPerformances)
  .sort((a, b) => {
    const aPct = a.ratedPerformances / a.totalPerformances;
    const bPct = b.ratedPerformances / b.totalPerformances;
    return aPct - bPct; // Lowest percentage first
  });

console.log(`Songs with partial coverage: ${partiallyRated.length}\n`);
console.log('Top songs with lowest rating coverage:');
partiallyRated.slice(0, 15).forEach((s, i) => {
  const pct = ((s.ratedPerformances / s.totalPerformances) * 100).toFixed(1);
  console.log(`${i + 1}. ${s.title}: ${s.ratedPerformances}/${s.totalPerformances} rated (${pct}%)`);
});

// Most-rated songs
console.log('\n=== BEST RATED SONGS (most ratings) ===\n');
songsWithSomeRatings
  .sort((a, b) => b.ratedPerformances - a.ratedPerformances)
  .slice(0, 10)
  .forEach((s, i) => {
    const pct = ((s.ratedPerformances / s.totalPerformances) * 100).toFixed(1);
    const t1 = s.ratings.tier1;
    const t2 = s.ratings.tier2;
    const t3 = s.ratings.tier3;
    console.log(`${i + 1}. ${s.title}: ${s.ratedPerformances}/${s.totalPerformances} (${pct}%) - T1:${t1} T2:${t2} T3:${t3}`);
  });

// Summary stats
const totalPerformances = songs.reduce((sum, s) => sum + s.totalPerformances, 0);
const totalRated = songs.reduce((sum, s) => sum + s.ratedPerformances, 0);
const avgPerfsPerSong = totalPerformances / songs.length;
const avgRatedPerSong = totalRated / songs.length;

console.log('\n=== OVERALL STATISTICS ===\n');
console.log(`Total performances: ${totalPerformances.toLocaleString()}`);
console.log(`Total rated: ${totalRated.toLocaleString()} (${((totalRated/totalPerformances)*100).toFixed(1)}%)`);
console.log(`Avg performances per song: ${avgPerfsPerSong.toFixed(1)}`);
console.log(`Avg rated per song: ${avgRatedPerSong.toFixed(1)}`);
console.log(`\nRating gap: ${(totalPerformances - totalRated).toLocaleString()} performances need ratings`);
