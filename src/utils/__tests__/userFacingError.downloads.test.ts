import { describeDownloadError, describeLoadError } from '../userFacingError';

describe('describeLoadError offline branch', () => {
  it('names the Downloads list when the device is offline', () => {
    expect(describeLoadError(new Error('Network request failed'), 'this show', { offline: true })).toBe(
      "You're offline. Downloaded shows are in Saved → Downloads.",
    );
  });

  it('keeps the existing copy when online', () => {
    expect(describeLoadError(new Error('Network request failed'))).toBe(
      "Couldn't reach archive.org. Check your connection and try again.",
    );
    expect(describeLoadError(new Error('HTTP 404'), 'this show', { offline: false })).toBe(
      "This recording isn't on archive.org anymore.",
    );
  });
});

describe('describeDownloadError', () => {
  it('maps each error code to copy', () => {
    expect(describeDownloadError('disk-full')).toBe('Not enough space on this device.');
    expect(describeDownloadError('not-found')).toBe("This recording isn't on archive.org anymore.");
    expect(describeDownloadError('network')).toBe("Couldn't reach archive.org. Check your connection and try again.");
    expect(describeDownloadError('unknown')).toBe("Couldn't download this show.");
    expect(describeDownloadError(undefined)).toBe("Couldn't download this show.");
  });
});
