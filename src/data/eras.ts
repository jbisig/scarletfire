/**
 * The single era taxonomy (replaces ShowsFilterTray FILTER_ERAS and
 * constants/classicShows ERAS). Ranges are inclusive, contiguous, and
 * exhaustive over the band's span, so every show date maps to exactly one
 * era (tested against the real catalog). Boundary calls: "Europe '72"
 * keeps the post-tour 1972 US dates; "Wall of Sound" starts with 1973
 * while the PA was being built.
 */
import type { EraId } from '../constants/tags';

export interface EraDef {
  id: EraId;
  label: string;
  /** inclusive, YYYY-MM-DD */
  start: string;
  /** inclusive, YYYY-MM-DD */
  end: string;
}

export const ERAS: readonly EraDef[] = [
  { id: 'primal', label: 'Primal Dead', start: '1965-01-01', end: '1967-12-31' },
  { id: 'livedead', label: 'Live/Dead', start: '1968-01-01', end: '1969-12-31' },
  { id: 'americana', label: 'Americana', start: '1970-01-01', end: '1972-04-06' },
  { id: 'europe72', label: "Europe '72", start: '1972-04-07', end: '1972-12-31' },
  { id: 'wallofsound', label: 'Wall of Sound', start: '1973-01-01', end: '1974-10-20' },
  { id: 'hiatus', label: 'Hiatus', start: '1974-10-21', end: '1976-06-02' },
  { id: 'return', label: 'Return', start: '1976-06-03', end: '1976-12-31' },
  { id: 'peakkeith', label: 'Peak Keith', start: '1977-01-01', end: '1979-02-17' },
  { id: 'brent', label: 'Brent Era', start: '1979-02-18', end: '1990-07-23' },
  { id: 'vincebruce', label: 'Vince & Bruce', start: '1990-07-24', end: '1992-03-24' },
  { id: 'finalyears', label: 'Final Years', start: '1992-03-25', end: '1995-12-31' },
];

export function eraForDate(date: string): EraId {
  const key = date.slice(0, 10);
  const era = ERAS.find(e => key >= e.start && key <= e.end);
  if (!era) throw new RangeError(`No era for date ${date}`);
  return era.id;
}
