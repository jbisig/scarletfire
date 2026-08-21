import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TagCategorySection } from '../../components/ShowsFilterTray/TagCategorySection';
import { TAG_CATEGORIES, tagsInCategory, TagId } from '../../constants/tags';

const venue = TAG_CATEGORIES.find(c => c.id === 'venueType')!;
const tags = tagsInCategory('venueType');
const counts = Object.fromEntries(tags.map(t => [t.id, t.id === 'festival' ? 0 : 12])) as Record<TagId, number>;
const allText = (tree: TestRenderer.ReactTestRenderer) => tree.root.findAllByType(Text).map(t => React.Children.toArray(t.props.children).join(''));

const render = async (over: Partial<React.ComponentProps<typeof TagCategorySection>> = {}) => {
  const onToggleTag = jest.fn(); const onToggleExpanded = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <TagCategorySection category={venue} tags={tags} selected={['arena']} counts={counts} expanded onToggleExpanded={onToggleExpanded} onToggleTag={onToggleTag} {...over} />
      </SafeAreaProvider>,
    );
  });
  return { tree, onToggleTag, onToggleExpanded };
};

it('renders the header with an active count and the pills with counts when expanded', async () => {
  const { tree } = await render();
  const text = allText(tree);
  expect(text).toContain('Venue');
  expect(text.some(t => t.includes('1 selected'))).toBe(true);
  expect(tree.root.findAllByProps({ testID: 'tag-pill-arena' }, { deep: false })).toHaveLength(1);
  expect(text.some(t => t === '12' || t.includes('12'))).toBe(true);
});

it('disables zero-count unselected pills and reports toggles', async () => {
  const { tree, onToggleTag } = await render();
  const festival = tree.root.findByProps({ testID: 'tag-pill-festival' });
  // findByProps stops at the FilterPill composite, so assert its own prop
  expect(festival.props.isDisabled).toBe(true);
  expect(tree.root.findByProps({ testID: 'tag-pill-arena' }).props.isDisabled).toBe(false);
  await act(async () => { tree.root.findByProps({ testID: 'tag-pill-stadium' }).props.onPress(); });
  expect(onToggleTag).toHaveBeenCalledWith('stadium');
});

it('hides the pills when collapsed and toggles via the header', async () => {
  const { tree, onToggleExpanded } = await render({ expanded: false });
  expect(tree.root.findAllByProps({ testID: 'tag-pill-arena' }, { deep: false })).toHaveLength(0);
  await act(async () => { tree.root.findByProps({ testID: 'tag-section-venueType' }).props.onPress(); });
  expect(onToggleExpanded).toHaveBeenCalledTimes(1);
});
