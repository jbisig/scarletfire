import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

export const ReorderableScrollView = React.forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => <ScrollView {...props} ref={ref} />,
);

ReorderableScrollView.displayName = 'ReorderableScrollView';
