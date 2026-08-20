jest.mock('../../utils/logger', () => ({
  logger: {
    api: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    player: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    profile: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  },
}));

import { archiveApi } from '../archiveApi';
import type { ArchiveDoc } from '../../types/archive.types';

describe('archiveApi.getShowsByYear', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('derives title/venue/location from the primary (highest-downloads) doc, and keeps every recording of a many-version show sorted, uncapped, and parsed', async () => {
    // Date A: two docs, the LOWER-downloads doc comes first in array order
    // with a different title/venue/coverage than the eventual primary.
    const dateA: ArchiveDoc[] = [
      {
        identifier: 'gd1978-05-11.aud.lowdownloads.shnf',
        title: 'WRONG TITLE (low-downloads doc)',
        date: '1978-05-11T00:00:00Z',
        venue: 'Wrong Venue',
        coverage: 'Wrong City, WR',
        year: '1978',
        downloads: 100,
      },
      {
        identifier: 'gd1978-05-11.sbd.highdownloads.shnf',
        title: 'Grateful Dead Live at Cornell University on 1978-05-11',
        date: '1978-05-11T00:00:00Z',
        venue: 'Barton Hall, Cornell University',
        coverage: 'Ithaca, NY',
        year: '1978',
        downloads: 250000,
      },
    ];

    // Date B: seven docs with distinct download counts, none matching the
    // per-show version cap that used to apply (SEARCH_LIMITS.MAX_VERSIONS_PER_SHOW = 5).
    const dateB: ArchiveDoc[] = Array.from({ length: 7 }, (_, i) => ({
      identifier: `gd1978-05-08.sbd.v${i}.flac16`,
      title: 'Grateful Dead Live at Uptown Theater on 1978-05-08',
      date: '1978-05-08T00:00:00Z',
      venue: 'Uptown Theater',
      coverage: 'Chicago, IL',
      year: '1978',
      downloads: i * 1000,
      source: 'SBD -> Master Reel -> DAT',
    }));

    const allDocs = [...dateA, ...dateB];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: { numFound: allDocs.length, start: 0, docs: allDocs },
      }),
    });

    const showsByYear = await archiveApi.getShowsByYear();
    const shows = showsByYear['1978'];
    expect(shows).toHaveLength(2);

    const cornell = shows.find(s => s.date === '1978-05-11T00:00:00Z')!;
    expect(cornell.primaryIdentifier).toBe('gd1978-05-11.sbd.highdownloads.shnf');
    expect(cornell.title).toBe('Grateful Dead Live at Cornell University on 1978-05-11');
    expect(cornell.venue).toBe('Barton Hall, Cornell University');
    expect(cornell.location).toBe('Ithaca, NY');

    const uptown = shows.find(s => s.date === '1978-05-08T00:00:00Z')!;
    expect(uptown.versions).toHaveLength(7);
    expect(uptown.versions.map(v => v.identifier)).toEqual([
      'gd1978-05-08.sbd.v6.flac16',
      'gd1978-05-08.sbd.v5.flac16',
      'gd1978-05-08.sbd.v4.flac16',
      'gd1978-05-08.sbd.v3.flac16',
      'gd1978-05-08.sbd.v2.flac16',
      'gd1978-05-08.sbd.v1.flac16',
      'gd1978-05-08.sbd.v0.flac16',
    ]);
    expect(uptown.primaryIdentifier).toBe('gd1978-05-08.sbd.v6.flac16');
    uptown.versions.forEach(v => {
      expect(v.format).toBe('sbd');
      expect(v.lineage).toEqual(['lowgen']);
    });
  });
});
