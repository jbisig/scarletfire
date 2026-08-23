import type { DownloadedShow } from '../../types/downloads.types';
import type { GratefulDeadShow, ShowDetail } from '../../types/show.types';
import { mergeUnsavedDownloads, sortDownloadedFirst } from '../savedShowsDownloads';

function saved(date: string, primaryIdentifier: string, savedAt?: number): GratefulDeadShow {
  return { date, year: date.slice(0, 4), venue: 'Venue', versions: [], primaryIdentifier, title: `Show ${date}`, savedAt };
}

function download(date: string, identifier: string, status: DownloadedShow['status'], requestedAt: number): DownloadedShow {
  const detail: ShowDetail = { identifier, title: `Show ${date}`, date, year: date.slice(0, 4), tracks: [], downloadable: true };
  return {
    identifier,
    date,
    title: `Grateful Dead Live at Barton Hall on ${date}`,
    venue: 'Barton Hall',
    location: 'Ithaca, NY',
    status,
    requestedAt,
    totalBytes: 0,
    allowCellular: false,
    tracks: {},
    detail,
  };
}

describe('mergeUnsavedDownloads', () => {
  it('appends complete downloads whose date is not already saved, as show rows', () => {
    const savedShows = [saved('1977-05-08', 'primary-77')];
    const downloads = [
      download('1977-05-08', 'aud-77', 'complete', 10),   // same date as a saved show → skipped
      download('1972-08-27', 'veneta', 'complete', 20),   // unsaved → appended
      download('1969-02-27', 'dp4', 'downloading', 30),   // not complete → skipped
    ];
    const merged = mergeUnsavedDownloads(savedShows, downloads);
    expect(merged.map(s => s.primaryIdentifier)).toEqual(['primary-77', 'veneta']);
    const row = merged[1];
    expect(row.date).toBe('1972-08-27');
    expect(row.venue).toBe('Barton Hall');
    expect(row.title).toContain('1972-08-27');
    expect(row.savedAt).toBeUndefined();
  });

  it('returns the saved list untouched when there are no downloads', () => {
    const savedShows = [saved('1977-05-08', 'primary-77')];
    expect(mergeUnsavedDownloads(savedShows, [])).toEqual(savedShows);
  });
});

describe('sortDownloadedFirst', () => {
  it('puts downloaded shows first, each group by most recent save', () => {
    const shows = [
      saved('1970-01-01', 'a', 100),  // not downloaded
      saved('1971-01-01', 'b', 300),  // downloaded
      saved('1972-01-01', 'c', 200),  // downloaded
      saved('1973-01-01', 'd', 400),  // not downloaded
    ];
    const downloadedDates = new Set(['1971-01-01', '1972-01-01']);
    const sorted = sortDownloadedFirst(shows, s => downloadedDates.has(s.date.slice(0, 10)), () => undefined);
    expect(sorted.map(s => s.primaryIdentifier)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('falls back to the download time for rows without a savedAt', () => {
    const shows = [
      saved('1971-01-01', 'b', 300),          // downloaded, saved at 300
      saved('1972-01-01', 'c', undefined),    // downloaded, never saved → download time 500
    ];
    const downloadedDates = new Set(['1971-01-01', '1972-01-01']);
    const requestedAt = (s: GratefulDeadShow) => (s.date.startsWith('1972') ? 500 : undefined);
    const sorted = sortDownloadedFirst(shows, s => downloadedDates.has(s.date.slice(0, 10)), requestedAt);
    expect(sorted.map(s => s.primaryIdentifier)).toEqual(['c', 'b']);
  });
});
