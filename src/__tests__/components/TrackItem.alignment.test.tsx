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

/** Kept in step with styles.title.lineHeight in TrackItem. */
const TITLE_LINE_HEIGHT = 20;

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

/** The heart, the add button, the more button. */
function iconButtons() {
  return row().root.findAllByType(View)
    .map((v) => StyleSheet.flatten(v.props.style) ?? {})
    .filter((s) => s.width === 28 && typeof s.height === 'number');
}

it('leaves nothing but the title and the duration aligned by baseline', () => {
  // A fixed-size child left to align by baseline puts its bottom edge on the
  // row's baseline and drags the text with it.
  const sized = iconButtons();
  expect(sized.length).toBeGreaterThan(0);
  sized.forEach((s) => expect(s.alignSelf).toBe('center'));
});

it('keeps the icon buttons within the title\'s line height', () => {
  // Baseline-aligned text sits flush to the top of the line, so a button
  // taller than the line sets the row's height, pushes the text up and leaves
  // itself sitting low — 4.2px out, which is what "the three dot is too low"
  // was. The row's height is the padding's job.
  const sized = iconButtons();
  expect(sized.length).toBeGreaterThan(0);
  sized.forEach((s) => expect(s.height).toBeLessThanOrEqual(TITLE_LINE_HEIGHT));
});
