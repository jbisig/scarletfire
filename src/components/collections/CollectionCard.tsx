import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Collection, CollectionType } from '../../types/collection.types';
import { COLORS } from '../../constants/theme';

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
}

export function CollectionCard({ variant, onPress, onLongPress }: Props) {
  const isTombstone = variant.kind === 'tombstone';
  const type: CollectionType =
    variant.kind === 'tombstone' ? variant.type : variant.collection.type;
  const name = variant.kind === 'tombstone' ? variant.name : variant.collection.name;
  const typeLabel = type === 'playlist' ? 'Playlist' : 'Show Collection';
  const ownerUsername =
    variant.kind === 'saved' || variant.kind === 'tombstone'
      ? variant.ownerUsername
      : null;

  const subtitle = isTombstone
    ? 'No longer available'
    : variant.kind === 'saved'
    ? `${typeLabel} · @${ownerUsername}`
    : `${typeLabel} · ${variant.collection.itemCount ?? 0} item${
        (variant.collection.itemCount ?? 0) === 1 ? '' : 's'
      }`;

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
      <View style={[styles.thumb, isTombstone && styles.thumbTombstone]}>
        <Ionicons
          name={isTombstone ? 'alert-circle-outline' : type === 'playlist' ? 'musical-notes' : 'albums'}
          size={24}
          color={COLORS.textSecondary}
        />
      </View>
      <View style={styles.meta}>
        <Text
          style={[styles.name, isTombstone && styles.nameTombstone]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <View style={styles.subtitleRow}>
          {variant.kind === 'saved' && (
            <Ionicons
              name="person-circle-outline"
              size={14}
              color={COLORS.textSecondary}
              style={styles.ownerIcon}
            />
          )}
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  tombstoneRow: { opacity: 0.6 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbTombstone: { backgroundColor: COLORS.cardBackground },
  meta: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  nameTombstone: { textDecorationLine: 'line-through' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ownerIcon: { marginRight: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13 },
});
