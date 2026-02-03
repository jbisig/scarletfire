/**
 * Enriches songs.generated.ts with ratings from songPerformanceRatings.ts
 * This pre-computes all ratings so we don't need runtime lookups
 */

const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');
const RATINGS_FILE = path.join(__dirname, '../src/data/songPerformanceRatings.ts');

console.log('🎵 Enriching songs with performance ratings...\n');

// Step 1: Parse ratings file to build a lookup map
console.log('📖 Reading ratings file...');
const ratingsContent = fs.readFileSync(RATINGS_FILE, 'utf8');

// Extract all rated performances and build a lookup map
const ratingsMap = new Map(); // key: "songTitle:date" -> tier

// Parse TIER_1, TIER_2, TIER_3 arrays
const tier1Match = ratingsContent.match(/export const TIER_1_SONG_PERFORMANCES[^[]*\[([\s\S]*?)\];/);
const tier2Match = ratingsContent.match(/export const TIER_2_SONG_PERFORMANCES[^[]*\[([\s\S]*?)\];/);
const tier3Match = ratingsContent.match(/export const TIER_3_SONG_PERFORMANCES[^[]*\[([\s\S]*?)\];/);

function parsePerformances(content, tier) {
  const performances = [];
  // Match each performance object
  const regex = /\{\s*songTitle:\s*["']([^"']+)["'],\s*showDate:\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    performances.push({
      songTitle: match[1],
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

console.log(`Found ${allRatings.length} rated performances`);

// Manual mappings (must match consolidateSongs.js)
const MANUAL_MAPPINGS = {
  'workin\' man blues': 'workingman\'s blues',
  'woman are smarter': 'women are smarter',
  'west l.a. fadeaway': 'west la fadeaway',
  'west l.a. fade away': 'west la fadeaway',
  'wharf rat \\>': 'wharf rat',
  'wharf rat \\\\': 'wharf rat',
  'wharf rat \\\\\\\\': 'wharf rat',
  'and we bid you good night': 'and we bid you goodnight',
  'me and my uncle': 'me & my uncle',
  'around and around': 'around & around',
  'china cat': 'china cat sunflower',
  'c c rider': 'china cat sunflower > i know you rider',
  'c. c. rider': 'china cat sunflower > i know you rider',
  'c.c. rider': 'china cat sunflower > i know you rider',
  'cc rider': 'china cat sunflower > i know you rider',
  'estimated prophet': 'estimated',
  'uncle john\'s band': 'uncle johns band',
  'st stephen': 'st. stephen',
  'saint stephen': 'st. stephen',
  'cant come down': 'can\'t come down',
  'dont ease me in': 'don\'t ease me in',
  'aiko aiko': 'iko iko',
  'big rail road blues': 'big railroad blues',
  'black-throated wind': 'black throated wind',
  'brown-eyed women': 'brown eyed women',
  'caution (do not step on the tracks)': 'caution',
  'corinna': 'corrina',
  'cryptical envelopement': 'cryptical enveloment',
  'dark star-': 'dark star',
  'deep elementary blues': 'deep elem blues',
  'drums & space': 'drums > space',
  'eyes of the world-': 'eyes of the world',
  'finiculi finicula': 'funiculi funicula',
  'gdtrfb': 'goin\' down the road feeling bad',
  'goin down the road': 'goin\' down the road feeling bad',
  'going down the road': 'goin\' down the road feeling bad',
  'goin\' down the road': 'goin\' down the road feeling bad',
  'going down the road feeling bad': 'goin\' down the road feeling bad',
  'dancin in the street': 'dancin\' in the streets',
  'dancin in the streets': 'dancin\' in the streets',
  'dancing in the street': 'dancin\' in the streets',
  'dancing in the streets': 'dancin\' in the streets',
  'dancin\' in the street': 'dancin\' in the streets',
  'drums/space': 'drums > space',
  'greatest story': 'greatest story ever told',
  'it\'s a man\'s, man\'s, man\'s world': 'it\'s a man\'s world',
  'it\'s all over now baby blue': 'it\'s all over now',
  'man smart': 'man smart woman smarter',
  'mind left body jam': 'mind left body',
  'mississippi half step': 'mississippi half-step uptown toodeloo',
  'playin\\\' in the band': 'playing in the band',
  'playing reprise': 'playing in the band reprise',
  'queen jane': 'queen jane approximately',
  'lovelight': 'turn on your lovelight',
  'uncle john\\\'s band': 'uncle johns band',
  'playing': 'playing in the band',
  'spanish': 'spanish jam',
  'truckina': 'truckin',
  // Additional mappings from ratings file
  'estimated prophet': 'estimated',
  'turn on your love light': 'turn on your lovelight',
  'mississippi halfstep uptown toodeloo': 'mississippi half-step uptown toodeloo',
  'pretty peggy o': 'peggy-o',
  'u.s. blues (wave that flag)': 'u.s. blues',
  'lost sailor > saint of circumstance': 'lost sailor > st. of circumstance',
  'man smart, woman smarter': 'man smart woman smarter',
  'west l.a. fadeaway': 'west la fadeaway',
  'jack a roe': 'jack-a-roe',
  'its all over now': 'it\'s all over now',
  'brother esau': 'my brother esau',
  'c. c. rider': 'china cat sunflower > i know you rider',
  'hurts me too': 'it hurts me too',
  'walking blues': 'walkin\' blues',
  'all new minglewood blues': 'new minglewood blues',
};

// Normalize song title (must match consolidateSongs.js normalization)
function normalizeSongTitle(title) {
  let normalized = title
    .toLowerCase()
    .trim()
    // Decode HTML entities from ratings file
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    // Remove "Grateful Dead - " prefix from ratings file
    .replace(/^grateful\s+dead\s*[-–]\s*/i, '')
    // Remove "e:" prefix
    .replace(/^e:\s*/i, '')
    // Normalize segue arrows to " > "
    .replace(/\s*[-–]?\s*[>→]\s*/g, ' > ')
    // Remove trailing segue markers
    .replace(/\s*>\s*$/g, '')
    // Remove trailing dash/hyphen
    .replace(/\s*-\s*$/g, '')
    // Normalize escaped characters
    .replace(/\\+>/g, '>')
    .replace(/\\+$/g, '')
    // Normalize "and" vs "&"
    .replace(/\band\b/g, '&')
    // Remove version markers and parenthetical notes
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s*\[[^\]]*\]\s*$/g, '')
    // Normalize spacing
    .replace(/\s+/g, ' ')
    .trim();

  // Apply manual mappings
  if (MANUAL_MAPPINGS[normalized]) {
    normalized = MANUAL_MAPPINGS[normalized];
  }

  return normalized;
}

// Build lookup map
allRatings.forEach(rating => {
  const normalizedTitle = normalizeSongTitle(rating.songTitle);
  const key = `${normalizedTitle}:${rating.date}`;
  ratingsMap.set(key, rating.tier);
});

console.log(`Built lookup map with ${ratingsMap.size} entries\n`);

// Step 2: Read songs file and process line by line
console.log('📖 Reading songs file...');
let songsContent = fs.readFileSync(SONGS_FILE, 'utf8');

// Step 3: Update SongPerformance interface
console.log('🔧 Updating SongPerformance interface...');
songsContent = songsContent.replace(
  /export interface SongPerformance \{[^}]+\}/,
  `export interface SongPerformance {
  date: string;
  identifier: string;
  venue?: string;
  rating?: 1 | 2 | 3; // Pre-computed performance rating
}`
);

// Step 4: Process line by line to add ratings
console.log('⭐ Adding ratings to performances...');

const lines = songsContent.split('\n');
const outputLines = [];
let currentSongTitle = null;
let normalizedCurrentSong = null;
let matchCount = 0;
let totalPerformances = 0;
let inPerformance = false;
let currentDate = null;
let performanceHasRating = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Track current song
  const titleMatch = line.match(/^\s*title:\s*"([^"]+)"/);
  if (titleMatch) {
    currentSongTitle = titleMatch[1];
    normalizedCurrentSong = normalizeSongTitle(currentSongTitle);
  }

  // Track if we're in a performance object
  const dateMatch = line.match(/^\s*date:\s*"([^"]+)"/);
  if (dateMatch) {
    currentDate = dateMatch[1];
    inPerformance = true;
    performanceHasRating = false;
    totalPerformances++;
    outputLines.push(line);
    continue;
  }

  // Track if performance already has a rating
  if (inPerformance && line.match(/^\s*rating:\s*\d/)) {
    performanceHasRating = true;
  }

  // If we see a closing brace and we're in a performance, check if we need to add rating
  if (inPerformance && line.match(/^\s*\},?\s*$/)) {
    // Check if this performance has a rating (only add if not already present)
    if (currentDate && normalizedCurrentSong && !performanceHasRating) {
      const lookupKey = `${normalizedCurrentSong}:${currentDate}`;
      const rating = ratingsMap.get(lookupKey);

      if (rating) {
        matchCount++;
        // Insert rating line before the closing brace
        const indent = line.match(/^(\s*)/)[1];
        outputLines.push(`${indent}  rating: ${rating},`);
      }
    }
    inPerformance = false;
    currentDate = null;
    performanceHasRating = false;
  }

  outputLines.push(line);
}

const updatedContent = outputLines.join('\n');

console.log(`\n✅ Enrichment complete!`);
console.log(`   Total performances: ${totalPerformances}`);
console.log(`   Rated performances: ${matchCount}`);
console.log(`   Coverage: ${((matchCount / totalPerformances) * 100).toFixed(1)}%\n`);

// Step 5: Write updated file
console.log('💾 Writing updated songs file...');
fs.writeFileSync(SONGS_FILE, updatedContent);

console.log('✨ Done! Songs file enriched with ratings.');
console.log(`   File: ${SONGS_FILE}\n`);
