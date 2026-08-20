import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockUseAuth = jest.fn();
jest.mock('../AuthContext', () => ({ useAuth: () => mockUseAuth() }));

const mockLoadPrefs = jest.fn();
const mockSyncPrefs = jest.fn();
jest.mock('../../services/userPreferencesCloudService', () => ({
  userPreferencesCloudService: {
    loadPrefs: (...args: unknown[]) => mockLoadPrefs(...args),
    syncPrefs: (...args: unknown[]) => mockSyncPrefs(...args),
  },
}));
jest.mock('../../hooks/useSyncErrorToast', () => ({ useSyncErrorToast: () => jest.fn() }));

import { SourcePrefsProvider, useSourcePrefs, useSourcePreference, usePendingNudge, useActivePin } from '../SourcePrefsContext';
import { resetStoreForTests, getSourcePrefs, EMPTY_SOURCE_PREFS } from '../../services/sourcePrefsStore';
import { STORAGE_KEYS } from '../../constants/registry';

const loggedOut = { state: { isAuthenticated: false, user: null, isLoading: false } };
const loggedIn = { state: { isAuthenticated: true, user: { id: 'u1' }, isLoading: false } };

let api: ReturnType<typeof useSourcePrefs>;
let preference: ReturnType<typeof useSourcePreference>;
let nudge: ReturnType<typeof usePendingNudge>;
let pin: ReturnType<typeof useActivePin>;
function Harness({ date }: { date: string }) {
  api = useSourcePrefs();
  preference = useSourcePreference();
  nudge = usePendingNudge();
  pin = useActivePin(date);
  return null;
}

const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(async () => {
  resetStoreForTests();
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue(loggedOut);
  mockLoadPrefs.mockResolvedValue(EMPTY_SOURCE_PREFS);
  mockSyncPrefs.mockResolvedValue(undefined);
});

it('loads persisted prefs from AsyncStorage on mount (normalizing)', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.SOURCE_PREFS, JSON.stringify({ preference: 'aud', preferenceSetAt: 1, pins: {}, nudgeAnswers: { sbd: 'maybe' } }));
  await act(async () => { TestRenderer.create(<SourcePrefsProvider><Harness date="1977-05-08" /></SourcePrefsProvider>); });
  await flush();
  expect(preference).toBe('aud');
  expect(getSourcePrefs().nudgeAnswers).toEqual({});
});

it('setPreference / pin update hooks and persist to AsyncStorage', async () => {
  await act(async () => { TestRenderer.create(<SourcePrefsProvider><Harness date="1977-05-08" /></SourcePrefsProvider>); });
  await flush();
  await act(async () => { api.setPreference('matrix'); api.pin('1977-05-08', 'mtx', 'matrix'); });
  await flush();
  expect(preference).toBe('matrix');
  expect(pin?.identifier).toBe('mtx');
  const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.SOURCE_PREFS))!);
  expect(stored.preference).toBe('matrix');
  expect(stored.pins['1977-05-08'].identifier).toBe('mtx');
  await act(async () => { api.clearPin('1977-05-08'); });
  expect(pin).toBeNull();
});

it('exposes the pending nudge and clears it when answered', async () => {
  await act(async () => { TestRenderer.create(<SourcePrefsProvider><Harness date="1977-05-08" /></SourcePrefsProvider>); });
  await flush();
  await act(async () => {
    api.pin('1977-05-08', 'a', 'aud');
    api.pin('1977-05-09', 'b', 'aud');
    api.pin('1972-08-27', 'c', 'aud');
  });
  expect(nudge).toBe('aud');
  await act(async () => { api.answerNudge('aud', 'yes'); api.setPreference('aud'); });
  expect(nudge).toBeNull();
  expect(preference).toBe('aud');
});

it('merges cloud prefs on login (newer wins) and pushes the merged result', async () => {
  mockUseAuth.mockReturnValue(loggedIn);
  mockLoadPrefs.mockResolvedValue({
    preference: 'fm', preferenceSetAt: 50,
    pins: { '1977-05-08': { identifier: 'cloud', format: 'fm', pinnedAt: 50 } },
    nudgeAnswers: {},
  });
  await AsyncStorage.setItem(STORAGE_KEYS.SOURCE_PREFS, JSON.stringify({
    preference: 'sbd', preferenceSetAt: 10,
    pins: { '1977-05-08': { identifier: 'local', format: 'sbd', pinnedAt: 10 }, '1972-08-27': { identifier: 'l2', format: 'sbd', pinnedAt: 20 } },
    nudgeAnswers: {},
  }));
  await act(async () => { TestRenderer.create(<SourcePrefsProvider><Harness date="1977-05-08" /></SourcePrefsProvider>); });
  await flush(); await flush(); await flush();
  expect(mockLoadPrefs).toHaveBeenCalledWith('u1');
  expect(preference).toBe('fm');
  expect(pin?.identifier).toBe('cloud');
  expect(getSourcePrefs().pins['1972-08-27'].identifier).toBe('l2');
  expect(mockSyncPrefs).toHaveBeenCalledWith('u1', expect.objectContaining({ preference: 'fm' }));
});
