import { getDisplayRelease, getOfficialReleasesForDate, DISPLAY_SERIES, pickDisplayRelease, OfficialRelease } from '../officialReleases';

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

describe('pickDisplayRelease', () => {
  // Real dataset only exercises the "Others" tie-break (see the fallback-date comment above),
  // so these synthetic cases cover the "earliest named DISPLAY_SERIES wins" tie-break directly.
  const boxSet: OfficialRelease = { name: 'Box A', series: 'Box Set', showDates: [] };
  const dicksPicks: OfficialRelease = { name: "Dick's Picks Vol. 3", series: "Dick's Picks", showDates: [] };

  it('a named series beats Others, regardless of input order', () => {
    expect(pickDisplayRelease([boxSet, dicksPicks])).toEqual({ release: dicksPicks, more: 1 });
    expect(pickDisplayRelease([dicksPicks, boxSet])).toEqual({ release: dicksPicks, more: 1 });
  });

  it("picks the earliest-ranked named series among several", () => {
    const roadTrips: OfficialRelease = { name: 'RT', series: 'Road Trips', showDates: [] };
    const davesPicks: OfficialRelease = { name: 'DaP 24', series: "Dave's Picks", showDates: [] };
    const europe72: OfficialRelease = { name: 'E72', series: "Europe '72", showDates: [] };
    expect(pickDisplayRelease([roadTrips, davesPicks, europe72])).toEqual({ release: davesPicks, more: 2 });
  });

  it('keeps the first element when ranks tie (stable sort among equal ranks)', () => {
    const studio: OfficialRelease = { name: 'Studio', series: 'Studio Album', showDates: [] };
    const anniversary: OfficialRelease = { name: '50th', series: '50th Anniversary', showDates: [] };
    expect(pickDisplayRelease([studio, anniversary])).toEqual({ release: studio, more: 1 });
  });

  it('returns null for an empty list', () => {
    expect(pickDisplayRelease([])).toBeNull();
  });
});
