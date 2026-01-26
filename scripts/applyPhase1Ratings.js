const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');
const PHASE1_FILE = path.join(__dirname, '../src/data/phase1RatingsToCollect.json');
const APPLIED_LOG = path.join(__dirname, '../src/data/phase1RatingsApplied.json');
const BACKUP_DIR = path.join(__dirname, '../backups');

console.log('📥 Applying Phase 1 ratings to songs.generated.ts...\n');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create backup before making changes
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupPath = path.join(BACKUP_DIR, `songs.generated.before-phase1-${timestamp}.ts`);
fs.copyFileSync(SONGS_FILE, backupPath);
console.log(`💾 Backup created: ${backupPath}\n`);

// Load Phase 1 ratings
if (!fs.existsSync(PHASE1_FILE)) {
  console.error('❌ Phase 1 ratings file not found!');
  console.error(`   Expected at: ${PHASE1_FILE}`);
  process.exit(1);
}

const phase1Data = JSON.parse(fs.readFileSync(PHASE1_FILE, 'utf-8'));

// Build lookup map: "songTitle:date" -> rating
const ratingsMap = new Map();
let totalRatings = 0;
let filledRatings = 0;

phase1Data.forEach(song => {
  song.performances.forEach(perf => {
    if (perf.rating) {
      ratingsMap.set(`${song.songTitle}:${perf.date}`, perf.rating);
      filledRatings++;
    }
    totalRatings++;
  });
});

console.log(`📊 Phase 1 Ratings Status:`);
console.log(`   Total performances: ${totalRatings}`);
console.log(`   Filled ratings: ${filledRatings} (${((filledRatings/totalRatings)*100).toFixed(1)}%)`);
console.log(`   Missing ratings: ${totalRatings - filledRatings}\n`);

if (filledRatings === 0) {
  console.log('⚠️  No ratings filled in yet. Edit the JSON file and add ratings (1, 2, or 3).');
  process.exit(0);
}

// Read songs file
console.log('📖 Reading songs file...');
let songsContent = fs.readFileSync(SONGS_FILE, 'utf-8');
const lines = songsContent.split('\n');
const outputLines = [];

let currentSongTitle = null;
let currentDate = null;
let currentIdentifier = null;
let appliedCount = 0;
const appliedRatings = []; // Track what we applied

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Track current song
  const titleMatch = line.match(/^\s*title:\s*"([^"]+)"/);
  if (titleMatch) {
    currentSongTitle = titleMatch[1];
  }

  // Track current performance date
  const dateMatch = line.match(/^\s*date:\s*"([^"]+)"/);
  if (dateMatch) {
    currentDate = dateMatch[1];
    outputLines.push(line);
    continue;
  }

  // Track identifier
  const identifierMatch = line.match(/^\s*identifier:\s*"([^"]+)"/);
  if (identifierMatch) {
    currentIdentifier = identifierMatch[1];
  }

  // Check if we should add rating before closing brace
  if (line.match(/^\s*\},?\s*$/) && currentSongTitle && currentDate) {
    const key = `${currentSongTitle}:${currentDate}`;
    const rating = ratingsMap.get(key);

    if (rating) {
      // Check if rating already exists
      const alreadyHasRating = outputLines.slice(-5).some(l => l.includes('rating:'));

      if (!alreadyHasRating) {
        // Add rating before closing brace
        const indent = line.match(/^(\s*)/)[1];
        outputLines.push(`${indent}  rating: ${rating},`);
        appliedCount++;

        // Log what we applied
        appliedRatings.push({
          songTitle: currentSongTitle,
          date: currentDate,
          identifier: currentIdentifier,
          rating: rating,
          appliedAt: new Date().toISOString()
        });
      }
    }

    currentDate = null; // Reset for next performance
    currentIdentifier = null;
  }

  outputLines.push(line);
}

// Write back to file
console.log(`✅ Applied ${appliedCount} new ratings\n`);

if (appliedCount > 0) {
  fs.writeFileSync(SONGS_FILE, outputLines.join('\n'), 'utf-8');

  // Save log of applied ratings
  const logData = {
    appliedAt: new Date().toISOString(),
    backupPath: backupPath,
    ratingsApplied: appliedRatings,
    summary: {
      totalApplied: appliedCount,
      source: 'Phase 1 Collection'
    }
  };

  fs.writeFileSync(APPLIED_LOG, JSON.stringify(logData, null, 2), 'utf-8');

  console.log(`💾 Updated songs file: ${SONGS_FILE}`);
  console.log(`📋 Applied ratings log: ${APPLIED_LOG}`);
  console.log(`\n🎉 Done! Your Phase 1 ratings have been added to the app.`);

  // Summary by song
  console.log(`\n📊 Ratings added by song:`);
  phase1Data.forEach(song => {
    const rated = song.performances.filter(p => p.rating).length;
    if (rated > 0) {
      console.log(`   ${song.songTitle}: ${rated}/${song.selectedCount} performances rated`);
    }
  });

  console.log(`\n♻️  To revert these changes, run: node scripts/revertPhase1Ratings.js`);
} else {
  console.log('ℹ️  No new ratings applied (all performances already have ratings)');
}
