import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ShareTray } from '../../../components/share/ShareTray.native';
import * as shareNative from '../../../services/shareService.native';
import type { ShareItem } from '../../../services/shareService';

jest.mock('../../../services/shareService.native', () => ({
  shareToCopyLink: jest.fn(),
  shareToWhatsApp: jest.fn(),
  shareToInstagramStory: jest.fn(),
  shareToMessages: jest.fn(),
}));

const songItem: ShareItem = {
  kind: 'song',
  showId: 'gd1982',
  trackId: 't1',
  trackTitle: "Franklin's Tower",
  trackSlug: 'franklins-tower',
  date: '1982-08-06',
  venue: 'Sound City',
  rating: 1,
};

const showItem: ShareItem = {
  kind: 'show',
  showId: 'gd1982',
  date: '1982-08-06',
  venue: 'Sound City',
  tier: 2,
};

describe('ShareTray (native)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all four destination buttons when an item is present', () => {
    const { getByLabelText } = render(
      <ShareTray item={songItem} onClose={jest.fn()} />
    );
    expect(getByLabelText('Copy link')).toBeTruthy();
    expect(getByLabelText('WhatsApp')).toBeTruthy();
    expect(getByLabelText('Instagram')).toBeTruthy();
    expect(getByLabelText('Messages')).toBeTruthy();
  });

  it('renders the "Share this song" headline for a song item', () => {
    const { getByText } = render(
      <ShareTray item={songItem} onClose={jest.fn()} />
    );
    expect(getByText('Share this song')).toBeTruthy();
  });

  it('renders the "Share this show" headline for a show item', () => {
    const { getByText } = render(
      <ShareTray item={showItem} onClose={jest.fn()} />
    );
    expect(getByText('Share this show')).toBeTruthy();
  });

  it('invokes shareToCopyLink with the current item when Copy link tapped', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <ShareTray item={songItem} onClose={onClose} />
    );
    fireEvent.press(getByLabelText('Copy link'));
    expect(shareNative.shareToCopyLink).toHaveBeenCalledTimes(1);
    expect((shareNative.shareToCopyLink as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({ item: songItem })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes shareToWhatsApp when WhatsApp tapped', () => {
    const { getByLabelText } = render(
      <ShareTray item={songItem} onClose={jest.fn()} />
    );
    fireEvent.press(getByLabelText('WhatsApp'));
    expect(shareNative.shareToWhatsApp).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when item is null', () => {
    const { queryByLabelText } = render(
      <ShareTray item={null} onClose={jest.fn()} />
    );
    expect(queryByLabelText('Copy link')).toBeNull();
  });
});
