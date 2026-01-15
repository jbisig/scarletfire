const fs = require('fs');
const path = require('path');

/**
 * Parse setlist CSV and cross-reference with Archive.org data
 * to only include performances that have actual recordings
 */

const CSV_PATH = path.join(__dirname, '../reference_files/setlist - setlist.csv');
const ARCHIVE_SHOWS_PATH = path.join(__dirname, '../reference_files/archive-shows.json');

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

    // Check if this is a show header line
    if (parts[0] && parts[0].match(/^\d{4}\/\d{2}\/\d{2}/)) {
      const date = parts[0];
      const bandName = parts[1];
      const venue = parts[2] || undefined;

      if (bandName === 'Grateful Dead') {
        gratefulDeadShows++;
        currentShow = {
          date: date.replace(/\//g, '-'), // Convert to YYYY-MM-DD
          venue: venue
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

function cleanSongName(name) {
  name = name
    .replace(/^>\s*/, '')
    .replace(/\*+$/, '')
    .replace(/\?+$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
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
  console.log('📦 Loading Archive.org shows data...');

  if (!fs.existsSync(ARCHIVE_SHOWS_PATH)) {
    console.log('❌ Archive shows file not found. Run fetchArchiveShows.js first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(ARCHIVE_SHOWS_PATH, 'utf-8'));
  console.log(`✅ Loaded ${data.length} shows from Archive.org`);

  // Create a map of date -> show data
  // Normalize dates to YYYY-MM-DD format (strip timestamp)
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

function crossReference(songToShowDates, dateToShow) {
  console.log('\n🔗 Cross-referencing setlist with Archive.org...');

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
try {
  console.log('🎸 Generating Grateful Dead songs with verified Archive.org recordings...\n');

  const songToShowDates = parseSetlistCSV();
  const dateToShow = loadArchiveShows();
  const songToPerformances = crossReference(songToShowDates, dateToShow);
  const tsCode = generateTypeScriptCode(songToPerformances);

  const outputPath = path.join(__dirname, '../src/constants/songs.generated.ts');

  const fullFile = `/**
 * Generated Grateful Dead song list with VERIFIED Archive.org recordings
 * Generated on ${new Date().toISOString()}
 *
 * Only includes performances that have actual recordings available
 * DO NOT EDIT THIS FILE MANUALLY
 */

export interface SongPerformance {
  date: string;
  identifier: string;
  venue?: string;
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

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
