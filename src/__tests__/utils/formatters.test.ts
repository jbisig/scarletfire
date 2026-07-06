/**
 * Tests for formatter utility functions
 */

import {
  formatDate,
  formatDateMMDDYYYY,
  formatDateMDYY,
  formatDuration,
  formatDownloads,
  formatDownloadsLabel,
  getVenueFromShow,
  matchesDateQuery,
} from '../../utils/formatters';

describe('formatDate', () => {
  it('formats ISO date to MM/DD/YYYY', () => {
    expect(formatDate('1977-05-08')).toBe('05/08/1977');
  });

  it('handles different years correctly', () => {
    expect(formatDate('1965-12-31')).toBe('12/31/1965');
    expect(formatDate('1995-07-09')).toBe('07/09/1995');
  });
});

// Characterization tests for the string-split MM/DD/YYYY formatter that
// previously lived in shareService.ts (and was cloned verbatim in
// ShowDetailScreen.tsx). Deliberately does NOT use date-fns / parseLocalDate
// like formatDate above — it's a plain string split, kept byte-identical to
// its prior implementations. See Task 14.
describe('formatDateMMDDYYYY', () => {
  it('formats a plain ISO date as MM/DD/YYYY', () => {
    expect(formatDateMMDDYYYY('1982-08-06')).toBe('08/06/1982');
  });

  it('handles full ISO timestamps by using only the date portion', () => {
    expect(formatDateMMDDYYYY('1982-08-06T00:00:00Z')).toBe('08/06/1982');
  });

  it('handles different years correctly', () => {
    expect(formatDateMMDDYYYY('1965-12-31')).toBe('12/31/1965');
  });
});

// Characterization tests for the inline "browser tab title" short-date
// variant previously written inline in ShowDetailScreen.tsx's loadShowDetail
// (M/D/YY, no leading zeros, 2-digit year). See Task 14.
describe('formatDateMDYY', () => {
  it('strips leading zeros from month and day, and uses a 2-digit year', () => {
    expect(formatDateMDYY('1982-08-06')).toBe('8/6/82');
  });

  it('handles double-digit month/day unchanged', () => {
    expect(formatDateMDYY('1977-12-31')).toBe('12/31/77');
  });

  it('handles full ISO timestamps by using only the date portion', () => {
    expect(formatDateMDYY('1982-08-06T00:00:00Z')).toBe('8/6/82');
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

describe('formatDownloads', () => {
  it('returns "0" for zero, undefined, or NaN', () => {
    expect(formatDownloads(0)).toBe('0');
    expect(formatDownloads(undefined)).toBe('0');
    expect(formatDownloads(NaN)).toBe('0');
  });

  it('returns the plain number below 1000', () => {
    expect(formatDownloads(999)).toBe('999');
  });

  it('formats thousands with an uppercase K tier', () => {
    expect(formatDownloads(1000)).toBe('1.0K');
    expect(formatDownloads(1234)).toBe('1.2K');
  });

  it('formats millions with an uppercase M tier', () => {
    expect(formatDownloads(1200000)).toBe('1.2M');
  });
});

// Characterization tests for the descriptive "<n> downloads" label previously
// defined locally in ShowDetailScreen.tsx. Deliberately differs from
// formatDownloads above: empty string (not '0') for falsy input, lowercase
// 'k' tier, and NO millions tier (ShowDetailScreen never saw counts that
// high, so the historical output for 7-figure counts is an untruncated
// "<n/1000>k downloads" string). See Task 14.
describe('formatDownloadsLabel', () => {
  it('returns an empty string for zero, undefined, or NaN', () => {
    expect(formatDownloadsLabel(0)).toBe('');
    expect(formatDownloadsLabel(undefined)).toBe('');
    expect(formatDownloadsLabel(NaN)).toBe('');
  });

  it('returns "<n> downloads" below 1000', () => {
    expect(formatDownloadsLabel(999)).toBe('999 downloads');
  });

  it('formats thousands with a lowercase k tier', () => {
    expect(formatDownloadsLabel(1000)).toBe('1.0k downloads');
  });

  it('has no millions tier — divides by 1000 regardless of magnitude', () => {
    expect(formatDownloadsLabel(1200000)).toBe('1200.0k downloads');
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
