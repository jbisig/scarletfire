import { describeLoadError } from '../../utils/userFacingError';

describe('describeLoadError', () => {
  it('maps network failures to a connection message that names archive.org', () => {
    expect(describeLoadError(new Error('Network request failed'))).toBe(
      "Couldn't reach archive.org. Check your connection and try again.",
    );
    expect(describeLoadError(new TypeError('Failed to fetch'))).toBe(
      "Couldn't reach archive.org. Check your connection and try again.",
    );
    expect(describeLoadError(new Error('getShowDetail: timeout of 10000ms exceeded'))).toBe(
      "Couldn't reach archive.org. Check your connection and try again.",
    );
  });

  it('maps a missing item to a plain not-found message', () => {
    expect(describeLoadError(new Error('getShowDetail: HTTP 404'))).toBe(
      "This recording isn't on archive.org anymore.",
    );
  });

  it('maps server errors to a try-later message', () => {
    expect(describeLoadError(new Error('Server error: HTTP 503'))).toBe(
      'archive.org is having trouble right now. Try again in a moment.',
    );
  });

  it('never leaks a raw technical message for unknown errors', () => {
    expect(describeLoadError(new Error('Unexpected metadata response format'))).toBe(
      "Couldn't load this show.",
    );
    expect(describeLoadError('garbage')).toBe("Couldn't load this show.");
    expect(describeLoadError(undefined)).toBe("Couldn't load this show.");
  });

  it('lets the caller name what failed', () => {
    expect(describeLoadError(new Error('weird'), 'this track')).toBe("Couldn't load this track.");
  });
});
