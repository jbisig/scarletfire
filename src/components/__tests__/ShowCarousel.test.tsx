import React from 'react';
import { render } from '@testing-library/react-native';
import { ShowCarousel } from '../ShowCarousel';
import { GratefulDeadShow } from '../../types/show.types';

jest.mock('../HorizontalShowCard', () => {
  const { Text } = require('react-native');
  return {
    HorizontalShowCard: ({ show }: { show: { primaryIdentifier: string } }) => (
      <Text>{show.primaryIdentifier}</Text>
    ),
  };
});

const show = (date: string, id: string): GratefulDeadShow => ({
  date, year: date.slice(0, 4), versions: [], primaryIdentifier: id, title: id,
});

const shows = [show('1977-05-08T00:00:00Z', 'cornell')];

describe('ShowCarousel subtitle', () => {
  it('renders the subtitle under the title when provided', () => {
    const { getByText } = render(
      <ShowCarousel
        title="May '77"
        subtitle="The legend-making month"
        shows={shows}
        onShowPress={jest.fn()}
      />,
    );
    getByText("May '77");
    getByText('The legend-making month');
  });

  it('renders no subtitle text when the prop is omitted', () => {
    const { queryByText } = render(
      <ShowCarousel title="Classic Shows" shows={shows} onShowPress={jest.fn()} />,
    );
    expect(queryByText('The legend-making month')).toBeNull();
  });
});
