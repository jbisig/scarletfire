import { getDisplayRelease, getOfficialReleasesForDate, DISPLAY_SERIES } from '../officialReleases';

describe('getDisplayRelease', () => {
  it('returns null when a date has no releases', () => {
    expect(getDisplayRelease('1966-01-08')).toBeNull();
  });
  it('prefers the earliest DISPLAY_SERIES series and counts the rest', () => {
    // None of ['1977-05-08','1972-08-27','1973-11-11','1990-03-29'] have >=2 releases in
    // OFFICIAL_RELEASES (verified via a node -e scan). '1969-01-26' is the only date with
    // >=2 releases (Live/Dead + Aoxomoxoa 50th Anniversary), so it's used here instead.
    const multi = ['1977-05-08', '1972-08-27', '1973-11-11', '1990-03-29'].find(d => getOfficialReleasesForDate(d).length >= 2) ?? '1969-01-26';
    const picked = getDisplayRelease(multi)!;
    const all = getOfficialReleasesForDate(multi);
    const rank = (s: string) => { const i = DISPLAY_SERIES.indexOf(s); return i === -1 ? DISPLAY_SERIES.indexOf('Others') : i; };
    expect(Math.min(...all.map(r => rank(r.series)))).toBe(rank(picked.release.series));
    expect(picked.more).toBe(all.length - 1);
  });
});
