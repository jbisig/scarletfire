const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');
const OUTPUT_FILE = path.join(__dirname, '../src/data/phase1RatingsToCollect.json');

console.log('🎵 Phase 1: Generating ratings collection list...\n');

// Parse songs file
const content = fs.readFileSync(SONGS_FILE, 'utf-8');
const lines = content.split('\n');

const songs = [];
let currentSong = null;

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];

  const titleMatch = line.match(/^\s*title:\s*"([^"]+)"/);
  if (titleMatch) {
    currentSong = {
      title: titleMatch[1],
      performances: []
    };
    songs.push(currentSong);
    continue;
  }

  if (currentSong) {
    const dateMatch = line.match(/^\s*date:\s*"([^"]+)"/);
    if (dateMatch) {
      const date = dateMatch[1];
      let identifier = '';
      let venue = '';
      let rating = null;

      // Look ahead for identifier, venue, rating in next few lines
      for (let i = lineIdx + 1; i < Math.min(lineIdx + 6, lines.length); i++) {
        const nextLine = lines[i];

        const idMatch = nextLine.match(/^\s*identifier:\s*"([^"]+)"/);
        if (idMatch) identifier = idMatch[1];

        const venueMatch = nextLine.match(/^\s*venue:\s*"([^"]+)"/);
        if (venueMatch) venue = venueMatch[1];

        const ratingMatch = nextLine.match(/^\s*rating:\s*(\d+),?\s*$/);
        if (ratingMatch) rating = parseInt(ratingMatch[1]);

        // Stop at closing brace
        if (nextLine.match(/^\s*\},?\s*$/)) break;
      }

      if (identifier) {
        currentSong.performances.push({ date, identifier, venue, rating });
      }
    }
  }
}

console.log(`📊 Parsed ${songs.length} songs\n`);

// Filter songs with zero ratings
const songsWithNoRatings = songs
  .filter(s => s.performances.every(p => !p.rating))
  .sort((a, b) => b.performances.length - a.performances.length);

console.log(`🎯 Found ${songsWithNoRatings.length} songs with NO ratings\n`);

// Target: Top 20 songs with most performances
const targetSongs = songsWithNoRatings.slice(0, 20);

console.log('📋 Phase 1 Target Songs (Top 20 by performance count):\n');
targetSongs.forEach((song, i) => {
  console.log(`${i + 1}. ${song.title} (${song.performances.length} performances)`);
});

// Smart selection criteria
function scorePerformance(perf, allPerfs) {
  let score = 0;
  const year = parseInt(perf.date.split('-')[0]);

  // Golden era (1972-1977): +10 points
  if (year >= 1972 && year <= 1977) score += 10;

  // Classic era (1968-1974): +5 points
  if (year >= 1968 && year <= 1974) score += 5;

  // Late peak (1989-1990): +3 points
  if (year >= 1989 && year <= 1990) score += 3;

  // Legendary venues: +5 points
  const venue = perf.venue.toLowerCase();
  const legendaryVenues = [
    'fillmore',
    'winterland',
    'barton hall',
    'cornell',
    'red rocks',
    'greek theatre',
    'madison square garden',
    'capitol theatre',
    'boston music hall'
  ];
  if (legendaryVenues.some(v => venue.includes(v))) score += 5;

  // Bonus for mid-year shows (peak of touring season): +2
  const month = parseInt(perf.date.split('-')[1]);
  if (month >= 5 && month <= 8) score += 2;

  return score;
}

// Select best performances for each song
const ratingsToCollect = targetSongs.map(song => {
  // Score all performances
  const scoredPerfs = song.performances.map(perf => ({
    ...perf,
    score: scorePerformance(perf, song.performances)
  }));

  // Sort by score, then by date
  scoredPerfs.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.date.localeCompare(b.date);
  });

  // Select top 15 performances, ensuring year diversity
  const selected = [];
  const yearsSeen = new Set();

  for (const perf of scoredPerfs) {
    const year = perf.date.split('-')[0];

    // Priority: High-scoring performances
    if (perf.score >= 10 || selected.length < 10) {
      selected.push(perf);
      yearsSeen.add(year);
    }
    // Secondary: Fill in missing years
    else if (!yearsSeen.has(year) && selected.length < 15) {
      selected.push(perf);
      yearsSeen.add(year);
    }

    if (selected.length >= 15) break;
  }

  return {
    songTitle: song.title,
    totalPerformances: song.performances.length,
    selectedCount: selected.length,
    performances: selected.map(p => ({
      date: p.date,
      venue: p.venue,
      identifier: p.identifier,
      score: p.score,
      rating: null, // To be filled in
      notes: '' // Optional notes during rating
    }))
  };
});

// Calculate totals
const totalPerformancesToRate = ratingsToCollect.reduce((sum, s) => sum + s.selectedCount, 0);

console.log(`\n✅ Phase 1 Collection Plan:`);
console.log(`   Songs: ${ratingsToCollect.length}`);
console.log(`   Total performances to rate: ${totalPerformancesToRate}`);
console.log(`   Avg per song: ${(totalPerformancesToRate / ratingsToCollect.length).toFixed(1)}\n`);

// Write to JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(ratingsToCollect, null, 2), 'utf-8');
console.log(`💾 Saved to: ${OUTPUT_FILE}`);

// Also create a human-readable summary
const summaryFile = path.join(__dirname, '../src/data/phase1RatingsSummary.md');
let summary = `# Phase 1 Ratings Collection\n\n`;
summary += `**Goal**: Rate ${totalPerformancesToRate} performances across ${ratingsToCollect.length} songs with zero current ratings\n\n`;
summary += `## Rating Scale\n`;
summary += `- **Tier 1**: Legendary, must-listen performances (best of the best)\n`;
summary += `- **Tier 2**: Excellent, standout performances (very good)\n`;
summary += `- **Tier 3**: Solid, recommended performances (good)\n\n`;
summary += `## Songs to Rate\n\n`;

ratingsToCollect.forEach((song, i) => {
  summary += `### ${i + 1}. ${song.songTitle} (${song.selectedCount} performances)\n\n`;
  summary += `| Date | Venue | Score | Listen |\n`;
  summary += `|------|-------|-------|--------|\n`;

  song.performances.forEach(perf => {
    const archiveUrl = `https://archive.org/details/${perf.identifier}`;
    summary += `| ${perf.date} | ${perf.venue} | ${perf.score} | [Listen](${archiveUrl}) |\n`;
  });

  summary += `\n`;
});

fs.writeFileSync(summaryFile, summary, 'utf-8');
console.log(`📄 Summary saved to: ${summaryFile}`);

console.log(`\n📝 Next Steps:`);
console.log(`   1. Open ${summaryFile} to see the full list`);
console.log(`   2. Listen to performances and rate them (1, 2, or 3)`);
console.log(`   3. Edit ${OUTPUT_FILE} to add ratings`);
console.log(`   4. Run applyPhase1Ratings.js to apply the ratings to songs.generated.ts`);
