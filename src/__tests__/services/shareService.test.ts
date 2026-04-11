import {
  buildShareUrl,
  buildShareText,
  pickRandomBackground,
  slugifyTrackTitle,
  WEB_ORIGIN,
  type ShareItem,
} from '../../services/shareService';

const showItem: ShareItem = {
  kind: 'show',
  showId: 'gd1982-08-06.sbd.miller.110987',
  date: '1982-08-06',
  venue: 'Sound City Recording Studios',
  tier: 1,
};

const songItem: ShareItem = {
  kind: 'song',
  showId: 'gd1982-08-06.sbd.miller.110987',
  trackId: 't42',
  trackTitle: "Franklin's Tower",
  trackSlug: 'franklins-tower',
  date: '1982-08-06',
  venue: 'Sound City Recording Studios',
  rating: 1,
};

describe('WEB_ORIGIN', () => {
  it('points at the production domain', () => {
    expect(WEB_ORIGIN).toBe('https://www.scarletfire.app');
  });
});

describe('buildShareUrl', () => {
  it('builds a show URL using the show date as the identifier', () => {
    expect(buildShareUrl(showItem, 3)).toBe(
      `${WEB_ORIGIN}/show/1982-08-06?bg=3`
    );
  });

  it('builds a song URL with the track slug as a second segment', () => {
    expect(buildShareUrl(songItem, 5)).toBe(
      `${WEB_ORIGIN}/show/1982-08-06/franklins-tower?bg=5`
    );
  });

  it('clamps bg below 1 to 1', () => {
    expect(buildShareUrl(showItem, 0).endsWith('?bg=1')).toBe(true);
    expect(buildShareUrl(showItem, -2).endsWith('?bg=1')).toBe(true);
  });

  it('clamps bg above 6 to 6', () => {
    expect(buildShareUrl(showItem, 7).endsWith('?bg=6')).toBe(true);
    expect(buildShareUrl(showItem, 999).endsWith('?bg=6')).toBe(true);
  });

  it('clamps non-finite bg to 1', () => {
    expect(buildShareUrl(showItem, NaN).endsWith('?bg=1')).toBe(true);
    expect(buildShareUrl(showItem, Infinity).endsWith('?bg=1')).toBe(true);
  });

  it('rounds fractional bg values', () => {
    expect(buildShareUrl(showItem, 3.4).endsWith('?bg=3')).toBe(true);
    expect(buildShareUrl(showItem, 3.6).endsWith('?bg=4')).toBe(true);
  });
});

describe('buildShareText', () => {
  it('includes the formatted date and venue for a show', () => {
    const text = buildShareText(showItem);
    expect(text).toContain('08/06/1982');
    expect(text).toContain('Sound City Recording Studios');
  });

  it('includes the track title, date, and venue for a song', () => {
    const text = buildShareText(songItem);
    expect(text).toContain("Franklin's Tower");
    expect(text).toContain('08/06/1982');
    expect(text).toContain('Sound City Recording Studios');
  });
});

describe('pickRandomBackground', () => {
  it('always returns an integer in 1..6', () => {
    for (let i = 0; i < 500; i++) {
      const n = pickRandomBackground();
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
    }
  });
});

describe('slugifyTrackTitle', () => {
  it('lowercases and hyphenates simple titles', () => {
    expect(slugifyTrackTitle('Dark Star')).toBe('dark-star');
  });

  it('preserves apostrophes (encodeURIComponent does not encode them)', () => {
    // encodeURIComponent does not encode apostrophes (they are not RFC 3986
    // reserved chars). Matches the behavior of stringifyTrackTitle in
    // src/navigation/webLinking.ts. "Franklin's Tower" becomes "franklin's-tower".
    expect(slugifyTrackTitle("Franklin's Tower")).toBe("franklin's-tower");
  });

  it('collapses multiple spaces into a single hyphen', () => {
    expect(slugifyTrackTitle('Scarlet  Begonias')).toBe('scarlet-begonias');
  });
});
