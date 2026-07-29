import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { StarPicker } from '../../components/StarPicker';

// NOTE: TestRenderer.create() must be wrapped in act() even for the initial
// render in this repo's React 19 + react-test-renderer setup (see
// StarRating.test.tsx for the same pattern) — otherwise the render doesn't
// flush synchronously and tree.root throws "unmounted test renderer".

it('renders 3 star buttons plus a zero button', () => {
  let tree: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<StarPicker value={null} onSelect={jest.fn()} />);
  });
  expect(tree!.root.findByProps({ accessibilityLabel: 'Rate 1 star' })).toBeTruthy();
  expect(tree!.root.findByProps({ accessibilityLabel: 'Rate 2 stars' })).toBeTruthy();
  expect(tree!.root.findByProps({ accessibilityLabel: 'Rate 3 stars' })).toBeTruthy();
  expect(tree!.root.findByProps({ accessibilityLabel: 'Rate 0 stars' })).toBeTruthy();
});

it('tapping a star selects that count', () => {
  const onSelect = jest.fn();
  let tree: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<StarPicker value={null} onSelect={onSelect} />);
  });
  act(() => { tree.root.findByProps({ accessibilityLabel: 'Rate 2 stars' }).props.onPress(); });
  expect(onSelect).toHaveBeenCalledWith(2);
});

it('tapping zero selects 0', () => {
  const onSelect = jest.fn();
  let tree: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<StarPicker value={3} onSelect={onSelect} />);
  });
  act(() => { tree.root.findByProps({ accessibilityLabel: 'Rate 0 stars' }).props.onPress(); });
  expect(onSelect).toHaveBeenCalledWith(0);
});

it('marks the current value as selected', () => {
  let tree: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<StarPicker value={2} onSelect={jest.fn()} />);
  });
  const btn = tree!.root.findByProps({ accessibilityLabel: 'Rate 2 stars' });
  expect(btn.props.accessibilityState).toEqual({ selected: true });
});
