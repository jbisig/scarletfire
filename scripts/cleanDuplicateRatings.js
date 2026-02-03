/**
 * Cleans up duplicate rating lines from songs.generated.ts
 * Keeps only the first rating line in each performance object
 */

const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');

console.log('🧹 Cleaning duplicate rating lines from songs.generated.ts...\n');

// Read the file
const content = fs.readFileSync(SONGS_FILE, 'utf8');
const lines = content.split('\n');
const outputLines = [];

let inPerformance = false;
let hasSeenRating = false;
let duplicatesRemoved = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Track performance object boundaries
  const dateMatch = line.match(/^\s*date:\s*"([^"]+)"/);
  if (dateMatch) {
    inPerformance = true;
    hasSeenRating = false;
  }

  // Check for rating line
  const isRatingLine = line.match(/^\s*rating:\s*\d/);
  
  if (inPerformance && isRatingLine) {
    if (hasSeenRating) {
      // Skip duplicate rating
      duplicatesRemoved++;
      continue;
    }
    hasSeenRating = true;
  }

  // Reset when we hit closing brace
  if (inPerformance && line.match(/^\s*\},?\s*$/)) {
    inPerformance = false;
    hasSeenRating = false;
  }

  outputLines.push(line);
}

// Write the cleaned content
fs.writeFileSync(SONGS_FILE, outputLines.join('\n'));

console.log(`✅ Removed ${duplicatesRemoved} duplicate rating lines`);
console.log(`💾 Updated: ${SONGS_FILE}`);
