import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TrackItem } from '../../components/TrackItem';
import { Track } from '../../types/show.types';

const track: Track = {
  id: 't1', title: 'Scarlet Begonias', format: 'mp3', streamUrl: 'https://x/t1.mp3',
};
const base = { track, isPlaying: false, onPress: jest.fn() };

it('renders a resolved user rating and fires onRatingPress on tap', () => {
  const onRatingPress = jest.fn();
  let tree: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      <TrackItem {...base} rating={{ stars: 2, isUserRating: true }} onRatingPress={onRatingPress} />
    );
  });
  const btn = tree!.root.findByProps({ testID: 'track-rating-button' });
  act(() => { btn.props.onPress({ stopPropagation: jest.fn() }); });
  expect(onRatingPress).toHaveBeenCalledWith(track);
});

it('renders the placeholder when unrated but tappable', () => {
  let tree: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      <TrackItem {...base} rating={null} onRatingPress={jest.fn()} />
    );
  });
  expect(tree!.root.findAllByProps({ testID: 'track-rating-button' }).length).toBeGreaterThan(0);
});

it('renders nothing in the rating slot when unrated and not tappable', () => {
  let tree: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<TrackItem {...base} rating={null} />);
  });
  expect(tree!.root.findAllByProps({ testID: 'track-rating-button' })).toHaveLength(0);
});
