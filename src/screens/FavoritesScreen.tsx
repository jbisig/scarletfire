import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
  RefreshControl,
  Platform,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { ScreenHeader } from '../components/ScreenHeader';
import { SegmentedTabs, SegmentedTabItem } from '../components/SegmentedTabs';
import { AnimatedSearchBar } from '../components/AnimatedSearchBar';
import { SortDropdown } from '../components/SortDropdown';
import { ShowCard } from '../components/ShowCard';
import { ShowsFilterTray, ShowsFilterState, createEmptyFilterState, hasActiveFilters } from '../components/ShowsFilterTray';
import { GratefulDeadShow } from '../types/show.types';
import { ShuffleSongItem } from '../types/player.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ShowsByYear } from '../types/show.types';
import { showDetailParams } from '../utils/showDetailParams';
import { makeShowTagFilter, sourceConstraintFromTags } from '../services/tagResolver';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerActions } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { haptics } from '../services/hapticService';
import { SongCard } from '../components/SongCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useDebounce } from '../hooks/useDebounce';
import { useResponsive } from '../hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileImage } from '../components/ProfileImage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';
import { logger } from '../utils/logger';
import { useShareSheet } from '../contexts/ShareSheetContext';
import { useCollections } from '../contexts/CollectionsContext';
import { CollectionsTab } from '../components/collections/CollectionsTab';
import { CreateCollectionModal } from '../components/collections/CreateCollectionModal';
import { CollectionType, LibraryCollectionEntry } from '../types/collection.types';
import { AddToCollectionPicker } from '../components/collections/AddToCollectionPicker';
import { EmptyState } from '../components/StateViews';
import {
  SavedItemSortType,
  SAVED_SHOW_SORT_OPTIONS,
  SAVED_SONG_SORT_OPTIONS,
  getSavedItemSortLabel,
  getSavedItemSortIcon,
} from '../constants/sortOptions';
import { useSortDropdown } from '../hooks/useSortDropdown';
import { usePlaySavedSong } from '../hooks/usePlaySavedSong';
import { compareBySavedAt, compareByDate, compareAlphabetical } from '../utils/sortComparators';
import { useDownloads } from '../contexts/DownloadsContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { mergeUnsavedDownloads, sortDownloadedFirst } from '../utils/savedShowsDownloads';

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Favorites'>;

type TabType = 'shows' | 'songs' | 'collections';
type SongSortType = SavedItemSortType;
type ShowSortType = SavedItemSortType;

const FAVORITES_TABS: SegmentedTabItem<TabType>[] = [
  { key: 'shows', label: 'Shows' },
  { key: 'songs', label: 'Songs' },
  { key: 'collections', label: 'Collections' },
];

export function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { width: windowWidth } = useWindowDimensions();
  const [headerWidth, setHeaderWidth] = useState(windowWidth);
  const padding = isDesktop ? 32 : LAYOUT.HORIZONTAL_PADDING;
  const { favoriteShows, favoriteSongs, isLoading, refreshFavorites } = useFavorites();
  const {
    deleteCollection,
    libraryEntries,
    unsaveCollection,
    removeTombstone,
    duplicateCollection,
  } = useCollections();
  const [createCollectionVisible, setCreateCollectionVisible] = useState(false);
  const [createCollectionType, setCreateCollectionType] = useState<CollectionType>('show_collection');
  const [pickerSong, setPickerSong] = useState<FavoriteSong | null>(null);
  const { startShuffleSongs, startShuffleShows } = usePlayerActions();
  const { getPlayCountStable } = usePlayCounts();
  const [activeTab, setActiveTab] = useState<TabType>('shows');
  const { loadingSongId, playSong } = usePlaySavedSong();
  const [songSortType, setSongSortType] = useState<SongSortType>('dateSavedNewest');
  const [showSortType, setShowSortType] = useState<ShowSortType>('dateSavedNewest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [filterTrayOpen, setFilterTrayOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ShowsFilterState>(createEmptyFilterState);
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const showSortDropdown = useSortDropdown();
  const songSortDropdown = useSortDropdown();
  const showsListRef = useRef<FlatList>(null);
  const songsListRef = useRef<FlatList>(null);

  const downloadedShows = useDownloads();
  const { isConnected } = useNetworkStatus();

  // Complete downloads keyed by show date: drives the row badge, the
  // "Downloaded" sort, and the offline grey-out. (Downloads are keyed to the
  // exact recording; favorites to the catalog primary — the date is the
  // stable join.)
  const downloadsByDate = useMemo(() => {
    const map = new Map<string, number>(); // date → requestedAt
    for (const d of downloadedShows) {
      if (d.status === 'complete') map.set(d.date.slice(0, 10), d.requestedAt);
    }
    return map;
  }, [downloadedShows]);

  // Offline, lead with what can actually play. One-way: coming back online
  // leaves the sort where the user had it.
  useEffect(() => {
    if (!isConnected) setShowSortType('downloadedFirst');
  }, [isConnected]);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Profile dropdown
  const {
    profileButtonRef,
    avatarUrl,
    isAuthenticated,
    dropdownState,
    handleProfilePress,
    handleLogout,
    handleLogin,
    handleSettings,
    handleSupport,
    handleViewProfile,
    userProfile,
    closeDropdown,
  } = useProfileDropdown();

  const searchBarFullWidth = headerWidth - (padding * 2);

  const { openShareTray } = useShareSheet();

  const handleShareProfile = useCallback(() => {
    if (!userProfile || !userProfile.is_public || !userProfile.username) {
      Alert.alert(
        'Public Profile',
        'Set up your public profile in Settings to share your favorites.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Settings',
            onPress: () => {
              if (isDesktop) {
                navigation.reset({ index: 0, routes: [{ name: 'Settings' as never }] });
              } else {
                navigation.navigate('Settings' as never);
              }
            },
          },
        ]
      );
      return;
    }

    const displayName = userProfile.display_name || userProfile.username;
    openShareTray({
      kind: 'profile',
      username: userProfile.username,
      displayName,
      showCount: favoriteShows.length,
      songCount: favoriteSongs.length,
    });
  }, [userProfile, favoriteShows.length, favoriteSongs.length, openShareTray, navigation, isDesktop]);

  // Create showsByYear structure from favoriteShows for the filter tray
  const favoriteShowsByYear = useMemo(() => {
    const byYear: ShowsByYear = {};
    favoriteShows.forEach(show => {
      const year = show.date.substring(0, 4);
      if (!byYear[year]) {
        byYear[year] = [];
      }
      byYear[year].push(show);
    });
    return byYear;
  }, [favoriteShows]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFavorites();
    setRefreshing(false);
  }, [refreshFavorites]);

  // Search bar handlers
  const handleSearchExpand = useCallback(() => {
    setIsSearchExpanded(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  }, []);

  // Scroll to top when sort type changes
  React.useEffect(() => {
    showsListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [showSortType]);

  React.useEffect(() => {
    songsListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [songSortType]);

  // Scroll to top when switching tabs
  React.useEffect(() => {
    if (activeTab === 'shows') {
      showsListRef.current?.scrollToOffset({ offset: 0, animated: false });
    } else {
      songsListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [activeTab]);

  // Filter and sort songs based on search query, filters, and sort type
  const sortedAndFilteredSongs = useMemo(() => {
    let songs = [...favoriteSongs];

    // Filter by selected years
    if (appliedFilters.selectedYears.length > 0) {
      songs = songs.filter(song => {
        const songYear = song.showDate.substring(0, 4);
        return appliedFilters.selectedYears.includes(songYear);
      });
    }

    // Filter by selected tags
    if (appliedFilters.selectedTags.length > 0) {
      const keep = makeShowTagFilter(appliedFilters.selectedTags);
      songs = songs.filter(song => keep(song.showDate));
    }

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      songs = songs.filter(song => {
        // Search in track title
        if (song.trackTitle.toLowerCase().includes(lowerQuery)) return true;

        // Search in date (various formats)
        if (song.showDate.includes(lowerQuery)) return true;

        // Search in venue
        if (song.venue?.toLowerCase().includes(lowerQuery)) return true;

        return false;
      });
    }

    // Sort based on selected sort type
    switch (songSortType) {
      case 'alphabetical':
        return songs.sort((a, b) => compareAlphabetical(a.trackTitle, b.trackTitle));

      case 'dateSavedNewest':
        return songs.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'newest'));

      case 'dateSavedOldest':
        return songs.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'oldest'));

      case 'performanceDateOldest':
        return songs.sort((a, b) => compareByDate(a.showDate, b.showDate, 'oldest'));

      case 'performanceDateNewest':
        return songs.sort((a, b) => compareByDate(a.showDate, b.showDate, 'newest'));

      default:
        return songs;
    }
  }, [favoriteSongs, songSortType, debouncedSearchQuery, appliedFilters]);

  // Filter and sort shows based on search query, filters, and sort type
  const sortedAndFilteredShows = useMemo(() => {
    // Saved shows plus complete-but-unsaved downloads (copied: the sorts
    // below mutate in place and must never reorder context state).
    let shows = [...mergeUnsavedDownloads(favoriteShows, downloadedShows)];

    // Filter by selected years
    if (appliedFilters.selectedYears.length > 0) {
      shows = shows.filter(show => {
        const showYear = show.date.substring(0, 4);
        return appliedFilters.selectedYears.includes(showYear);
      });
    }

    // Filter by selected tags
    if (appliedFilters.selectedTags.length > 0) {
      const keep = makeShowTagFilter(appliedFilters.selectedTags);
      shows = shows.filter(show => keep(show.date));
    }

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      shows = shows.filter(show => {
        // Search in title
        if (show.title?.toLowerCase().includes(lowerQuery)) return true;

        // Search in date
        if (show.date.includes(lowerQuery)) return true;

        // Search in venue
        if (show.venue?.toLowerCase().includes(lowerQuery)) return true;

        // Search in location
        if (show.location?.toLowerCase().includes(lowerQuery)) return true;

        return false;
      });
    }

    // Sort based on selected sort type
    switch (showSortType) {
      case 'alphabetical':
        return shows.sort((a, b) => compareAlphabetical(a.venue || '', b.venue || ''));

      case 'dateSavedNewest':
        return shows.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'newest'));

      case 'dateSavedOldest':
        return shows.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'oldest'));

      case 'performanceDateOldest':
        return shows.sort((a, b) => compareByDate(a.date, b.date, 'oldest'));

      case 'performanceDateNewest':
        return shows.sort((a, b) => compareByDate(a.date, b.date, 'newest'));

      case 'downloadedFirst':
        return sortDownloadedFirst(
          shows,
          s => downloadsByDate.has(s.date.slice(0, 10)),
          s => downloadsByDate.get(s.date.slice(0, 10)),
        );

      default:
        return shows;
    }
  }, [favoriteShows, downloadedShows, downloadsByDate, showSortType, debouncedSearchQuery, appliedFilters]);

  const filteredLibraryEntries = useMemo(() => {
    if (!debouncedSearchQuery) return libraryEntries;
    const lowerQuery = debouncedSearchQuery.toLowerCase();
    return libraryEntries.filter((entry) => {
      const name = entry.kind === 'tombstone' ? entry.name : entry.collection.name;
      return name.toLowerCase().includes(lowerQuery);
    });
  }, [libraryEntries, debouncedSearchQuery]);

  const handleShowPress = useCallback((show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', showDetailParams(show, {
      sourceConstraint: sourceConstraintFromTags(appliedFilters.selectedTags),
    }));
  }, [navigation, appliedFilters.selectedTags]);

  const handleSongPress = useCallback((song: FavoriteSong) => {
    playSong(song.showIdentifier, song.trackId);
  }, [playSong]);

  const handleSongLongPress = useCallback((song: FavoriteSong) => {
    Alert.alert(song.trackTitle, undefined, [
      { text: 'Add to Playlist', onPress: () => setPickerSong(song) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const songKeyExtractor = useCallback(
    (item: FavoriteSong) => `${item.trackId}-${item.showIdentifier}`,
    []
  );

  const renderSongItem = useCallback(({ item }: { item: FavoriteSong }) => (
    <SongCard
      song={item}
      isLoading={loadingSongId === `${item.trackId}-${item.showIdentifier}`}
      // Stable getter — doesn't change identity when some other song/show's
      // play count changes elsewhere in the app, so this callback (and the
      // memoized song rows relying on it) doesn't churn on every play.
      playCount={getPlayCountStable(item.trackTitle, item.showIdentifier)}
      onPress={handleSongPress}
      onLongPress={handleSongLongPress}
      correctVenue
    />
  ), [loadingSongId, getPlayCountStable, handleSongPress, handleSongLongPress]);

  // Shuffle handlers
  const handleShuffleShows = useCallback(() => {
    if (favoriteShows.length === 0) return;
    haptics.medium();
    startShuffleShows(favoriteShows);
  }, [favoriteShows, startShuffleShows]);

  const handleShuffleSongs = useCallback(() => {
    if (favoriteSongs.length === 0) return;
    haptics.medium();
    // Convert FavoriteSong to ShuffleSongItem (same interface, just different name)
    const shuffleSongs: ShuffleSongItem[] = favoriteSongs.map(song => ({
      trackId: song.trackId,
      trackTitle: song.trackTitle,
      showIdentifier: song.showIdentifier,
      showDate: song.showDate,
      venue: song.venue,
      streamUrl: song.streamUrl,
    }));
    startShuffleSongs(shuffleSongs);
  }, [favoriteSongs, startShuffleSongs]);


  if (isLoading) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.header, isDesktop && styles.headerDesktop]}>
            <View style={[styles.headerLeft, isDesktop && styles.headerLeftDesktop]}>
              {!isDesktop && <ProfileImage uri={null} style={styles.avatar} />}
              <Text style={styles.headerTitle}>Saved</Text>
            </View>
          </View>
        </View>
        <SkeletonLoader variant="showCard" count={10} />
      </View>
    );
  }

  const renderShowsTab = () => {
    if (favoriteShows.length === 0 && downloadsByDate.size === 0) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={null}
            title="Nothing saved yet"
            message={"Tap the save button on any show\nto add it to your saved shows."}
            transparentBackground
          />
        </View>
      );
    }

    return (
      <View style={styles.tabContentContainer}>
        {/* Action Bar Section with Gradient */}
        <View style={[styles.actionBarSection, isDesktop && styles.actionBarSectionDesktop]}>
          <View style={styles.actionRow}>
            {/* Sort label with arrow */}
            <View ref={showSortDropdown.buttonRef} collapsable={false}>
              <TouchableOpacity
                style={styles.sortLabelButton}
                onPress={showSortDropdown.open}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Sort shows by ${getSavedItemSortLabel(showSortType, 'show')}`}
                accessibilityHint="Double tap to change sort order"
              >
                <Ionicons name={getSavedItemSortIcon(showSortType)} size={16} color={COLORS.textSecondary} />
                <Text style={styles.sortLabelText}>{getSavedItemSortLabel(showSortType, 'show')}</Text>
              </TouchableOpacity>
            </View>

            {/* Play button */}
            <TouchableOpacity
              style={styles.shuffleButton}
              onPress={handleShuffleShows}
              accessibilityRole="button"
              accessibilityLabel="Shuffle all saved shows"
              accessibilityHint="Double tap to play your favorite shows in random order"
            >
              <Ionicons name="shuffle" size={16} color={COLORS.accent} />
              <Text style={styles.shuffleButtonText}>Play Shows</Text>
            </TouchableOpacity>
          </View>

          {/* Gradient fade overlay */}
          <LinearGradient
            colors={[COLORS.background, COLORS.background + '00']}
            locations={[0, 1]}
            style={[styles.actionBarGradient, isDesktop && styles.actionBarGradientDesktop, { pointerEvents: 'none' }]}
          />
        </View>

        {sortedAndFilteredShows.length === 0 && debouncedSearchQuery.trim() ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No shows found matching "{debouncedSearchQuery}"</Text>
          </View>
        ) : (
          <FlatList
            ref={showsListRef}
            data={sortedAndFilteredShows}
            keyExtractor={(item) => item.primaryIdentifier}
            renderItem={({ item }) => {
              const isDownloaded = downloadsByDate.has(item.date.slice(0, 10));
              return (
                <ShowCard
                  show={item}
                  onPress={handleShowPress}
                  downloaded={isDownloaded}
                  dimmed={!isConnected && !isDownloaded}
                />
              );
            }}
            contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={Keyboard.dismiss}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.accent}
              />
            }
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={11}
            initialNumToRender={10}
          />
        )}
      </View>
    );
  };

  const renderSongsTab = () => {
    if (favoriteSongs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={null}
            title="Nothing saved yet"
            message={"Tap the save button on any song to\nadd it to your saved songs."}
            transparentBackground
          />
        </View>
      );
    }

    return (
      <View style={styles.tabContentContainer}>
        {/* Action Bar Section with Gradient */}
        <View style={[styles.actionBarSection, isDesktop && styles.actionBarSectionDesktop]}>
          <View style={styles.actionRow}>
            {/* Sort label with arrow */}
            <View ref={songSortDropdown.buttonRef} collapsable={false}>
              <TouchableOpacity
                style={styles.sortLabelButton}
                onPress={songSortDropdown.open}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Sort songs by ${getSavedItemSortLabel(songSortType, 'song')}`}
                accessibilityHint="Double tap to change sort order"
              >
                <Ionicons name={getSavedItemSortIcon(songSortType)} size={16} color={COLORS.textSecondary} />
                <Text style={styles.sortLabelText}>{getSavedItemSortLabel(songSortType, 'song')}</Text>
              </TouchableOpacity>
            </View>

            {/* Play button */}
            <TouchableOpacity
              style={styles.shuffleButton}
              onPress={handleShuffleSongs}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Shuffle all saved songs"
              accessibilityHint="Double tap to play your favorite songs in random order"
            >
              <Ionicons name="shuffle" size={16} color={COLORS.accent} />
              <Text style={styles.shuffleButtonText}>Play Songs</Text>
            </TouchableOpacity>
          </View>

          {/* Gradient fade overlay */}
          <LinearGradient
            colors={[COLORS.background, COLORS.background + '00']}
            locations={[0, 1]}
            style={[styles.actionBarGradient, isDesktop && styles.actionBarGradientDesktop, { pointerEvents: 'none' }]}
          />
        </View>

        {sortedAndFilteredSongs.length === 0 && debouncedSearchQuery.trim() ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No songs found matching "{debouncedSearchQuery}"</Text>
          </View>
        ) : (
          <FlatList
            ref={songsListRef}
            data={sortedAndFilteredSongs}
            keyExtractor={songKeyExtractor}
            renderItem={renderSongItem}
            contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={Keyboard.dismiss}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.accent}
              />
            }
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            updateCellsBatchingPeriod={50}
            windowSize={11}
            initialNumToRender={15}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <ScreenHeader
        title="Saved"
        isDesktop={isDesktop}
        topPadding={insets.top + 8}
        onHeaderLayout={(e) => setHeaderWidth(e.nativeEvent.layout.width)}
        isSearchExpanded={isSearchExpanded}
        profileButtonRef={profileButtonRef}
        avatarUrl={avatarUrl}
        isAuthenticated={isAuthenticated}
        onProfilePress={handleProfilePress}
        showGradient={false}
        rightContent={
          <>
            {/* Share Profile Button */}
            {isAuthenticated && !isSearchExpanded && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShareProfile}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Share saved"
              >
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={COLORS.textHint}
                />
              </TouchableOpacity>
            )}

            {/* Filter button */}
            {!isSearchExpanded && <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters(appliedFilters) && styles.filterButtonActive,
              ]}
              onPress={() => setFilterTrayOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={hasActiveFilters(appliedFilters) ? 'Filters active' : 'Filters'}
              accessibilityHint="Double tap to open filter options"
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={hasActiveFilters(appliedFilters) ? COLORS.textPrimary : COLORS.textHint}
              />
            </TouchableOpacity>}

            {/* Animated Search Bar */}
            <AnimatedSearchBar
              isExpanded={isSearchExpanded}
              onExpand={handleSearchExpand}
              onClose={handleSearchClose}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search favorites"
              expandedWidth={searchBarFullWidth}
            />
          </>
        }
      >
        {/* Tab Navigation */}
        <SegmentedTabs
          tabs={FAVORITES_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          containerStyle={styles.tabContainer}
          getAccessibilityHint={(tab) => `Double tap to view ${tab}`}
        />
      </ScreenHeader>

      {/* Filter Tray Modal */}
      <ShowsFilterTray
        isOpen={filterTrayOpen}
        onClose={() => setFilterTrayOpen(false)}
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        showsByYear={favoriteShowsByYear}
      />

      {/* Profile Dropdown */}
      <ProfileDropdown
        state={dropdownState}
        isAuthenticated={isAuthenticated}
        onClose={closeDropdown}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSettings={handleSettings}
        onSupport={handleSupport}
        onViewProfile={handleViewProfile}
      />

      {/* Tab Content */}
      {activeTab === 'shows' ? (
        renderShowsTab()
      ) : activeTab === 'songs' ? (
        renderSongsTab()
      ) : (
        <>
          <CollectionsTab
            entries={filteredLibraryEntries}
            onRemoveTombstone={removeTombstone}
            onEntryPress={(e: LibraryCollectionEntry) => {
              if (e.kind === 'tombstone') return;
              navigation.navigate('CollectionDetail', { collectionId: e.collection.id });
            }}
            onEntryLongPress={(e: LibraryCollectionEntry) => {
              if (e.kind === 'tombstone') {
                Alert.alert(e.name, 'No longer available.', [
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeTombstone(e.savedId),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]);
                return;
              }
              if (e.kind === 'owned') {
                Alert.alert(e.collection.name, undefined, [
                  {
                    text: 'Duplicate',
                    onPress: async () => {
                      try {
                        const created = await duplicateCollection(e.collection.id);
                        navigation.navigate('CollectionDetail', { collectionId: created.id });
                      } catch (err) {
                        logger.api.error('duplicate failed', err);
                        Alert.alert('Could not duplicate collection', 'Please try again.');
                      }
                    },
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Delete collection?', 'This cannot be undone.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteCollection(e.collection.id) },
                      ]);
                    },
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]);
                return;
              }
              // saved
              Alert.alert(e.collection.name, `Saved from @${e.ownerUsername}`, [
                {
                  text: 'Duplicate',
                  onPress: async () => {
                    try {
                      const created = await duplicateCollection(e.collection.id);
                      navigation.navigate('CollectionDetail', { collectionId: created.id });
                    } catch (err) {
                      logger.api.error('duplicate failed', err);
                      Alert.alert('Could not duplicate collection', 'Please try again.');
                    }
                  },
                },
                {
                  text: 'Unsave',
                  style: 'destructive',
                  onPress: () => unsaveCollection(e.collection.id),
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            onCreate={(type) => {
              setCreateCollectionType(type);
              setCreateCollectionVisible(true);
            }}
            emptyMessage="Tap + to create one."
          />
          <CreateCollectionModal
            visible={createCollectionVisible}
            onClose={() => setCreateCollectionVisible(false)}
            initialType={createCollectionType}
          />
        </>
      )}

      {pickerSong && (
        <AddToCollectionPicker
          visible
          onClose={() => setPickerSong(null)}
          type="playlist"
          itemIdentifier={`${pickerSong.showIdentifier}::${pickerSong.trackId}`}
          // pickerSong is already a FavoriteSong (not a track+show pair), so
          // toFavoriteSong's signature doesn't apply here — it's already the
          // exact shape itemMetadata needs.
          itemMetadata={pickerSong}
        />
      )}

      {/* Song Sort Dropdown */}
      <SortDropdown
        visible={songSortDropdown.visible}
        onClose={songSortDropdown.close}
        position={songSortDropdown.position}
        options={SAVED_SONG_SORT_OPTIONS}
        selectedValue={songSortType}
        onSelect={setSongSortType}
      />

      {/* Show Sort Dropdown */}
      <SortDropdown
        visible={showSortDropdown.visible}
        onClose={showSortDropdown.close}
        position={showSortDropdown.position}
        options={SAVED_SHOW_SORT_OPTIONS}
        selectedValue={showSortType}
        onSelect={setShowSortType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerSection: {
    zIndex: 10,
    backgroundColor: COLORS.background,
  },
  headerSectionDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
  headerDesktop: {
    paddingHorizontal: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    position: 'absolute',
    left: LAYOUT.HORIZONTAL_PADDING,
    top: 0,
    bottom: SPACING.lg,
    zIndex: 20,
  },
  headerLeftDesktop: {
    left: 32,
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBackground,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading2,
  },
  filterButton: {
    width: LAYOUT.headerButtonSize,
    height: LAYOUT.headerButtonSize,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.accent,
  },
  headerButton: {
    width: LAYOUT.headerButtonSize,
    height: LAYOUT.headerButtonSize,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBarSection: {
    backgroundColor: COLORS.background,
    zIndex: 10,
    overflow: 'visible',
  },
  actionBarSectionDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  actionBarGradient: {
    position: 'absolute',
    // Short enough that the first list item (now only SPACING.xs below the
    // bar) rests clear of the fade; scrolled content still dissolves under it.
    bottom: -12,
    left: 0,
    right: 0,
    height: 12,
  },
  actionBarGradientDesktop: {
    display: 'none',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.md,
  },
  sortLabelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sortLabelText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Margins only — the shared row/gap/tab/active/inactive styling lives in <SegmentedTabs>.
  tabContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xxxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxxl,
    ...(Platform.OS === 'android' && {
      marginBottom: 80,
    }),
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    // The sort/action row above already carries SPACING.md of bottom padding,
    // so the list itself only needs a sliver before the first item.
    paddingTop: SPACING.xs,
    paddingBottom: LAYOUT.listBottomPadding,
  },
  listContentDesktop: {
    padding: 16,
  },
  tabContentContainer: {
    flex: 1,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  shuffleButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
});
