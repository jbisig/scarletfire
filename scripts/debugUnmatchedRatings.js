const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');
const RATINGS_FILE = path.join(__dirname, '../src/data/songPerformanceRatings.ts');

// Same normalization as enrichment script
const MANUAL_MAPPINGS = {
  'workin\' man blues': 'workingman\'s blues',
  'woman are smarter': 'women are smarter',
  'aiko aiko': 'iko iko',
  'playing': 'playing in the band',
  'spanish': 'spanish jam',
  'truckina': 'truckin',
  // ... (abbreviated for speed)
};

function normalizeSongTitle(title) {
  let normalized = title
    .toLowerCase()
    .trim()
    .replace(/^grateful\s+dead\s*[-–]\s*/i, '')
    .replace(/^e:\s*/i, '')
    .replace(/\s*[-–]?>\s*$/g, '')
    .replace(/\s*->\s*$/g, '')
    .replace(/\s*>\s*$/g, '')
    .replace(/\s*-\s*$/g, '')
    .replace(/\\+>/g, '>')
    .replace(/\\+$/g, '')
    .replace(/\band\b/g, '&')
    .replace(/\s*\(live\)\s*$/i, '')
    .replace(/\s*\(studio\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (MANUAL_MAPPINGS[normalized]) {
    normalized = MANUAL_MAPPINGS[normalized];
  }

  return normalized;
}

// Parse ratings file
console.log('📖 Reading ratings file...');
const ratingsContent = fs.readFileSync(RATINGS_FILE, 'utf8');

const tier1Match = ratingsContent.match(/export const TIER_1_SONG_PERFORMANCES[^[]*\[([\s\S]*?)\];/);
const tier2Match = ratingsContent.match(/export const TIER_2_SONG_PERFORMANCES[^[]*\[([\s\S]*?)\];/);
const tier3Match = ratingsContent.match(/export const TIER_3_SONG_PERFORMANCES[^[]*\[([\s\S]*?)\];/);

function parsePerformances(content, tier) {
  const performances = [];
  const regex = /\{\s*songTitle:\s*["']([^"']+)["'],\s*showDate:\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    performances.push({
      originalTitle: match[1],
      normalizedTitle: normalizeSongTitle(match[1]),
      date: match[2],
      tier: tier
    });
  }
  return performances;
}

const allRatings = [];
if (tier1Match) allRatings.push(...parsePerformances(tier1Match[1], 1));
if (tier2Match) allRatings.push(...parsePerformances(tier2Match[1], 2));
if (tier3Match) allRatings.push(...parsePerformances(tier3Match[1], 3));

console.log(`Found ${allRatings.length} rated performances\n`);

// Parse songs file
console.log('📖 Reading songs file...');
const songsContent = fs.readFileSync(SONGS_FILE, 'utf8');
const lines = songsContent.split('\n');

const songsMap = new Map(); // normalized title -> { title, performances: Set of dates }
let currentSong = null;

for (const line of lines) {
  const titleMatch = line.match(/^\s*title:\s*"([^"]+)"/);
  if (titleMatch) {
    const title = titleMatch[1];
    currentSong = {
      originalTitle: title,
      normalizedTitle: normalizeSongTitle(title),
      dates: new Set()
    };
    if (!songsMap.has(currentSong.normalizedTitle)) {
      songsMap.set(currentSong.normalizedTitle, currentSong);
    } else {
      currentSong = songsMap.get(currentSong.normalizedTitle);
    }
  }

  const dateMatch = line.match(/^\s*date:\s*"([^"]+)"/);
  if (dateMatch && currentSong) {
    currentSong.dates.add(dateMatch[1]);
  }
}

console.log(`Found ${songsMap.size} songs in generated file\n`);

// Find unmatched ratings
const unmatchedRatings = [];
const unmatchedSongs = new Set();

for (const rating of allRatings) {
  const song = songsMap.get(rating.normalizedTitle);

  if (!song) {
    unmatchedRatings.push({
      reason: 'Song not found',
      ...rating
    });
    unmatchedSongs.add(rating.normalizedTitle);
  } else if (!song.dates.has(rating.date)) {
    unmatchedRatings.push({
      reason: 'Date not found',
      ...rating,
      songInFile: song.originalTitle
    });
  }
}

console.log(`=== UNMATCHED RATINGS ANALYSIS ===\n`);
console.log(`Total ratings: ${allRatings.length}`);
console.log(`Matched: ${allRatings.length - unmatchedRatings.length}`);
console.log(`Unmatched: ${unmatchedRatings.length}\n`);

console.log(`Breakdown by reason:`);
const songNotFound = unmatchedRatings.filter(r => r.reason === 'Song not found').length;
const dateNotFound = unmatchedRatings.filter(r => r.reason === 'Date not found').length;
console.log(`  Song not found (filtered or <3 perfs): ${songNotFound}`);
console.log(`  Date mismatch: ${dateNotFound}\n`);

console.log(`Unique songs with no match (first 20):`);
Array.from(unmatchedSongs).slice(0, 20).forEach(song => {
  console.log(`  - ${song}`);
});

console.log(`\nSample date mismatches (first 10):`);
unmatchedRatings
  .filter(r => r.reason === 'Date not found')
  .slice(0, 10)
  .forEach(r => {
    console.log(`  - "${r.originalTitle}" (${r.normalizedTitle}) on ${r.date}`);
    console.log(`    Song exists in file as: "${r.songInFile}"`);
  });
