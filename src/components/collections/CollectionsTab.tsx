import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Collection, CollectionType } from '../../types/collection.types';
import { CollectionCard } from './CollectionCard';
import { COLORS } from '../../constants/theme';

interface Props {
  collections: Collection[];
  onCardPress: (c: Collection) => void;
  onCardLongPress?: (c: Collection) => void;
  onCreate?: (type: CollectionType) => void;
  emptyMessage?: string;
}

export function CollectionsTab({
  collections,
  onCardPress,
  onCardLongPress,
  onCreate,
  emptyMessage = 'No collections yet.',
}: Props) {
  const showCollections = collections.filter((c) => c.type === 'show_collection');
  const playlists = collections.filter((c) => c.type === 'playlist');

  const renderSection = (
    label: string,
    type: CollectionType,
    items: Collection[],
  ) => (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{label}</Text>
        {onCreate && (
          <TouchableOpacity
            onPress={() => onCreate(type)}
            accessibilityRole="button"
            accessibilityLabel={`New ${label}`}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        items.map((c) => (
          <CollectionCard
            key={c.id}
            variant={{ kind: 'owned', collection: c }}
            onPress={() => onCardPress(c)}
            onLongPress={onCardLongPress ? () => onCardLongPress(c) : undefined}
          />
        ))
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {renderSection('Show Collections', 'show_collection', showCollections)}
      {renderSection('Playlists', 'playlist', playlists)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 200 },
  section: { marginTop: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  headerText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  addBtn: { padding: 4 },
  empty: {
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
