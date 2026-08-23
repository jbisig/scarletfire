// DownloadsTab imports DownloadsContext (for useShowDownload), which imports
// downloadManager (native), which imports nativeAudioPlayer, whose module
// scope throws when the native module isn't registered (no app host in the
// Jest env). Stub it so the real store-backed hooks load without touching
// download machinery this test never exercises — same stub
// DownloadButton.test.tsx and downloadManager.core.test.ts use.
jest.mock('../../services/nativeAudioPlayer', () => ({
  __esModule: true,
  default: { setExcludedFromBackup: jest.fn().mockResolvedValue(undefined) },
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { DownloadedShow } from '../../types/downloads.types';
import { createDownloadedShow, resetDownloadsStoreForTests, upsertDownloadedShow } from '../../services/downloadsStore';
import { DownloadsTab } from '../DownloadsTab';

function make(identifier: string, status: DownloadedShow['status'], extra: Partial<DownloadedShow> = {}): DownloadedShow {
  const base = createDownloadedShow(
    {
      identifier, title: `Grateful Dead Live at Barton Hall on 1977-05-08`, date: '1977-05-08', year: '1977',
      venue: 'Barton Hall', location: 'Ithaca, NY', downloadable: true,
      tracks: [{ id: 'a.mp3', title: 'a', format: 'VBR MP3', streamUrl: 'https://archive.org/download/x/a.mp3', size: 2 * 1024 * 1024 }],
    },
    { allowCellular: false, now: 1 },
  );
  const show = { ...base, status, ...extra };
  upsertDownloadedShow(show);
  return show;
}

beforeEach(() => resetDownloadsStoreForTests());

it('renders the empty state', () => {
  const { getByText } = render(<DownloadsTab shows={[]} isOffline={false} onPress={jest.fn()} onLongPress={jest.fn()} />);
  getByText(/Shows you download appear here/);
});

it('renders rows with date, venue, size and status, and fires callbacks', () => {
  const complete = make('done', 'complete');
  const failed = make('bad', 'failed', { error: 'network' });
  const paused = make('wait', 'paused');
  const onPress = jest.fn();
  const onLongPress = jest.fn();
  const { getByText, getAllByText } = render(
    <DownloadsTab shows={[complete, failed, paused]} isOffline onPress={onPress} onLongPress={onLongPress} />,
  );
  getByText("You're offline — showing your downloads.");
  expect(getAllByText('05/08/1977 · Barton Hall')).toHaveLength(3);
  expect(getAllByText('2.0 MB')).toHaveLength(3);
  getByText('Failed · Retry');
  getByText('Waiting for Wi-Fi');
  fireEvent.press(getAllByText('05/08/1977 · Barton Hall')[0]);
  expect(onPress).toHaveBeenCalledWith(complete);
  fireEvent(getAllByText('05/08/1977 · Barton Hall')[1], 'longPress');
  expect(onLongPress).toHaveBeenCalledWith(failed);
});
