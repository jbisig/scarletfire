import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SourcePreferencePicker } from '../../components/SourcePreferencePicker';

it('renders the five options with labels and descriptions and marks the selected one', async () => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => { tree = TestRenderer.create(<SourcePreferencePicker value="matrix" onChange={jest.fn()} />); });
  const radios = tree.root.findAllByProps({ accessibilityRole: 'radio' }, { deep: false });
  expect(radios).toHaveLength(5);
  expect(radios.map(r => r.props.accessibilityState.selected)).toEqual([false, false, false, true, false]);
  const text = tree.root.findAllByType(Text).map(t => React.Children.toArray(t.props.children).join(''));
  expect(text).toContain('Most Popular');
  expect(text).toContain('Soundboard and audience blended together');
});

it('reports the tapped value', async () => {
  const onChange = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => { tree = TestRenderer.create(<SourcePreferencePicker value="popular" onChange={onChange} />); });
  await act(async () => { tree.root.findByProps({ testID: 'source-pref-fm' }).props.onPress(); });
  expect(onChange).toHaveBeenCalledWith('fm');
});
