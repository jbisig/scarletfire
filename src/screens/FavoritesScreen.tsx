import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { AnimatedSearchBar } from '../components/AnimatedSearchBar';
import { SortDropdown, SortOption } from '../components/SortDropdown';
import { ShowCard } from '../components/ShowCard';
import { ShowsFilterTray, ShowsFilterState, createEmptyFilterState, hasActiveFilters } from '../components/ShowsFilterTray';
import { GratefulDeadShow } from '../types/show.types';
import { ShuffleSongItem } from '../types/player.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import showsData from '../data/shows.json';
import { ShowsByYear } from '../types/show.types';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { haptics } from '../services/hapticService';
import { archiveApi } from '../services/archiveApi';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { getOfficialReleasesForDate, expandDisplaySeries } from '../data/officialReleases';
import { StarRating } from '../components/StarRating';
import { PlayCountBadge } from '../components/PlayCountBadge';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useDebounce } from '../hooks/useDebounce';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';
import { logger } from '../utils/logger';

// Default profile image for logged out users
const LOGGED_OUT_PROFILE = require('../../assets/images/logged-out-pfp.png');

// Layout constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = SPACING.xl;
// Full width for header search = screen - padding on both sides - filter button - gap
const SEARCH_BAR_FULL_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - LAYOUT.headerButtonSize - LAYOUT.headerButtonGap;

const allShowsByYear = showsData as ShowsByYear;

// Look up correct venue by show date
function getCorrectVenue(showDate: string): string | undefined {
  const normalizedDate = showDate.substring(0, 10); // YYYY-MM-DD
  const year = normalizedDate.substring(0, 4);
  const yearShows = allShowsByYear[year];
  if (!yearShows) return undefined;

  const show = yearShows.find(s => s.date.substring(0, 10) === normalizedDate);
  if (show) {
    return getVenueFromShow(show);
  }
  return undefined;
}

// Memoized song item component to prevent unnecessary re-renders
interface SongItemProps {
  song: FavoriteSong;
  isLoading: boolean;
  playCount: number;
  onPress: (song: FavoriteSong) => void;
}

const SongItem = React.memo<SongItemProps>(({ song, isLoading, playCount, onPress }) => {
  const performanceRating = getSongPerformanceRating(song.trackTitle, song.showDate);
  const venue = getCorrectVenue(song.showDate) || song.venue;

  return (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => onPress(song)}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <View style={styles.songContentRow}>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {song.trackTitle}
          </Text>

          <View style={styles.songDateRow}>
            <Text style={styles.songDate}>
              {formatDate(song.showDate)}
            </Text>
            {performanceRating && (
              <StarRating tier={performanceRating} size={14} />
            )}
          </View>

          {venue && (
            <Text style={styles.songVenue} numberOfLines={1}>
              {venue}
            </Text>
          )}
        </View>

        <PlayCountBadge count={playCount} size="small" />
      </View>
    </TouchableOpacity>
  );
});

SongItem.displayName = 'SongItem';

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Favorites'>;

type TabType = 'shows' | 'songs';
type SongSortType = 'alphabetical' | 'dateSavedNewest' | 'dateSavedOldest' | 'performanceDateOldest' | 'performanceDateNewest';
type ShowSortType = 'alphabetical' | 'dateSavedNewest' | 'dateSavedOldest' | 'performanceDateOldest' | 'performanceDateNewest';

const SONG_SORT_OPTIONS: SortOption<SongSortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'dateSavedOldest', label: 'Date Saved (Oldest First)' },
  { value: 'dateSavedNewest', label: 'Date Saved (Newest First)' },
  { value: 'performanceDateOldest', label: 'Performance Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Performance Date (Newest First)' },
];

const SHOW_SORT_OPTIONS: SortOption<ShowSortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'dateSavedOldest', label: 'Date Saved (Oldest First)' },
  { value: 'dateSavedNewest', label: 'Date Saved (Newest First)' },
  { value: 'performanceDateOldest', label: 'Show Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Show Date (Newest First)' },
];

export function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { favoriteShows, favoriteSongs, isLoading, refreshFavorites } = useFavorites();
  const { loadTrack, startShuffleSongs, startShuffleShows } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const [activeTab, setActiveTab] = useState<TabType>('shows');
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const [songSortType, setSongSortType] = useState<SongSortType>('alphabetical');
  const [showSortType, setShowSortType] = useState<ShowSortType>('performanceDateOldest');
  const [showSongSortModal, setShowSongSortModal] = useState(false);
  const [showShowSortModal, setShowShowSortModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortButtonPosition, setShowSortButtonPosition] = useState({ top: 0, left: 0 });
  const [songSortButtonPosition, setSongSortButtonPosition] = useState({ top: 0, left: 0 });
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [filterTrayOpen, setFilterTrayOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ShowsFilterState>(createEmptyFilterState);
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const showSortButtonRef = useRef<View>(null);
  const songSortButtonRef = useRef<View>(null);
  const showsListRef = useRef<FlatList>(null);
  const songsListRef = useRef<FlatList>(null);

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
    closeDropdown,
  } = useProfileDropdown();

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

  const handleShowSortPress = () => {
    showSortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setShowSortButtonPosition({ top: pageY + height + 8, left: pageX });
      setShowShowSortModal(true);
    });
  };

  const handleSongSortPress = () => {
    songSortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSongSortButtonPosition({ top: pageY + height + 8, left: pageX });
      setShowSongSortModal(true);
    });
  };

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

    // Filter by selected series (official releases)
    if (appliedFilters.selectedSeries.length > 0) {
      const expandedSeries = expandDisplaySeries(appliedFilters.selectedSeries);
      songs = songs.filter(song => {
        const releases = getOfficialReleasesForDate(song.showDate);
        return releases.some(r => expandedSeries.includes(r.series));
      });
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
        return songs.sort((a, b) => a.trackTitle.localeCompare(b.trackTitle));

      case 'dateSavedNewest':
        return songs.sort((a, b) => {
          if (!a.savedAt && !b.savedAt) return 0;
          if (!a.savedAt) return 1;
          if (!b.savedAt) return -1;
          return b.savedAt - a.savedAt;
        });

      case 'dateSavedOldest':
        return songs.sort((a, b) => {
          if (!a.savedAt && !b.savedAt) return 0;
          if (!a.savedAt) return -1;
          if (!b.savedAt) return 1;
          return a.savedAt - b.savedAt;
        });

      case 'performanceDateOldest':
        return songs.sort((a, b) => a.showDate.localeCompare(b.showDate));

      case 'performanceDateNewest':
        return songs.sort((a, b) => b.showDate.localeCompare(a.showDate));

      default:
        return songs;
    }
  }, [favoriteSongs, songSortType, debouncedSearchQuery, appliedFilters]);

  // Filter and sort shows based on search query, filters, and sort type
  const sortedAndFilteredShows = useMemo(() => {
    let shows = [...favoriteShows];

    // Filter by selected years
    if (appliedFilters.selectedYears.length > 0) {
      shows = shows.filter(show => {
        const showYear = show.date.substring(0, 4);
        return appliedFilters.selectedYears.includes(showYear);
      });
    }

    // Filter by selected series (official releases)
    if (appliedFilters.selectedSeries.length > 0) {
      const expandedSeries = expandDisplaySeries(appliedFilters.selectedSeries);
      shows = shows.filter(show => {
        const releases = getOfficialReleasesForDate(show.date);
        return releases.some(r => expandedSeries.includes(r.series));
      });
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
        return shows.sort((a, b) => {
          const venueA = a.venue || '';
          const venueB = b.venue || '';
          return venueA.localeCompare(venueB);
        });

      case 'dateSavedNewest':
        return shows.sort((a, b) => {
          if (!a.savedAt && !b.savedAt) return 0;
          if (!a.savedAt) return 1;
          if (!b.savedAt) return -1;
          return b.savedAt - a.savedAt;
        });

      case 'dateSavedOldest':
        return shows.sort((a, b) => {
          if (!a.savedAt && !b.savedAt) return 0;
          if (!a.savedAt) return -1;
          if (!b.savedAt) return 1;
          return a.savedAt - b.savedAt;
        });

      case 'performanceDateOldest':
        return shows.sort((a, b) => a.date.localeCompare(b.date));

      case 'performanceDateNewest':
        return shows.sort((a, b) => b.date.localeCompare(a.date));

      default:
        return shows;
    }
  }, [favoriteShows, showSortType, debouncedSearchQuery, appliedFilters]);

  const getSongSortLabel = (sortType: SongSortType): string => {
    switch (sortType) {
      case 'alphabetical':
        return 'Alphabetical';
      case 'dateSavedNewest':
      case 'dateSavedOldest':
        return 'Date Saved';
      case 'performanceDateOldest':
      case 'performanceDateNewest':
        return 'Perform. Date';
      default:
        return 'Sort';
    }
  };

  const getSongSortIcon = (sortType: SongSortType): 'arrow-up' | 'arrow-down' => {
    switch (sortType) {
      case 'dateSavedOldest':
      case 'performanceDateOldest':
        return 'arrow-up';
      default:
        return 'arrow-down';
    }
  };

  const getShowSortLabel = (sortType: ShowSortType): string => {
    switch (sortType) {
      case 'alphabetical':
        return 'Alphabetical';
      case 'dateSavedNewest':
      case 'dateSavedOldest':
        return 'Date Saved';
      case 'performanceDateOldest':
      case 'performanceDateNewest':
        return 'Perform. Date';
      default:
        return 'Sort';
    }
  };

  const getShowSortIcon = (sortType: ShowSortType): 'arrow-up' | 'arrow-down' => {
    switch (sortType) {
      case 'dateSavedOldest':
      case 'performanceDateOldest':
        return 'arrow-up';
      case 'alphabetical':
        return 'arrow-down';
      default:
        return 'arrow-down';
    }
  };

  const handleShowPress = useCallback((show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  }, [navigation]);

  const handleSongPress = useCallback(async (song: FavoriteSong) => {
    try {
      setLoadingSongId(`${song.trackId}-${song.showIdentifier}`);

      // Fetch the show details to get all tracks
      const showDetail = await archiveApi.getShowDetail(song.showIdentifier, false);

      // Find the matching track
      const track = showDetail.tracks.find(t => t.id === song.trackId);

      if (track) {
        await loadTrack(track, showDetail, showDetail.tracks);
      }
    } catch (error) {
      logger.player.error('Failed to load song:', error);
    } finally {
      setLoadingSongId(null);
    }
  }, [loadTrack]);

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
      <View style={styles.container}>
        <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={LOGGED_OUT_PROFILE} style={styles.avatar} />
              <Text style={styles.headerTitle}>Favorites</Text>
            </View>
          </View>
        </View>
        <SkeletonLoader variant="showCard" count={10} />
      </View>
    );
  }

  const renderShowsTab = () => {
    if (favoriteShows.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Tap the save button on any show{'\n'}to add it to your favorites.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContentContainer}>
        {/* Action Bar Section with Gradient */}
        <View style={styles.actionBarSection}>
          <View style={styles.actionRow}>
            {/* Sort label with arrow */}
            <View ref={showSortButtonRef} collapsable={false}>
              <TouchableOpacity
                style={styles.sortLabelButton}
                onPress={handleShowSortPress}
                activeOpacity={0.7}
              >
                <Ionicons name={getShowSortIcon(showSortType)} size={16} color={COLORS.textSecondary} />
                <Text style={styles.sortLabelText}>{getShowSortLabel(showSortType)}</Text>
              </TouchableOpacity>
            </View>

            {/* Play button */}
            <TouchableOpacity
              style={styles.shuffleButton}
              onPress={handleShuffleShows}
              accessibilityRole="button"
              accessibilityLabel="Shuffle all favorite shows"
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
            style={styles.actionBarGradient}
            pointerEvents="none"
          />
        </View>

        {sortedAndFilteredShows.length === 0 && debouncedSearchQuery.trim() ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No shows found matching "{debouncedSearchQuery}"</Text>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <FlatList
            ref={showsListRef}
            data={sortedAndFilteredShows}
            keyExtractor={(item) => item.primaryIdentifier}
            renderItem={({ item }) => (
              <ShowCard show={item} onPress={handleShowPress} />
            )}
            contentContainerStyle={styles.listContent}
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
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Tap the save button on any song to{'\n'}add it to your favorites.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContentContainer}>
        {/* Action Bar Section with Gradient */}
        <View style={styles.actionBarSection}>
          <View style={styles.actionRow}>
            {/* Sort label with arrow */}
            <View ref={songSortButtonRef} collapsable={false}>
              <TouchableOpacity
                style={styles.sortLabelButton}
                onPress={handleSongSortPress}
                activeOpacity={0.7}
              >
                <Ionicons name={getSongSortIcon(songSortType)} size={16} color={COLORS.textSecondary} />
                <Text style={styles.sortLabelText}>{getSongSortLabel(songSortType)}</Text>
              </TouchableOpacity>
            </View>

            {/* Play button */}
            <TouchableOpacity
              style={styles.shuffleButton}
              onPress={handleShuffleSongs}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Shuffle all favorite songs"
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
            style={styles.actionBarGradient}
            pointerEvents="none"
          />
        </View>

        {sortedAndFilteredSongs.length === 0 && debouncedSearchQuery.trim() ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No songs found matching "{debouncedSearchQuery}"</Text>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <FlatList
            ref={songsListRef}
            data={sortedAndFilteredSongs}
            keyExtractor={(item) => `${item.trackId}-${item.showIdentifier}`}
            renderItem={({ item }) => (
              <SongItem
                song={item}
                isLoading={loadingSongId === `${item.trackId}-${item.showIdentifier}`}
                playCount={getPlayCount(item.trackTitle, item.showIdentifier)}
                onPress={handleSongPress}
              />
            )}
            contentContainerStyle={styles.listContent}
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
    <View style={styles.container}>
      {/* Header Section with Gradient Fade */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
        {/* Custom Header: Avatar + Title + Search + Filter */}
        <View style={styles.header}>
          {/* Left side: Avatar and Title (gets covered by search bar) */}
          <View style={styles.headerLeft}>
            <TouchableOpacity
              ref={profileButtonRef}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              <Image
                source={isAuthenticated && avatarUrl
                  ? { uri: avatarUrl }
                  : LOGGED_OUT_PROFILE
                }
                style={styles.avatar}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Favorites</Text>
          </View>

          {/* Right side: Search and Filter buttons */}
          <View style={styles.headerRight}>
            {/* Animated Search Bar */}
            <AnimatedSearchBar
              isExpanded={isSearchExpanded}
              onExpand={handleSearchExpand}
              onClose={handleSearchClose}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search favorites"
              expandedWidth={SEARCH_BAR_FULL_WIDTH}
            />

            {/* Filter button - always visible */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters(appliedFilters) && styles.filterButtonActive,
              ]}
              onPress={() => setFilterTrayOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={hasActiveFilters(appliedFilters) ? COLORS.textPrimary : COLORS.textHint}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer} accessibilityRole="tablist">
          {(['shows', 'songs'] as const).map((tab) => (
            <TouchableOpacity
              key={`${tab}-${activeTab}`}
              style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={`${tab === 'shows' ? 'Shows' : 'Songs'} tab`}
              accessibilityState={{ selected: activeTab === tab }}
              accessibilityHint={`Double tap to view favorite ${tab}`}
            >
              <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                {tab === 'shows' ? 'Shows' : 'Songs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
      />

      {/* Tab Content */}
      {activeTab === 'shows' ? renderShowsTab() : renderSongsTab()}

      {/* Song Sort Dropdown */}
      <SortDropdown
        visible={showSongSortModal}
        onClose={() => setShowSongSortModal(false)}
        position={songSortButtonPosition}
        options={SONG_SORT_OPTIONS}
        selectedValue={songSortType}
        onSelect={setSongSortType}
      />

      {/* Show Sort Dropdown */}
      <SortDropdown
        visible={showShowSortModal}
        onClose={() => setShowShowSortModal(false)}
        position={showSortButtonPosition}
        options={SHOW_SORT_OPTIONS}
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
  headerSection: {
    zIndex: 10,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    position: 'absolute',
    left: HORIZONTAL_PADDING,
    top: 0,
    bottom: SPACING.lg,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.headerButtonGap,
    marginLeft: 'auto',
    zIndex: 10,
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
  headerGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  actionBarSection: {
    backgroundColor: COLORS.background,
    zIndex: 10,
    overflow: 'visible',
  },
  actionBarGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
  },
  activeTab: {
    backgroundColor: COLORS.accent,
  },
  inactiveTab: {
    backgroundColor: COLORS.cardBackground,
  },
  activeTabText: {
    fontSize: 20,
    fontFamily: 'FamiljenGrotesk-SemiBold',
    color: COLORS.textPrimary,
  },
  inactiveTabText: {
    fontSize: 20,
    fontFamily: 'FamiljenGrotesk-SemiBold',
    color: COLORS.textSecondary,
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
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading3,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingTop: SPACING.sm + 8,
    paddingBottom: LAYOUT.listBottomPadding,
  },
  songItem: {
    paddingVertical: 8,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  songContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  songTitle: {
    ...TYPOGRAPHY.heading4,
    marginBottom: SPACING.xs,
  },
  songDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  songDate: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  songVenue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
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
