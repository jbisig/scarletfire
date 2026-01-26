/**
 * Test that song ratings can be looked up correctly
 */

// Simulate the normalization function from the data file
function normalizeSongTitleForLookup(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/^grateful\s+dead\s*[-–]\s*/i, '')
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s*[-–]?\s*[>→]\s*/g, ' > ')
    .replace(/^\d+[\s.-]*/, '')
    .replace(/^Track\s+\d+[\s:]*/, '')
    .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\s*[#]\d+.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    .replace(/playin'/gi, 'playing')
    .replace(/truckin'/gi, 'truckin')
    .replace(/lovin'/gi, 'loving')
    .replace(/&/g, 'and')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sample rated performances (from the data file)
const sampleRatings = [
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1974-08-06",
    tier: 1
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1972-08-27",
    tier: 1
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1974-06-26",
    tier: 1
  }
];

// Simulate lookup function
function getSongPerformanceRating(songTitle, showDate) {
  const normalizedSongTitle = normalizeSongTitleForLookup(songTitle);
  const dateOnly = showDate.split('T')[0];

  const rating = sampleRatings.find(
    perf =>
      normalizeSongTitleForLookup(perf.songTitle) === normalizedSongTitle &&
      perf.showDate === dateOnly
  );

  return rating?.tier || null;
}

console.log('Testing song rating lookups:\n');

// Test cases - these are how songs come from Archive.org
const tests = [
  { song: 'Eyes Of The World', date: '1974-08-06', expected: 1 },
  { song: '01 Eyes Of The World', date: '1974-08-06', expected: 1 },
  { song: 'Dark Star', date: '1972-08-27', expected: 1 },
  { song: 'China Cat Sunflower > I Know You Rider', date: '1974-06-26', expected: 1 },
  { song: 'Eyes Of The World', date: '1990-01-01', expected: null }, // Not rated
];

tests.forEach(({ song, date, expected }) => {
  const result = getSongPerformanceRating(song, date);
  const match = result === expected ? '✅' : '❌';
  console.log(`${match} Song: "${song}" on ${date}`);
  console.log(`   Result: ${result === null ? 'null' : `Tier ${result}`}`);
  console.log(`   Expected: ${expected === null ? 'null' : `Tier ${expected}`}`);
  console.log();
});
