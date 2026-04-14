import { buildShareUrl, buildShareText } from '../shareService';

describe('shareService — collection', () => {
  const base = {
    kind: 'collection' as const,
    collectionId: 'abc',
    ownerUsername: 'jerry',
    slug: 'best-77',
    name: 'Best 77',
    type: 'show_collection' as const,
    itemCount: 5,
  };

  it('builds a collection URL with bg param', () => {
    expect(buildShareUrl(base, 2)).toMatch(/\/profile\/jerry\/collection\/best-77\?bg=2$/);
  });

  it('builds share text for show collections', () => {
    expect(buildShareText(base)).toBe('Best 77 — 5 shows by @jerry');
  });

  it('builds share text for playlists', () => {
    expect(
      buildShareText({ ...base, type: 'playlist', name: 'Dark Stars', itemCount: 12 }),
    ).toBe('Dark Stars — 12 tracks by @jerry');
  });
});
