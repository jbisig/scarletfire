/**
 * Scraper for Headyversion.com - Fan-voted song performance rankings
 *
 * This script scrapes performance rankings from Headyversion.com and generates
 * a TypeScript file with rated song performances organized into 1-3 star tiers.
 *
 * Usage: node scripts/scrapeHeadyVersionRatings.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  BASE_URL: 'https://headyversion.com',
  DELAY_MS: 2000, // 2 second delay between requests (be polite)
  MAX_RETRIES: 3,
  CHECKPOINT_FILE: path.join(__dirname, 'scrape_checkpoint.json'),
  OUTPUT_FILE: path.join(__dirname, '../src/data/songPerformanceRatings.ts'),
};

// Checkpoint state for resuming interrupted scrapes
let checkpoint = {
  completedSongs: [],
  allRatings: [],
  lastSongIndex: -1,
};

/**
 * Load checkpoint from disk if exists
 */
function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      checkpoint = JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf8'));
      console.log(`📂 Loaded checkpoint: ${checkpoint.completedSongs.length} songs completed`);
    }
  } catch (error) {
    console.error('⚠️  Failed to load checkpoint:', error.message);
  }
}

/**
 * Save checkpoint to disk
 */
function saveCheckpoint() {
  try {
    fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    console.error('⚠️  Failed to save checkpoint:', error.message);
  }
}

/**
 * Simple HTTP GET request using Node.js https module
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Follow a redirect and return the final URL
 */
function followRedirect(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
      } else {
        resolve(url);
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Delay execution for specified milliseconds
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  🌐 Fetching: ${url}`);
      const html = await fetchUrl(url);
      return html;
    } catch (error) {
      console.error(`  ⚠️  Attempt ${i + 1} failed: ${error.message}`);
      if (i === retries - 1) throw error;
      await delay(CONFIG.DELAY_MS * 2); // Longer delay on retry
    }
  }
}

/**
 * Simple HTML parsing - extract text between tags
 */
function extractText(html, startTag, endTag) {
  const startIndex = html.indexOf(startTag);
  if (startIndex === -1) return null;

  const contentStart = startIndex + startTag.length;
  const endIndex = html.indexOf(endTag, contentStart);
  if (endIndex === -1) return null;

  return html.substring(contentStart, endIndex).trim();
}

/**
 * Extract all matches of a pattern
 */
function extractAll(html, pattern) {
  const results = [];
  const regex = new RegExp(pattern, 'g');
  let match;

  while ((match = regex.exec(html)) !== null) {
    results.push(match[1]);
  }

  return results;
}

/**
 * Normalize song title for consistency
 */
function normalizeSongTitle(title) {
  return title
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    // Common variations
    .replace(/Playin'/gi, 'Playing')
    .replace(/Truckin'/gi, 'Truckin')
    .replace(/Lovin'/gi, 'Loving');
}

/**
 * Parse date string (e.g., "Aug. 27, 1972") to YYYY-MM-DD
 */
function parseDate(dateStr) {
  const months = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };

  // Match patterns like "Aug. 27, 1972" or "August 27, 1972"
  const match = dateStr.match(/([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (!match) {
    console.warn(`  ⚠️  Could not parse date: ${dateStr}`);
    return null;
  }

  const [, month, day, year] = match;
  const monthNum = months[month.toLowerCase().substring(0, 3)];

  if (!monthNum) {
    console.warn(`  ⚠️  Unknown month: ${month}`);
    return null;
  }

  const paddedDay = day.padStart(2, '0');
  return `${year}-${monthNum}-${paddedDay}`;
}

/**
 * Extract Archive.org identifier from a URL
 * Example: https://archive.org/details/gd1972-08-27.sbd.halligan.24058.sbeok.shnf
 * Returns: gd1972-08-27.sbd.halligan.24058.sbeok.shnf
 */
function extractIdentifier(url) {
  if (!url) return null;

  const match = url.match(/archive\.org\/details\/([^\/\?#]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch list of all songs from Headyversion homepage
 */
async function fetchSongList() {
  console.log('\n📋 Fetching song list from Headyversion.com...');

  try {
    // Use the search page which lists all songs ordered by vote count
    const searchUrl = `${CONFIG.BASE_URL}/search/all/?order=count`;
    const html = await fetchWithRetry(searchUrl);

    // Look for song links - pattern: href='/song/{id}/grateful-dead/{song-name}/'
    // Note: Headyversion uses single quotes in href attributes
    const songLinks = extractAll(html, "href='(/song/\\d+/grateful-dead/[^']+)'");

    if (songLinks.length === 0) {
      console.error('❌ No song links found. Website structure may have changed.');
      console.log('   Trying alternate pattern with double quotes...');

      // Try alternate pattern with double quotes
      const altSongLinks = extractAll(html, 'href="(/song/\\d+/grateful-dead/[^"]+)"');

      if (altSongLinks.length === 0) {
        return [];
      }

      const uniqueSongs = [...new Set(altSongLinks)];
      console.log(`✅ Found ${uniqueSongs.length} songs (using alternate pattern)`);
      return uniqueSongs;
    }

    const uniqueSongs = [...new Set(songLinks)];
    console.log(`✅ Found ${uniqueSongs.length} songs`);

    return uniqueSongs;
  } catch (error) {
    console.error('❌ Failed to fetch song list:', error.message);
    return [];
  }
}

/**
 * Parse performance entries from song detail page
 * Returns show IDs and performance data (identifiers will be fetched later)
 */
function parsePerformances(html, songTitle) {
  const performances = [];

  // Headyversion structure:
  // <div class="score" id="show_score_XX">VOTES</div>
  // <div class="show_date">
  //   <a href="/show/YY/grateful-dead/DATE/">Aug. 27, 1972 - Venue Name</a>
  // </div>
  // <a href="/show/YY/archive/">Listen on archive</a>

  // Split HTML into performance blocks (between score divs)
  const blockPattern = /<div class="arrows">[\s\S]*?<div class="score"[^>]*>\s*(\d+)\s*<\/div>[\s\S]*?(?=<div class="arrows">|<div class="pagination">|$)/g;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    const block = match[0];
    const votes = parseInt(match[1], 10);

    // Extract date from show_date div
    const dateMatch = block.match(/<div class="show_date">[\s\S]*?([a-z]+\.?\s+\d{1,2},?\s+\d{4})\s*[-–]\s*([^<]+)<\/a>/i);
    if (!dateMatch) continue;

    const dateStr = dateMatch[1];
    const venueStr = dateMatch[2].trim();
    const showDate = parseDate(dateStr);
    if (!showDate) continue;

    // Extract show ID from archive link: href="/show/18/archive/"
    const showIdMatch = block.match(/href="\/show\/(\d+)\/archive\//);
    if (!showIdMatch) {
      console.warn(`  ⚠️  Could not find show ID for ${dateStr}`);
      continue;
    }

    const showId = showIdMatch[1];

    performances.push({
      songTitle,
      showDate,
      showId,  // We'll resolve this to an identifier later
      venue: venueStr,
      votes
    });
  }

  return performances;
}

/**
 * Resolve show ID to Archive.org identifier by following redirect
 */
async function resolveShowIdentifier(showId) {
  try {
    const archiveUrl = `${CONFIG.BASE_URL}/show/${showId}/archive/`;
    const redirectUrl = await followRedirect(archiveUrl);

    // Extract identifier from redirect URL
    // Example: http://www.archive.org/details/gd72-08-27.sbd.braverman.16582.sbefail.shnf
    const identifier = extractIdentifier(redirectUrl);

    if (!identifier) {
      console.warn(`    ⚠️  Could not extract identifier from: ${redirectUrl}`);
    }

    return identifier;
  } catch (error) {
    console.error(`    ❌ Failed to resolve show ${showId}:`, error.message);
    return null;
  }
}

/**
 * Fetch performance rankings for a specific song
 */
async function fetchSongPerformances(songUrl) {
  const fullUrl = CONFIG.BASE_URL + songUrl;

  // Extract song name from URL for display
  const songName = songUrl.split('/').pop().replace(/-/g, ' ');
  console.log(`\n🎵 Scraping: ${songName}`);

  try {
    const html = await fetchWithRetry(fullUrl);

    // Extract song title from page
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const songTitle = titleMatch ? normalizeSongTitle(titleMatch[1]) : songName;

    // Parse performances (returns show IDs, not identifiers yet)
    const performances = parsePerformances(html, songTitle);

    if (performances.length === 0) {
      console.log(`  ⚠️  No performances found`);
      return [];
    }

    console.log(`  📊 Found ${performances.length} performances, resolving identifiers...`);

    // Resolve show IDs to Archive.org identifiers
    // To avoid too many requests, we'll only resolve the top-ranked ones
    // (since we only need top ~10 for tiering anyway)
    const topPerformances = performances.slice(0, 15); // Get top 15 to be safe

    const resolved = [];
    for (const perf of topPerformances) {
      const identifier = await resolveShowIdentifier(perf.showId);

      if (identifier) {
        resolved.push({
          songTitle: perf.songTitle,
          showDate: perf.showDate,
          identifier,
          venue: perf.venue,
          votes: perf.votes
        });
      }

      // Small delay between identifier resolutions
      await delay(300);
    }

    console.log(`  ✅ Resolved ${resolved.length}/${topPerformances.length} identifiers`);

    return resolved;
  } catch (error) {
    console.error(`  ❌ Failed to scrape ${songName}:`, error.message);
    return [];
  }
}

/**
 * Map vote counts to tier system (1-3 stars)
 */
function mapVotesToTiers(performances) {
  if (performances.length === 0) return [];

  // Sort by votes descending
  const sorted = [...performances].sort((a, b) => b.votes - a.votes);

  const tiers = sorted.map((perf, index) => {
    let tier;

    if (index < 3) {
      tier = 1; // Top 3 = Tier 1 (3 stars)
    } else if (index < 10) {
      tier = 2; // Ranks 4-10 = Tier 2 (2 stars)
    } else if (perf.votes >= 50) {
      tier = 3; // Notable performances (50+ votes) = Tier 3 (1 star)
    } else {
      return null; // Skip low-vote performances
    }

    return {
      songTitle: perf.songTitle,
      showDate: perf.showDate,
      showIdentifier: perf.identifier,
      tier,
      votes: perf.votes,
      notes: `${perf.votes} votes on HeadyVersion`
    };
  }).filter(Boolean);

  return tiers;
}

/**
 * Generate TypeScript file from scraped data
 */
function generateTypeScriptFile(allRatings) {
  console.log('\n📝 Generating TypeScript file...');

  // Organize by tier
  const tier1 = allRatings.filter(r => r.tier === 1);
  const tier2 = allRatings.filter(r => r.tier === 2);
  const tier3 = allRatings.filter(r => r.tier === 3);

  const now = new Date().toISOString().split('T')[0];

  const tsContent = `/**
 * Song Performance Ratings
 *
 * Fan-voted rankings scraped from Headyversion.com
 * Generated: ${now}
 *
 * Tier 1 (3 stars): Top 1-3 performances per song
 * Tier 2 (2 stars): Ranks 4-10 performances
 * Tier 3 (1 star): Notable performances (50+ votes)
 */

export type PerformanceRatingTier = 1 | 2 | 3;

export interface RatedSongPerformance {
  songTitle: string;
  showDate: string;
  showIdentifier: string;
  tier: PerformanceRatingTier;
  votes?: number;
  notes?: string;
}

// Tier 1: Legendary performances (3 stars) - ${tier1.length} performances
export const TIER_1_SONG_PERFORMANCES: RatedSongPerformance[] = [
${tier1.map(r => `  {
    songTitle: "${r.songTitle}",
    showDate: "${r.showDate}",
    showIdentifier: "${r.showIdentifier}",
    tier: 1,
    votes: ${r.votes},
    notes: "${r.notes}"
  }`).join(',\n')}
];

// Tier 2: Excellent performances (2 stars) - ${tier2.length} performances
export const TIER_2_SONG_PERFORMANCES: RatedSongPerformance[] = [
${tier2.map(r => `  {
    songTitle: "${r.songTitle}",
    showDate: "${r.showDate}",
    showIdentifier: "${r.showIdentifier}",
    tier: 2,
    votes: ${r.votes},
    notes: "${r.notes}"
  }`).join(',\n')}
];

// Tier 3: Notable performances (1 star) - ${tier3.length} performances
export const TIER_3_SONG_PERFORMANCES: RatedSongPerformance[] = [
${tier3.map(r => `  {
    songTitle: "${r.songTitle}",
    showDate: "${r.showDate}",
    showIdentifier: "${r.showIdentifier}",
    tier: 3,
    votes: ${r.votes},
    notes: "${r.notes}"
  }`).join(',\n')}
];

// Combined list for easy lookup
export const ALL_RATED_SONG_PERFORMANCES: RatedSongPerformance[] = [
  ...TIER_1_SONG_PERFORMANCES,
  ...TIER_2_SONG_PERFORMANCES,
  ...TIER_3_SONG_PERFORMANCES,
];

/**
 * Get performance rating for a song + show combination
 */
export function getSongPerformanceRating(
  songTitle: string,
  showDate: string
): PerformanceRatingTier | null {
  const normalizedSongTitle = normalizeSongTitleForLookup(songTitle);
  const dateOnly = showDate.split('T')[0];

  const rating = ALL_RATED_SONG_PERFORMANCES.find(
    perf =>
      normalizeSongTitleForLookup(perf.songTitle) === normalizedSongTitle &&
      perf.showDate === dateOnly
  );

  return rating?.tier || null;
}

/**
 * Normalize song titles for consistent lookups
 */
function normalizeSongTitleForLookup(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/^\\d+[\\s.-]*/, '')
    .replace(/^Track\\s+\\d+[\\s:]*/, '')
    .replace(/\\s*[-–]\\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\\s*[#]\\d+.*$/i, '')
    .replace(/\\s*\\(.*?\\)\\s*$/, '')
    .replace(/\\s*\\[.*?\\]\\s*$/, '')
    .replace(/playin'/gi, 'playing')
    .replace(/truckin'/gi, 'truckin')
    .replace(/lovin'/gi, 'loving')
    .replace(/&/g, 'and')
    .replace(/'/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
}

/**
 * Get all rated performances for a specific song
 */
export function getRatedPerformancesForSong(
  songTitle: string
): RatedSongPerformance[] {
  const normalized = normalizeSongTitleForLookup(songTitle);
  return ALL_RATED_SONG_PERFORMANCES
    .filter(perf => normalizeSongTitleForLookup(perf.songTitle) === normalized)
    .sort((a, b) => a.tier - b.tier);
}
`;

  try {
    fs.writeFileSync(CONFIG.OUTPUT_FILE, tsContent);
    console.log(`✅ Generated: ${CONFIG.OUTPUT_FILE}`);
    console.log(`   - Tier 1 (3★): ${tier1.length} performances`);
    console.log(`   - Tier 2 (2★): ${tier2.length} performances`);
    console.log(`   - Tier 3 (1★): ${tier3.length} performances`);
    console.log(`   - Total: ${allRatings.length} rated performances`);
  } catch (error) {
    console.error('❌ Failed to write TypeScript file:', error.message);
  }
}

/**
 * Main scraping function
 */
async function main() {
  console.log('🎸 Grateful Dead Song Performance Scraper');
  console.log('==========================================\n');

  // Load checkpoint if exists
  loadCheckpoint();

  // Fetch song list
  const songUrls = await fetchSongList();

  if (songUrls.length === 0) {
    console.error('❌ No songs found. Exiting.');
    return;
  }

  // Filter out already completed songs
  const remainingSongs = songUrls.filter(
    (url, index) => index > checkpoint.lastSongIndex
  );

  if (remainingSongs.length === 0) {
    console.log('✅ All songs already scraped!');
  } else {
    console.log(`\n🔄 Scraping ${remainingSongs.length} songs...`);
    console.log(`   (${checkpoint.completedSongs.length} already completed)\n`);
  }

  // Scrape each song
  for (let i = 0; i < remainingSongs.length; i++) {
    const songUrl = remainingSongs[i];
    const absoluteIndex = checkpoint.lastSongIndex + i + 1;

    console.log(`\n[${absoluteIndex + 1}/${songUrls.length}]`);

    // Fetch performances for this song
    const performances = await fetchSongPerformances(songUrl);

    // Map to tiers
    const tiers = mapVotesToTiers(performances);

    // Add to results
    checkpoint.allRatings.push(...tiers);
    checkpoint.completedSongs.push(songUrl);
    checkpoint.lastSongIndex = absoluteIndex;

    // Save checkpoint every 5 songs
    if ((i + 1) % 5 === 0) {
      saveCheckpoint();
      console.log(`\n💾 Checkpoint saved (${checkpoint.completedSongs.length} songs completed)`);
    }

    // Rate limiting - wait between requests
    if (i < remainingSongs.length - 1) {
      await delay(CONFIG.DELAY_MS);
    }
  }

  // Final save
  saveCheckpoint();

  // Generate TypeScript file
  generateTypeScriptFile(checkpoint.allRatings);

  // Clean up checkpoint file
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
    console.log('\n🗑️  Checkpoint file removed (scrape complete)');
  }

  console.log('\n✅ Scraping complete!');
}

// Run the scraper
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
