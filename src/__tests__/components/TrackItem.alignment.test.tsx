import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { TrackItem } from '../../components/TrackItem';
import { Track } from '../../types/show.types';

/**
 * The duration, the heart and the "more" button are one cluster at the right
 * of the row and are centred together. On a title that wrapped to two lines
 * that matters: aligning the duration to the title's first line instead put it
 * above its own neighbours.
 *
 * The row's height is the padding's job — 14 + a 20pt title line + 14 = 48 on
 * both platforms — so no icon button may be taller than that line.
 */

/** Kept in step with styles.title.lineHeight in TrackItem. */
const TITLE_LINE_HEIGHT = 20;

const track: Track = {
  id: 't1', title: 'Scarlet Begonias', format: 'mp3', streamUrl: 'https://x/t1.mp3',
  duration: 1555,
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

/** The heart, the add button, the more button. */
function iconButtons() {
  return row().root.findAllByType(View)
    .map((v) => StyleSheet.flatten(v.props.style) ?? {})
    .filter((s) => s.width === 28 && typeof s.height === 'number');
}

it('centres the row rather than aligning it on a baseline', () => {
  // Baseline alignment moves the duration onto the title's first line, which
  // breaks the cluster apart as soon as a title wraps.
  const container = row().root.findAllByType(View)[0];
  expect(StyleSheet.flatten(container.props.style).alignItems).toBe('center');
});

it('centres the duration, so it tracks the heart and the more button', () => {
  // Anchored to the element that actually renders the duration — several
  // other children are centred too, and matching one of those would pass
  // whatever the duration did.
  const tree = row();
  const durationText = tree.root.findAll(
    (n) => n.type === Text && typeof n.props.children === 'string' && /^\d+:\d\d$/.test(n.props.children),
  )[0];
  expect(durationText).toBeDefined();

  const wrap = tree.root.findAll(
    (n) => n.type === View && n.findAll((c) => c === durationText).length > 0,
  ).pop();

  expect(StyleSheet.flatten(wrap!.props.style).alignSelf).toBe('center');
});

it("keeps the icon buttons within the title's line height", () => {
  // Otherwise a button, not the padding, sets the row height — which is how
  // the two platforms drifted to needing different padding.
  const sized = iconButtons();
  expect(sized.length).toBeGreaterThan(0);
  sized.forEach((s) => expect(s.height).toBeLessThanOrEqual(TITLE_LINE_HEIGHT));
});
