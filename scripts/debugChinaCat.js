const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');

const MANUAL_MAPPINGS = {
  'china cat': 'china cat sunflower',
  'c c rider': 'china cat sunflower > i know you rider',
  'c. c. rider': 'china cat sunflower > i know you rider',
  'c.c. rider': 'china cat sunflower > i know you rider',
  'cc rider': 'china cat sunflower > i know you rider',
};

function normalizeTitle(title) {
  let normalized = title
    .toLowerCase()
    .trim()
    .replace(/\s*[-–]?>\s*$/g, '')
    .replace(/\s*[-–]?\s*>\s*$/g, '')
    .replace(/\s*->\s*$/g, '')
    .replace(/\s*-->\s*$/g, '')
    .replace(/\s*>\s*$/g, '')
    .replace(/\\+>/g, '>')
    .replace(/\\+$/g, '')
    .replace(/\band\b/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  if (MANUAL_MAPPINGS[normalized]) {
    normalized = MANUAL_MAPPINGS[normalized];
  }

  return normalized;
}

// Read the file
const content = fs.readFileSync(SONGS_FILE, 'utf-8');
const lines = content.split('\n');

let chinaCatTitles = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const titleMatch = line.match(/^\s*title: "(.+)",$/);

  if (titleMatch) {
    const originalTitle = titleMatch[1];
    if (originalTitle.toLowerCase().includes('china cat')) {
      const normalized = normalizeTitle(originalTitle);
      chinaCatTitles.push({ original: originalTitle, normalized });
    }
  }
}

console.log('China Cat titles found in generated file:');
chinaCatTitles.forEach(({ original, normalized }) => {
  console.log(`  "${original}" -> "${normalized}"`);
});

console.log('\nGrouped by normalized title:');
const grouped = {};
chinaCatTitles.forEach(({ original, normalized }) => {
  if (!grouped[normalized]) grouped[normalized] = [];
  grouped[normalized].push(original);
});

Object.entries(grouped).forEach(([normalized, originals]) => {
  console.log(`\n"${normalized}":`);
  console.log(`  Count: ${originals.length}`);
  originals.slice(0, 5).forEach(o => console.log(`  - ${o}`));
  if (originals.length > 5) console.log(`  ... and ${originals.length - 5} more`);
});
