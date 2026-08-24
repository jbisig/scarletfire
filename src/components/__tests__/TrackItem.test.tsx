import React from 'react';
import { act, render } from '@testing-library/react-native';
import { TrackItem } from '../TrackItem';
import { Track } from '../../types/show.types';

const track: Track = {
  id: 'gd77-05-08d1t01.mp3',
  title: 'Scarlet Begonias',
  duration: 512,
  format: 'mp3',
  streamUrl: 'https://example.org/gd77-05-08d1t01.mp3',
};

const baseProps = {
  track,
  isPlaying: false,
  onPress: jest.fn(),
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('TrackItem loading spinner', () => {
  it('does not flash the spinner for fast loads (under 1.5s)', () => {
    const { queryByTestId, rerender } = render(<TrackItem {...baseProps} isLoading />);
    expect(queryByTestId('track-loading')).toBeNull();

    act(() => jest.advanceTimersByTime(1400));
    expect(queryByTestId('track-loading')).toBeNull();

    // Load finishes before the threshold: the spinner never appeared.
    rerender(<TrackItem {...baseProps} isLoading={false} />);
    act(() => jest.advanceTimersByTime(2000));
    expect(queryByTestId('track-loading')).toBeNull();
  });

  it('shows the spinner once loading has taken 1.5s', () => {
    const { queryByTestId } = render(<TrackItem {...baseProps} isLoading />);
    act(() => jest.advanceTimersByTime(1500));
    expect(queryByTestId('track-loading')).not.toBeNull();
  });

  it('hides the spinner as soon as loading ends', () => {
    const { queryByTestId, rerender } = render(<TrackItem {...baseProps} isLoading />);
    act(() => jest.advanceTimersByTime(1500));
    expect(queryByTestId('track-loading')).not.toBeNull();

    rerender(<TrackItem {...baseProps} isLoading={false} />);
    expect(queryByTestId('track-loading')).toBeNull();
  });
});
