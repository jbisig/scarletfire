const mockManager = {
  isSupported: true,
  enqueueShow: jest.fn().mockResolvedValue(undefined),
  cancelShow: jest.fn().mockResolvedValue(undefined),
  retryShow: jest.fn().mockResolvedValue(undefined),
  removeShow: jest.fn().mockResolvedValue(undefined),
  removeAll: jest.fn().mockResolvedValue(undefined),
  allowCellular: jest.fn(),
  setWifiOnly: jest.fn(),
  reconcileOnLaunch: jest.fn().mockResolvedValue(undefined),
  start: jest.fn(),
};
// A plain `{ downloadManager: mockManager }` factory return captures
// `mockManager` by value at factory-invocation time. Under this project's
// babel target, `import` calls (and therefore this factory) are hoisted
// above the `const mockManager = {...}` assignment below and `const` is
// down-leveled to `var`, so the captured value would be `undefined`
// (silently — no TDZ to catch it). A getter defers the read to each
// property access, by which time `mockManager` is assigned.
jest.mock('../../services/downloadManager', () => ({
  get downloadManager() { return mockManager; },
}));

import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/registry';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../../services/downloadsStore';
import {
  DownloadsProvider,
  useDownloadActions,
  useDownloads,
  useDownloadSettings,
  useShowDownload,
} from '../DownloadsContext';

const detail = {
  identifier: 'aud', title: 'Cornell', date: '1977-05-08', year: '1977', downloadable: true,
  tracks: [{ id: 'd1t01.mp3', title: 'x', format: 'VBR MP3', streamUrl: 'https://archive.org/download/aud/d1t01.mp3', size: 100 }],
};

function Probe() {
  const { entry, progress } = useShowDownload('aud');
  const all = useDownloads();
  const settings = useDownloadSettings();
  const actions = useDownloadActions();
  return (
    <>
      <Text testID="status">{entry?.status ?? 'none'}</Text>
      <Text testID="fraction">{String(progress.fraction)}</Text>
      <Text testID="count">{String(all.length)}</Text>
      <Text testID="wifi">{String(settings.wifiOnly)}</Text>
      <Text testID="bytes">{String(settings.totalBytes)}</Text>
      <Text testID="supported">{String(actions.isSupported)}</Text>
    </>
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  resetDownloadsStoreForTests();
  await AsyncStorage.clear();
});

it('hydrates the manifest on mount, then reconciles', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify({ version: 1, wifiOnly: false, shows: {} }));
  const { getByTestId } = render(<DownloadsProvider><Probe /></DownloadsProvider>);
  await waitFor(() => expect(getByTestId('wifi').props.children).toBe('false'));
  await waitFor(() => expect(mockManager.reconcileOnLaunch).toHaveBeenCalledTimes(1));
});

it('re-renders subscribers as the store changes', async () => {
  const { getByTestId } = render(<DownloadsProvider><Probe /></DownloadsProvider>);
  await waitFor(() => expect(mockManager.reconcileOnLaunch).toHaveBeenCalled());
  expect(getByTestId('status').props.children).toBe('none');

  act(() => { upsertDownloadedShow(createDownloadedShow(detail, { allowCellular: false, now: 1 })); });
  expect(getByTestId('status').props.children).toBe('queued');
  expect(getByTestId('count').props.children).toBe('1');

  act(() => {
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedShow('aud', { status: 'complete' });
  });
  expect(getByTestId('fraction').props.children).toBe('1');
  expect(getByTestId('bytes').props.children).toBe('100');
  expect(getByTestId('supported').props.children).toBe('true');
});
