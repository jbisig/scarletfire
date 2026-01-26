const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Enhanced song generation script that uses BOTH setlist CSV AND Archive.org track listings
 * to ensure we don't miss any performances
 */

const CSV_PATH = path.join(__dirname, '../reference_files/setlist - setlist.csv');
const ARCHIVE_SHOWS_PATH = path.join(__dirname, '../reference_files/archive-shows.json');

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
function extractTracksFromArchiveMetadata(metadata) {
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
    .map(t => t.title);

  return tracks;
}

function parseSetlistCSV() {
  console.log('📖 Reading setlist CSV...');
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');

  console.log(`📊 Found ${lines.length} lines`);

  const songToShowDates = new Map();
  const showsWithoutSongs = [];
  let currentShow = null;
  let gratefulDeadShows = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');

    // Check if this is a show header line
    if (parts[0] && parts[0].match(/^\d{4}\/\d{2}\/\d{2}/)) {
      // Track shows without songs from previous iteration
      if (currentShow && currentShow.songCount === 0) {
        showsWithoutSongs.push(currentShow.date);
      }

      const date = parts[0];
      const bandName = parts[1];
      const venue = parts[2] || undefined;

      if (bandName === 'Grateful Dead') {
        gratefulDeadShows++;
        currentShow = {
          date: date.replace(/\//g, '-'), // Convert to YYYY-MM-DD
          venue: venue,
          songCount: 0
        };
      } else {
        currentShow = null;
      }
    } else if (currentShow && parts[1]) {
      let songName = parts[1].trim();

      // Skip set markers
      if (!songName || songName === 'I:' || songName === 'II:' || songName === 'E:' || songName === 'III:') {
        continue;
      }

      songName = cleanSongName(songName);

      if (songName) {
        currentShow.songCount++;
        if (!songToShowDates.has(songName)) {
          songToShowDates.set(songName, new Set());
        }
        songToShowDates.get(songName).add(currentShow.date);
      }
    }
  }

  console.log(`✅ Processed ${gratefulDeadShows} Grateful Dead shows from setlist`);
  console.log(`⚠️  ${showsWithoutSongs.length} shows have no songs listed`);
  console.log(`🎵 Found ${songToShowDates.size} unique songs from setlist`);

  return { songToShowDates, showsWithoutSongs };
}

function cleanSongName(name) {
  name = name
    .replace(/^>\s*/, '')
    .replace(/\*+$/, '')
    .replace(/\?+$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    // Remove parenthetical annotations at start or end
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
    // Remove "- electric sets", "- set 2", etc.
    .replace(/\s*-\s*electric\s+sets?\s*$/i, '')
    .replace(/\s*-\s*set\s+\d+\s*$/i, '')
    // Clean up track numbers
    .replace(/^Track\s+\d+\s*:\s*/i, '')
    .replace(/^\d+\s*\.\s*/, '')
    .replace(/^\d+\s+/, '')
    .trim();

  const skipPatterns = [
    /^tuning/i, /^talk/i, /^banter/i, /^announce/i,
    /^intro/i, /^crowd/i, /^applause/i, /^silence/i,
    /^unknown/i, /^drums$/i, /^space$/i,
  ];

  if (skipPatterns.some(pattern => pattern.test(name))) {
    return null;
  }

  return name;
}

function loadArchiveShows() {
  console.log('\n📦 Loading Archive.org shows data...');

  if (!fs.existsSync(ARCHIVE_SHOWS_PATH)) {
    console.log('❌ Archive shows file not found. Run fetchArchiveShows.js first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(ARCHIVE_SHOWS_PATH, 'utf-8'));
  console.log(`✅ Loaded ${data.length} shows from Archive.org`);

  // Create a map of date -> show data
  const dateToShow = new Map();
  data.forEach(show => {
    // Strip timestamp from ISO date: "1965-11-01T00:00:00Z" -> "1965-11-01"
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

async function augmentWithArchiveTracks(songToShowDates, showsWithoutSongs, dateToShow) {
  console.log('\n🔍 Augmenting missing shows with Archive.org track listings...');

  let augmentedShows = 0;
  let augmentedSongs = 0;
  let failedFetches = 0;

  for (const date of showsWithoutSongs) {
    const shows = dateToShow.get(date);
    if (!shows || shows.length === 0) continue;

    // Use the show with most downloads
    const bestShow = shows.sort((a, b) => b.downloads - a.downloads)[0];

    console.log(`  Fetching ${date} (${bestShow.identifier})...`);

    try {
      const metadata = await fetchArchiveMetadata(bestShow.identifier);
      const tracks = extractTracksFromArchiveMetadata(metadata);

      if (tracks.length > 0) {
        augmentedShows++;

        for (const trackTitle of tracks) {
          const cleanedTitle = cleanSongName(trackTitle);
          if (cleanedTitle) {
            if (!songToShowDates.has(cleanedTitle)) {
              songToShowDates.set(cleanedTitle, new Set());
            }
            songToShowDates.get(cleanedTitle).add(date);
            augmentedSongs++;
          }
        }

        console.log(`    ✅ Added ${tracks.length} tracks`);
      }

      // Rate limiting - wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.log(`    ❌ Failed to fetch: ${err.message}`);
      failedFetches++;
    }
  }

  console.log(`\n✅ Augmented ${augmentedShows} shows with ${augmentedSongs} song performances`);
  console.log(`❌ Failed to fetch ${failedFetches} shows`);

  return songToShowDates;
}

function crossReference(songToShowDates, dateToShow) {
  console.log('\n🔗 Cross-referencing with Archive.org recordings...');

  const songToPerformances = new Map();
  let totalMatches = 0;

  songToShowDates.forEach((dates, songName) => {
    const performances = [];

    dates.forEach(date => {
      const shows = dateToShow.get(date);
      if (shows && shows.length > 0) {
        // Use the show with most downloads
        const bestShow = shows.sort((a, b) => b.downloads - a.downloads)[0];
        performances.push({
          date: date,
          identifier: bestShow.identifier,
          venue: bestShow.venue
        });
        totalMatches++;
      }
    });

    if (performances.length > 0) {
      songToPerformances.set(songName, performances);
    }
  });

  console.log(`✅ ${songToPerformances.size} songs with recordings`);
  console.log(`📀 ${totalMatches} total performance recordings found`);

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
    console.log('🎸 Generating Grateful Dead songs with ENHANCED Archive.org data...\n');

    const { songToShowDates, showsWithoutSongs } = parseSetlistCSV();
    const dateToShow = loadArchiveShows();

    // Augment with Archive.org track listings for shows missing from setlist
    const augmentedSongData = await augmentWithArchiveTracks(songToShowDates, showsWithoutSongs, dateToShow);

    const songToPerformances = crossReference(augmentedSongData, dateToShow);
    const tsCode = generateTypeScriptCode(songToPerformances);

    const outputPath = path.join(__dirname, '../src/constants/songs.generated.ts');

    const fullFile = `/**
 * Generated Grateful Dead song list with VERIFIED Archive.org recordings
 * Generated on ${new Date().toISOString()}
 *
 * Data sources:
 * 1. Setlist CSV (primary source)
 * 2. Archive.org track listings (fallback for shows missing setlist data)
 *
 * Only includes performances that have actual recordings available
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
