import React from 'react';
import { StyleSheet, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { TrackItem } from '../../components/TrackItem';
import { Track } from '../../types/show.types';

/**
 * The row aligns the title and the duration on their text baselines, so the
 * duration sits on the title's first line rather than floating in the gutter
 * of a title that wrapped, and so the two land together despite being
 * different sizes.
 *
 * That only holds while every *other* child is pinned to centre. A View's
 * baseline is its bottom edge, so a button left to align by baseline claims
 * the row's baseline and rows with a heart drift from rows without one —
 * which is exactly why this was reverted once before (1d014e6).
 */

const track: Track = {
  id: 't1', title: 'Scarlet Begonias', format: 'mp3', streamUrl: 'https://x/t1.mp3',
};

function row() {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      <TrackItem
        track={track}
        isPlaying={false}
        onPress={jest.fn()}
        onLongPress={jest.fn()}
        onToggleSave={jest.fn()}
        onAddToPlaylist={jest.fn()}
        isSaved
        rating={{ stars: 3, isUserRating: false }}
      />,
    );
  });
  return tree;
}

it('aligns the row on the text baseline', () => {
  const container = row().root.findAllByType(View)[0];
  expect(StyleSheet.flatten(container.props.style).alignItems).toBe('baseline');
});

it('leaves nothing but the title and the duration aligned by baseline', () => {
  // Any fixed-size child — the heart, the add button, the more button — has to
  // be centred, or its bottom edge becomes the row's baseline.
  const views = row().root.findAllByType(View);
  const sized = views
    .map((v) => StyleSheet.flatten(v.props.style) ?? {})
    .filter((s) => s.width === 28 && s.height === 28);

  expect(sized.length).toBeGreaterThan(0);
  sized.forEach((s) => expect(s.alignSelf).toBe('center'));
});
