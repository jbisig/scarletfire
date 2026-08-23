/**
 * Folds offline downloads into the Saved screen's Shows tab (there is no
 * separate Downloads segment): complete downloads that aren't already saved
 * appear as ordinary show rows, and the "Downloaded" sort puts downloaded
 * shows first.
 */
import type { DownloadedShow } from '../types/downloads.types';
import type { GratefulDeadShow } from '../types/show.types';
import { compareBySavedAt } from './sortComparators';

function dateKey(date: string): string {
  return date.slice(0, 10);
}

/** A DownloadedShow rendered as a Shows-tab row (never persisted). */
function toShowRow(download: DownloadedShow): GratefulDeadShow {
  return {
    date: download.date,
    year: download.date.slice(0, 4),
    venue: download.venue,
    location: download.location,
    versions: [],
    // The exact downloaded recording: the resolver treats it as an implicit
    // pin, so opening this row lands on the recording that is on disk.
    primaryIdentifier: download.identifier,
    title: download.title,
  };
}

/**
 * Saved shows plus any COMPLETE download whose date has no saved show yet —
 * every download stays reachable from the Shows tab, hearted or not.
 */
export function mergeUnsavedDownloads(
  savedShows: GratefulDeadShow[],
  downloads: DownloadedShow[],
): GratefulDeadShow[] {
  const complete = downloads.filter(d => d.status === 'complete');
  if (complete.length === 0) return savedShows;
  const savedDates = new Set(savedShows.map(s => dateKey(s.date)));
  const unsaved = complete.filter(d => !savedDates.has(dateKey(d.date))).map(toShowRow);
  return unsaved.length === 0 ? savedShows : [...savedShows, ...unsaved];
}

/**
 * The "Downloaded" sort: downloaded shows first, then the rest; both groups
 * by most recent save, falling back to the download time for rows that were
 * never saved. Sorts a copy-in-place like the sibling comparator call sites.
 */
export function sortDownloadedFirst(
  shows: GratefulDeadShow[],
  isDownloaded: (show: GratefulDeadShow) => boolean,
  downloadRequestedAt: (show: GratefulDeadShow) => number | undefined,
): GratefulDeadShow[] {
  return shows.sort((a, b) => {
    const da = isDownloaded(a);
    const db = isDownloaded(b);
    if (da !== db) return da ? -1 : 1;
    return compareBySavedAt(
      a.savedAt ?? downloadRequestedAt(a),
      b.savedAt ?? downloadRequestedAt(b),
      'newest',
    );
  });
}
