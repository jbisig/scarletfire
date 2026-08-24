import React, { useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { GratefulDeadShow } from '../types/show.types';
import { HorizontalShowCard } from './HorizontalShowCard';
import { assignShareBackgrounds } from './share/shareBackgrounds';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface ShowCarouselProps {
  title: string;
  /** Optional one-line description rendered under the title. */
  subtitle?: string;
  shows: GratefulDeadShow[];
  onShowPress: (show: GratefulDeadShow) => void;
  extraData?: unknown;
}

export interface ShowCarouselRef {
  scrollToStart: () => void;
}

export const ShowCarousel = React.memo(forwardRef<ShowCarouselRef, ShowCarouselProps>(function ShowCarousel({
  title,
  subtitle,
  shows,
  onShowPress,
  extraData,
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

  const bgIndexes = useMemo(
    () => assignShareBackgrounds(shows.map(s => s.primaryIdentifier)),
    [shows],
  );

  const renderItem = useCallback(({ item, index }: { item: GratefulDeadShow; index: number }) => (
    <HorizontalShowCard
      show={item}
      onPress={onShowPress}
      bgIndex={bgIndexes[index]}
    />
  ), [onShowPress, bgIndexes]);

  // On desktop web, render a wrapping grid instead of a horizontal scroll
  if (isDesktop) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.webGrid}>
          {shows.map((show, index) => (
            <HorizontalShowCard
              key={show.primaryIdentifier}
              show={show}
              onPress={onShowPress}
              bgIndex={bgIndexes[index]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <FlatList
        ref={flatListRef}
        data={shows}
        keyExtractor={(item) => item.primaryIdentifier}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        extraData={extraData}
        nestedScrollEnabled
      />
    </View>
  );
}));

const ItemSeparator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xxxl,
  },
  header: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.heading4,
  },
  subtitle: {
    // Same 13px the show cards use for their date/location lines.
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: COLORS.textSecondary,
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
