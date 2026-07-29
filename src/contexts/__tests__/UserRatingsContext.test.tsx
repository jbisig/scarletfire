import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockUseAuth = jest.fn();
jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockLoadRatings = jest.fn();
const mockSyncRatings = jest.fn();
jest.mock('../../services/userRatingsCloudService', () => ({
  userRatingsCloudService: {
    loadRatings: (...args: unknown[]) => mockLoadRatings(...args),
    syncRatings: (...args: unknown[]) => mockSyncRatings(...args),
  },
}));

jest.mock('../../hooks/useSyncErrorToast', () => ({
  useSyncErrorToast: () => jest.fn(),
}));

import { UserRatingsProvider, useUserRatings, useResolvedShowRating } from '../UserRatingsContext';
import { resetStoreForTests, getUserRatings } from '../../services/userRatingsStore';
import { STORAGE_KEYS } from '../../constants/registry';

const loggedOut = { state: { isAuthenticated: false, user: null, isLoading: false } };
const loggedIn = { state: { isAuthenticated: true, user: { id: 'u1' }, isLoading: false } };

// Test harness component exposing the context API + a resolved rating
let api: ReturnType<typeof useUserRatings>;
let resolved: ReturnType<typeof useResolvedShowRating>;
function Harness({ date }: { date: string }) {
  api = useUserRatings();
  resolved = useResolvedShowRating(date);
  return null;
}

const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  jest.clearAllMocks();
  resetStoreForTests();
  (AsyncStorage.clear as jest.Mock)?.mockClear?.();
  mockUseAuth.mockReturnValue(loggedOut);
  mockLoadRatings.mockResolvedValue({ shows: {}, performances: {} });
  mockSyncRatings.mockResolvedValue(undefined);
});

it('loads persisted ratings from AsyncStorage on mount', async () => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.USER_RATINGS,
    JSON.stringify({ shows: { '1966-01-08': { stars: 2, ratedAt: 1 } }, performances: {} })
  );
  await act(async () => {
    TestRenderer.create(
      <UserRatingsProvider><Harness date="1966-01-08" /></UserRatingsProvider>
    );
  });
  await flush();
  expect(resolved).toEqual({ stars: 2, isUserRating: true });
});

it('setShowRating updates resolution and persists to AsyncStorage', async () => {
  await act(async () => {
    TestRenderer.create(
      <UserRatingsProvider><Harness date="1966-01-08" /></UserRatingsProvider>
    );
  });
  await act(async () => { api.setShowRating('1966-01-08', 3); });
  await flush();
  expect(resolved).toEqual({ stars: 3, isUserRating: true });
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_RATINGS);
  expect(JSON.parse(stored!).shows['1966-01-08'].stars).toBe(3);
});

it('merges cloud ratings on login and pushes the merged result', async () => {
  mockUseAuth.mockReturnValue(loggedIn);
  mockLoadRatings.mockResolvedValue({
    shows: { '1977-05-08': { stars: 1, ratedAt: 100 } },
    performances: {},
  });
  await act(async () => {
    TestRenderer.create(
      <UserRatingsProvider><Harness date="1977-05-08" /></UserRatingsProvider>
    );
  });
  await flush();
  expect(mockLoadRatings).toHaveBeenCalledWith('u1');
  expect(getUserRatings().shows['1977-05-08'].stars).toBe(1);
  expect(mockSyncRatings).toHaveBeenCalled();
});
