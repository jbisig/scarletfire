import { normalizeVenue } from '../venueNormalization';

describe('normalizeVenue', () => {
  it('lowercases, strips punctuation to spaces, collapses whitespace, drops a leading "the"', () => {
    expect(normalizeVenue('The Spectrum')).toBe('spectrum');
    expect(normalizeVenue("Henry J. Kaiser Convention Center")).toBe('henry j kaiser convention center');
    expect(normalizeVenue('Oakland-Alameda County Coliseum')).toBe('oakland alameda county coliseum');
    expect(normalizeVenue('  Fillmore   West ')).toBe('fillmore west');
    expect(normalizeVenue("Winterland Arena")).toBe('winterland arena');
  });
  it('returns empty for missing venues', () => {
    expect(normalizeVenue(undefined)).toBe('');
    expect(normalizeVenue('')).toBe('');
  });
});
