import React from 'react';
import { Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Collection, CollectionType } from '../../types/collection.types';
import { formatCount } from '../../utils/formatters';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

type Variant =
  | { kind: 'owned'; collection: Collection }
  | { kind: 'saved'; collection: Collection; ownerUsername: string }
  | {
      kind: 'tombstone';
      name: string;
      type: CollectionType;
      ownerUsername: string;
    };

interface Props {
  variant: Variant;
  onPress: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
}

/**
 * A library row: name over one quiet fact line. The section header already
 * names the type, so the row spends no pixels restating it — no thumb, no
 * chevron, no icon; the same text-first voice as ShowCard and SongCard.
 */
export function CollectionCard({ variant, onPress, onLongPress, onRemove }: Props) {
  const isTombstone = variant.kind === 'tombstone';
  const type: CollectionType =
    variant.kind === 'tombstone' ? variant.type : variant.collection.type;
  const name = variant.kind === 'tombstone' ? variant.name : variant.collection.name;
  const typeLabel = type === 'playlist' ? 'Playlist' : 'Show Collection';
  const ownerUsername =
    variant.kind === 'saved' || variant.kind === 'tombstone'
      ? variant.ownerUsername
      : null;

  const itemNoun = type === 'playlist' ? 'song' : 'show';
  const itemCount = variant.kind !== 'tombstone' ? variant.collection.itemCount ?? 0 : 0;
  const subtitle = isTombstone
    ? 'No longer available'
    : variant.kind === 'saved'
    ? `${formatCount(itemCount, itemNoun)} · @${ownerUsername}`
    : formatCount(itemCount, itemNoun);

  return (
    <TouchableOpacity
      style={[styles.row, isTombstone && styles.tombstoneRow]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${typeLabel}${
        ownerUsername ? `, by ${ownerUsername}` : ''
      }${isTombstone ? ', no longer available' : ''}`}
    >
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {isTombstone && onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeBtn}
          accessibilityLabel="Remove"
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Platform.OS === 'web' ? 16 : SPACING.xxl,
    gap: 12,
  },
  tombstoneRow: { opacity: 0.5 },
  meta: { flex: 1 },
  name: { ...TYPOGRAPHY.heading4 },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeBtn: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
});
