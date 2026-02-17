import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { GratefulDeadShow } from '../types/show.types';
import { HorizontalShowCard } from './HorizontalShowCard';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface ShowCarouselProps {
  title: string;
  shows: GratefulDeadShow[];
  onShowPress: (show: GratefulDeadShow) => void;
  extraData?: unknown;
  color?: 'blue' | 'red';
}

export interface ShowCarouselRef {
  scrollToStart: () => void;
}

export const ShowCarousel = React.memo(forwardRef<ShowCarouselRef, ShowCarouselProps>(function ShowCarousel({
  title,
  shows,
  onShowPress,
  extraData,
  color,
}, ref) {
  const flatListRef = useRef<FlatList>(null);
  const { isDesktop } = useResponsive();

  useImperativeHandle(ref, () => ({
    scrollToStart: () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
  }));

  if (shows.length === 0) {
    return null;
  }

  const renderItem = ({ item, index }: { item: GratefulDeadShow; index: number }) => (
    <HorizontalShowCard
      show={item}
      onPress={onShowPress}
      index={index}
      color={color}
    />
  );

  // On desktop web, render a wrapping grid instead of a horizontal scroll
  if (isDesktop) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.webGrid}>
          {shows.map((show, index) => (
            <HorizontalShowCard
              key={show.primaryIdentifier}
              show={show}
              onPress={onShowPress}
              index={index}
              color={color}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        ref={flatListRef}
        data={shows}
        keyExtractor={(item) => item.primaryIdentifier}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        extraData={extraData}
        nestedScrollEnabled
      />
    </View>
  );
}));

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
  webGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
});
