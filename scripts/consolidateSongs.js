const fs = require('fs');
const path = require('path');

/**
 * Consolidate duplicate songs with different title variations
 */

const SONGS_FILE = path.join(__dirname, '../src/constants/songs.generated.ts');

// Manual mappings for songs that need special handling
const MANUAL_MAPPINGS = {
  'workin\' man blues': 'workingman\'s blues',
  'woman are smarter': 'women are smarter',
  'west l.a. fadeaway': 'west la fadeaway',
  'west l.a. fade away': 'west la fadeaway',
  'wharf rat \\>': 'wharf rat',
  'wharf rat \\\\': 'wharf rat',
  'wharf rat \\\\\\\\': 'wharf rat',
  'and we bid you good night': 'and we bid you goodnight',
  'me and my uncle': 'me & my uncle',
  'around and around': 'around & around',
  'china cat': 'china cat sunflower',
  // C.C. Rider variations are abbreviated forms of the China Cat > I Know You Rider segue
  'c c rider': 'china cat sunflower > i know you rider',
  'c. c. rider': 'china cat sunflower > i know you rider',
  'c.c. rider': 'china cat sunflower > i know you rider',
  'cc rider': 'china cat sunflower > i know you rider',
  'estimated prophet': 'estimated',
  'uncle john\'s band': 'uncle johns band',
  'st stephen': 'st. stephen',
  'saint stephen': 'st. stephen',
  'cant come down': 'can\'t come down',
  'dont ease me in': 'don\'t ease me in',
  // User corrections batch
  'aiko aiko': 'iko iko',
  'big rail road blues': 'big railroad blues',
  'black-throated wind': 'black throated wind',
  'brown-eyed women': 'brown eyed women',
  'caution (do not step on the tracks)': 'caution',
  'corinna': 'corrina',
  'cryptical envelopement': 'cryptical enveloment',
  'dark star-': 'dark star',
  'deep elementary blues': 'deep elem blues',
  'drums & space': 'drums > space',
  'eyes of the world-': 'eyes of the world',
  'finiculi finicula': 'funiculi funicula',
  'gdtrfb': 'goin\' down the road feeling bad',
  'goin down the road': 'goin\' down the road feeling bad',
  'going down the road': 'goin\' down the road feeling bad',
  'goin\' down the road': 'goin\' down the road feeling bad',
  'going down the road feeling bad': 'goin\' down the road feeling bad',
  'dancin in the street': 'dancin\' in the streets',
  'dancin in the streets': 'dancin\' in the streets',
  'dancing in the street': 'dancin\' in the streets',
  'dancing in the streets': 'dancin\' in the streets',
  'dancin\' in the street': 'dancin\' in the streets',
  // Additional corrections batch 2
  'drums/space': 'drums > space',
  'greatest story': 'greatest story ever told',
  'it\'s a man\'s, man\'s, man\'s world': 'it\'s a man\'s world',
  'it\'s all over now baby blue': 'it\'s all over now',
  'man smart': 'man smart woman smarter',
  'mind left body jam': 'mind left body',
  'mississippi half step': 'mississippi half-step uptown toodeloo',
  'playin\\\' in the band': 'playing in the band',
  'playing reprise': 'playing in the band reprise',
  'queen jane': 'queen jane approximately',
  'lovelight': 'turn on your lovelight',
  'uncle john\\\'s band': 'uncle johns band',
  // Additional corrections batch 3
  'playing': 'playing in the band',
  'spanish': 'spanish jam',
  'truckina': 'truckin',
};

function normalizeTitle(title) {
  let normalized = title
    .toLowerCase()
    .trim()
    // Remove "e:" prefix
    .replace(/^e:\s*/i, '')
    // Remove segue markers
    .replace(/\s*[-–]?>\s*$/g, '')
    .replace(/\s*[-–]?\s*>\s*$/g, '')
    .replace(/\s*->\s*$/g, '')
    .replace(/\s*-->\s*$/g, '')
    .replace(/\s*>\s*$/g, '')
    // Remove trailing dash/hyphen
    .replace(/\s*-\s*$/g, '')
    // Normalize escaped characters
    .replace(/\\+>/g, '>')
    .replace(/\\+$/g, '')
    // Normalize "and" vs "&"
    .replace(/\band\b/g, '&')
    // Remove version markers
    .replace(/\s*\(live\)\s*$/i, '')
    .replace(/\s*\(studio\)\s*$/i, '')
    .replace(/\s*\(acoustic\)\s*$/i, '')
    .replace(/\s*\(electric\)\s*$/i, '')
    .replace(/\s*\(reprise\)\s*$/i, '')
    // Normalize spacing
    .replace(/\s+/g, ' ')
    .trim();

  // Apply manual mappings
  if (MANUAL_MAPPINGS[normalized]) {
    normalized = MANUAL_MAPPINGS[normalized];
  }

  return normalized;
}

// Convert to Title Case (capitalize major words, lowercase articles/prepositions)
function toTitleCase(str) {
  const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;
  const acronyms = /^(u\.s\.|i\.k\.y\.r\.|gdtrfb|st\.|jr\.|sr\.)$/i;

  return str
    .toLowerCase()
    .split(' ')
    .map((word, index, arr) => {
      // Always capitalize first and last word
      if (index === 0 || index === arr.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Keep acronyms uppercase
      if (acronyms.test(word)) {
        return word.toUpperCase();
      }

      // Lowercase small words
      if (smallWords.test(word)) {
        return word.toLowerCase();
      }

      // Capitalize everything else
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    // Handle words after segue arrows
    .replace(/>\s+(\w)/g, (match, letter) => '> ' + letter.toUpperCase())
    // Special cases
    .replace(/\bSt\./g, 'St.')
    .replace(/\bU\.s\./g, 'U.S.')
    .replace(/\bI\b/g, 'I'); // Pronoun "I" always uppercase
}

function shouldExclude(title) {
  const excludePatterns = [
    /tuning/i,
    /noodling/i,
    /between song/i,
    /sound ?check/i,
    /crowd/i,
    /applause/i,
    /banter/i,
    /talk/i,
    /intro/i,
    /outro/i,
    /commercial/i,
    /interview/i,
    /radio spot/i,
    /announcement/i,
    /^\d+$/,  // Just numbers
    /^\.\/[-.]$/,  // Weird characters
    /^unknown/i,
    /^drums$/i,
    /^space$/i,
  ];

  return excludePatterns.some(pattern => pattern.test(title));
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// Calculate similarity percentage between two strings
function similarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return ((maxLength - distance) / maxLength) * 100;
}

// Fuzzy match and merge similar songs
function fuzzyMergeSongs(songMap, threshold = 80) {
  console.log(`\n🔍 Fuzzy matching songs (${threshold}% similarity threshold)...`);

  const songs = Array.from(songMap.entries());
  const mergedCount = new Map(); // Track how many songs were merged

  for (let i = 0; i < songs.length; i++) {
    const [title1] = songs[i];

    // Skip if this song has already been merged into another
    if (!songMap.has(title1)) continue;

    for (let j = i + 1; j < songs.length; j++) {
      const [title2] = songs[j];

      // Skip if this song has already been merged
      if (!songMap.has(title2)) continue;

      const sim = similarity(title1, title2);

      if (sim >= threshold) {
        // Get current songs from the map
        const song1 = songMap.get(title1);
        const song2 = songMap.get(title2);

        // Skip if either song was already deleted (shouldn't happen but safety check)
        if (!song1 || !song2) continue;

        // Determine which song to keep (the one with more performances)
        const keep = song1.performances.length >= song2.performances.length ? title1 : title2;
        const remove = keep === title1 ? title2 : title1;

        const keepSong = songMap.get(keep);
        const removeSong = songMap.get(remove);

        // Merge performances
        for (const perf of removeSong.performances) {
          // Avoid duplicates
          const exists = keepSong.performances.some(p =>
            p.date === perf.date && p.identifier === perf.identifier
          );
          if (!exists) {
            keepSong.performances.push(perf);
          }
        }

        // Remove the merged song
        songMap.delete(remove);

        // Track merges
        if (!mergedCount.has(keep)) mergedCount.set(keep, []);
        mergedCount.get(keep).push(remove);

        console.log(`  ✓ Merged "${remove}" into "${keep}" (${sim.toFixed(1)}% similar)`);
      }
    }
  }

  console.log(`✅ Fuzzy merge complete: ${mergedCount.size} songs absorbed duplicates`);

  return songMap;
}

function parseSongsFile() {
  console.log('📖 Reading songs file...');
  const content = fs.readFileSync(SONGS_FILE, 'utf-8');

  // Extract the GRATEFUL_DEAD_SONGS array
  const songsMatch = content.match(/export const GRATEFUL_DEAD_SONGS: Song\[\] = \[([\s\S]*)\];/);
  if (!songsMatch) {
    throw new Error('Could not find GRATEFUL_DEAD_SONGS in file');
  }

  // Parse songs manually (regex-based parsing)
  const songMap = new Map();
  let currentSong = null;
  let totalPerformances = 0;
  let excludedSongs = 0;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match song title
    const titleMatch = line.match(/^\s*title: "(.+)",$/);
    if (titleMatch) {
      const originalTitle = titleMatch[1];

      // Check if should be excluded
      if (shouldExclude(originalTitle)) {
        excludedSongs++;
        currentSong = null;
        continue;
      }

      const normalizedTitle = normalizeTitle(originalTitle);

      if (!songMap.has(normalizedTitle)) {
        songMap.set(normalizedTitle, {
          title: normalizedTitle,
          performances: []
        });
      }
      currentSong = songMap.get(normalizedTitle);
      continue;
    }

    // Match performance date
    if (currentSong) {
      const dateMatch = line.match(/^\s*date: "(.+)",$/);
      if (dateMatch) {
        const date = dateMatch[1];
        let identifier = '';
        let venue = '';

        // Look ahead for identifier and venue
        if (i + 1 < lines.length) {
          const identifierMatch = lines[i + 1].match(/^\s*identifier: "(.+)",$/);
          if (identifierMatch) {
            identifier = identifierMatch[1];
          }
        }
        if (i + 2 < lines.length) {
          const venueMatch = lines[i + 2].match(/^\s*venue: "(.+)",$/);
          if (venueMatch) {
            venue = venueMatch[1];
          }
        }

        // Check for rating
        let rating = null;
        if (i + 3 < lines.length) {
          const ratingMatch = lines[i + 3].match(/^\s*rating: (\d+),$/);
          if (ratingMatch) {
            rating = parseInt(ratingMatch[1]);
          }
        } else if (i + 2 < lines.length && !venue) {
          const ratingMatch = lines[i + 2].match(/^\s*rating: (\d+),$/);
          if (ratingMatch) {
            rating = parseInt(ratingMatch[1]);
          }
        }

        // Avoid duplicates within same song
        const exists = currentSong.performances.some(p =>
          p.date === date && p.identifier === identifier
        );

        if (!exists && identifier) {
          currentSong.performances.push({
            date,
            identifier,
            venue,
            rating
          });
          totalPerformances++;
        }
      }
    }
  }

  console.log(`✅ Parsed ${songMap.size} unique songs`);
  console.log(`   Total performances: ${totalPerformances}`);
  console.log(`   Excluded songs: ${excludedSongs}`);

  // Apply fuzzy matching to merge similar songs
  fuzzyMergeSongs(songMap, 80);

  return songMap;
}

function generateTypeScriptCode(songMap) {
  console.log('\n📝 Generating consolidated TypeScript code...');

  const songs = Array.from(songMap.values())
    .map(song => ({
      ...song,
      performanceCount: song.performances.length
    }))
    .filter(song => song.performanceCount >= 3)
    .sort((a, b) => a.title.localeCompare(b.title));

  console.log(`📋 ${songs.length} songs with 3+ recordings (after consolidation)`);

  let code = 'export const GRATEFUL_DEAD_SONGS: Song[] = [\n';

  for (const song of songs) {
    code += '  {\n';
    code += `    title: "${escapeString(toTitleCase(song.title))}",\n`;
    code += `    performanceCount: ${song.performanceCount},\n`;
    code += '    performances: [\n';

    // Sort performances by date
    const sortedPerformances = song.performances.sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    for (const perf of sortedPerformances) {
      code += '      {\n';
      code += `        date: "${perf.date}",\n`;
      code += `        identifier: "${escapeString(perf.identifier)}",\n`;
      if (perf.venue) {
        code += `        venue: "${escapeString(toTitleCase(perf.venue))}",\n`;
      }
      if (perf.rating) {
        code += `        rating: ${perf.rating},\n`;
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
  console.log('🎵 Consolidating duplicate songs...\n');

  const songMap = parseSongsFile();
  const tsCode = generateTypeScriptCode(songMap);

  const outputPath = SONGS_FILE;

  const fullFile = `/**
 * Generated Grateful Dead song list from Archive.org recordings
 * Generated on ${new Date().toISOString()}
 *
 * CONSOLIDATED: Duplicate song variations merged
 * SOURCE: Archive.org track listings
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

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
