import { ERAS, eraForDate } from '../eras';
import { tagLabel } from '../../constants/tags';
import showsData from '../shows.json';
import type { ShowsByYear } from '../../types/show.types';

describe('ERAS', () => {
  it('is contiguous, ordered, and covers 1965-01-01..1995-12-31', () => {
    expect(ERAS[0].start).toBe('1965-01-01');
    expect(ERAS[ERAS.length - 1].end).toBe('1995-12-31');
    for (let i = 1; i < ERAS.length; i++) {
      const prevEnd = new Date(ERAS[i - 1].end + 'T00:00:00Z').getTime();
      const start = new Date(ERAS[i].start + 'T00:00:00Z').getTime();
      expect(start - prevEnd).toBe(24 * 60 * 60 * 1000);
    }
  });

  it('matches the registry ids and labels', () => {
    ERAS.forEach(e => expect(tagLabel(e.id)).toBe(e.label));
    expect(ERAS.map(e => e.id)).toEqual([
      'primal', 'livedead', 'americana', 'europe72', 'wallofsound', 'hiatus', 'return', 'peakkeith', 'brent', 'vincebruce', 'finalyears',
    ]);
  });
});

describe('eraForDate', () => {
  it('lands on the spec boundaries', () => {
    expect(eraForDate('1967-12-31')).toBe('primal');
    expect(eraForDate('1968-01-01')).toBe('livedead');
    expect(eraForDate('1972-04-06')).toBe('americana');
    expect(eraForDate('1972-04-07')).toBe('europe72');
    expect(eraForDate('1973-01-01')).toBe('wallofsound');
    expect(eraForDate('1974-10-20')).toBe('wallofsound');
    expect(eraForDate('1974-10-21')).toBe('hiatus');
    expect(eraForDate('1976-06-03')).toBe('return');
    expect(eraForDate('1977-05-08T00:00:00Z')).toBe('peakkeith');
    expect(eraForDate('1979-02-17')).toBe('peakkeith');
    expect(eraForDate('1979-02-18')).toBe('brent');
    expect(eraForDate('1990-07-23')).toBe('brent');
    expect(eraForDate('1990-07-24')).toBe('vincebruce');
    expect(eraForDate('1992-03-24')).toBe('vincebruce');
    expect(eraForDate('1992-03-25')).toBe('finalyears');
    expect(eraForDate('1995-07-09')).toBe('finalyears');
  });

  it('throws outside the band’s span', () => {
    expect(() => eraForDate('1964-12-31')).toThrow(RangeError);
    expect(() => eraForDate('1996-01-01')).toThrow(RangeError);
  });

  it('gives every catalog show exactly one era', () => {
    const shows = Object.values(showsData as ShowsByYear).flat();
    const counts = new Map<string, number>();
    shows.forEach(s => { const e = eraForDate(s.date); counts.set(e, (counts.get(e) ?? 0) + 1); });
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(shows.length);
    expect(counts.size).toBe(ERAS.length);
  });
});
