import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  Platform,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCollections } from '../contexts/CollectionsContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerActions } from '../contexts/PlayerContext';
import { logger } from '../utils/logger';
import { useShareSheet } from '../contexts/ShareSheetContext';
import { useToast } from '../contexts/ToastContext';
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
import { ErrorState, LoadingState } from '../components/StateViews';
import { BottomSheet } from '../components/BottomSheet';
import { SortTray } from '../components/SortTray';
import { SortableTrackList } from '../components/collections/SortableTrackList';
import { ReorderableScrollView } from '../components/collections/ReorderableScrollView';
import { BlurBackground } from '../components/shared/BlurBackground';
import { GlassHeader } from '../components/web/GlassHeader';
import { getShareBackground, shareBackgroundIndexForId } from '../components/share/shareBackgrounds';
import { LinearGradient } from 'expo-linear-gradient';
import { WebVideoBackground } from '../components/shared/WebVideoBackground';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { useAppActiveState } from '../hooks/useAppActiveState';
import { resolveVideoUri } from '../utils/resolveVideoUri';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { ActionSheet, ActionSheetAction } from '../components/ActionSheet';
import { formatCount } from '../utils/formatters';
import { showDetailParams } from '../utils/showDetailParams';
import {
  CollectionSortType,
  COLLECTION_SHOW_SORT_OPTIONS,
  getCollectionSortLabel,
  getSortOptionIcon,
} from '../constants/sortOptions';
import { compareByDate, compareAlphabetical } from '../utils/sortComparators';

/** Height of the sticky nav row (back chevron / title bar) on native. */
const STICKY_NAV_HEIGHT = 44;


type Nav = StackNavigationProp<RootStackParamList, 'CollectionDetail'>;
type RouteT = RouteProp<RootStackParamList, 'CollectionDetail'>;

type ShowSortType = CollectionSortType;

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
    setCollectionPublic,
    deleteCollection,
    saveCollection,
    unsaveCollection,
    isCollectionSaved,
    duplicateCollection,
  } = useCollections();
  const { openShareTray } = useShareSheet();
  const { showToast } = useToast();
  const { openAuthModal } = useWebAuthModal();
  const { startSequentialSongs, startShuffleSongs } = usePlayerActions();
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Bumped by the ErrorState's Retry button to re-trigger the load effect
  // below (which otherwise only depends on route params + fetchItems).
  const [reloadKey, setReloadKey] = useState(0);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [saveCount, setSaveCount] = useState<number | null>(null);
  const [showSort, setShowSort] = useState<ShowSortType>('dateAddedNewest');
  const [reorderMode, setReorderMode] = useState(false);
  const [showSortTrayVisible, setShowSortTrayVisible] = useState(false);
  const [visibilityTrayVisible, setVisibilityTrayVisible] = useState(false);

  // ——— Show-detail-style header: shared background video + sticky nav ———
  const { videoSource, videoId, resetToFallback } = useVideoBackground();
  const appState = useAppActiveState();
  const videoUri = useMemo(
    () => (Platform.OS === 'web' ? resolveVideoUri(videoSource) : ''),
    [videoSource],
  );
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollYRef = useRef(0);
  const scrollRef = useRef<any>(null);
  const [heroHeight, setHeroHeight] = useState(0);
  const [heroOnScreen, setHeroOnScreen] = useState(true);

  const handleScrollUpdate = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      lastScrollYRef.current = y;
      if (heroHeight > 0) {
        const visible = y < heroHeight;
        setHeroOnScreen((prev) => (prev === visible ? prev : visible));
      }
    },
    [heroHeight],
  );

  // In reorder mode the Nestable container owns onScroll (it silently drops
  // the prop), so scrollY only updates when a drag or momentum ends — coarse,
  // but enough to keep the sticky backdrop roughly honest while reordering.
  const handleCoarseScrollUpdate = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.setValue(e.nativeEvent.contentOffset.y);
      handleScrollUpdate(e);
    },
    [scrollY, handleScrollUpdate],
  );

  const onScrollEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: handleScrollUpdate,
      }),
    [scrollY, handleScrollUpdate],
  );

  // Toggling reorder mode swaps the scroll container (Animated.ScrollView ↔
  // NestableScrollContainer), which resets the scroll position — restore it.
  useEffect(() => {
    const y = lastScrollYRef.current;
    if (y > 0) {
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y, animated: false }));
    }
  }, [reorderMode]);

  /**
   * The sticky nav's backdrop (video + blur + gradient) fades in as the hero
   * header scrolls away — same curve as ShowDetailScreen.
   */
  const headerBackdropOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [Math.max(0, heroHeight - 140), Math.max(1, heroHeight - 40)],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY, heroHeight],
  );

  const [menuVisible, setMenuVisible] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<CollectionItem | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [signInPromptVisible, setSignInPromptVisible] = useState(false);
  const pendingAuthActionRef = useRef<'save' | 'duplicate' | null>(null);
  const wasSignedInRef = useRef(false);

  const handleMenuPress = () => setMenuVisible(true);

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
      setLoadError(null);
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
      } catch (e) {
        logger.api.error('Failed to load collection', e);
        if (!cancelled) setLoadError("Couldn't load this collection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    route.params?.collectionId,
    route.params?.username,
    route.params?.slug,
    fetchItems,
    reloadKey,
  ]);

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
      try {
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
      } catch (e) {
        // Degrade gracefully: attribution is a nice-to-have, not worth an
        // error state or toast. Leave ownerUsername null so the header/share
        // UI simply omits the "by @username" attribution.
        logger.api.error('Failed to load collection owner username', e);
      }
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

    // Flip the collection to shared the first time it's shared — this is
    // what makes the public-link RLS policy allow anon reads. Fire-and-forget
    // so a slow/failed network call never blocks opening the share tray;
    // surface failures via a toast instead.
    if (!collection.isShared) {
      const sharedCollectionId = collection.id;
      collectionsService
        .markCollectionShared(sharedCollectionId)
        .then(() => {
          setCollection((prev) =>
            prev && prev.id === sharedCollectionId ? { ...prev, isShared: true } : prev,
          );
        })
        .catch((e) => {
          logger.api.error('Failed to mark collection as shared', e);
          showToast("Couldn't update sharing settings. Please try again.", 'error');
        });
    }
  }, [collection, items.length, openShareTray, ownerUsername, showToast]);

  // Owner-only Public/Private picker. Optimistic via the context (the sync
  // effect above pushes the new value into `collection`); on failure the
  // context reverts and we explain.
  const handleSelectVisibility = useCallback(async (value: 'public' | 'private') => {
    if (!collection) return;
    const next = value === 'public';
    if (next === collection.isPublic) return;
    try {
      await setCollectionPublic(collection.id, next);
      showToast(
        next
          ? `${collection.type === 'playlist' ? 'Playlist' : 'Collection'} is now public`
          : `${collection.type === 'playlist' ? 'Playlist' : 'Collection'} is now private`,
        'success',
      );
    } catch (e) {
      logger.api.error('Failed to update collection visibility', e);
      showToast("Couldn't update visibility. Please try again.", 'error');
    }
  }, [collection, setCollectionPublic, showToast]);

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

  // Item whose "…" tray is open. Its Remove acts directly — the tray's
  // explicit destructive row is the deliberate step, so no second confirm.
  const [itemActionTarget, setItemActionTarget] = useState<CollectionItem | null>(null);

  const removeItemDirect = useCallback(
    async (target: CollectionItem) => {
      if (!collection) return;
      await removeItem(collection.id, target.itemIdentifier);
      setItems((prev) => prev.filter((i) => i.id !== target.id));
    },
    [collection, removeItem],
  );

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
      // Full bundle (including classicTier) so ShowDetail's first-paint
      // header — star rating included — doesn't have to wait on a refetch.
      navigation.dispatch(StackActions.push('ShowDetail', showDetailParams(show)));
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

  const renderPlaylistRowContent = useCallback(
    (item: CollectionItem, interactive: boolean) => {
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
        <SongCard
          song={song}
          containerStyle={interactive ? undefined : { backgroundColor: 'transparent' }}
          onPress={interactive ? () => handleTrackPress(md) : undefined}
          onLongPress={
            interactive && isOwner
              ? () =>
                  Alert.alert(md.trackTitle, undefined, [
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
      );
    },
    [handleTrackPress, confirmRemoveItem, isOwner],
  );

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
        sorted.sort((a, b) => compareAlphabetical(title(a), title(b)));
        break;
      case 'dateAddedOldest':
        sorted.sort((a, b) => compareByDate(a.addedAt, b.addedAt, 'oldest'));
        break;
      case 'dateAddedNewest':
        sorted.sort((a, b) => compareByDate(a.addedAt, b.addedAt, 'newest'));
        break;
      case 'performanceDateOldest':
        sorted.sort((a, b) => compareByDate(perfDate(a), perfDate(b), 'oldest'));
        break;
      case 'performanceDateNewest':
        sorted.sort((a, b) => compareByDate(perfDate(a), perfDate(b), 'newest'));
        break;
    }
    return sorted;
  }, [collection, items, showSort]);

  // Header is rendered inline (see `header` JSX below) on all platforms. The
  // stack navigator's default header is hidden via the AppNavigator config.

  if (loading) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop, styles.loadingContainer]}>
        <LoadingState size="small" transparentBackground />
      </View>
    );
  }
  if (loadError) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <ErrorState message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
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
    collection.type === 'playlist' ? 'Playlist' : formatCount(items.length, 'show');

  const bgSource = getShareBackground(shareBackgroundIndexForId(collection.id));

  const header = (
    <View onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}>
    <GlassHeader
      background={
        Platform.OS === 'web' ? (
          videoUri ? (
            <WebVideoBackground uri={videoUri} videoId={videoId} onError={resetToFallback} />
          ) : undefined
        ) : (
          /* Same family as ShowDetail's native hero: the shared background
             video over the artwork (the fallback for the moment before the
             video is ready, and for when it fails and resetToFallback fires),
             under a dark blur. GlassHeader adds the dark wash + bottom fade. */
          <View style={styles.headerVideoStack}>
            <Image source={bgSource} style={styles.headerArtImage} resizeMode="cover" />
            {(() => {
              const { Video, ResizeMode } = require('expo-av');
              return (
                <Video
                  key={`collection-header-video-${videoId}`}
                  source={videoSource}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={appState === 'active' && heroOnScreen}
                  isLooping
                  isMuted
                  onError={resetToFallback}
                />
              );
            })()}
            <BlurBackground intensity={30} tint="dark" />
          </View>
        )
      }
      onBackPress={() => navigation.goBack()}
      isDesktop={isDesktop}
      contentGap={20}
      fadeToBackground
      hideNav={Platform.OS !== 'web'}
      contentStyle={
        Platform.OS !== 'web' && { paddingTop: insets.top + STICKY_NAV_HEIGHT + 8 }
      }
    >
        <View style={styles.webInfoSection}>
          <View style={styles.webTitleBlock}>
            <Text style={styles.webCollectionName} numberOfLines={2}>{collection.name}</Text>
            <View style={styles.webMetaRow}>
              <Text style={styles.webMetaText}>{typeLabel}</Text>
              {saveCount !== null && (
                <>
                  <Text style={styles.webMetaDot}>·</Text>
                  <Text style={styles.webMetaText}>
                    {formatCount(saveCount, 'save')}
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
                <BlurBackground intensity={25} tint="default" />
                <Ionicons name="checkmark" size={17} color={COLORS.textPrimary} />
                <Text style={styles.pillText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pillsRow}>
              {collection.type === 'playlist' && items.length > 0 && (
                <TouchableOpacity style={styles.pill} onPress={handleShuffle} activeOpacity={0.7}>
                  <BlurBackground intensity={25} tint="default" />
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
                  <BlurBackground intensity={25} tint="default" />
                  <Ionicons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={17}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.pillText}>{saved ? 'Saved' : 'Save'}</Text>
                </TouchableOpacity>
              )}
              {collection && isOwner && (
                /* Tray trigger styled like the Share pill: state icon on the
                   left, chevron on the right as the menu affordance. */
                <TouchableOpacity
                  style={styles.pill}
                  onPress={() => setVisibilityTrayVisible(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Visibility: ${collection.isPublic ? 'Public' : 'Private'}`}
                  accessibilityHint={
                    collection.isPublic
                      ? 'Listed on your profile and shared with followers. Double tap to change'
                      : 'Only people with the link can open it. Double tap to change'
                  }
                >
                  <BlurBackground intensity={25} tint="default" />
                  <Ionicons
                    name={collection.isPublic ? 'globe-outline' : 'lock-closed-outline'}
                    size={17}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.pillText}>{collection.isPublic ? 'Public' : 'Private'}</Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
              {collection && ownerUsername && (
                <TouchableOpacity style={styles.pill} onPress={handleShare} activeOpacity={0.7}>
                  <BlurBackground intensity={25} tint="default" />
                  <Ionicons name="share-outline" size={17} color={COLORS.textPrimary} />
                  <Text style={styles.pillText}>Share</Text>
                </TouchableOpacity>
              )}
              {collection && (
                <TouchableOpacity
                  style={styles.menuCircleBtn}
                  activeOpacity={0.7}
                  onPress={handleMenuPress}
                  accessibilityRole="button"
                  accessibilityLabel="More actions"
                >
                  <BlurBackground intensity={25} tint="default" />
                  <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
    </GlassHeader>
    </View>
  );

  // Native-only sticky nav over the scroll view: back chevron always visible,
  // title + video/blur/gradient backdrop fading in as the hero scrolls away —
  // the same treatment as ShowDetailScreen's transparent nav header.
  const stickyHeader =
    Platform.OS !== 'web' ? (
      <View style={[styles.stickyHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: headerBackdropOpacity }]}
        >
          {(() => {
            const { Video, ResizeMode } = require('expo-av');
            return (
              <Video
                key={`collection-sticky-video-${videoId}`}
                source={videoSource}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.COVER}
                shouldPlay={appState === 'active' && !heroOnScreen}
                isLooping
                isMuted
                onError={resetToFallback}
              />
            );
          })()}
          <BlurBackground intensity={40} tint="dark" />
          <LinearGradient
            colors={['rgba(18, 18, 18, 0.35)', 'rgba(18, 18, 18, 0.92)']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={styles.stickyNavRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.stickyNavButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Animated.Text
            style={[styles.stickyNavTitle, { opacity: headerBackdropOpacity }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {collection.name}
          </Animated.Text>
          <View style={styles.stickyNavSpacer} />
        </View>
      </View>
    ) : null;

  // Actions for the "…" tray (Spotify-style bottom sheet).
  const menuActions: ActionSheetAction[] = [
    ...(isOwner
      ? [
          {
            label: 'Rename',
            icon: 'pencil-outline' as const,
            onPress: () => {
              setRenameText(collection.name);
              setRenameOpen(true);
            },
          },
        ]
      : []),
    ...(isOwner && collection.type === 'playlist' && items.length >= 2
      ? [
          {
            label: 'Reorder',
            icon: 'swap-vertical-outline' as const,
            onPress: () => setReorderMode(true),
          },
        ]
      : []),
    { label: 'Duplicate', icon: 'copy-outline' as const, onPress: handleDuplicate },
    ...(isOwner
      ? [
          {
            label: 'Delete',
            icon: 'trash-outline' as const,
            destructive: true,
            onPress: handleDelete,
          },
        ]
      : []),
    ...(isNonOwnerViewer && isSignedIn && saved
      ? [
          {
            label: 'Unsave',
            icon: 'bookmark-outline' as const,
            destructive: true,
            onPress: handleToggleSave,
          },
        ]
      : []),
  ];

  // Sort bar rendered directly above the list for show collections.
  const sortBar = collection.type === 'show_collection' && items.length > 0 ? (
    <View style={[styles.sortBar, isDesktop && styles.sortBarDesktop]}>
        <TouchableOpacity
          style={styles.sortLabelButton}
          onPress={() => setShowSortTrayVisible(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Sort shows by ${getCollectionSortLabel(showSort)}`}
          accessibilityHint="Double tap to change sort order"
        >
          <Ionicons name={getSortOptionIcon(COLLECTION_SHOW_SORT_OPTIONS, showSort)} size={16} color={COLORS.textSecondary} />
          <Text style={styles.sortLabelText}>{getCollectionSortLabel(showSort)}</Text>
        </TouchableOpacity>
    </View>
  ) : null;

  // The Nestable container is only needed while a NestableDraggableFlatList
  // is mounted (playlist reorder mode) — and it silently swallows onScroll,
  // so outside reorder mode a plain Animated.ScrollView drives the sticky
  // header at full scroll-event resolution.
  const ScrollContainer: React.ComponentType<any> = reorderMode
    ? ReorderableScrollView
    : Animated.ScrollView;

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
    <ScrollContainer
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onScroll={reorderMode ? undefined : onScrollEvent}
      onScrollEndDrag={reorderMode ? handleCoarseScrollUpdate : undefined}
      onMomentumScrollEnd={reorderMode ? handleCoarseScrollUpdate : undefined}
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
                    onPress={() => setItemActionTarget(item)}
                    accessibilityLabel="More options"
                    accessibilityHint="Opens actions for this show"
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.playlistBody, isDesktop && styles.listBodyDesktop]}>
          {reorderMode ? (
            <SortableTrackList
              items={items}
              onReorder={handleReorder}
              renderItem={(item: CollectionItem) => renderPlaylistRowContent(item, false)}
            />
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.playlistRow}>
                <View style={{ flex: 1 }}>{renderPlaylistRowContent(item, true)}</View>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.removeIconBtn}
                    onPress={() => setItemActionTarget(item)}
                    accessibilityLabel="More options"
                    accessibilityHint="Opens actions for this song"
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}

      <SortTray
        visible={showSortTrayVisible}
        onClose={() => setShowSortTrayVisible(false)}
        options={COLLECTION_SHOW_SORT_OPTIONS}
        selectedValue={showSort}
        onSelect={setShowSort}
      />

      <ActionSheet
        visible={visibilityTrayVisible}
        onClose={() => setVisibilityTrayVisible(false)}
        title="Visibility"
        actions={[
          {
            label: 'Public',
            icon: 'globe-outline' as const,
            detail: 'Listed on your profile and shared with followers',
            selected: collection.isPublic,
            onPress: () => handleSelectVisibility('public'),
          },
          {
            label: 'Private',
            icon: 'lock-closed-outline' as const,
            detail: 'Only people with the link can open it',
            selected: !collection.isPublic,
            onPress: () => handleSelectVisibility('private'),
          },
        ]}
      />

      <ActionSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={collection.name}
        actions={menuActions}
      />

      <ActionSheet
        visible={!!itemActionTarget}
        onClose={() => setItemActionTarget(null)}
        title={
          itemActionTarget
            ? collection.type === 'playlist'
              ? (itemActionTarget.itemMetadata as PlaylistItemMetadata).trackTitle
              : (itemActionTarget.itemMetadata as ShowCollectionItemMetadata).title
            : undefined
        }
        actions={
          itemActionTarget
            ? [
                {
                  label:
                    collection.type === 'playlist'
                      ? 'Remove from playlist'
                      : 'Remove from collection',
                  icon: 'trash-outline' as const,
                  destructive: true,
                  onPress: () => removeItemDirect(itemActionTarget),
                },
              ]
            : []
        }
      />

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
    </ScrollContainer>
    {stickyHeader}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  containerDesktop: { backgroundColor: COLORS.backgroundSecondary },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },

  // Web header shell (wrapper/opacity/blur/nav row) now lives in <GlassHeader>;
  // this just needs to fill the background layer <GlassHeader> provides.
  headerVideoStack: {
    flex: 1,
  },
  headerArtImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  stickyNavRow: {
    height: STICKY_NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickyNavButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  stickyNavTitle: {
    flex: 1,
    textAlign: 'center',
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  // Mirrors the back button's footprint so the title centres truly.
  stickyNavSpacer: {
    width: 22 + SPACING.lg * 2,
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
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          // @ts-ignore - web only
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }
      : {}),
  },
  menuCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMedium,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          // @ts-ignore - web only
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }
      : {}),
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
  playlistBody: {
    // No top padding: the song rows carry their own vertical padding, so the
    // first row already clears the header comfortably.
    paddingTop: 0,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
