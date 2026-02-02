import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { GratefulDeadShow } from '../types/show.types';
import { HorizontalShowCard } from './HorizontalShowCard';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface ShowCarouselProps {
  title: string;
  shows: GratefulDeadShow[];
  onShowPress: (show: GratefulDeadShow) => void;
  extraData?: unknown;
}

export const ShowCarousel = React.memo<ShowCarouselProps>(function ShowCarousel({
  title,
  shows,
  onShowPress,
  extraData,
}) {
  if (shows.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: GratefulDeadShow }) => (
    <HorizontalShowCard
      show={item}
      onPress={onShowPress}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={shows}
        keyExtractor={(item) => item.primaryIdentifier}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        extraData={extraData}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.heading4,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
  },
  separator: {
    width: SPACING.md,
  },
});
