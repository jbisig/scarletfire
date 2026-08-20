import { groupDocsIntoShows, buildRawDump, buildReport, buildSlimCatalog, serializeCatalog } from '../lib/catalogBuilder';
import sample from './fixtures/search-1977-sample.json';
import type { ArchiveDoc } from '../../src/types/archive.types';
import type { ShowsByYear } from '../../src/types/show.types';

const docs = sample as ArchiveDoc[];

describe('groupDocsIntoShows', () => {
  const byYear = groupDocsIntoShows(docs);
  const shows = byYear['1977'];

  it('groups recordings by date under their year, falling back to the date for a missing year', () => {
    expect(Object.keys(byYear)).toEqual(['1977']);
    expect(shows.map(s => s.date)).toEqual([
      '1977-02-26T00:00:00Z',
      '1977-04-23T00:00:00Z',
      '1977-04-27T00:00:00Z',
      '1977-05-09T00:00:00Z',
    ]);
  });

  it('keeps every recording (no cap), sorted by downloads desc, primary = highest downloads', () => {
    const apr23 = shows.find(s => s.date.startsWith('1977-04-23'))!;
    expect(apr23.versions.map(v => v.identifier)).toEqual([
      'gd1977-04-23.mtx.seamons.97596.sbeok.flac16',
      'gd1977-04-23.sbd.miller.88401.sbeok.flac16',
    ]);
    expect(apr23.primaryIdentifier).toBe('gd1977-04-23.mtx.seamons.97596.sbeok.flac16');
    expect(apr23.title).toBe('Grateful Dead Live at Springfield Civic Center Arena on 1977-04-23');
    expect(apr23.venue).toBe('Springfield Civic Center Arena');
    expect(apr23.location).toBe('Springfield, MA');
    expect(apr23.year).toBe('1977');
  });

  it('bakes parsed fields onto each version and never a legacy `source` string', () => {
    const apr27 = shows.find(s => s.date.startsWith('1977-04-27'))!;
    const moore = apr27.versions.find(v => v.identifier === 'gd1977-04-27.fm.moore.berger.98429.flac24')!;
    expect(moore.format).toBe('fm');
    expect(moore.lineage).toEqual(['lowgen']);
    expect(moore.avgRating).toBe(5);
    expect(moore.numReviews).toBe(2);
    expect(moore.provenance).toBe('FM reel master');
    expect(moore.taper).toBe('Jerry Moore');
    expect(moore.transferrer).toBe('Rob Berger');
    expect(moore).not.toHaveProperty('source');
    expect(moore).not.toHaveProperty('title');
  });

  it('keeps a show with many recordings intact (no slice at 5)', () => {
    const many: ArchiveDoc[] = Array.from({ length: 9 }, (_, i) => ({
      identifier: `gd1977-05-08.sbd.v${i}.shnf`,
      title: 'Grateful Dead Live at Barton Hall on 1977-05-08',
      date: '1977-05-08T00:00:00Z',
      year: '1977',
      downloads: i,
    }));
    const out = groupDocsIntoShows(many)['1977'][0];
    expect(out.versions).toHaveLength(9);
    expect(out.primaryIdentifier).toBe('gd1977-05-08.sbd.v8.shnf');
  });

  it('derives title/venue/location from the primary (highest-downloads) doc, not the first doc encountered for the date', () => {
    // The first doc in array order is the LOWER-downloads recording with a
    // different title/venue/coverage than the eventual primary. A "first
    // doc wins" implementation would report the low-downloads doc's fields;
    // the correct behavior looks up the doc matching the sorted primary
    // identifier.
    const twoDocs: ArchiveDoc[] = [
      {
        identifier: 'gd1977-06-09.aud.lowdownloads.shnf',
        title: 'WRONG TITLE (low-downloads doc)',
        date: '1977-06-09T00:00:00Z',
        venue: 'Wrong Venue',
        coverage: 'Wrong City, WR',
        year: '1977',
        downloads: 10,
      },
      {
        identifier: 'gd1977-06-09.sbd.highdownloads.shnf',
        title: 'Grateful Dead Live at Winterland on 1977-06-09',
        date: '1977-06-09T00:00:00Z',
        venue: 'Winterland Arena',
        coverage: 'San Francisco, CA',
        year: '1977',
        downloads: 5000,
      },
    ];
    const show = groupDocsIntoShows(twoDocs)['1977'][0];
    expect(show.primaryIdentifier).toBe('gd1977-06-09.sbd.highdownloads.shnf');
    expect(show.title).toBe('Grateful Dead Live at Winterland on 1977-06-09');
    expect(show.venue).toBe('Winterland Arena');
    expect(show.location).toBe('San Francisco, CA');
  });

  it('collapses two docs on the same calendar day with different time-of-day suffixes into one show', () => {
    const sameDay: ArchiveDoc[] = [
      {
        identifier: 'gd1977-06-10.sbd.midnight.shnf',
        title: 'Grateful Dead Live at Some Venue on 1977-06-10',
        date: '1977-06-10T00:00:00Z',
        venue: 'Some Venue',
        coverage: 'Some City, SC',
        year: '1977',
        downloads: 10,
      },
      {
        identifier: 'gd1977-06-10.aud.noon.shnf',
        title: 'Grateful Dead Live at Some Venue on 1977-06-10',
        date: '1977-06-10T12:00:00Z',
        venue: 'Some Venue',
        coverage: 'Some City, SC',
        year: '1977',
        downloads: 5,
      },
    ];
    const shows1977 = groupDocsIntoShows(sameDay)['1977'];
    expect(shows1977).toHaveLength(1);
    expect(shows1977[0].versions).toHaveLength(2);
    // Emitted date is the primary (highest-downloads) doc's ORIGINAL full string.
    expect(shows1977[0].date).toBe('1977-06-10T00:00:00Z');
  });
});

describe('buildRawDump', () => {
  it('keeps only the raw text fields that are present, keyed by identifier', () => {
    const dump = buildRawDump(docs);
    expect(dump['gd1977-04-27.fm.moore.berger.98429.flac24']).toEqual({
      source: 'FM reel master',
      lineage: 'wnew simulcast>10.5" reel @ 7.5 ips, dolby b technics rs-1506>sony nr-335>hd-p2 24/48>cd w',
      taper: 'Jerry Moore',
      transferer: 'Rob Berger',
    });
    expect(dump['gd1977-02-26.sbd.steve.253.shnf']).toEqual({});
    expect(Object.keys(dump)).toHaveLength(6);
  });
});

describe('buildReport', () => {
  const report = buildReport(groupDocsIntoShows(docs), docs.length);

  it('summarizes totals and the recording-level format distribution', () => {
    expect(report).toContain('Recordings: 6');
    expect(report).toContain('Shows: 4');
    expect(report).toMatch(/\| sbd \| 3 \|/);
    expect(report).toMatch(/\| matrix \| 1 \|/);
    expect(report).toMatch(/\| fm \| 2 \|/);
  });

  it('reports show-level coverage per tag as a percentage of shows', () => {
    // sbd appears on 3 of 4 shows (02-26, 04-23, 05-09) = 75%
    expect(report).toMatch(/\| Soundboard \| 3 \| 75% \|/);
    // miller on 04-23 and 05-09 = 50%
    expect(report).toMatch(/\| Charlie Miller \| 2 \| 50% \|/);
  });

  it('lists identifiers whose format is unknown', () => {
    const withUnknown = [
      ...docs,
      { identifier: 'gd1977-02-17.145591.Goody-pitch-fix.flac1644', title: 'x', date: '1977-02-17T00:00:00Z', year: '1977', downloads: 1 },
    ] as ArchiveDoc[];
    const r = buildReport(groupDocsIntoShows(withUnknown), withUnknown.length);
    expect(r).toContain('## Unknown format (1)');
    expect(r).toContain('gd1977-02-17.145591.Goody-pitch-fix.flac1644');
  });
});

describe('serializeCatalog', () => {
  const byYear: ShowsByYear = groupDocsIntoShows(docs);
  const out = serializeCatalog(byYear);

  it('round-trips through JSON.parse to the original catalog', () => {
    expect(JSON.parse(out)).toEqual(byYear);
  });

  it('writes one show per line (plus year/bracket lines)', () => {
    const lines = out.split('\n').filter(l => l.length > 0);
    const showLines = lines.filter(l => l.startsWith('{"date":'));
    expect(showLines).toHaveLength(4);
  });

  it('has no line starting with whitespace', () => {
    const lines = out.split('\n').filter(l => l.length > 0);
    lines.forEach(line => {
      expect(line).not.toMatch(/^\s/);
    });
  });
});

describe('buildSlimCatalog', () => {
  const byYear = groupDocsIntoShows(docs);
  const slim = buildSlimCatalog(byYear);

  it('keeps the same year keys, in the same order, as the source catalog', () => {
    expect(Object.keys(slim)).toEqual(Object.keys(byYear));
    Object.keys(byYear).forEach(year => {
      expect(slim[year].map(s => s.primaryIdentifier)).toEqual(byYear[year].map(s => s.primaryIdentifier));
    });
  });

  it('each entry has exactly date, primaryIdentifier, and venue', () => {
    slim['1977'].forEach(entry => {
      expect(Object.keys(entry).sort()).toEqual(['date', 'primaryIdentifier', 'venue'].sort());
    });
  });

  it('omits venue when the source show has none', () => {
    const noVenue: ShowsByYear = { 1977: [{ date: '1977-01-01T00:00:00Z', year: '1977', versions: [], primaryIdentifier: 'gd1977-01-01.sbd.x.shnf', title: 'x' }] };
    const slimNoVenue = buildSlimCatalog(noVenue);
    expect(slimNoVenue['1977'][0]).toEqual({ date: '1977-01-01T00:00:00Z', primaryIdentifier: 'gd1977-01-01.sbd.x.shnf' });
    expect(slimNoVenue['1977'][0]).not.toHaveProperty('venue');
  });
});
