/**
 * Test the actual exported function from songPerformanceRatings.ts
 */

import { getSongPerformanceRating } from '../src/data/songPerformanceRatings';

console.log('Testing exported getSongPerformanceRating function:\n');

// Test with actual song titles as they come from Archive.org
const tests = [
  { song: 'Eyes Of The World', date: '1974-08-06' },
  { song: 'Dark Star', date: '1972-08-27' },
  { song: 'Playing In The Band', date: '1972-08-27' },
  { song: 'China Cat Sunflower > I Know You Rider', date: '1974-06-26' },
];

tests.forEach(({ song, date }) => {
  const rating = getSongPerformanceRating(song, date);
  console.log(`Song: "${song}" on ${date}`);
  console.log(`  Rating: ${rating ? `Tier ${rating} (${4 - rating} stars)` : 'Not rated'}`);
  console.log();
});
