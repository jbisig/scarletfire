const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');
const APPLIED_LOG = path.join(__dirname, '../src/data/phase1RatingsApplied.json');

console.log('♻️  Reverting Phase 1 ratings...\n');

// Check if applied log exists
if (!fs.existsSync(APPLIED_LOG)) {
  console.log('ℹ️  No Phase 1 ratings log found. Nothing to revert.');
  console.log(`   Expected at: ${APPLIED_LOG}`);
  process.exit(0);
}

// Load the applied ratings log
const logData = JSON.parse(fs.readFileSync(APPLIED_LOG, 'utf-8'));

console.log(`📋 Found Phase 1 ratings applied on: ${logData.appliedAt}`);
console.log(`   Total ratings to remove: ${logData.summary.totalApplied}`);
console.log(`   Backup available at: ${logData.backupPath}\n`);

// Confirm with user
console.log('⚠️  This will remove all Phase 1 ratings from songs.generated.ts');
console.log('   The file will be restored from the backup.\n');

// Read the backup file
if (!fs.existsSync(logData.backupPath)) {
  console.error('❌ Backup file not found!');
  console.error(`   Expected at: ${logData.backupPath}`);
  console.error('   Cannot safely revert. Please restore manually.');
  process.exit(1);
}

console.log('📖 Reading backup file...');
const backupContent = fs.readFileSync(logData.backupPath, 'utf-8');

// Create a new backup of current state (before reverting)
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_DIR = path.join(__dirname, '../backups');
const preRevertBackup = path.join(BACKUP_DIR, `songs.generated.before-revert-${timestamp}.ts`);

fs.copyFileSync(SONGS_FILE, preRevertBackup);
console.log(`💾 Created backup of current state: ${preRevertBackup}\n`);

// Restore from backup
fs.writeFileSync(SONGS_FILE, backupContent, 'utf-8');

console.log('✅ Restored songs.generated.ts from backup\n');

// Archive the applied log (don't delete, for history)
const archiveLog = APPLIED_LOG.replace('.json', `-reverted-${timestamp}.json`);
fs.renameSync(APPLIED_LOG, archiveLog);

console.log(`📂 Archived applied ratings log: ${archiveLog}`);
console.log(`\n🎉 Phase 1 ratings have been reverted!`);

// Summary
console.log(`\n📊 Removed ${logData.summary.totalApplied} Phase 1 ratings from:`);
const songsSummary = {};
logData.ratingsApplied.forEach(r => {
  if (!songsSummary[r.songTitle]) songsSummary[r.songTitle] = 0;
  songsSummary[r.songTitle]++;
});

Object.entries(songsSummary).forEach(([song, count]) => {
  console.log(`   ${song}: ${count} ratings`);
});

console.log(`\n💡 To re-apply Phase 1 ratings, run: node scripts/applyPhase1Ratings.js`);
