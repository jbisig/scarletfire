import { archiveApi } from '../services/archiveApi';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs';
import { logger } from './logger';

/**
 * Utility to fetch all song performance data and generate TypeScript code
 * Run this once to populate the performances array in songs.ts
 */
export async function generateSongData() {
  const log = logger.create('SongData');
  log.info('Starting to fetch all song performance data...');
  log.info('This will take 10-15 minutes. Please be patient!');

  const startTime = Date.now();

  try {
    // Fetch all song versions from the Archive API
    const songVersionsMap = await archiveApi.getSongVersions();

    log.info(`Fetched data for ${songVersionsMap.size} songs`);

    // Convert to the format we need
    const songsWithPerformances = GRATEFUL_DEAD_SONGS.map(song => {
      const performances = songVersionsMap.get(song.title) || [];

      return {
        title: song.title,
        performanceCount: performances.length,
        performances: performances.map(p => ({
          date: p.date,
          identifier: p.identifier,
          venue: p.venue
        }))
      };
    });

    // Generate TypeScript code
    const tsCode = generateTypeScriptCode(songsWithPerformances);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log.info(`Total time: ${elapsed} seconds`);
    log.info('Copy the data below and replace GRATEFUL_DEAD_SONGS in src/constants/songs.ts:');
    log.info(tsCode);

    return songsWithPerformances;
  } catch (error) {
    log.error('Error generating song data:', error);
    throw error;
  }
}

function generateTypeScriptCode(songs: any[]): string {
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

function escapeString(str: string): string {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
