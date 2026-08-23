import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { TrackItem } from '../../components/TrackItem';
import { Track } from '../../types/show.types';

const track: Track = {
  id: 't1', title: 'Scarlet Begonias', format: 'mp3', streamUrl: 'https://x/t1.mp3',
};
const base = { track, isPlaying: false, onPress: jest.fn() };

function render(props: Record<string, unknown>) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => { tree = TestRenderer.create(<TrackItem {...base} {...props} />); });
  return tree;
}

/** The <Text> holding the track title — the run the stars have to sit inside. */
function titleText(tree: TestRenderer.ReactTestRenderer) {
  return tree.root.findAll(
    (node) => node.type === Text && node.props.children?.[0] === track.title,
  )[0];
}

/**
 * The rendered star glyphs. Matched on output rather than on the StarRating
 * component: it is wrapped in React.memo, which findAllByType will not match,
 * and the glyphs are what actually has to end up in the right place.
 *
 * deep:false because a warm Ionicons renders an inner element of the same name,
 * which would otherwise count every star twice.
 */
function starGlyphs(node: TestRenderer.ReactTestInstance) {
  return node.findAll((n: any) => {
    const name = n.type?.displayName ?? n.type?.name;
    return name === 'Icon' && /^star/.test(n.props?.name ?? '');
  }, { deep: false });
}

it('renders a resolved rating as stars', () => {
  const tree = render({ rating: { stars: 2, isUserRating: true } });
  expect(starGlyphs(tree.root)).toHaveLength(2);
});

it('renders no stars when the track is unrated', () => {
  const tree = render({ rating: null });
  expect(starGlyphs(tree.root)).toHaveLength(0);
});

it('puts the stars inside the title text so they follow its last line', () => {
  // As a flex sibling the rating aligned to the *first* baseline, so a title
  // that wrapped left its stars stranded beside line one: "Scarlet Begonias >
  // Fire on the ***" / "Mountain". Nesting them in the title's own run is what
  // carries them to the end of the last line.
  const tree = render({ rating: { stars: 3, isUserRating: false } });
  expect(starGlyphs(titleText(tree))).toHaveLength(3);
});

it('wraps the stars in a Text, not a View', () => {
  // A View would break out of the text run and stop the stars flowing with it,
  // which is the whole point.
  const tree = render({ rating: { stars: 1, isUserRating: false } });
  const glyph = starGlyphs(tree.root)[0];
  const ancestors = tree.root.findAll((n) => n.findAll((c) => c === glyph).length > 0);
  expect(ancestors.some((n) => n.type === Text)).toBe(true);
});

it('gives a rated title one more line, so the stars are never clamped away', () => {
  // The stars share the title's line budget now. At a narrow width a two-line
  // title would push them onto a clamped third line and the rating would just
  // disappear — verified in the browser at 300pt, where all three vanished.
  expect(titleText(render({ rating: { stars: 3, isUserRating: false } })).props.numberOfLines).toBe(3);
  expect(titleText(render({ rating: null })).props.numberOfLines).toBe(2);
});

it('does not make the rating pressable in a track row', () => {
  // Rating happens from the player; in the list the stars are decorative.
  const tree = render({ rating: { stars: 2, isUserRating: true } });
  expect(tree.root.findAllByProps({ testID: 'track-rating-button' })).toHaveLength(0);
});
