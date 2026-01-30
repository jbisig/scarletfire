/**
 * Tests for formatter utility functions
 */

import { formatDate, formatDuration, getVenueFromShow, matchesDateQuery } from '../../utils/formatters';

describe('formatDate', () => {
  it('formats ISO date to MM/DD/YYYY', () => {
    expect(formatDate('1977-05-08')).toBe('05/08/1977');
  });

  it('handles different years correctly', () => {
    expect(formatDate('1965-12-31')).toBe('12/31/1965');
    expect(formatDate('1995-07-09')).toBe('07/09/1995');
  });
});

describe('formatDuration', () => {
  it('formats seconds into MM:SS', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('returns --:-- for zero, undefined, or invalid values', () => {
    expect(formatDuration(0)).toBe('--:--');
    expect(formatDuration(undefined)).toBe('--:--');
    expect(formatDuration(-1)).toBe('--:--');
    expect(formatDuration(NaN)).toBe('--:--');
  });
});

describe('getVenueFromShow', () => {
  it('extracts venue from title using regex pattern', () => {
    const show = { title: 'Grateful Dead Live at Winterland on 1977-05-08' };
    expect(getVenueFromShow(show)).toBe('Winterland');
  });

  it('falls back to venue property when title does not match pattern', () => {
    const show = { title: 'Some Random Title', venue: 'Fillmore West' };
    expect(getVenueFromShow(show)).toBe('Fillmore West');
  });

  it('returns venue when no title is present', () => {
    const show = { venue: 'Fillmore West' };
    expect(getVenueFromShow(show)).toBe('Fillmore West');
  });

  it('returns Unknown Venue when both are missing or title does not match', () => {
    expect(getVenueFromShow({})).toBe('Unknown Venue');
    expect(getVenueFromShow({ title: 'No pattern match here' })).toBe('Unknown Venue');
  });
});

describe('matchesDateQuery', () => {
  const date = '1977-05-08';

  it('matches full ISO date', () => {
    expect(matchesDateQuery(date, '1977-05-08')).toBe(true);
  });

  it('matches MM/DD/YY format', () => {
    expect(matchesDateQuery(date, '5/8/77')).toBe(true);
    expect(matchesDateQuery(date, '05/08/77')).toBe(true);
  });

  it('matches MM-DD-YYYY format', () => {
    expect(matchesDateQuery(date, '5-8-1977')).toBe(true);
  });

  it('matches partial year', () => {
    expect(matchesDateQuery(date, '1977')).toBe(true);
  });

  it('returns false for non-matching dates', () => {
    expect(matchesDateQuery(date, '1978-05-08')).toBe(false);
    expect(matchesDateQuery(date, '5/9/77')).toBe(false);
  });
});
