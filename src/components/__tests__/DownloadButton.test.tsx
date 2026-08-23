import { Alert } from 'react-native';

const mockActions = {
  isSupported: true,
  enqueueShow: jest.fn().mockResolvedValue(undefined),
  cancelShow: jest.fn().mockResolvedValue(undefined),
  retryShow: jest.fn().mockResolvedValue(undefined),
  removeShow: jest.fn().mockResolvedValue(undefined),
  removeAll: jest.fn().mockResolvedValue(undefined),
  allowCellular: jest.fn(),
  setWifiOnly: jest.fn(),
};
// DownloadsContext imports downloadManager (native), which imports
// nativeAudioPlayer, whose module scope throws when the native module isn't
// registered (no app host in the Jest env). Stub it so requireActual below
// can load the real store-backed hooks without touching download machinery
// this test never exercises — same stub downloadManager.core.test.ts uses.
jest.mock('../../services/nativeAudioPlayer', () => ({
  __esModule: true,
  default: { setExcludedFromBackup: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../contexts/DownloadsContext', () => {
  const actual = jest.requireActual('../../contexts/DownloadsContext');
  return { ...actual, useOptionalDownloadActions: () => mockActions };
});

const mockNetwork = { isConnected: true, isWifi: true };
jest.mock('../../hooks/useNetworkStatus', () => ({ useNetworkStatus: () => mockNetwork }));

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ShowDetail } from '../../types/show.types';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  setWifiOnly,
  updateDownloadedShow,
  upsertDownloadedShow,
} from '../../services/downloadsStore';
import { DownloadButton } from '../DownloadButton';

const show: ShowDetail = {
  identifier: 'aud', title: 'Cornell', date: '1977-05-08', year: '1977', downloadable: true,
  tracks: [{ id: 'd1t01.mp3', title: 'x', format: 'VBR MP3', streamUrl: 'https://archive.org/download/aud/d1t01.mp3', size: 142 * 1024 * 1024 }],
};

beforeEach(() => {
  jest.clearAllMocks();
  resetDownloadsStoreForTests();
  mockNetwork.isConnected = true;
  mockNetwork.isWifi = true;
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('enqueues directly on Wi-Fi', () => {
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download show'));
  expect(mockActions.enqueueShow).toHaveBeenCalledWith(show, { allowCellular: false });
});

it('asks before downloading over cellular when the guard is on', () => {
  mockNetwork.isWifi = false;
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download show'));
  expect(mockActions.enqueueShow).not.toHaveBeenCalled();
  const [title, message, buttons] = (Alert.alert as jest.Mock).mock.calls[0];
  expect(title).toBe('Download over cellular?');
  expect(message).toContain('142.0 MB');
  (buttons as { text: string; onPress?: () => void }[]).find(b => b.text === 'Download')!.onPress!();
  expect(mockActions.enqueueShow).toHaveBeenCalledWith(show, { allowCellular: true });
});

it('skips the prompt when the guard is off', () => {
  mockNetwork.isWifi = false;
  setWifiOnly(false);
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download show'));
  // Deliberate behavior change per final review: only the cellular prompt's
  // own "Download" button opts a show into cellular; every other enqueue
  // path (guard off, or fully offline) passes allowCellular: false and lets
  // the engine's Wi-Fi guard govern whether the show actually transfers.
  expect(mockActions.enqueueShow).toHaveBeenCalledWith(show, { allowCellular: false });
});

it('enqueues without prompting while fully offline, even with the guard on', () => {
  mockNetwork.isConnected = false;
  mockNetwork.isWifi = false;
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download show'));
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(mockActions.enqueueShow).toHaveBeenCalledWith(show, { allowCellular: false });
});

it('shows the stream-only state for non-downloadable recordings', () => {
  const { getByLabelText } = render(<DownloadButton show={{ ...show, downloadable: false }} identifier="aud" />);
  fireEvent.press(getByLabelText('Streaming only'));
  expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe('Streaming only');
  expect(mockActions.enqueueShow).not.toHaveBeenCalled();
});

it('walks through downloading → complete → failed states', () => {
  upsertDownloadedShow(createDownloadedShow(show, { allowCellular: false, now: 1 }));
  updateDownloadedShow('aud', { status: 'downloading' });
  const { getByLabelText, rerender } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText(/Downloading/));
  expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe('Cancel download?');

  act(() => { updateDownloadedShow('aud', { status: 'complete' }); });
  rerender(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Downloaded'));
  expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe('Remove download?');

  act(() => { updateDownloadedShow('aud', { status: 'failed', error: 'disk-full' }); });
  rerender(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download failed'));
  const [, message, buttons] = (Alert.alert as jest.Mock).mock.calls[2];
  expect(message).toBe('Not enough space on this device.');
  (buttons as { text: string; onPress?: () => void }[]).find(b => b.text === 'Retry')!.onPress!();
  expect(mockActions.retryShow).toHaveBeenCalledWith('aud');
});

it('offers cellular while waiting for Wi-Fi', () => {
  upsertDownloadedShow(createDownloadedShow(show, { allowCellular: false, now: 1 }));
  updateDownloadedShow('aud', { status: 'paused' });
  mockNetwork.isWifi = false;
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Waiting for Wi-Fi'));
  const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
  (buttons as { text: string; onPress?: () => void }[]).find(b => b.text === 'Download over cellular')!.onPress!();
  expect(mockActions.allowCellular).toHaveBeenCalledWith('aud');
});
