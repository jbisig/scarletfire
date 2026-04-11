import React from 'react';
import { render } from '@testing-library/react-native';
import { ShareCard } from '../../../components/share/ShareCard';
import type { ShareItem } from '../../../services/shareService';

const showItem: ShareItem = {
  kind: 'show',
  showId: 'gd1982',
  date: '1982-08-06',
  venue: 'Sound City Recording Studios',
  tier: 1,
};

const songItem: ShareItem = {
  kind: 'song',
  showId: 'gd1982',
  trackId: 't1',
  trackTitle: "Franklin's Tower",
  trackSlug: 'franklins-tower',
  date: '1982-08-06',
  venue: 'Sound City Recording Studios',
  rating: 1,
};

describe('ShareCard', () => {
  it('renders a show card with date as title and venue as subtitle', () => {
    const { getByText } = render(<ShareCard item={showItem} bgIndex={1} />);
    expect(getByText('08/06/1982')).toBeTruthy();
    expect(getByText('Sound City Recording Studios')).toBeTruthy();
  });

  it('renders a song card with track title as title, plus date and venue', () => {
    const { getByText } = render(<ShareCard item={songItem} bgIndex={2} />);
    expect(getByText("Franklin's Tower")).toBeTruthy();
    expect(getByText('Sound City Recording Studios')).toBeTruthy();
    expect(getByText('08/06/1982')).toBeTruthy();
  });

  it('does not crash when tier is null on a show', () => {
    const nullTierShow: ShareItem = { ...showItem, tier: null };
    const { getByText } = render(<ShareCard item={nullTierShow} bgIndex={1} />);
    expect(getByText('08/06/1982')).toBeTruthy();
  });

  it('does not crash when rating is null on a song', () => {
    const nullRatingSong: ShareItem = { ...songItem, rating: null };
    const { getByText } = render(<ShareCard item={nullRatingSong} bgIndex={1} />);
    expect(getByText("Franklin's Tower")).toBeTruthy();
  });

  it('accepts any bg index without crashing (out-of-range clamps to bg-1)', () => {
    const { getByText } = render(<ShareCard item={showItem} bgIndex={99} />);
    expect(getByText('08/06/1982')).toBeTruthy();
  });
});
