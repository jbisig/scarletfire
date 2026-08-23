import {
  downloadsRootUri,
  showDirUri,
  relativePathFor,
  toAbsoluteUri,
} from '../downloadPaths';

describe('downloadPaths', () => {
  it('roots everything under documentDirectory/downloads/', () => {
    expect(downloadsRootUri()).toBe('file:///mock-documents/downloads/');
    expect(showDirUri('gd1977-05-08.aud')).toBe('file:///mock-documents/downloads/gd1977-05-08.aud/');
  });

  it('builds a relative path with the file name URI-encoded and joins it back', () => {
    const rel = relativePathFor('gd1977-05-08.aud', 'gd77-05-08 d1t01.mp3');
    expect(rel).toBe('downloads/gd1977-05-08.aud/gd77-05-08%20d1t01.mp3');
    expect(toAbsoluteUri(rel)).toBe('file:///mock-documents/downloads/gd1977-05-08.aud/gd77-05-08%20d1t01.mp3');
  });
});
