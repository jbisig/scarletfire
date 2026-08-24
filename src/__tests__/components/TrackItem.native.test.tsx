// Native rows used to mount the web hover-reveal add/save buttons at
// opacity 0 — invisible, but still 28pt tap targets and still announced by
// VoiceOver as "Add to playlist" / "Add to favorites". On native they must
// not exist; the visible "more" button is the way in. jest-expo runs as iOS.
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ActivityIndicator } from 'react-native';
import { TrackItem } from '../../components/TrackItem';
import { Track } from '../../types/show.types';

const track: Track = {
  id: 't1', title: 'Scarlet Begonias', format: 'mp3', streamUrl: 'https://x/t1.mp3', duration: 381,
};
const base = { track, isPlaying: false, onPress: jest.fn() };

function render(props: Partial<React.ComponentProps<typeof TrackItem>>) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<TrackItem {...base} {...props} />);
  });
  return tree;
}

const labels = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root.findAll(n => typeof n.props.accessibilityLabel === 'string').map(n => n.props.accessibilityLabel as string);

it('does not mount phantom add/save buttons on native when the track is unsaved', () => {
  const tree = render({ onToggleSave: jest.fn(), onAddToPlaylist: jest.fn(), isSaved: false });
  expect(labels(tree)).not.toContain('Add to playlist');
  expect(labels(tree)).not.toContain('Add to favorites');
});

it('still shows the saved heart on native so the user can un-save', () => {
  const tree = render({ onToggleSave: jest.fn(), isSaved: true });
  expect(labels(tree)).toContain('Remove from favorites');
});

it('exposes a visible, labelled "more" button that opens the row menu', () => {
  const onLongPress = jest.fn();
  const tree = render({ onLongPress, onToggleSave: jest.fn(), onAddToPlaylist: jest.fn() });
  const more = tree.root.findByProps({ testID: 'track-more-button' });
  expect(more.props.accessibilityLabel).toBe('More options for Scarlet Begonias');
  act(() => { more.props.onPress({ stopPropagation: jest.fn() }); });
  expect(onLongPress).toHaveBeenCalledWith(track);
});

it('announces loading immediately but holds the spinner until the load has dragged (1.5s)', () => {
  jest.useFakeTimers();
  try {
    const tree = render({ isLoading: true, isPlaying: true });
    // Announced right away for screen readers…
    const row = tree.root.findByProps({ accessibilityHint: 'Double tap to play this track' });
    expect(row.props.accessibilityLabel).toMatch(/^Loading\. Scarlet Begonias/);
    // …but no visual spinner yet: most tracks start in well under a second,
    // and a spinner that flashes for a few frames reads as jank.
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(0);

    act(() => { jest.advanceTimersByTime(1500); });
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
  } finally {
    jest.useRealTimers();
  }
});
