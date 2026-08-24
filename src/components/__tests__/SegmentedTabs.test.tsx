import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SegmentedTabs, SegmentedTabItem } from '../SegmentedTabs';

type Key = 'shows' | 'songs' | 'collections';
const tabs: SegmentedTabItem<Key>[] = [
  { key: 'shows', label: 'Shows' },
  { key: 'songs', label: 'Songs' },
  { key: 'collections', label: 'Collections' },
];

describe('SegmentedTabs', () => {
  it('renders every tab label inside a single tablist container', () => {
    const { getByText, getByTestId } = render(
      <SegmentedTabs tabs={tabs} activeTab="shows" onTabChange={jest.fn()} />,
    );
    getByTestId('segmented-tabs');
    getByText('Shows');
    getByText('Songs');
    getByText('Collections');
  });

  it('renders a sliding highlight thumb', () => {
    const { getByTestId } = render(
      <SegmentedTabs tabs={tabs} activeTab="songs" onTabChange={jest.fn()} />,
    );
    getByTestId('segmented-tabs-thumb');
  });

  it('reports the active tab as selected and fires onTabChange on press', () => {
    const onTabChange = jest.fn();
    const { getByLabelText } = render(
      <SegmentedTabs tabs={tabs} activeTab="shows" onTabChange={onTabChange} />,
    );
    expect(getByLabelText('Shows tab').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Songs tab').props.accessibilityState.selected).toBe(false);

    fireEvent.press(getByLabelText('Songs tab'));
    expect(onTabChange).toHaveBeenCalledWith('songs');
  });
});
