import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ProgressRing } from '../ProgressRing';

describe('ProgressRing', () => {
  it('renders its children centered in the ring', () => {
    const { getByText } = render(
      <ProgressRing size={26} thickness={2.5} progress={0.4} color="#E54C4F" trackColor="#333333">
        <Text>child</Text>
      </ProgressRing>,
    );
    getByText('child');
  });

  it('renders one arc piece below half progress and two above', () => {
    const { queryAllByTestId, rerender } = render(
      <ProgressRing size={26} thickness={2.5} progress={0} color="#E54C4F" trackColor="#333333" />,
    );
    expect(queryAllByTestId('progress-ring-arc')).toHaveLength(0);
    rerender(
      <ProgressRing size={26} thickness={2.5} progress={0.4} color="#E54C4F" trackColor="#333333" />,
    );
    expect(queryAllByTestId('progress-ring-arc')).toHaveLength(1);
    rerender(
      <ProgressRing size={26} thickness={2.5} progress={0.9} color="#E54C4F" trackColor="#333333" />,
    );
    expect(queryAllByTestId('progress-ring-arc')).toHaveLength(2);
  });

  it('clamps out-of-range progress instead of crashing', () => {
    const { queryAllByTestId, rerender } = render(
      <ProgressRing size={26} thickness={2.5} progress={-0.5} color="#E54C4F" trackColor="#333333" />,
    );
    expect(queryAllByTestId('progress-ring-arc')).toHaveLength(0);
    rerender(
      <ProgressRing size={26} thickness={2.5} progress={1.7} color="#E54C4F" trackColor="#333333" />,
    );
    expect(queryAllByTestId('progress-ring-arc')).toHaveLength(2);
  });
});
