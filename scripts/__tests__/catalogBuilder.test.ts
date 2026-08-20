import { groupDocsIntoShows, buildRawDump, buildReport } from '../lib/catalogBuilder';
import sample from './fixtures/search-1977-sample.json';
import type { ArchiveDoc } from '../../src/types/archive.types';

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
