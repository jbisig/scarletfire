import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCollections } from '../contexts/CollectionsContext';
import { useAuth } from '../contexts/AuthContext';
import { useShareSheet } from '../contexts/ShareSheetContext';
import { collectionsService } from '../services/collectionsService';
import { profileService } from '../services/profileService';
import {
  Collection,
  CollectionItem,
  PlaylistItemMetadata,
  ShowCollectionItemMetadata,
} from '../types/collection.types';
import { COLORS } from '../constants/theme';

type Nav = StackNavigationProp<RootStackParamList, 'CollectionDetail'>;
type RouteT = RouteProp<RootStackParamList, 'CollectionDetail'>;

export function CollectionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { state } = useAuth();
  const user = state.user;
  const {
    collections,
    fetchItems,
    removeItem,
    reorderItems,
    renameCollection,
    deleteCollection,
  } = useCollections();
  const { openShareTray } = useShareSheet();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);

  const routeReadOnly = !!route.params?.readOnly;
  const isPublicLink = !!route.params?.username && !!route.params?.slug;

  // Load collection + items
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (route.params?.collectionId) {
          const found = collections.find((c) => c.id === route.params!.collectionId);
          if (found) {
            setCollection(found);
            setItems(await fetchItems(found.id));
          }
        } else if (route.params?.username && route.params?.slug) {
          const profile = await profileService.getPublicProfile(route.params.username);
          if (profile?.profile?.id) {
            const result = await collectionsService.fetchPublicCollectionByLink(
              profile.profile.id,
              route.params.slug,
            );
            if (result) {
              setCollection(result.collection);
              setItems(result.items);
              setOwnerUsername(route.params.username);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [collections, fetchItems, route.params]);

  // Load owner username for share builder (owner view only)
  useEffect(() => {
    (async () => {
      if (!collection || ownerUsername) return;
      if (user && user.id === collection.userId) {
        const me = await profileService.getUserProfile(user.id);
        setOwnerUsername(me?.username ?? null);
      }
    })();
  }, [collection, user, ownerUsername]);

  const isOwner =
    !routeReadOnly && !isPublicLink && !!user && !!collection && user.id === collection.userId;

  const handleShare = useCallback(() => {
    if (!collection || !ownerUsername) return;
    openShareTray({
      kind: 'collection',
      collectionId: collection.id,
      ownerUsername,
      slug: collection.slug,
      name: collection.name,
      type: collection.type,
      itemCount: items.length,
    } as any); // ShareItem extended in Task 16
  }, [collection, items.length, openShareTray, ownerUsername]);

  const handleDelete = useCallback(() => {
    if (!collection) return;
    Alert.alert('Delete collection?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCollection(collection.id);
          navigation.goBack();
        },
      },
    ]);
  }, [collection, deleteCollection, navigation]);

  const handleRemoveItem = useCallback(
    async (item: CollectionItem) => {
      if (!collection) return;
      await removeItem(collection.id, item.itemIdentifier);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    },
    [collection, removeItem],
  );

  const handleMove = useCallback(
    async (item: CollectionItem, direction: -1 | 1) => {
      if (!collection) return;
      const idx = items.findIndex((i) => i.id === item.id);
      const targetIdx = idx + direction;
      if (idx < 0 || targetIdx < 0 || targetIdx >= items.length) return;
      const next = [...items];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      setItems(next);
      await reorderItems(
        collection.id,
        next.map((i) => i.id),
      );
    },
    [collection, items, reorderItems],
  );

  const handleItemPress = useCallback(
    (item: CollectionItem) => {
      if (!collection) return;
      if (collection.type === 'show_collection') {
        const md = item.itemMetadata as ShowCollectionItemMetadata;
        navigation.navigate('ShowDetail', {
          identifier: md.primaryIdentifier,
          date: md.date,
          venue: md.venue,
          location: md.location,
        });
      } else {
        // TODO: wire up playlist queue playback once a queue API is available
        const md = item.itemMetadata as PlaylistItemMetadata;
        navigation.navigate('ShowDetail', {
          identifier: md.showIdentifier,
          trackTitle: md.trackTitle,
          date: md.showDate,
          venue: md.venue,
        });
      }
    },
    [collection, navigation],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: collection?.name ?? 'Collection',
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {collection && ownerUsername && (
            <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
              <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity
              onPress={() => {
                if (!collection) return;
                Alert.alert(collection.name, undefined, [
                  {
                    text: 'Rename',
                    onPress: () => {
                      setRenameText(collection.name);
                      setRenameOpen(true);
                    },
                  },
                  { text: 'Delete', style: 'destructive', onPress: handleDelete },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              style={styles.headerBtn}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [collection, isOwner, handleDelete, handleShare, navigation, ownerUsername]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!collection) return <Text style={styles.empty}>Collection not found.</Text>;

  return (
    <View style={styles.container}>
      {collection.description ? (
        <Text style={styles.description}>{collection.description}</Text>
      ) : null}
      {!isOwner && ownerUsername && (
        <Text style={styles.attribution}>by @{ownerUsername}</Text>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.empty}>No items yet.</Text>}
        renderItem={({ item }) => {
          const md = item.itemMetadata as any;
          const title =
            collection.type === 'playlist' ? md.trackTitle : md.title;
          const subtitle =
            collection.type === 'playlist'
              ? `${md.showDate}${md.venue ? ` · ${md.venue}` : ''}`
              : `${md.date}${md.venue ? ` · ${md.venue}` : ''}`;
          return (
            <View style={styles.row}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleItemPress(item)}
                onLongPress={
                  isOwner
                    ? () =>
                        Alert.alert(title, undefined, [
                          ...(collection.type === 'playlist'
                            ? [
                                { text: 'Move up', onPress: () => handleMove(item, -1) },
                                { text: 'Move down', onPress: () => handleMove(item, 1) },
                              ]
                            : []),
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => handleRemoveItem(item),
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ])
                    : undefined
                }
              >
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {renameOpen && collection && (
        <View style={styles.renameOverlay}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Rename Collection</Text>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              maxLength={80}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setRenameOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!renameText.trim()) return;
                  await renameCollection(collection.id, renameText.trim());
                  setRenameOpen(false);
                  setCollection({ ...collection, name: renameText.trim() });
                }}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  description: {
    color: COLORS.textSecondary,
    padding: 16,
    fontSize: 14,
  },
  attribution: {
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  title: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  renameOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.backdropDark,
    justifyContent: 'center',
    padding: 20,
  },
  renameCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  renameTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  renameInput: {
    backgroundColor: COLORS.searchBackground,
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  cancelText: { color: COLORS.textSecondary, fontSize: 15, padding: 10 },
  saveText: { color: COLORS.accent, fontSize: 15, fontWeight: '600', padding: 10 },
});
