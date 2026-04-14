import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Collection } from '../../types/collection.types';
import { COLORS } from '../../constants/theme';

interface Props {
  collection: Collection;
  onPress: () => void;
  onLongPress?: () => void;
}

export function CollectionCard({ collection, onPress, onLongPress }: Props) {
  const typeLabel = collection.type === 'playlist' ? 'Playlist' : 'Show Collection';
  const count = collection.itemCount ?? 0;
  const countLabel = `${count} item${count === 1 ? '' : 's'}`;
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${collection.name}, ${typeLabel}, ${countLabel}`}
    >
      <View style={styles.thumb}>
        <Ionicons
          name={collection.type === 'playlist' ? 'musical-notes' : 'albums'}
          size={24}
          color={COLORS.textSecondary}
        />
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>{collection.name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {typeLabel} · {countLabel}
        </Text>
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
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
});
