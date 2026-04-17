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
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';
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
import { useWebAuthModal } from '../components/web/WebAuthModal';
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
import { BottomSheet } from '../components/BottomSheet';
import { SortDropdown, SortOption } from '../components/SortDropdown';
import { SortableTrackList } from '../components/collections/SortableTrackList';
import { getShareBackground } from '../components/share/shareBackgrounds';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

// Derive a stable background index (1-6) from the collection id so that
// returning to a collection shows the same header image.
function bgIndexFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    // >>> 0 coerces to unsigned 32-bit so the modulo stays positive without
    // the Math.abs → overflow trap.
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % 6) + 1;
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
    savedCollections,
    liveSavedCollectionsById,
    fetchItems,
    removeItem,
    reorderItems,
    renameCollection,
    deleteCollection,
    saveCollection,
    unsaveCollection,
    isCollectionSaved,
    duplicateCollection,
  } = useCollections();
  const { openShareTray } = useShareSheet();
  const { openAuthModal } = useWebAuthModal();
  const { startSequentialSongs, startShuffleSongs } = usePlayer();
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [saveCount, setSaveCount] = useState<number | null>(null);
  const [showSort, setShowSort] = useState<ShowSortType>('dateAddedNewest');
  const [showSortModalVisible, setShowSortModalVisible] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [showSortButtonPosition, setShowSortButtonPosition] = useState({ top: 0, left: 0 });
  const showSortButtonRef = useRef<View>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef<View>(null);

  const [removeTarget, setRemoveTarget] = useState<CollectionItem | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [signInPromptVisible, setSignInPromptVisible] = useState(false);
  const pendingAuthActionRef = useRef<'save' | 'duplicate' | null>(null);
  const wasSignedInRef = useRef(false);

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

  // Load the collection + items once per route change. We intentionally do
  // NOT depend on `collections` here: the context mutates that array on every
  // optimistic update, and re-running this effect would re-fetch items and
  // race with local state. A separate effect keeps the live `collection`
  // object in sync from the context for owner mutations (rename etc.).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (route.params?.collectionId) {
          const collectionId = route.params.collectionId;
          const items = await fetchItems(collectionId);
          if (!cancelled) setItems(items);
          // Fallback for collections the viewer neither owns nor has saved
          // (e.g. Popular Collections owned by another user). The sibling
          // effect below only populates `collection` from owned/saved state.
          const inLocalState =
            collections.some((c) => c.id === collectionId) ||
            liveSavedCollectionsById.has(collectionId);
          if (!inLocalState) {
            const fetched = await collectionsService.fetchCollectionById(collectionId);
            if (fetched && !cancelled) setCollection(fetched);
          }
        } else if (route.params?.username && route.params?.slug) {
          const owner = await profileService.getProfileIdByUsername(route.params.username);
          if (owner?.id && !cancelled) {
            const result = await collectionsService.fetchPublicCollectionByLink(
              owner.id,
              route.params.slug,
            );
            if (result && !cancelled) {
              setCollection(result.collection);
              setItems(result.items);
              setOwnerUsername(route.params.username);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params?.collectionId, route.params?.username, route.params?.slug, fetchItems]);

  // Keep `collection` in sync with the context for owner-edited collections
  // (rename, description change) without triggering the expensive items load.
  // Also resolves saved collections (owned by someone else) via the live map.
  useEffect(() => {
    if (!route.params?.collectionId) return;
    const found =
      collections.find((c) => c.id === route.params!.collectionId) ??
      liveSavedCollectionsById.get(route.params!.collectionId);
    if (found) setCollection(found);
  }, [collections, liveSavedCollectionsById, route.params?.collectionId]);

  // Reset owner username when the route changes.
  useEffect(() => {
    setOwnerUsername(route.params?.username ?? null);
  }, [route.params?.collectionId, route.params?.username, route.params?.slug]);

  // Load owner username for share builder and header attribution.
  // Three paths: (1) owner viewing own → look up their profile,
  // (2) viewer has saved this collection → use the snapshot on SavedCollection,
  // (3) public-link view → already set from route.params.username.
  useEffect(() => {
    (async () => {
      if (!collection || ownerUsername) return;
      if (user && user.id === collection.userId) {
        const me = await profileService.getUserProfile(user.id);
        setOwnerUsername(me?.username ?? null);
        return;
      }
      const savedMatch = savedCollections.find((s) => s.collectionId === collection.id);
      if (savedMatch) {
        setOwnerUsername(savedMatch.lastKnownOwnerUsername);
        return;
      }
      // Fallback: fetch the owner's profile by userId so the share/Owner fields populate.
      const prof = await profileService.getUserProfile(collection.userId);
      setOwnerUsername(prof?.username ?? null);
    })();
  }, [collection, user, ownerUsername, savedCollections]);

  const isOwner =
    !routeReadOnly && !isPublicLink && !!user && !!collection && user.id === collection.userId;

  const isSignedIn = !!user;
  // A non-owner viewer (saved-collection view, public-link view, or logged-out viewer)
  const isNonOwnerViewer = !isOwner;
  const saved = !!collection && isSignedIn && isCollectionSaved(collection.id);

  // Load the cross-user save count once we know the collection id. `saved`
  // is included so toggling save locally refreshes the number.
  useEffect(() => {
    if (!collection) {
      setSaveCount(null);
      return;
    }
    let cancelled = false;
    collectionsService
      .fetchCollectionSaveCount(collection.id)
      .then((n) => {
        if (!cancelled) setSaveCount(n);
      })
      .catch(() => {
        if (!cancelled) setSaveCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [collection?.id, saved]);

  const playlistQueue = useMemo(
    () =>
      collection?.type === 'playlist'
        ? items.map((i) => i.itemMetadata as PlaylistItemMetadata)
        : [],
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
    });
  }, [collection, items.length, openShareTray, ownerUsername]);

  const handleToggleSave = useCallback(async () => {
    if (!collection) return;
    if (!isSignedIn) {
      pendingAuthActionRef.current = 'save';
      if (Platform.OS === 'web') {
        openAuthModal('login');
      } else {
        setSignInPromptVisible(true);
      }
      return;
    }
    try {
      if (saved) {
        await unsaveCollection(collection.id);
      } else {
        await saveCollection(collection.id);
      }
    } catch (e) {
      logger.api.error('toggle save failed', e);
      Alert.alert('Could not update saved collections', 'Please try again.');
    }
  }, [collection, isSignedIn, saved, saveCollection, unsaveCollection, openAuthModal]);

  const handleDuplicate = useCallback(async () => {
    if (!collection) return;
    if (!isSignedIn) {
      pendingAuthActionRef.current = 'duplicate';
      if (Platform.OS === 'web') {
        openAuthModal('login');
      } else {
        setSignInPromptVisible(true);
      }
      return;
    }
    try {
      const created = await duplicateCollection(collection.id);
      navigation.dispatch(
        StackActions.replace('CollectionDetail', { collectionId: created.id }),
      );
    } catch (e) {
      logger.api.error('duplicate failed', e);
      Alert.alert('Could not duplicate collection', 'Please try again.');
    }
  }, [collection, isSignedIn, duplicateCollection, navigation, openAuthModal]);

  // Resume a pending save/duplicate after the user signs in via the auth modal.
  // Fires only on the signed-out → signed-in transition, not on initial mount.
  useEffect(() => {
    const wasSignedIn = wasSignedInRef.current;
    wasSignedInRef.current = isSignedIn;
    if (!wasSignedIn && isSignedIn && pendingAuthActionRef.current && collection) {
      const action = pendingAuthActionRef.current;
      pendingAuthActionRef.current = null;
      if (action === 'save') handleToggleSave();
      else if (action === 'duplicate') handleDuplicate();
    }
  }, [isSignedIn, collection, handleToggleSave, handleDuplicate]);

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

  const handleReorder = useCallback(
    async (nextOrder: CollectionItem[]) => {
      if (!collection) return;
      const prev = items;
      setItems(nextOrder);
      try {
        await reorderItems(
          collection.id,
          nextOrder.map((i) => i.id),
        );
      } catch (e) {
        logger.player.error('Reorder failed, reconciling with server', e);
        try {
          const fresh = await fetchItems(collection.id);
          setItems(fresh);
        } catch {
          setItems(prev);
        }
        Alert.alert("Couldn't save new order", 'Please try again.');
      }
    },
    [collection, items, reorderItems, fetchItems],
  );

  useEffect(() => {
    if (reorderMode && (!isOwner || items.length < 2)) {
      setReorderMode(false);
    }
  }, [reorderMode, isOwner, items.length]);

  const handleShowPress = useCallback(
    (show: GratefulDeadShow) => {
      // Use push (not navigate) so Back always returns to THIS collection,
      // even if ShowDetail already exists elsewhere in the nav stack.
      navigation.dispatch(
        StackActions.push('ShowDetail', {
          identifier: show.primaryIdentifier,
          date: show.date,
          venue: show.venue,
          location: show.location,
        }),
      );
    },
    [navigation],
  );

  const handleTrackPress = useCallback(
    async (md: PlaylistItemMetadata) => {
      // Sequential playback through the playlist: the queue is the whole list,
      // starting from the tapped index. "Next" advances to the next playlist
      // item (not the next track in its show).
      const index = playlistQueue.findIndex(
        (q) => q.trackId === md.trackId && q.showIdentifier === md.showIdentifier,
      );
      if (index < 0) return;
      const key = `${md.showIdentifier}::${md.trackId}`;
      setLoadingTrackId(key);
      try {
        await startSequentialSongs(playlistQueue, index);
      } catch (e) {
        logger.player.error('Failed to play playlist track:', e);
      } finally {
        setLoadingTrackId(null);
      }
    },
    [playlistQueue, startSequentialSongs],
  );

  const handleShuffle = useCallback(() => {
    if (!collection || collection.type !== 'playlist' || playlistQueue.length === 0) return;
    startShuffleSongs(playlistQueue, 'playlist');
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
    // Signed-in viewers with a tombstoned save row likely landed here because
    // the owner deleted the collection while they had it open. Surface that
    // context and give them an out.
    const viewerHasTombstones =
      !!user && savedCollections.some((s) => s.collectionId === null);
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop, styles.loadingContainer]}>
        <Text style={styles.empty}>
          {viewerHasTombstones
            ? 'This collection is no longer available. It may have been deleted by its owner.'
            : 'Collection not found.'}
        </Text>
        <TouchableOpacity
          style={[styles.pill, { marginTop: 16 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={17} color={COLORS.textPrimary} />
          <Text style={styles.pillText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeLabel =
    collection.type === 'playlist'
      ? 'Playlist'
      : `${items.length} show${items.length === 1 ? '' : 's'}`;

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
              {saveCount !== null && (
                <>
                  <Text style={styles.webMetaDot}>·</Text>
                  <Text style={styles.webMetaText}>
                    {saveCount} save{saveCount === 1 ? '' : 's'}
                  </Text>
                </>
              )}
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

          {reorderMode ? (
            <View style={styles.pillsRow}>
              <TouchableOpacity
                style={styles.pill}
                onPress={() => setReorderMode(false)}
                activeOpacity={0.7}
                accessibilityLabel="Exit reorder mode"
              >
                <Ionicons name="checkmark" size={17} color={COLORS.textPrimary} />
                <Text style={styles.pillText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pillsRow}>
              {collection.type === 'playlist' && items.length > 0 && (
                <TouchableOpacity style={styles.pill} onPress={handleShuffle} activeOpacity={0.7}>
                  <Ionicons name="shuffle" size={17} color={COLORS.textPrimary} />
                  <Text style={styles.pillText}>Shuffle</Text>
                </TouchableOpacity>
              )}
              {isNonOwnerViewer && collection && (
                <TouchableOpacity
                  style={styles.pill}
                  onPress={handleToggleSave}
                  activeOpacity={0.7}
                  accessibilityLabel={saved ? 'Unsave collection' : 'Save collection'}
                >
                  <Ionicons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={17}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.pillText}>{saved ? 'Saved' : 'Save'}</Text>
                </TouchableOpacity>
              )}
              {collection && ownerUsername && (
                <TouchableOpacity style={styles.pill} onPress={handleShare} activeOpacity={0.7}>
                  <Ionicons name="share-outline" size={17} color={COLORS.textPrimary} />
                  <Text style={styles.pillText}>Share</Text>
                </TouchableOpacity>
              )}
              {collection && (
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
          )}

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
            {isOwner && (
              <>
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
              </>
            )}

            {isOwner && collection.type === 'playlist' && items.length >= 2 && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  setReorderMode(true);
                }}
              >
                <Ionicons name="swap-vertical-outline" size={16} color={COLORS.textPrimary} />
                <Text style={styles.menuItemText}>Reorder</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleDuplicate();
              }}
            >
              <Ionicons name="copy-outline" size={16} color={COLORS.textPrimary} />
              <Text style={styles.menuItemText}>Duplicate</Text>
            </TouchableOpacity>

            {isOwner && (
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
            )}

            {isNonOwnerViewer && isSignedIn && saved && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  handleToggleSave();
                }}
              >
                <Ionicons name="bookmark-outline" size={16} color={COLORS.error} />
                <Text style={[styles.menuItemText, { color: COLORS.error }]}>Unsave</Text>
              </TouchableOpacity>
            )}
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

      <ConfirmModal
        visible={signInPromptVisible}
        title="Sign in required"
        message="Sign in to save and duplicate collections."
        confirmLabel="OK"
        onConfirm={() => setSignInPromptVisible(false)}
        onCancel={() => setSignInPromptVisible(false)}
      />

      <BottomSheet
        visible={renameOpen && !!collection}
        onClose={() => setRenameOpen(false)}
        cardStyle={styles.renameCard}
        swipeToDismiss={false}
      >
        {collection && (
          <>
            <Text style={styles.renameTitle}>Rename Collection</Text>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              maxLength={80}
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                onPress={() => setRenameOpen(false)}
                style={styles.renameCancelBtn}
              >
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.renameSaveBtn}
                onPress={async () => {
                  if (!renameText.trim()) return;
                  await renameCollection(collection.id, renameText.trim());
                  setRenameOpen(false);
                  setCollection({ ...collection, name: renameText.trim() });
                }}
              >
                <Text style={styles.renameSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </BottomSheet>
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
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  webMetaDot: {
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.surfaceMedium,
  },
  menuCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMedium,
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

  // Rename modal (inside <BottomSheet>)
  renameCard: {
    paddingHorizontal: 20,
    gap: 12,
  },
  renameTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  renameInput: {
    backgroundColor: COLORS.searchBackground,
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  renameCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLight,
  },
  renameCancelText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  renameSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  renameSaveText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
});
