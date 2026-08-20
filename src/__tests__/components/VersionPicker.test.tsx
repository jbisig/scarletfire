import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VersionPicker } from '../../components/VersionPicker';
import type { RecordingVersion } from '../../types/show.types';

const VERSIONS: RecordingVersion[] = [
  {
    identifier: 'gd1977-05-08.sbd.cantor.sacks.266.shnf',
    downloads: 98069,
    format: 'sbd',
    lineage: ['betty', 'lowgen'],
    avgRating: 4.89,
    numReviews: 36,
    provenance: 'SBD → Master Reel → DAT',
    taper: 'Betty Cantor',
    transferrer: 'Darrin Sacks',
  },
  {
    identifier: 'gd1977-05-08.mtx.dan.29511.flac16',
    downloads: 1200,
    format: 'matrix',
    lineage: [],
  },
];

const allText = (tree: TestRenderer.ReactTestRenderer): string[] =>
  tree.root.findAllByType(Text).map(t => React.Children.toArray(t.props.children).join(''));

const render = async (props: Partial<React.ComponentProps<typeof VersionPicker>> = {}) => {
  const onVersionChange = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    // VersionPicker reads useSafeAreaInsets; nothing in the Jest setup mounts
    // a SafeAreaProvider, so supply one with fixed metrics.
    tree = TestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <VersionPicker
          versions={VERSIONS}
          selectedVersion={VERSIONS[0].identifier}
          onVersionChange={onVersionChange}
          {...props}
        />
      </SafeAreaProvider>,
    );
  });
  return { tree, onVersionChange };
};

// findByProps / findAllByProps match non-deep (a TouchableOpacity is matched
// once, not again via the host View it renders) — the same reason the
// RatingTray tests use them. Avoid root.findAll(predicate) with testIDs.
const openPicker = async (tree: TestRenderer.ReactTestRenderer) => {
  const trigger = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  await act(async () => { trigger.props.onPress(); });
};

it('shows the selected recording\'s format label in the pill', async () => {
  const { tree } = await render();
  expect(allText(tree)).toContain('Soundboard');
  const trigger = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  expect(trigger.props.accessibilityLabel).toBe('Recording source: Soundboard');
});

it('lists every recording with format, lineage chips, rating, views, and provenance', async () => {
  const { tree } = await render();
  await openPicker(tree);
  const text = allText(tree);
  expect(text).toContain('Betty Board');
  expect(text).toContain('Low Generation');
  expect(text).toContain('Matrix');
  expect(text.some(t => t.includes('4.9') && t.includes('36'))).toBe(true);
  expect(text).toContain('SBD → Master Reel → DAT');
  expect(text.some(t => t.includes('Taper: Betty Cantor'))).toBe(true);
});

it('omits the rating when a recording has none', async () => {
  const { tree } = await render({ selectedVersion: VERSIONS[1].identifier });
  await openPicker(tree);
  // findAllByProps (plural), called with just the props object, defaults to a
  // *deep* search (unlike findByProps, which forces { deep: false }) — RN's
  // TouchableOpacity forwards testID through several nested layers (an inner
  // composite, Animated(View), View), so an undeep call would over-match.
  // Pass { deep: false } explicitly to get exactly one match per row.
  const rows = tree.root.findAllByProps(
    { testID: 'version-row-gd1977-05-08.mtx.dan.29511.flac16' },
    { deep: false },
  );
  expect(rows).toHaveLength(1);
  const rowText = rows[0].findAllByType(Text).map(t => React.Children.toArray(t.props.children).join(''));
  expect(rowText.some(t => t.includes('★'))).toBe(false);
  expect(rowText).toContain('Matrix');
});

it('calls onVersionChange with the tapped identifier', async () => {
  const { tree, onVersionChange } = await render();
  await openPicker(tree);
  const row = tree.root.findByProps({ testID: 'version-row-gd1977-05-08.mtx.dan.29511.flac16' });
  await act(async () => { row.props.onPress(); });
  expect(onVersionChange).toHaveBeenCalledWith('gd1977-05-08.mtx.dan.29511.flac16');
});
