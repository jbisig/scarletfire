// ShowDetailScreen pulls in the whole player/navigation graph; mock the
// native-only modules it transitively imports so the pure helper can load.
jest.mock('../../services/authService', () => ({
  authService: { onAuthStateChanged: jest.fn(), getClient: jest.fn() },
}));
jest.mock('../../services/nativeAudioPlayer', () => {
  const actual = jest.requireActual('../../services/audioPlayerTypes');
  return {
    __esModule: true,
    default: { addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }) },
    State: actual.State,
    Event: actual.Event,
  };
});

import { dateFromRouteIdentifier } from '../../screens/ShowDetailScreen';

describe('dateFromRouteIdentifier', () => {
  it('passes a date route through', () => {
    expect(dateFromRouteIdentifier('1977-05-08')).toBe('1977-05-08');
  });

  it('reads the date out of 2- and 4-digit-year Archive identifiers', () => {
    expect(dateFromRouteIdentifier('gd77-05-08.sbd.hicks.4982.sbeok.shnf')).toBe('1977-05-08');
    expect(dateFromRouteIdentifier('gd1977-05-08.sbd.cantor.sacks.266.shnf')).toBe('1977-05-08');
  });

  it('returns undefined for anything else', () => {
    expect(dateFromRouteIdentifier('not-a-show')).toBeUndefined();
    expect(dateFromRouteIdentifier('')).toBeUndefined();
  });
});
