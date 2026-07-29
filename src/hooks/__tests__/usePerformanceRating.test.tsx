import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockUsePlayer = jest.fn();
jest.mock('../../contexts/PlayerContext', () => ({
  usePlayer: () => mockUsePlayer(),
}));
// UserRatingsContext (for useUserRatingsVersion) transitively imports
// AuthContext -> authService.native.ts -> GoogleSignin, which isn't
// available in the test environment. Mock it out (same pattern as
// RatingOverlay.test.tsx) since usePerformanceRating never calls useAuth.
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ state: { isAuthenticated: false, user: null, isLoading: false } }),
}));
jest.mock('../../services/userRatingsCloudService', () => ({
  userRatingsCloudService: {
    loadRatings: jest.fn().mockResolvedValue({ shows: {}, performances: {} }),
    syncRatings: jest.fn().mockResolvedValue(undefined),
  },
}));

import { usePerformanceRating } from '../usePerformanceRating';
import { setPerformanceUserRating, resetStoreForTests } from '../../services/userRatingsStore';

let result: ReturnType<typeof usePerformanceRating>;
function Harness() {
  result = usePerformanceRating();
  return null;
}

beforeEach(() => {
  resetStoreForTests();
  jest.clearAllMocks();
});

it('resolves the system rating for the current track', () => {
  mockUsePlayer.mockReturnValue({
    isRadioMode: false,
    currentRadioTrack: null,
    state: {
      currentTrack: { id: 't1', title: 'Playing In The Band' },
      currentShow: { identifier: 'gd72', date: '1972-08-27' },
    },
  });
  act(() => { TestRenderer.create(<Harness />); });
  expect(result).toEqual({ stars: 3, isUserRating: false }); // famous tier-1 version
});

it('user override wins and re-renders on change', () => {
  mockUsePlayer.mockReturnValue({
    isRadioMode: false,
    currentRadioTrack: null,
    state: {
      currentTrack: { id: 't1', title: 'Playing In The Band' },
      currentShow: { identifier: 'gd72', date: '1972-08-27' },
    },
  });
  act(() => { TestRenderer.create(<Harness />); });
  act(() => { setPerformanceUserRating('Playing In The Band', '1972-08-27', 1); });
  expect(result).toEqual({ stars: 1, isUserRating: true });
});

it('radio mode resolves via the radio track performance (user override applies)', () => {
  mockUsePlayer.mockReturnValue({
    isRadioMode: true,
    currentRadioTrack: {
      performance: { songTitle: 'Grateful Dead - Dark Star', showDate: '1969-02-27', showIdentifier: 'x', tier: 1 },
    },
    state: { currentTrack: null, currentShow: null },
  });
  act(() => { TestRenderer.create(<Harness />); });
  expect(result).toEqual({ stars: 3, isUserRating: false });
  act(() => { setPerformanceUserRating('Dark Star', '1969-02-27', 0); });
  expect(result).toEqual({ stars: 0, isUserRating: true });
});
