import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Collection, CollectionType } from '../types/collection.types';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';

interface CollectionCarouselProps {
  title: string;
  collections: Collection[];
  type: CollectionType;
  onCollectionPress: (collectionId: string) => void;
  onCreatePress?: () => void;
}

const CARD_WIDTH = LAYOUT.horizontalCardWidth;
const CARD_HEIGHT = LAYOUT.horizontalCardHeight;

function formatCountLabel(c: Collection): string {
  const n = c.itemCount ?? 0;
  const noun = c.type === 'playlist' ? 'song' : 'show';
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

export const CollectionCarousel = React.memo(function CollectionCarousel({
  title,
  collections,
  type,
  onCollectionPress,
  onCreatePress,
}: CollectionCarouselProps) {
  const { isDesktop } = useResponsive();
  const isEmpty = collections.length === 0;
  const isPlaylist = type === 'playlist';
  const createLabel = isPlaylist ? 'New Playlist' : 'New Show Collection';

  const renderCollection = useCallback(
    ({ item }: { item: Collection }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onCollectionPress(item.id)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        <View style={styles.cardIcon}>
          <Ionicons
            name={item.type === 'playlist' ? 'musical-notes' : 'albums'}
            size={28}
            color={COLORS.textSecondary}
          />
        </View>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.cardCount}>
          {formatCountLabel(item)}
          {item.saveCount !== undefined
            ? ` · ${item.saveCount} save${item.saveCount === 1 ? '' : 's'}`
            : ''}
        </Text>
      </TouchableOpacity>
    ),
    [onCollectionPress],
  );

  const createCard = onCreatePress ? (
    <TouchableOpacity
      style={styles.card}
      onPress={onCreatePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={createLabel}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="add" size={28} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.cardName} numberOfLines={2}>
        {createLabel}
      </Text>
    </TouchableOpacity>
  ) : null;

  if (isEmpty && !createCard) return null;

  if (isDesktop) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.grid}>
          {isEmpty
            ? createCard
            : collections.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.card}
                  onPress={() => onCollectionPress(c.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons
                      name={c.type === 'playlist' ? 'musical-notes' : 'albums'}
                      size={28}
                      color={COLORS.textSecondary}
                    />
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {c.name}
                  </Text>
                  <Text style={styles.cardCount}>
                    {formatCountLabel(c)}
                    {c.saveCount !== undefined
                      ? ` · ${c.saveCount} save${c.saveCount === 1 ? '' : 's'}`
                      : ''}
                  </Text>
                </TouchableOpacity>
              ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {isEmpty ? (
        <View style={styles.emptyRow}>{createCard}</View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={c => c.id}
          renderItem={renderCollection}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ItemSeparator}
        />
      )}
    </View>
  );
});

const ItemSeparator = () => <View style={styles.separator} />;

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
  emptyRow: {
    paddingHorizontal: SPACING.xl,
  },
  separator: {
    width: SPACING.md,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  cardCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
});
