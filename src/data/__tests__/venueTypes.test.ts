import { VENUE_TYPES, INTERNATIONAL_VENUES } from '../venueTypes';
import { FESTIVAL_DATES, UNVERIFIED_FESTIVAL_DATES } from '../festivalDates';
import { normalizeVenue } from '../../utils/venueNormalization';
import showsData from '../shows.json';
import type { ShowsByYear } from '../../types/show.types';

const PHYSICAL = new Set(['theater', 'arena', 'stadium', 'amphitheater']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

describe('VENUE_TYPES (generated)', () => {
  it('keys are already-normalized venue strings and every entry is a known type', () => {
    for (const [key, entry] of Object.entries(VENUE_TYPES)) {
      expect(normalizeVenue(key)).toBe(key);
      expect(PHYSICAL.has(entry.type)).toBe(true);
      expect(['high', 'medium', 'low']).toContain(entry.confidence);
    }
  });

  it('covers the big rooms and most catalog shows', () => {
    expect(VENUE_TYPES['madison square garden'].type).toBe('arena');
    expect(VENUE_TYPES['winterland arena'].type).toBe('arena');
    expect(VENUE_TYPES['fillmore east'].type).toBe('theater');
    expect(VENUE_TYPES['red rocks amphitheatre'].type).toBe('amphitheater');
    expect(VENUE_TYPES['robert f kennedy stadium'].type).toBe('stadium');
    const shows = Object.values(showsData as ShowsByYear).flat();
    const typed = shows.filter(s => VENUE_TYPES[normalizeVenue(s.venue)]).length;
    expect(typed / shows.length).toBeGreaterThan(0.8);
  });

  it('flags international venues from the curated list', () => {
    expect(INTERNATIONAL_VENUES.has('wembley arena')).toBe(true);
    expect(INTERNATIONAL_VENUES.has('gizah sound and light theater')).toBe(true);
    expect(INTERNATIONAL_VENUES.has('madison square garden')).toBe(false);
    expect(INTERNATIONAL_VENUES.size).toBeGreaterThanOrEqual(40);
  });
});

describe('FESTIVAL_DATES', () => {
  it('has valid dates, sources, and only high/medium confidence', () => {
    expect(FESTIVAL_DATES.length).toBeGreaterThanOrEqual(15);
    const seen = new Set<string>();
    FESTIVAL_DATES.forEach(e => {
      expect(e.date).toMatch(DATE_RE);
      expect(seen.has(e.date)).toBe(false); seen.add(e.date);
      expect(e.source.length).toBeGreaterThan(3);
      expect(['high', 'medium']).toContain(e.confidence);
    });
    UNVERIFIED_FESTIVAL_DATES.forEach(e => expect(e.confidence).toBe('low'));
    expect(FESTIVAL_DATES.some(e => e.date === '1969-08-16')).toBe(true);   // Woodstock
    expect(FESTIVAL_DATES.some(e => e.date === '1973-07-28')).toBe(true);   // Watkins Glen
  });
});
