import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollections } from '../../contexts/CollectionsContext';
import { CreateCollectionForm } from './CreateCollectionForm';
import {
  CollectionType,
  CollectionItemMetadata,
} from '../../types/collection.types';
import { collectionsService } from '../../services/collectionsService';
import { authService } from '../../services/authService';
import { BottomSheet } from '../BottomSheet';
import { COLORS, TYPOGRAPHY, FONTS } from '../../constants/theme';

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

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!visible) {
      setCreateVisible(false);
      return;
    }
    let cancelled = false;
    (async () => {
      // One JOIN query per open, replacing the N+1 `fetchCollectionItems` loop.
      const userId =
        filtered[0]?.userId ??
        (await authService.getClient().auth.getUser()).data.user?.id;
      if (!userId) return;
      try {
        const ids = await collectionsService.fetchCollectionIdsContainingItem(
          userId,
          itemIdentifier,
        );
        if (cancelled) return;
        setMemberships(
          Object.fromEntries(filtered.map((c) => [c.id, ids.has(c.id)])),
        );
      } catch {
        // Ignore — toggles will still work, just no pre-populated checkmarks.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, filtered, itemIdentifier]);

  const toggle = (collectionId: string) => {
    const wasIn = !!memberships[collectionId];
    setMemberships((prev) => ({ ...prev, [collectionId]: !wasIn }));
    const op = wasIn
      ? removeItem(collectionId, itemIdentifier)
      : addItem(collectionId, itemIdentifier, itemMetadata);
    op.catch(() => {
      setMemberships((prev) => ({ ...prev, [collectionId]: wasIn }));
    });
  };

  const title = type === 'playlist' ? 'Add to Playlist' : 'Add to Collection';
  const newLabel = type === 'playlist' ? 'New Playlist' : 'New Show Collection';

  const handleNewPress = () => {
    setCreateVisible(true);
  };

  const handleClose = () => {
    setCreateVisible(false);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} cardStyle={styles.card}>
      {createVisible ? (
        <CreateCollectionForm
          type={type}
          onCancel={() => setCreateVisible(false)}
          onCreated={async (createdId) => {
            await addItem(createdId, itemIdentifier, itemMetadata);
            setMemberships((prev) => ({ ...prev, [createdId]: true }));
            setCreateVisible(false);
          }}
        />
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            {isWeb && (
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No {type === 'playlist' ? 'playlists' : 'collections'} yet.
              </Text>
            }
            renderItem={({ item }) => {
              const selected = !!memberships[item.id];
              return (
                <Pressable
                  onPress={() => toggle(item.id)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  {({ pressed }) => (
                    <>
                      <Text
                        style={[
                          styles.rowText,
                          (selected || pressed) && styles.rowTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <View style={styles.checkSlot}>
                        {(selected || pressed) && (
                          <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                        )}
                      </View>
                    </>
                  )}
                </Pressable>
              );
            }}
          />

          <TouchableOpacity style={styles.newBtn} onPress={handleNewPress}>
            <Ionicons name="add" size={20} color={COLORS.accent} />
            <Text style={styles.newText}>{newLabel}</Text>
          </TouchableOpacity>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { ...TYPOGRAPHY.heading4, fontSize: 18 },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: COLORS.accentTransparent,
  },
  checkSlot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { ...TYPOGRAPHY.body, fontSize: 15 },
  rowTextSelected: { color: COLORS.accent },
  empty: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'web' ? 12 : 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  newText: {
    fontFamily: FONTS.secondary,
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
