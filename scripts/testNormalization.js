/**
 * Test the song title normalization function
 */

function normalizeSongTitleForLookup(title) {
  return title
    .toLowerCase()
    .trim()
    // Remove "Grateful Dead - " prefix from stored titles
    .replace(/^grateful\s+dead\s*[-–]\s*/i, '')
    // Decode HTML entities
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    // Normalize arrow symbols (>, ->, →) to a standard format
    .replace(/\s*[-–]?\s*[>→]\s*/g, ' > ')
    // Remove track numbers and annotations
    .replace(/^\d+[\s.-]*/, '')
    .replace(/^Track\s+\d+[\s:]*/, '')
    .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\s*[#]\d+.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    // Normalize common variations
    .replace(/playin'/gi, 'playing')
    .replace(/truckin'/gi, 'truckin')
    .replace(/lovin'/gi, 'loving')
    .replace(/&/g, 'and')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('Testing song title normalization:\n');

// Test cases
const testCases = [
  { input: 'Grateful Dead - Eyes Of The World', expected: 'eyes of the world' },
  { input: 'Eyes Of The World', expected: 'eyes of the world' },
  { input: 'Grateful Dead - China Cat Sunflower -&gt; I Know You Rider', expected: 'china cat sunflower > i know you rider' },
  { input: 'China Cat Sunflower > I Know You Rider', expected: 'china cat sunflower > i know you rider' },
  { input: '01 Dark Star', expected: 'dark star' },
  { input: "Playin' In The Band", expected: 'playing in the band' },
];

testCases.forEach(({ input, expected }) => {
  const result = normalizeSongTitleForLookup(input);
  const match = result === expected ? '✅' : '❌';
  console.log(`${match} Input: "${input}"`);
  console.log(`   Result: "${result}"`);
  console.log(`   Expected: "${expected}"`);
  console.log();
});
