import { lookupShowByDate, lookupShowByIdentifier } from '../_lib/showLookup';

describe('lookupShowByDate', () => {
  it('returns show metadata for Cornell 77 (a known tier 1 classic)', () => {
    const result = lookupShowByDate('1977-05-08');
    expect(result).not.toBeNull();
    expect(result?.date).toBe('1977-05-08');
    expect(result?.primaryIdentifier).toBeTruthy();
    expect(result?.venue).toBeTruthy();
    expect(result?.classicTier).toBe(1);
  });

  it('returns metadata with classicTier=null for a date that is not a classic', () => {
    // 1965-11-01 is the first show in shows.json and is not in any classic tier list
    const result = lookupShowByDate('1965-11-01');
    expect(result).not.toBeNull();
    expect(result?.classicTier).toBeNull();
  });

  it('returns null for a date that does not exist in shows.json', () => {
    expect(lookupShowByDate('1800-01-01')).toBeNull();
  });

  it('returns null when the input is malformed', () => {
    expect(lookupShowByDate('not-a-date')).toBeNull();
  });
});

describe('lookupShowByIdentifier', () => {
  it('returns show metadata when given a known archive identifier', () => {
    // Use the primaryIdentifier for Cornell 77 derived from the date lookup
    const result = lookupShowByDate('1977-05-08');
    expect(result).not.toBeNull();
    const identifier = result!.primaryIdentifier;

    const byId = lookupShowByIdentifier(identifier);
    expect(byId).not.toBeNull();
    expect(byId?.date).toBe('1977-05-08');
    expect(byId?.primaryIdentifier).toBe(identifier);
  });

  it('returns null for an unknown identifier', () => {
    expect(lookupShowByIdentifier('gd-fake-identifier-does-not-exist')).toBeNull();
  });
});
