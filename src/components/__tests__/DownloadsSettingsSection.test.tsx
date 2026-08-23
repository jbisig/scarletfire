const mockActions = {
  isSupported: true,
  enqueueShow: jest.fn(), cancelShow: jest.fn(), retryShow: jest.fn(), removeShow: jest.fn(),
  removeAll: jest.fn().mockResolvedValue(undefined),
  allowCellular: jest.fn(),
  setWifiOnly: jest.fn(),
};
// DownloadsContext imports downloadManager (native), which imports
// nativeAudioPlayer, whose module scope throws when the native module isn't
// registered (no app host in the Jest env). Stub it so requireActual below
// can load the real store-backed hooks without touching download machinery
// this test never exercises — same stub DownloadButton.test.tsx uses.
jest.mock('../../services/nativeAudioPlayer', () => ({
  __esModule: true,
  default: { setExcludedFromBackup: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../contexts/DownloadsContext', () => {
  const actual = jest.requireActual('../../contexts/DownloadsContext');
  return { ...actual, useOptionalDownloadActions: () => mockActions };
});

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../../services/downloadsStore';
import { DownloadsSettingsSection } from '../DownloadsSettingsSection';

beforeEach(() => {
  jest.clearAllMocks();
  resetDownloadsStoreForTests();
});

it('shows usage, toggles Wi-Fi only, and confirms Remove all', () => {
  upsertDownloadedShow(createDownloadedShow(
    { identifier: 'a', title: 't', date: '1977-05-08', year: '1977', downloadable: true,
      tracks: [{ id: 'x.mp3', title: 'x', format: 'VBR MP3', streamUrl: 'https://archive.org/download/a/x.mp3', size: 3 * 1024 * 1024 }] },
    { allowCellular: false, now: 1 },
  ));
  updateDownloadedTrack('a', 'x.mp3', { status: 'complete' });
  updateDownloadedShow('a', { status: 'complete' });

  const { getByText, getByRole, getByLabelText } = render(<DownloadsSettingsSection />);
  getByText('1 show · 3.0 MB');

  fireEvent(getByRole('switch'), 'valueChange', false);
  expect(mockActions.setWifiOnly).toHaveBeenCalledWith(false);

  fireEvent.press(getByLabelText('Remove all downloads'));
  getByText('Remove all downloads?');
  fireEvent.press(getByText('Remove'));
  expect(mockActions.removeAll).toHaveBeenCalledTimes(1);
});

it('disables Remove all when nothing is downloaded', () => {
  const { getByLabelText, getByText } = render(<DownloadsSettingsSection />);
  getByText('No downloads');
  expect(getByLabelText('Remove all downloads').props.accessibilityState?.disabled).toBe(true);
});
