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
// Two lines of name + the count line + padding. The show cards are taller
// because they carry artwork; these carry only text, so matching their
// height just made dead space.
const CARD_HEIGHT = 88;

function formatCountLabel(c: Collection): string {
  const n = c.itemCount ?? 0;
  const noun = c.type === 'playlist' ? 'song' : 'show';
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/**
 * One card for both the horizontal list and the desktop grid. Name and
 * count only: the section title already says what these are, so a per-card
 * icon restated it, and the count is the one fact that helps you choose.
 */
function CollectionCard({
  collection,
  onPress,
}: {
  collection: Collection;
  onPress: (collectionId: string) => void;
}) {
  const count = formatCountLabel(collection);
  const saves =
    collection.saveCount !== undefined
      ? ` · ${collection.saveCount} save${collection.saveCount === 1 ? '' : 's'}`
      : '';
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(collection.id)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${collection.name}, ${count}${saves}`}
    >
      <Text style={styles.cardName} numberOfLines={2}>
        {collection.name}
      </Text>
      <Text style={styles.cardCount} numberOfLines={1}>
        {count}
        {saves}
      </Text>
    </TouchableOpacity>
  );
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
      <CollectionCard collection={item} onPress={onCollectionPress} />
    ),
    [onCollectionPress],
  );

  const createCard = onCreatePress ? (
    <TouchableOpacity
      style={[styles.card, styles.createCard]}
      onPress={onCreatePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={createLabel}
    >
      <View style={styles.createRow}>
        <Ionicons name="add" size={18} color={COLORS.textPrimary} />
        <Text style={styles.cardName} numberOfLines={2}>
          {createLabel}
        </Text>
      </View>
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
                <CollectionCard key={c.id} collection={c} onPress={onCollectionPress} />
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
    // Text anchors top-left, in line with the show cards beside it.
    justifyContent: 'flex-start',
    gap: SPACING.xs,
  },
  createCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  // Same type as the show cards beside these (HorizontalShowCard.venue / .date).
  cardName: {
    ...TYPOGRAPHY.label,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  cardCount: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
});
