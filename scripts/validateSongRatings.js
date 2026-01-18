/**
 * Validation script for song performance ratings
 *
 * Checks the generated songPerformanceRatings.ts file for:
 * - Correct date formats (YYYY-MM-DD)
 * - Valid tier values (1, 2, or 3)
 * - No duplicate song+date combinations
 * - Valid identifiers
 * - Reasonable tier distribution
 *
 * Usage: node scripts/validateSongRatings.js
 */

const fs = require('fs');
const path = require('path');

const RATINGS_FILE = path.join(__dirname, '../src/data/songPerformanceRatings.ts');

/**
 * Parse TypeScript file to extract performance data
 * This is a simple parser that looks for the array definitions
 */
function parseRatingsFile() {
  try {
    const content = fs.readFileSync(RATINGS_FILE, 'utf8');

    // Parse all three tier arrays since ALL_RATED_SONG_PERFORMANCES uses spread operators
    const performances = [];

    // Extract TIER_1_SONG_PERFORMANCES
    const tier1Match = content.match(/export const TIER_1_SONG_PERFORMANCES[^=]+=\s*\[([\s\S]*?)\];/);
    if (tier1Match) {
      parsePerformancesFromArray(tier1Match[1], performances);
    }

    // Extract TIER_2_SONG_PERFORMANCES
    const tier2Match = content.match(/export const TIER_2_SONG_PERFORMANCES[^=]+=\s*\[([\s\S]*?)\];/);
    if (tier2Match) {
      parsePerformancesFromArray(tier2Match[1], performances);
    }

    // Extract TIER_3_SONG_PERFORMANCES
    const tier3Match = content.match(/export const TIER_3_SONG_PERFORMANCES[^=]+=\s*\[([\s\S]*?)\];/);
    if (tier3Match) {
      parsePerformancesFromArray(tier3Match[1], performances);
    }

    return performances;
  } catch (error) {
    console.error('❌ Failed to read ratings file:', error.message);
    return null;
  }
}

/**
 * Parse performance objects from array content
 */
function parsePerformancesFromArray(arrayContent, performances) {
  // Match performance objects
  const perfPattern = /\{[\s\S]*?songTitle:\s*"([^"]+)"[\s\S]*?showDate:\s*"([^"]+)"[\s\S]*?showIdentifier:\s*"([^"]+)"[\s\S]*?tier:\s*(\d+)[\s\S]*?\}/g;

  let perfMatch;
  while ((perfMatch = perfPattern.exec(arrayContent)) !== null) {
    performances.push({
      songTitle: perfMatch[1],
      showDate: perfMatch[2],
      showIdentifier: perfMatch[3],
      tier: parseInt(perfMatch[4], 10)
    });
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDateFormat(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Validate tier value (1, 2, or 3)
 */
function validateTier(tier) {
  return [1, 2, 3].includes(tier);
}

/**
 * Run all validations
 */
function runValidations(performances) {
  console.log('🔍 Running validations...\n');

  const errors = [];
  const warnings = [];
  const seen = new Set();
  const tierCounts = { 1: 0, 2: 0, 3: 0 };
  const songCounts = {};

  performances.forEach((perf, idx) => {
    // 1. Date format validation
    if (!validateDateFormat(perf.showDate)) {
      errors.push(`Invalid date format at index ${idx}: "${perf.showDate}" (expected YYYY-MM-DD)`);
    }

    // 2. Tier validation
    if (!validateTier(perf.tier)) {
      errors.push(`Invalid tier at index ${idx}: ${perf.tier} (expected 1, 2, or 3)`);
    } else {
      tierCounts[perf.tier]++;
    }

    // 3. Duplicate check
    const key = `${perf.songTitle}|${perf.showDate}`;
    if (seen.has(key)) {
      errors.push(`Duplicate entry at index ${idx}: "${perf.songTitle}" on ${perf.showDate}`);
    }
    seen.add(key);

    // 4. Identifier validation
    if (!perf.showIdentifier || perf.showIdentifier.length === 0) {
      errors.push(`Missing identifier at index ${idx}: "${perf.songTitle}" on ${perf.showDate}`);
    }

    // Count per song
    songCounts[perf.songTitle] = (songCounts[perf.songTitle] || 0) + 1;
  });

  // 5. Distribution analysis
  const totalPerformances = performances.length;
  const tier1Percent = (tierCounts[1] / totalPerformances * 100).toFixed(1);
  const tier2Percent = (tierCounts[2] / totalPerformances * 100).toFixed(1);
  const tier3Percent = (tierCounts[3] / totalPerformances * 100).toFixed(1);

  console.log('📊 Tier Distribution:');
  console.log(`   Tier 1 (3★): ${tierCounts[1]} performances (${tier1Percent}%)`);
  console.log(`   Tier 2 (2★): ${tierCounts[2]} performances (${tier2Percent}%)`);
  console.log(`   Tier 3 (1★): ${tierCounts[3]} performances (${tier3Percent}%)`);
  console.log(`   Total: ${totalPerformances} performances\n`);

  // Warn if distribution seems off
  if (tier1Percent > 30) {
    warnings.push(`Tier 1 is ${tier1Percent}% of total (expected ~15-20%)`);
  }
  if (tier3Percent < 20) {
    warnings.push(`Tier 3 is only ${tier3Percent}% of total (expected ~30-40%)`);
  }

  // 6. Song analysis
  const uniqueSongs = Object.keys(songCounts).length;
  const avgPerSong = (totalPerformances / uniqueSongs).toFixed(1);

  console.log('🎵 Song Analysis:');
  console.log(`   Unique songs: ${uniqueSongs}`);
  console.log(`   Avg performances per song: ${avgPerSong}\n`);

  // List songs with many ratings (top 10)
  const topSongs = Object.entries(songCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('🔝 Top 10 Most Rated Songs:');
  topSongs.forEach(([song, count], i) => {
    console.log(`   ${i + 1}. ${song} (${count} performances)`);
  });
  console.log();

  // List songs with very few ratings
  const lowRatedSongs = Object.entries(songCounts)
    .filter(([, count]) => count < 3)
    .sort((a, b) => a[1] - b[1]);

  if (lowRatedSongs.length > 0) {
    warnings.push(`${lowRatedSongs.length} songs have fewer than 3 rated performances`);
  }

  // Print results
  console.log('═══════════════════════════════════════════\n');

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log();
  }

  if (errors.length > 0) {
    console.log('❌ Errors Found:');
    errors.forEach(e => console.log(`   - ${e}`));
    console.log(`\n❌ Validation failed with ${errors.length} error(s)\n`);
    return false;
  }

  console.log('✅ All validations passed!');
  console.log(`   ${totalPerformances} performances validated`);
  console.log(`   ${uniqueSongs} unique songs`);
  console.log(`   No duplicates or format errors\n`);

  return true;
}

/**
 * Main validation function
 */
function main() {
  console.log('🎸 Song Performance Ratings Validator');
  console.log('=====================================\n');

  // Check if file exists
  if (!fs.existsSync(RATINGS_FILE)) {
    console.error(`❌ Ratings file not found: ${RATINGS_FILE}`);
    console.log('   Run scrapeHeadyVersionRatings.js first to generate the file.\n');
    process.exit(1);
  }

  // Parse ratings file
  const performances = parseRatingsFile();

  if (!performances) {
    console.error('❌ Failed to parse ratings file\n');
    process.exit(1);
  }

  if (performances.length === 0) {
    console.error('❌ No performances found in ratings file\n');
    process.exit(1);
  }

  // Run validations
  const success = runValidations(performances);

  process.exit(success ? 0 : 1);
}

// Run validator
main();
