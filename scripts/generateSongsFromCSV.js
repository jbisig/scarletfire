const fs = require('fs');
const path = require('path');

/**
 * Parse the setlist CSV and generate TypeScript code for GRATEFUL_DEAD_SONGS
 */

const CSV_PATH = path.join(__dirname, '../reference_files/setlist - setlist.csv');

function parseCSV() {
  console.log('📖 Reading setlist CSV...');
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');

  console.log(`📊 Found ${lines.length} lines`);

  const songToShows = new Map();
  let currentShow = null;
  let gratefulDeadShows = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');

    // Check if this is a show header line (has a date in YYYY/MM/DD format)
    if (parts[0] && parts[0].match(/^\d{4}\/\d{2}\/\d{2}/)) {
      const date = parts[0];
      const bandName = parts[1];
      const venue = parts[2] || undefined;

      // Only process Grateful Dead shows
      if (bandName === 'Grateful Dead') {
        gratefulDeadShows++;
        currentShow = {
          date: date.replace(/\//g, '-'), // Convert to YYYY-MM-DD format
          venue: venue,
          identifier: generateIdentifier(date, venue)
        };
      } else {
        currentShow = null;
      }
    } else if (currentShow && parts[1]) {
      // This is a song line
      let songName = parts[1].trim();

      // Skip set markers and empty songs
      if (!songName || songName === 'I:' || songName === 'II:' || songName === 'E:' || songName === 'III:') {
        continue;
      }

      // Clean up song name
      songName = cleanSongName(songName);

      if (songName) {
        if (!songToShows.has(songName)) {
          songToShows.set(songName, []);
        }

        const performances = songToShows.get(songName);

        // Avoid duplicate dates
        if (!performances.some(p => p.date === currentShow.date)) {
          performances.push({
            date: currentShow.date,
            identifier: currentShow.identifier,
            venue: currentShow.venue
          });
        }
      }
    }
  }

  console.log(`✅ Processed ${gratefulDeadShows} Grateful Dead shows`);
  console.log(`🎵 Found ${songToShows.size} unique songs`);

  return songToShows;
}

function cleanSongName(name) {
  // Remove common prefixes and markers
  name = name
    .replace(/^>\s*/, '') // Remove segue marker
    .replace(/\*+$/, '') // Remove asterisks at end
    .replace(/\?+$/, '') // Remove question marks at end
    .replace(/\s*\[.*?\]\s*$/, '') // Remove bracketed notes at end
    .trim();

  // Skip non-musical entries
  const skipPatterns = [
    /^tuning/i,
    /^talk/i,
    /^banter/i,
    /^announce/i,
    /^intro/i,
    /^crowd/i,
    /^applause/i,
    /^silence/i,
    /^unknown/i,
    /^drums$/i,
    /^space$/i,
  ];

  if (skipPatterns.some(pattern => pattern.test(name))) {
    return null;
  }

  return name;
}

function generateIdentifier(date, venue) {
  // Generate an Archive.org-style identifier
  // Format: gd1977-05-08.sbd.miller.87355.flac16
  const dateStr = date.replace(/\//g, '-');
  return `gd${dateStr}.sbd.unknown.00000.flac16`;
}

function generateTypeScriptCode(songToShows) {
  console.log('📝 Generating TypeScript code...');

  // Convert to array and sort
  const songs = Array.from(songToShows.entries())
    .map(([title, performances]) => ({
      title,
      performanceCount: performances.length,
      performances: performances.sort((a, b) => a.date.localeCompare(b.date))
    }))
    .filter(song => song.performanceCount >= 3) // Only songs with 3+ performances
    .sort((a, b) => a.title.localeCompare(b.title));

  console.log(`📋 ${songs.length} songs with 3+ performances`);

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
  console.log('🎸 Starting Grateful Dead song data generation...\n');

  const songToShows = parseCSV();
  const tsCode = generateTypeScriptCode(songToShows);

  // Write to output file
  const outputPath = path.join(__dirname, '../src/constants/songs.generated.ts');

  const fullFile = `/**
 * Generated Grateful Dead song list with performances
 * Generated from setlist CSV on ${new Date().toISOString()}
 *
 * DO NOT EDIT THIS FILE MANUALLY
 * Regenerate by running: node scripts/generateSongsFromCSV.js
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
  console.log(`\n📋 Next steps:`);
  console.log(`1. Update src/constants/songs.ts to export from songs.generated.ts`);
  console.log(`2. Remove the temporary data generator from SongListScreen`);

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
