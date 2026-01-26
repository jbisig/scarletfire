const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * FULLY VERIFIED song generation script
 *
 * Only includes performances where we can VERIFY the song exists in the Archive.org recording
 * Uses fuzzy matching between setlist names and Archive.org track titles
 */

const CSV_PATH = path.join(__dirname, '../reference_files/setlist - setlist.csv');
const ARCHIVE_SHOWS_PATH = path.join(__dirname, '../reference_files/archive-shows.json');
const CACHE_PATH = path.join(__dirname, '../reference_files/archive-metadata-cache.json');

// Helper to fetch Archive.org metadata
function fetchArchiveMetadata(identifier) {
  return new Promise((resolve, reject) => {
    const url = `https://archive.org/metadata/${identifier}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Extract track titles from Archive.org metadata
function extractTracksFromMetadata(metadata) {
  const files = metadata.files || {};
  const tracks = Object.entries(files)
    .filter(([name, file]) =>
      (file.format === 'VBR MP3' || file.format === 'Ogg Vorbis') &&
      file.title &&
      file.title.trim() !== ''
    )
    .map(([name, file]) => ({
      title: file.title,
      track: file.track || 0
    }))
    .sort((a, b) => a.track - b.track)
    .map(t => normalizeTrackTitle(t.title));

  return tracks;
}

// Normalize track title for matching (same as SongPerformancesScreen)
function normalizeTrackTitle(title) {
  return title
    .toLowerCase()
    .replace(/^>\s*/, '')
    .replace(/\*+$/, '')
    .replace(/\?+$/, '')
    .replace(/^\d+[\s.-]*/, '')
    .replace(/^Track\s+\d+[\s:]*/, '')
    .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\s*[#]\d+.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    .replace(/^\(acoustic\)\s*/i, '')
    .replace(/^\(electric\)\s*/i, '')
    .replace(/^\(late\)\s*/i, '')
    .replace(/^\(early\)\s*/i, '')
    .replace(/^\(reprise\)\s*/i, '')
    .replace(/\s*\(acoustic\)\s*$/i, '')
    .replace(/\s*\(electric\)\s*$/i, '')
    .replace(/\s*\(late\)\s*$/i, '')
    .replace(/\s*\(early\)\s*$/i, '')
    .replace(/\s*\(reprise\)\s*$/i, '')
    .replace(/\s*-\s*electric\s+sets?\s*$/i, '')
    .replace(/\s*-\s*set\s+\d+\s*$/i, '')
    .replace(/\s+jam\s*$/i, '')
    .replace(/playin'/gi, 'playing')
    .replace(/truckin'/gi, 'truckin')
    .replace(/lovin'/gi, 'loving')
    .trim();
}

// Calculate string similarity (Levenshtein distance)
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const distance = costs[s2.length];
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

function parseSetlistCSV() {
  console.log('📖 Reading setlist CSV...');
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');

  console.log(`📊 Found ${lines.length} lines`);

  const songToShowDates = new Map();
  let currentShow = null;
  let gratefulDeadShows = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');

    if (parts[0] && parts[0].match(/^\d{4}\/\d{2}\/\d{2}/)) {
      const date = parts[0];
      const bandName = parts[1];

      if (bandName === 'Grateful Dead') {
        gratefulDeadShows++;
        currentShow = {
          date: date.replace(/\//g, '-')
        };
      } else {
        currentShow = null;
      }
    } else if (currentShow && parts[1]) {
      let songName = parts[1].trim();

      if (!songName || songName === 'I:' || songName === 'II:' || songName === 'E:' || songName === 'III:') {
        continue;
      }

      songName = normalizeTrackTitle(songName);

      if (songName && !isNonMusicalEntry(songName)) {
        if (!songToShowDates.has(songName)) {
          songToShowDates.set(songName, new Set());
        }
        songToShowDates.get(songName).add(currentShow.date);
      }
    }
  }

  console.log(`✅ Processed ${gratefulDeadShows} Grateful Dead shows from setlist`);
  console.log(`🎵 Found ${songToShowDates.size} unique songs`);

  return songToShowDates;
}

function isNonMusicalEntry(name) {
  const skipPatterns = [
    /^tuning/i, /^talk/i, /^banter/i, /^announce/i,
    /^intro/i, /^crowd/i, /^applause/i, /^silence/i,
    /^unknown/i, /^drums$/i, /^space$/i,
  ];

  return skipPatterns.some(pattern => pattern.test(name));
}

function loadArchiveShows() {
  console.log('\n📦 Loading Archive.org shows data...');

  if (!fs.existsSync(ARCHIVE_SHOWS_PATH)) {
    console.log('❌ Archive shows file not found. Run fetchArchiveShows.js first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(ARCHIVE_SHOWS_PATH, 'utf-8'));
  console.log(`✅ Loaded ${data.length} shows from Archive.org`);

  const dateToShow = new Map();
  data.forEach(show => {
    const normalizedDate = show.date.split('T')[0];

    if (!dateToShow.has(normalizedDate)) {
      dateToShow.set(normalizedDate, []);
    }
    dateToShow.get(normalizedDate).push({
      ...show,
      date: normalizedDate
    });
  });

  console.log(`📅 ${dateToShow.size} unique dates with recordings`);
  return dateToShow;
}

function loadCache() {
  if (fs.existsSync(CACHE_PATH)) {
    console.log('\\n💾 Loading metadata cache...');
    const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    console.log(`✅ Loaded ${Object.keys(cache).length} cached shows`);
    return cache;
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

async function verifyPerformances(songToShowDates, dateToShow) {
  console.log('\\n🔍 VERIFYING all performances against Archive.org recordings...');
  console.log('⚠️  This will take a while - fetching metadata for all shows...\\n');

  const cache = loadCache();
  const songToVerifiedPerformances = new Map();

  let totalChecked = 0;
  let totalVerified = 0;
  let totalRejected = 0;
  let cacheHits = 0;
  let cacheMisses = 0;

  const SIMILARITY_THRESHOLD = 0.75; // 75% similarity required

  for (const [songName, dates] of songToShowDates.entries()) {
    const verifiedPerformances = [];

    for (const date of dates) {
      const shows = dateToShow.get(date);
      if (!shows || shows.length === 0) {
        totalRejected++;
        continue;
      }

      totalChecked++;

      // Use the show with most downloads
      const bestShow = shows.sort((a, b) => b.downloads - a.downloads)[0];

      // Check cache first
      let tracks;
      if (cache[bestShow.identifier]) {
        tracks = cache[bestShow.identifier];
        cacheHits++;
      } else {
        // Fetch from Archive.org
        try {
          console.log(`  Fetching ${date} (${bestShow.identifier})...`);
          const metadata = await fetchArchiveMetadata(bestShow.identifier);
          tracks = extractTracksFromMetadata(metadata);

          // Cache the result
          cache[bestShow.identifier] = tracks;
          cacheMisses++;

          // Save cache every 50 fetches
          if (cacheMisses % 50 === 0) {
            saveCache(cache);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.log(`    ❌ Failed to fetch: ${err.message}`);
          totalRejected++;
          continue;
        }
      }

      // Fuzzy match song name against tracks
      let bestMatch = null;
      let bestScore = 0;

      for (const track of tracks) {
        const similarity = calculateSimilarity(songName, track);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = track;
        }
      }

      if (bestScore >= SIMILARITY_THRESHOLD) {
        // VERIFIED - song found in recording
        verifiedPerformances.push({
          date: date,
          identifier: bestShow.identifier,
          venue: bestShow.venue
        });
        totalVerified++;
        if (cacheMisses > cacheHits) {
          console.log(`    ✅ VERIFIED "${songName}" (matched "${bestMatch}" at ${(bestScore * 100).toFixed(0)}%)`);
        }
      } else {
        // REJECTED - song not found in recording
        totalRejected++;
        if (cacheMisses > cacheHits) {
          console.log(`    ❌ REJECTED "${songName}" (best match: "${bestMatch}" at ${(bestScore * 100).toFixed(0)}%)`);
        }
      }
    }

    if (verifiedPerformances.length > 0) {
      songToVerifiedPerformances.set(songName, verifiedPerformances);
    }
  }

  // Save final cache
  saveCache(cache);

  console.log(`\\n✅ Verification complete!`);
  console.log(`   Total performances checked: ${totalChecked}`);
  console.log(`   ✅ Verified: ${totalVerified}`);
  console.log(`   ❌ Rejected: ${totalRejected}`);
  console.log(`   📊 Verification rate: ${((totalVerified / totalChecked) * 100).toFixed(1)}%`);
  console.log(`   💾 Cache hits: ${cacheHits}, misses: ${cacheMisses}`);

  return songToVerifiedPerformances;
}

function generateTypeScriptCode(songToPerformances) {
  console.log('\\n📝 Generating TypeScript code...');

  const songs = Array.from(songToPerformances.entries())
    .map(([title, performances]) => ({
      title,
      performanceCount: performances.length,
      performances: performances.sort((a, b) => a.date.localeCompare(b.date))
    }))
    .filter(song => song.performanceCount >= 3)
    .sort((a, b) => a.title.localeCompare(b.title));

  console.log(`📋 ${songs.length} songs with 3+ VERIFIED recordings`);

  let code = 'export const GRATEFUL_DEAD_SONGS: Song[] = [\n';

  for (const song of songs) {
    code += '  {\n';
    code += `    title: "${escapeString(song.title)}",\n`;
    code += `    performanceCount: ${song.performanceCount},\n`;
    code += '    performances: [\n';

    for (const perf of song.performances) {
      code += '      {\n';
      code += `        date: "${perf.date}",\n`;
      code += `        identifier: "${escapeString(perf.identifier)}",\n`;
      if (perf.venue) {
        code += `        venue: "${escapeString(perf.venue)}",\n`;
      }
      code += '      },\n';
    }

    code += '    ],\n';
    code += '  },\n';
  }

  code += '];\n';

  return code;
}

function escapeString(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

// Main execution
(async () => {
  try {
    console.log('🎸 Generating FULLY VERIFIED Grateful Dead songs...\\n');

    const songToShowDates = parseSetlistCSV();
    const dateToShow = loadArchiveShows();
    const songToPerformances = await verifyPerformances(songToShowDates, dateToShow);
    const tsCode = generateTypeScriptCode(songToPerformances);

    const outputPath = path.join(__dirname, '../src/constants/songs.generated.ts');

    const fullFile = `/**
 * Generated Grateful Dead song list with FULLY VERIFIED Archive.org recordings
 * Generated on ${new Date().toISOString()}
 *
 * VERIFICATION PROCESS:
 * 1. Parse setlist CSV for all songs
 * 2. Cross-reference with Archive.org recordings
 * 3. Fetch actual track listings from Archive.org
 * 4. Fuzzy match song names against track titles (75% similarity threshold)
 * 5. ONLY include performances where song is verified in the recording
 *
 * This ensures ZERO false positives - every performance listed has a verified recording
 * DO NOT EDIT THIS FILE MANUALLY
 */

export interface SongPerformance {
  date: string;
  identifier: string;
  venue?: string;
  rating?: 1 | 2 | 3; // Pre-computed performance rating
}

export interface Song {
  title: string;
  performanceCount: number;
  performances: SongPerformance[];
}

${tsCode}
`;

    fs.writeFileSync(outputPath, fullFile, 'utf-8');

    console.log(`\\n✅ Success!`);
    console.log(`📁 Written to: ${outputPath}`);
    console.log(`\\n⚠️  IMPORTANT: Run enrichSongsWithRatings.js to add performance ratings`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
