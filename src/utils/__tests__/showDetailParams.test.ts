/**
 * Tests for showDetailParams (Task 18) — the single helper that replaces the
 * hand-built ShowDetail nav-param bundle (identifier, venue, date, location,
 * classicTier) duplicated at 8+ navigate/push call sites. Two of those sites
 * (CollectionDetailScreen, PublicProfileScreen) used to drop fields from the
 * bundle, degrading ShowDetail's first-paint header — this helper always
 * returns the full bundle so that inconsistency can't recur.
 */

const mockResolveShowIdentifier = jest.fn();
jest.mock('../../services/sourceSelection', () => ({
  resolveShowIdentifier: (...args: unknown[]) => mockResolveShowIdentifier(...args),
}));

import { showDetailParams } from '../showDetailParams';
import { GratefulDeadShow } from '../../types/show.types';

function makeShow(overrides: Partial<GratefulDeadShow> = {}): GratefulDeadShow {
  return {
    date: '1977-05-08',
    year: '1977',
    venue: 'Barton Hall',
    location: 'Ithaca, NY',
    versions: [],
    primaryIdentifier: 'gd77-05-08.sbd.hicks',
    title: 'Grateful Dead Live at Barton Hall on 1977-05-08',
    classicTier: 1,
    ...overrides,
  };
}

describe('showDetailParams', () => {
  beforeEach(() => {
    mockResolveShowIdentifier.mockImplementation((show: GratefulDeadShow) => show.primaryIdentifier);
  });

  it('maps a GratefulDeadShow into the full ShowDetail nav-param bundle', () => {
    const show = makeShow();

    expect(showDetailParams(show)).toEqual({
      identifier: 'gd77-05-08.sbd.hicks',
      venue: 'Barton Hall',
      date: '1977-05-08',
      location: 'Ithaca, NY',
      classicTier: 1,
      sourceConstraint: undefined,
    });
  });

  it('resolves the identifier through sourceSelection (preference / pins), not primaryIdentifier blindly', () => {
    mockResolveShowIdentifier.mockReturnValue('gd77-05-08.aud.preferred');
    const show = makeShow();
    expect(showDetailParams(show).identifier).toBe('gd77-05-08.aud.preferred');
    expect(mockResolveShowIdentifier).toHaveBeenCalledWith(show, undefined);
  });

  it('passes a session constraint through and serializes it as a route param', () => {
    const show = makeShow();
    const params = showDetailParams(show, { sourceConstraint: { format: 'sbd', lineage: ['betty'] } });
    expect(mockResolveShowIdentifier).toHaveBeenCalledWith(show, { format: 'sbd', lineage: ['betty'] });
    expect(params.sourceConstraint).toBe('sbd,betty');
  });

  it('passes through undefined optional fields rather than inventing values', () => {
    const show = makeShow({ venue: undefined, location: undefined, classicTier: undefined });

    expect(showDetailParams(show)).toEqual({
      identifier: 'gd77-05-08.sbd.hicks',
      venue: undefined,
      date: '1977-05-08',
      location: undefined,
      classicTier: undefined,
      sourceConstraint: undefined,
    });
  });
});
