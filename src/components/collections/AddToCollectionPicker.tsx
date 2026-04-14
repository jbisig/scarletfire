import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollections } from '../../contexts/CollectionsContext';
import { CreateCollectionModal } from './CreateCollectionModal';
import {
  CollectionType,
  CollectionItemMetadata,
} from '../../types/collection.types';
import { collectionsService } from '../../services/collectionsService';
import { COLORS } from '../../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  type: CollectionType;
  itemIdentifier: string;
  itemMetadata: CollectionItemMetadata;
}

export function AddToCollectionPicker({
  visible,
  onClose,
  type,
  itemIdentifier,
  itemMetadata,
}: Props) {
  const { collections, addItem, removeItem } = useCollections();
  const filtered = useMemo(
    () => collections.filter((c) => c.type === type),
    [collections, type],
  );
  const [createVisible, setCreateVisible] = useState(false);
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const entries = await Promise.all(
        filtered.map(async (c) => {
          const items = await collectionsService.fetchCollectionItems(c.id);
          return [c.id, items.some((i) => i.itemIdentifier === itemIdentifier)] as const;
        }),
      );
      setMemberships(Object.fromEntries(entries));
    })();
  }, [visible, filtered, itemIdentifier]);

  const toggle = async (collectionId: string) => {
    if (memberships[collectionId]) {
      await removeItem(collectionId, itemIdentifier);
      setMemberships((prev) => ({ ...prev, [collectionId]: false }));
    } else {
      await addItem(collectionId, itemIdentifier, itemMetadata);
      setMemberships((prev) => ({ ...prev, [collectionId]: true }));
    }
  };

  const title = type === 'playlist' ? 'Add to Playlist' : 'Add to Collection';
  const newLabel = type === 'playlist' ? 'New Playlist' : 'New Collection';

  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      animationType={isWeb ? 'fade' : 'slide'}
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.backdrop, isWeb && styles.backdropWeb]}
        onPress={isWeb ? onClose : undefined}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={[styles.card, isWeb && styles.cardWeb]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No {type === 'playlist' ? 'playlists' : 'collections'} yet.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => toggle(item.id)}>
                <Text style={styles.rowText}>{item.name}</Text>
                {memberships[item.id] && (
                  <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.newBtn} onPress={() => setCreateVisible(true)}>
            <Ionicons name="add" size={20} color={COLORS.accent} />
            <Text style={styles.newText}>{newLabel}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>

      <CreateCollectionModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        initialType={type}
        onCreated={async (createdId) => {
          await addItem(createdId, itemIdentifier, itemMetadata);
          setMemberships((prev) => ({ ...prev, [createdId]: true }));
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  backdropWeb: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
  },
  cardWeb: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '70%',
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: { color: COLORS.textPrimary, fontSize: 15 },
  empty: { color: COLORS.textSecondary, paddingHorizontal: 16, paddingVertical: 12 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  newText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
});
