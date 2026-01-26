const fs = require('fs');
const path = require('path');

// Load the cache
const cachePath = path.join(__dirname, '../reference_files/archive-metadata-cache.json');
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));

// Look for shows with 'china cat sunflower' tracks
let standaloneCount = 0;
let segueCount = 0;
let bothCount = 0;
const standaloneExamples = [];

for (const [identifier, tracks] of Object.entries(cache)) {
  const hasStandalone = tracks.some(t => {
    const lower = t.toLowerCase();
    return lower.includes('china cat') &&
           !lower.includes('rider') &&
           !lower.includes('c.c.') &&
           !lower.includes('c c ') &&
           !lower.includes('cc ');
  });

  const hasSegue = tracks.some(t => {
    const lower = t.toLowerCase();
    return lower.includes('china cat') && lower.includes('rider');
  });

  if (hasStandalone && hasSegue) {
    bothCount++;
    if (bothCount <= 5) {
      console.log(`Both in ${identifier}:`);
      tracks.filter(t => t.toLowerCase().includes('china')).forEach(t => console.log(`  ${t}`));
    }
  } else if (hasStandalone) {
    standaloneCount++;
    if (standaloneCount <= 5) {
      standaloneExamples.push(identifier);
      console.log(`Standalone in ${identifier}:`);
      tracks.filter(t => t.toLowerCase().includes('china')).forEach(t => console.log(`  ${t}`));
    }
  } else if (hasSegue) {
    segueCount++;
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Standalone China Cat only: ${standaloneCount}`);
console.log(`Segue only: ${segueCount}`);
console.log(`Both in same show: ${bothCount}`);
