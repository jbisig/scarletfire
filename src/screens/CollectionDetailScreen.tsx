import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
  ImageBackground,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCollections } from '../contexts/CollectionsContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { archiveApi } from '../services/archiveApi';
import { logger } from '../utils/logger';
import { useShareSheet } from '../contexts/ShareSheetContext';
import { collectionsService } from '../services/collectionsService';
import { profileService } from '../services/profileService';
import {
  Collection,
  CollectionItem,
  PlaylistItemMetadata,
  ShowCollectionItemMetadata,
} from '../types/collection.types';
import { GratefulDeadShow } from '../types/show.types';
import { ShowCard } from '../components/ShowCard';
import { SongCard } from '../components/SongCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { SortDropdown, SortOption } from '../components/SortDropdown';
import { getShareBackground } from '../components/share/shareBackgrounds';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

// Derive a stable background index (1-6) from the collection id so that
// returning to a collection shows the same header image.
function bgIndexFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 6 + 1;
}

type Nav = StackNavigationProp<RootStackParamList, 'CollectionDetail'>;
type RouteT = RouteProp<RootStackParamList, 'CollectionDetail'>;

type ShowSortType =
  | 'alphabetical'
  | 'dateAddedOldest'
  | 'dateAddedNewest'
  | 'performanceDateOldest'
  | 'performanceDateNewest';

const SHOW_SORT_OPTIONS: SortOption<ShowSortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'dateAddedOldest', label: 'Date Added (Oldest First)' },
  { value: 'dateAddedNewest', label: 'Date Added (Newest First)' },
  { value: 'performanceDateOldest', label: 'Show Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Show Date (Newest First)' },
];

function getShowSortLabel(s: ShowSortType): string {
  switch (s) {
    case 'alphabetical': return 'Alphabetical';
    case 'dateAddedOldest':
    case 'dateAddedNewest': return 'Date Added';
    case 'performanceDateOldest':
    case 'performanceDateNewest': return 'Show Date';
  }
}

function getShowSortIcon(s: ShowSortType): 'arrow-up' | 'arrow-down' {
  switch (s) {
    case 'dateAddedOldest':
    case 'performanceDateOldest':
      return 'arrow-up';
    case 'alphabetical':
      return 'arrow-down';
    default:
      return 'arrow-down';
  }
}

// Map a stored show metadata blob to the GratefulDeadShow shape that ShowCard expects.
function toGratefulDeadShow(md: ShowCollectionItemMetadata): GratefulDeadShow {
  return {
    date: md.date,
    year: md.date.slice(0, 4),
    venue: md.venue,
    location: md.location,
    versions: [],
    primaryIdentifier: md.primaryIdentifier,
    title: md.title,
  };
}

export function CollectionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
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
  const { startSequentialSongs, startShuffleSongs, loadTrack } = usePlayer();
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [showSort, setShowSort] = useState<ShowSortType>('dateAddedNewest');
  const [showSortModalVisible, setShowSortModalVisible] = useState(false);
  const [showSortButtonPosition, setShowSortButtonPosition] = useState({ top: 0, left: 0 });
  const showSortButtonRef = useRef<View>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef<View>(null);

  const [removeTarget, setRemoveTarget] = useState<CollectionItem | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const handleShowSortPress = () => {
    showSortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setShowSortButtonPosition({ top: pageY + height + 8, left: pageX });
      setShowSortModalVisible(true);
    });
  };

  const handleMenuPress = () => {
    menuButtonRef.current?.measure((_x, _y, _width, height, pageX, pageY) => {
      // Left-align the menu with the button so it sits directly under it.
      setMenuPosition({ top: pageY + height + 4, left: pageX });
      setMenuVisible(true);
    });
  };

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
          const owner = await profileService.getProfileIdByUsername(route.params.username);
          if (owner?.id) {
            const result = await collectionsService.fetchPublicCollectionByLink(
              owner.id,
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

  // Reset owner username when the route changes.
  useEffect(() => {
    setOwnerUsername(route.params?.username ?? null);
  }, [route.params?.collectionId, route.params?.username, route.params?.slug]);

  // Load owner username for share builder (owner view only).
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

  const playlistQueue = useMemo(
    () =>
      items
        .filter(() => collection?.type === 'playlist')
        .map((i) => i.itemMetadata as PlaylistItemMetadata),
    [items, collection],
  );

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
    } as any);
  }, [collection, items.length, openShareTray, ownerUsername]);

  const handleDelete = useCallback(() => {
    if (!collection) return;
    setDeleteConfirmVisible(true);
  }, [collection]);

  const confirmRemoveItem = useCallback((item: CollectionItem) => {
    setRemoveTarget(item);
  }, []);

  const performRemove = useCallback(async () => {
    if (!collection || !removeTarget) return;
    const target = removeTarget;
    setRemoveTarget(null);
    await removeItem(collection.id, target.itemIdentifier);
    setItems((prev) => prev.filter((i) => i.id !== target.id));
  }, [collection, removeItem, removeTarget]);

  const performDelete = useCallback(async () => {
    if (!collection) return;
    setDeleteConfirmVisible(false);
    await deleteCollection(collection.id);
    navigation.goBack();
  }, [collection, deleteCollection, navigation]);

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

  const handleShowPress = useCallback(
    (show: GratefulDeadShow) => {
      // Use push (not navigate) so Back always returns to THIS collection,
      // even if ShowDetail already exists elsewhere in the nav stack.
      (navigation as any).push('ShowDetail', {
        identifier: show.primaryIdentifier,
        date: show.date,
        venue: show.venue,
        location: show.location,
      });
    },
    [navigation],
  );

  const handleTrackPress = useCallback(
    async (md: PlaylistItemMetadata) => {
      logger.player.info('Playlist tap:', md.trackTitle, md.showIdentifier);
      if (Platform.OS !== 'web') {
        // Diagnostic: confirm the tap actually fires on native.
        // eslint-disable-next-line no-console
        console.log('[CollectionDetail] playlist tap', md.trackTitle, md.showIdentifier);
      }
      const key = `${md.showIdentifier}::${md.trackId}`;
      setLoadingTrackId(key);
      try {
        const showDetail = await archiveApi.getShowDetail(md.showIdentifier);
        const track = showDetail.tracks.find((t) => t.id === md.trackId);
        if (track) {
          await loadTrack(track, showDetail, showDetail.tracks);
        } else {
          Alert.alert('Track not found', `Couldn't find "${md.trackTitle}" on the show.`);
          logger.player.error('Playlist track not found on show:', md.trackId);
        }
      } catch (e) {
        Alert.alert(
          'Playback error',
          e instanceof Error ? e.message : 'Unknown error',
        );
        logger.player.error('Failed to play playlist track:', e);
      } finally {
        setLoadingTrackId(null);
      }
    },
    [loadTrack],
  );

  const handleShuffle = useCallback(() => {
    if (!collection || collection.type !== 'playlist' || playlistQueue.length === 0) return;
    startShuffleSongs(playlistQueue);
  }, [collection, playlistQueue, startShuffleSongs]);

  // Sorted items for show collections.
  const displayItems = useMemo(() => {
    if (!collection || collection.type !== 'show_collection') return items;
    const sorted = [...items];
    const title = (i: CollectionItem) =>
      (i.itemMetadata as ShowCollectionItemMetadata).title ?? '';
    const perfDate = (i: CollectionItem) =>
      (i.itemMetadata as ShowCollectionItemMetadata).date ?? '';
    switch (showSort) {
      case 'alphabetical':
        sorted.sort((a, b) => title(a).localeCompare(title(b)));
        break;
      case 'dateAddedOldest':
        sorted.sort((a, b) => (a.addedAt < b.addedAt ? -1 : 1));
        break;
      case 'dateAddedNewest':
        sorted.sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
        break;
      case 'performanceDateOldest':
        sorted.sort((a, b) => (perfDate(a) < perfDate(b) ? -1 : 1));
        break;
      case 'performanceDateNewest':
        sorted.sort((a, b) => (perfDate(a) < perfDate(b) ? 1 : -1));
        break;
    }
    return sorted;
  }, [collection, items, showSort]);

  // Header is rendered inline (see `header` JSX below) on all platforms. The
  // stack navigator's default header is hidden via the AppNavigator config.

  if (loading) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop, styles.loadingContainer]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }
  if (!collection) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop, styles.loadingContainer]}>
        <Text style={styles.empty}>Collection not found.</Text>
      </View>
    );
  }

  const typeLabel = collection.type === 'playlist' ? 'Playlist' : 'Show Collection';
  const itemCountLabel = `${items.length} item${items.length === 1 ? '' : 's'}`;

  const bgSource = getShareBackground(bgIndexFromId(collection.id));

  const header = (
    <View style={styles.webHeaderWrapper}>
      <ImageBackground source={bgSource} style={styles.webHeaderBg} imageStyle={styles.webHeaderBgImage} />
      <View style={styles.webHeaderBlur} />
      <View
        style={[
          styles.webHeaderContent,
          isDesktop && styles.webHeaderContentDesktop,
          Platform.OS !== 'web' && { paddingTop: insets.top + 8 },
        ]}
      >
        <View style={styles.webNavRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.webBackButton}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.webInfoSection}>
          <View style={styles.webTitleBlock}>
            <Text style={styles.webCollectionName} numberOfLines={2}>{collection.name}</Text>
            <View style={styles.webMetaRow}>
              <Text style={styles.webMetaText}>{typeLabel}</Text>
              <Text style={styles.webMetaDot}>·</Text>
              <Text style={styles.webMetaText}>{itemCountLabel}</Text>
              {ownerUsername && (
                <>
                  <Text style={styles.webMetaDot}>·</Text>
                  <Text style={styles.webMetaText}>by @{ownerUsername}</Text>
                </>
              )}
            </View>
            {collection.description ? (
              <Text style={styles.webDescription}>{collection.description}</Text>
            ) : null}
          </View>

          <View style={styles.pillsRow}>
            {collection.type === 'playlist' && items.length > 0 && (
              <TouchableOpacity style={styles.pill} onPress={handleShuffle} activeOpacity={0.7}>
                <Ionicons name="shuffle" size={17} color={COLORS.textPrimary} />
                <Text style={styles.pillText}>Shuffle</Text>
              </TouchableOpacity>
            )}
            {collection && ownerUsername && (
              <TouchableOpacity style={styles.pill} onPress={handleShare} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={17} color={COLORS.textPrimary} />
                <Text style={styles.pillText}>Share</Text>
              </TouchableOpacity>
            )}
            {isOwner && (
              <View ref={menuButtonRef} collapsable={false}>
                <TouchableOpacity
                  style={styles.menuCircleBtn}
                  activeOpacity={0.7}
                  onPress={handleMenuPress}
                  accessibilityRole="button"
                  accessibilityLabel="More actions"
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </View>
    </View>
  );

  // Sort bar rendered directly above the list for show collections.
  const sortBar = collection.type === 'show_collection' && items.length > 0 ? (
    <View style={[styles.sortBar, isDesktop && styles.sortBarDesktop]}>
      <View ref={showSortButtonRef} collapsable={false}>
        <TouchableOpacity
          style={styles.sortLabelButton}
          onPress={handleShowSortPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Sort shows by ${getShowSortLabel(showSort)}`}
          accessibilityHint="Double tap to change sort order"
        >
          <Ionicons name={getShowSortIcon(showSort)} size={16} color={COLORS.textSecondary} />
          <Text style={styles.sortLabelText}>{getShowSortLabel(showSort)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  return (
    <ScrollView
      style={[styles.container, isDesktop && styles.containerDesktop]}
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      // iOS: ensure tap events are delivered to children quickly without being
      // swallowed by the scroll view's touch arbitration.
      canCancelContentTouches={false}
    >
      {header}
      {sortBar}

      {items.length === 0 ? (
        <Text style={styles.empty}>No items yet.</Text>
      ) : collection.type === 'show_collection' ? (
        <View style={[styles.listBody, isDesktop && styles.listBodyDesktop]}>
          {displayItems.map((item) => {
            const md = item.itemMetadata as ShowCollectionItemMetadata;
            const show = toGratefulDeadShow(md);
            return (
              <View key={item.id} style={styles.showCardRow}>
                <View style={{ flex: 1 }}>
                  <ShowCard show={show} onPress={handleShowPress} hideSaveBadge />
                </View>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.removeIconBtn}
                    onPress={() => confirmRemoveItem(item)}
                    accessibilityLabel="Remove from collection"
                  >
                    <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.playlistBody, isDesktop && styles.listBodyDesktop]}>
          {items.map((item, index) => {
            const md = item.itemMetadata as PlaylistItemMetadata;
            const song = {
              trackId: md.trackId,
              trackTitle: md.trackTitle,
              showIdentifier: md.showIdentifier,
              showDate: md.showDate,
              venue: md.venue,
              streamUrl: md.streamUrl,
            };
            return (
              <View key={item.id} style={styles.playlistRow}>
                <View style={{ flex: 1 }}>
                  <SongCard
                    song={song}
                    onPress={() => handleTrackPress(md)}
                    onLongPress={
                      isOwner
                        ? () =>
                            Alert.alert(md.trackTitle, undefined, [
                              { text: 'Move up', onPress: () => handleMove(item, -1) },
                              { text: 'Move down', onPress: () => handleMove(item, 1) },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: () => confirmRemoveItem(item),
                              },
                              { text: 'Cancel', style: 'cancel' },
                            ])
                        : undefined
                    }
                  />
                </View>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.removeIconBtn}
                    onPress={() => confirmRemoveItem(item)}
                    accessibilityLabel="Remove from playlist"
                  >
                    <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      <SortDropdown
        visible={showSortModalVisible}
        onClose={() => setShowSortModalVisible(false)}
        position={showSortButtonPosition}
        options={SHOW_SORT_OPTIONS}
        selectedValue={showSort}
        onSelect={setShowSort}
      />

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[styles.menu, { top: menuPosition.top, left: menuPosition.left }]}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setRenameText(collection.name);
                setRenameOpen(true);
              }}
            >
              <Ionicons name="pencil-outline" size={16} color={COLORS.textPrimary} />
              <Text style={styles.menuItemText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleDelete();
              }}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ConfirmModal
        visible={!!removeTarget}
        title={
          removeTarget
            ? `Remove "${
                collection.type === 'playlist'
                  ? (removeTarget.itemMetadata as PlaylistItemMetadata).trackTitle
                  : (removeTarget.itemMetadata as ShowCollectionItemMetadata).title
              }"?`
            : ''
        }
        message={`This will remove it from this ${collection.type === 'playlist' ? 'playlist' : 'collection'}.`}
        confirmLabel="Remove"
        destructive
        onConfirm={performRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title={`Delete "${collection.name}"?`}
        message="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={performDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  containerDesktop: { backgroundColor: COLORS.backgroundSecondary },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },

  // Web header
  webHeaderWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  webHeaderBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.68,
  },
  webHeaderBgImage: {},
  webHeaderBlur: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    // @ts-ignore - web only
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    zIndex: 1,
  },
  webHeaderContent: {
    position: 'relative',
    zIndex: 2,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
  webHeaderContentDesktop: {
    paddingHorizontal: 40,
  },
  webNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webBackButton: {
    // @ts-ignore
    cursor: 'pointer',
  },
  webInfoSection: {
    gap: 16,
  },
  webTitleBlock: {
    gap: 8,
  },
  webCollectionName: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '700',
    fontSize: 28,
    color: COLORS.textPrimary,
  },
  webMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  webMetaText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  webMetaDot: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  webDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
  },
  menuCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  pillDestructive: {
    backgroundColor: COLORS.surfaceLight,
  },
  pillText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },

  sortBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sortBarDesktop: {
    paddingHorizontal: 40,
  },
  sortLabelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
  },
  sortLabelText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  menuBackdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    minWidth: 180,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    paddingVertical: 6,
    // @ts-ignore web only
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItemText: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },

  toolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.cardBackground,
  },
  toolbarText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },

  // List bodies. Native cards (ShowCard/SongCard) already have their own
  // horizontal padding (SPACING.xxl), so we don't add any on native. On web,
  // ShowCard uses 16px internal padding and we offset the wrapper by 8/24
  // so card content aligns with the header (header 24, desktop 40).
  listBody: {
    paddingTop: 8,
    ...(Platform.OS === 'web' ? { paddingHorizontal: 8 } : {}),
  },
  listBodyDesktop: {
    paddingHorizontal: 24,
  },
  showCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  playlistBody: {
    paddingTop: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  trackSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  removeIconBtn: {
    padding: 8,
  },

  // Rename overlay
  renameOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.backdropDark,
    justifyContent: 'center',
    padding: 20,
  },
  renameCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 12,
    gap: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
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
