import React from 'react';
import { Platform, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CollectionType,
  LibraryCollectionEntry,
} from '../../types/collection.types';
import { CollectionCard } from './CollectionCard';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const LIST_PADDING_HORIZONTAL = Platform.OS === 'web' ? 16 : SPACING.xxl;

interface Props {
  entries: LibraryCollectionEntry[];
  onEntryPress: (entry: LibraryCollectionEntry) => void;
  onEntryLongPress?: (entry: LibraryCollectionEntry) => void;
  onRemoveTombstone?: (savedId: string) => void;
  onCreate?: (type: CollectionType) => void;
  emptyMessage?: string;
}

function entryType(e: LibraryCollectionEntry): CollectionType {
  if (e.kind === 'tombstone') return e.type;
  return e.collection.type;
}

function entryKey(e: LibraryCollectionEntry): string {
  switch (e.kind) {
    case 'owned':
      return `o-${e.collection.id}`;
    case 'saved':
      return `s-${e.collection.id}`;
    case 'tombstone':
      return `t-${e.savedId}`;
  }
}

function variantForEntry(e: LibraryCollectionEntry) {
  switch (e.kind) {
    case 'owned':
      return { kind: 'owned' as const, collection: e.collection };
    case 'saved':
      return {
        kind: 'saved' as const,
        collection: e.collection,
        ownerUsername: e.ownerUsername,
      };
    case 'tombstone':
      return {
        kind: 'tombstone' as const,
        name: e.name,
        type: e.type,
        ownerUsername: e.ownerUsername,
      };
  }
}

export function CollectionsTab({
  entries,
  onEntryPress,
  onEntryLongPress,
  onRemoveTombstone,
  onCreate,
  emptyMessage = 'No collections yet.',
}: Props) {
  const showEntries = entries.filter((e) => entryType(e) === 'show_collection');
  const playlistEntries = entries.filter((e) => entryType(e) === 'playlist');

  const renderSection = (
    label: string,
    type: CollectionType,
    items: LibraryCollectionEntry[],
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
        items.map((e) => (
          <CollectionCard
            key={entryKey(e)}
            variant={variantForEntry(e)}
            onPress={() => onEntryPress(e)}
            onLongPress={onEntryLongPress ? () => onEntryLongPress(e) : undefined}
            onRemove={e.kind === 'tombstone' && onRemoveTombstone ? () => onRemoveTombstone(e.savedId) : undefined}
          />
        ))
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {renderSection('Show Collections', 'show_collection', showEntries)}
      {renderSection('Playlists', 'playlist', playlistEntries)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 12, paddingBottom: 200 },
  section: { marginBottom: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LIST_PADDING_HORIZONTAL,
    marginBottom: 4,
  },
  headerText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addBtn: { padding: 4 },
  empty: {
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingHorizontal: LIST_PADDING_HORIZONTAL,
    paddingVertical: 12,
  },
});
