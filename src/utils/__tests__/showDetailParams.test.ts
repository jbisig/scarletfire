/**
 * Tests for showDetailParams (Task 18) — the single helper that replaces the
 * hand-built ShowDetail nav-param bundle (identifier, venue, date, location,
 * classicTier) duplicated at 8+ navigate/push call sites. Two of those sites
 * (CollectionDetailScreen, PublicProfileScreen) used to drop fields from the
 * bundle, degrading ShowDetail's first-paint header — this helper always
 * returns the full bundle so that inconsistency can't recur.
 */

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
  it('maps a GratefulDeadShow into the full ShowDetail nav-param bundle', () => {
    const show = makeShow();

    expect(showDetailParams(show)).toEqual({
      identifier: 'gd77-05-08.sbd.hicks',
      venue: 'Barton Hall',
      date: '1977-05-08',
      location: 'Ithaca, NY',
      classicTier: 1,
    });
  });

  it('uses primaryIdentifier as the identifier param', () => {
    const show = makeShow({ primaryIdentifier: 'gd66-02-12.aud' });
    expect(showDetailParams(show).identifier).toBe('gd66-02-12.aud');
  });

  it('passes through undefined optional fields rather than inventing values', () => {
    const show = makeShow({ venue: undefined, location: undefined, classicTier: undefined });

    expect(showDetailParams(show)).toEqual({
      identifier: 'gd77-05-08.sbd.hicks',
      venue: undefined,
      date: '1977-05-08',
      location: undefined,
      classicTier: undefined,
    });
  });
});
