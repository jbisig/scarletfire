const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Generate songs list DIRECTLY from Archive.org recordings
 * This is the most accurate approach - uses only what's actually in the recordings
 */

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

// Normalize track title for grouping
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
    .replace(/\s*->\s*$/i, '') // Remove trailing segue marker
    .replace(/playin'/gi, 'playing')
    .replace(/truckin'/gi, 'truckin')
    .replace(/lovin'/gi, 'loving')
    .replace(/&/g, 'and')
    .trim();
}

function isNonMusicalEntry(name) {
  const skipPatterns = [
    /^tuning/i, /^talk/i, /^banter/i, /^announce/i,
    /^intro/i, /^crowd/i, /^applause/i, /^silence/i,
    /^unknown/i, /^drums$/i, /^space$/i,
    /^\d+$/i, // Just numbers
  ];

  return skipPatterns.some(pattern => pattern.test(name)) || name.length < 3;
}

function loadArchiveShows() {
  console.log('📦 Loading Archive.org shows data...');

  if (!fs.existsSync(ARCHIVE_SHOWS_PATH)) {
    console.log('❌ Archive shows file not found. Run fetchArchiveShows.js first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(ARCHIVE_SHOWS_PATH, 'utf-8'));
  console.log(`✅ Loaded ${data.length} shows from Archive.org`);

  return data;
}

function loadCache() {
  if (fs.existsSync(CACHE_PATH)) {
    console.log('💾 Loading metadata cache...');
    const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    console.log(`✅ Loaded ${Object.keys(cache).length} cached shows\n`);
    return cache;
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

async function extractSongsFromArchive(shows) {
  console.log('🔍 Extracting songs from Archive.org recordings...');
  console.log('⚠️  This will fetch metadata for all shows...\n');

  const cache = loadCache();
  const songToPerformances = new Map();

  let processed = 0;
  let cacheHits = 0;
  let cacheMisses = 0;
  let totalSongsFound = 0;

  for (const show of shows) {
    processed++;

    // Check cache first
    let tracks;
    if (cache[show.identifier]) {
      tracks = cache[show.identifier];
      cacheHits++;
    } else {
      // Fetch from Archive.org
      try {
        console.log(`  [${processed}/${shows.length}] Fetching ${show.date} (${show.identifier})...`);
        const metadata = await fetchArchiveMetadata(show.identifier);
        tracks = extractTracksFromMetadata(metadata);

        // Cache the result
        cache[show.identifier] = tracks;
        cacheMisses++;

        // Save cache every 50 fetches
        if (cacheMisses % 50 === 0) {
          saveCache(cache);
          console.log(`    💾 Saved cache (${cacheMisses} new shows)`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.log(`    ❌ Failed to fetch: ${err.message}`);
        continue;
      }
    }

    // Process tracks
    for (const track of tracks) {
      if (!isNonMusicalEntry(track)) {
        if (!songToPerformances.has(track)) {
          songToPerformances.set(track, []);
        }

        songToPerformances.get(track).push({
          date: show.date.split('T')[0],
          identifier: show.identifier,
          venue: show.venue
        });

        totalSongsFound++;
      }
    }

    // Progress update every 100 shows
    if (processed % 100 === 0) {
      console.log(`    📊 Progress: ${processed}/${shows.length} shows (${((processed/shows.length)*100).toFixed(1)}%)`);
      console.log(`    🎵 Found ${songToPerformances.size} unique songs, ${totalSongsFound} total performances`);
    }
  }

  // Save final cache
  saveCache(cache);

  console.log(`\n✅ Extraction complete!`);
  console.log(`   Shows processed: ${processed}`);
  console.log(`   Unique songs: ${songToPerformances.size}`);
  console.log(`   Total performances: ${totalSongsFound}`);
  console.log(`   💾 Cache hits: ${cacheHits}, misses: ${cacheMisses}`);

  return songToPerformances;
}

function generateTypeScriptCode(songToPerformances) {
  console.log('\n📝 Generating TypeScript code...');

  const songs = Array.from(songToPerformances.entries())
    .map(([title, performances]) => ({
      title,
      performanceCount: performances.length,
      performances: performances.sort((a, b) => a.date.localeCompare(b.date))
    }))
    .filter(song => song.performanceCount >= 3)
    .sort((a, b) => a.title.localeCompare(b.title));

  console.log(`📋 ${songs.length} songs with 3+ recordings`);

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
    console.log('🎸 Generating songs DIRECTLY from Archive.org recordings...\n');

    const shows = loadArchiveShows();
    const songToPerformances = await extractSongsFromArchive(shows);
    const tsCode = generateTypeScriptCode(songToPerformances);

    const outputPath = path.join(__dirname, '../src/constants/songs.generated.ts');

    const fullFile = `/**
 * Generated Grateful Dead song list from Archive.org recordings
 * Generated on ${new Date().toISOString()}
 *
 * SOURCE: Archive.org track listings (NOT setlist CSV)
 * This is the most accurate source - every song listed exists in an Archive.org recording
 *
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

    console.log(`\n✅ Success!`);
    console.log(`📁 Written to: ${outputPath}`);
    console.log(`\n⚠️  IMPORTANT: Run enrichSongsWithRatings.js to add performance ratings`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
