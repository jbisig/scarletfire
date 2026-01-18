/**
 * Clean songPerformanceRatings.ts by removing entries with malformed identifiers
 */

const fs = require('fs');
const path = require('path');

const RATINGS_FILE = path.join(__dirname, '../src/data/songPerformanceRatings.ts');

console.log('🧹 Cleaning songPerformanceRatings.ts...\n');

try {
  const content = fs.readFileSync(RATINGS_FILE, 'utf8');

  // Find entries with bad identifiers
  const badIdentifierPattern = /%3Chtml%20lang=en%3E/g;
  const matches = content.match(badIdentifierPattern);
  console.log(`Found ${matches ? matches.length : 0} entries with malformed identifiers`);

  // Remove performance objects that have bad identifiers
  // Match full performance objects and check if they contain bad identifiers
  let cleaned = content;
  const perfObjectPattern = /\s*\{\s*songTitle:[\s\S]*?notes:[\s\S]*?\},?\n/g;

  let objectMatches = content.match(perfObjectPattern);
  let removedCount = 0;

  if (objectMatches) {
    objectMatches.forEach(obj => {
      if (obj.includes('%3Chtml%20lang=en%3E')) {
        cleaned = cleaned.replace(obj, '');
        removedCount++;
      }
    });
  }

  console.log(`Removed ${removedCount} performance entries with bad identifiers\n`);

  // Clean up any double commas or trailing commas before closing brackets
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/,\s*\]/g, '\n]');

  // Write cleaned content back
  fs.writeFileSync(RATINGS_FILE, cleaned);
  console.log('✅ File cleaned and saved');

  // Show new stats
  const newMatches = cleaned.match(/songTitle:/g);
  console.log(`\nNew total: ${newMatches ? newMatches.length : 0} performances`);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
