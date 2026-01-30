import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  LayoutChangeEvent,
  RefreshControl,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { ShowCard } from '../components/ShowCard';
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
import { StarRating } from '../components/StarRating';
import { PlayCountBadge } from '../components/PlayCountBadge';
import { LoadingState } from '../components/StateViews';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useDebounce } from '../hooks/useDebounce';
import { PageHeader } from '../components/PageHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

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

export function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { favoriteShows, favoriteSongs, isLoading, refreshFavorites } = useFavorites();
  const { loadTrack, startShuffleSongs, startShuffleShows } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const [activeTab, setActiveTab] = useState<TabType>('shows');
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const [songSortType, setSongSortType] = useState<SongSortType>('alphabetical');
  const [showSortType, setShowSortType] = useState<ShowSortType>('performanceDateOldest');
  const [showSongSortModal, setShowSongSortModal] = useState(false);
  const [showShowSortModal, setShowShowSortModal] = useState(false);
  const [showSearchQuery, setShowSearchQuery] = useState('');
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [showSortButtonPosition, setShowSortButtonPosition] = useState({ top: 0, right: 0 });
  const [songSortButtonPosition, setSongSortButtonPosition] = useState({ top: 0, right: 0 });
  const [isShowSearchExpanded, setIsShowSearchExpanded] = useState(false);
  const [isSongSearchExpanded, setIsSongSearchExpanded] = useState(false);
  const debouncedShowSearchQuery = useDebounce(showSearchQuery, 400);
  const debouncedSongSearchQuery = useDebounce(songSearchQuery, 400);
  const showSearchInputRef = useRef<TextInput>(null);
  const songSearchInputRef = useRef<TextInput>(null);
  const showSortButtonRef = useRef<View>(null);
  const songSortButtonRef = useRef<View>(null);
  const showsListRef = useRef<FlatList>(null);
  const songsListRef = useRef<FlatList>(null);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Tab sliding animation
  const [tabWidth, setTabWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Search expansion animations (for other buttons fading out)
  const showSearchAnim = useRef(new Animated.Value(0)).current;
  const songSearchAnim = useRef(new Animated.Value(0)).current;
  // Input fade-in animations
  const showInputAnim = useRef(new Animated.Value(0)).current;
  const songInputAnim = useRef(new Animated.Value(0)).current;
  // Close button fade-in animations
  const showCloseButtonAnim = useRef(new Animated.Value(0)).current;
  const songCloseButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activeTab === 'shows' ? 0 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [activeTab, slideAnim]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFavorites();
    setRefreshing(false);
  }, [refreshFavorites]);

  const handleTabContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    // Account for padding (4px on each side)
    setTabWidth((width - 8) / 2);
  };

  const handleShowSortPress = () => {
    showSortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setShowSortButtonPosition({ top: pageY + height + 8, right: 20 });
      setShowShowSortModal(true);
    });
  };

  const handleSongSortPress = () => {
    songSortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSongSortButtonPosition({ top: pageY + height + 8, right: 20 });
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

  // Filter and sort songs based on search query and sort type
  const sortedAndFilteredSongs = useMemo(() => {
    let songs = [...favoriteSongs];

    // Filter by search query
    if (debouncedSongSearchQuery.trim()) {
      const lowerQuery = debouncedSongSearchQuery.toLowerCase();
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
  }, [favoriteSongs, songSortType, debouncedSongSearchQuery]);

  // Filter and sort shows based on search query and sort type
  const sortedAndFilteredShows = useMemo(() => {
    let shows = [...favoriteShows];

    // Filter by search query
    if (debouncedShowSearchQuery.trim()) {
      const lowerQuery = debouncedShowSearchQuery.toLowerCase();
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
  }, [favoriteShows, showSortType, debouncedShowSearchQuery]);

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
      console.error('Failed to load song:', error);
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

  // Search expand/collapse handlers
  const handleShowSearchExpand = useCallback(() => {
    // Reset animations
    showInputAnim.setValue(0);
    showCloseButtonAnim.setValue(0);

    // Configure smooth layout animation for icon sliding
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    });
    setIsShowSearchExpanded(true);

    // Fade out other buttons with easing
    Animated.timing(showSearchAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Fade in input after short delay
    Animated.sequence([
      Animated.delay(80),
      Animated.timing(showInputAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in close button after expansion completes
    Animated.sequence([
      Animated.delay(250),
      Animated.timing(showCloseButtonAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => showSearchInputRef.current?.focus(), 150);
  }, [showSearchAnim, showInputAnim, showCloseButtonAnim]);

  const handleShowSearchCollapse = useCallback(() => {
    showSearchInputRef.current?.blur();

    // Hide input and close button immediately
    showInputAnim.setValue(0);
    showCloseButtonAnim.setValue(0);

    // Reset animation value first so buttons fade in from 0
    showSearchAnim.setValue(1);

    // Configure smooth layout animation for icon sliding back
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    });
    setIsShowSearchExpanded(false);
    setShowSearchQuery('');

    // Fade in other buttons after collapse animation progresses
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(showSearchAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [showSearchAnim, showInputAnim, showCloseButtonAnim]);

  const handleSongSearchExpand = useCallback(() => {
    // Reset animations
    songInputAnim.setValue(0);
    songCloseButtonAnim.setValue(0);

    // Configure smooth layout animation for icon sliding
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    });
    setIsSongSearchExpanded(true);

    // Fade out other buttons with easing
    Animated.timing(songSearchAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Fade in input after short delay
    Animated.sequence([
      Animated.delay(80),
      Animated.timing(songInputAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in close button after expansion completes
    Animated.sequence([
      Animated.delay(250),
      Animated.timing(songCloseButtonAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => songSearchInputRef.current?.focus(), 150);
  }, [songSearchAnim, songInputAnim, songCloseButtonAnim]);

  const handleSongSearchCollapse = useCallback(() => {
    songSearchInputRef.current?.blur();

    // Hide input and close button immediately
    songInputAnim.setValue(0);
    songCloseButtonAnim.setValue(0);

    // Reset animation value first so buttons fade in from 0
    songSearchAnim.setValue(1);

    // Configure smooth layout animation for icon sliding back
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    });
    setIsSongSearchExpanded(false);
    setSongSearchQuery('');

    // Fade in other buttons after collapse animation progresses
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(songSearchAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [songSearchAnim, songInputAnim, songCloseButtonAnim]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Favorites" />
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

    // Animated styles for shows search
    const showShuffleOpacity = showSearchAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.tabContentContainer}>
        {/* Action Bar Section with Gradient */}
        <View style={styles.actionBarSection}>
          <View style={styles.searchRow}>
            {/* Search input - expands to take full row */}
            <TouchableOpacity
              style={[
                styles.searchPillButton,
                isShowSearchExpanded && styles.searchInputContainerExpanded,
              ]}
              onPress={!isShowSearchExpanded ? handleShowSearchExpand : undefined}
              activeOpacity={1}
            >
              <Ionicons
                name="search"
                size={20}
                color={COLORS.textHint}
                style={isShowSearchExpanded ? styles.searchIconExpanded : undefined}
              />
              {isShowSearchExpanded && (
                <>
                  <Animated.View style={{ opacity: showInputAnim, flex: 1 }}>
                    <TextInput
                      ref={showSearchInputRef}
                      style={styles.searchInput}
                      placeholder="Date, venue, location"
                      placeholderTextColor={COLORS.textHint}
                      value={showSearchQuery}
                      onChangeText={setShowSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor="#FFFFFF"
                    />
                  </Animated.View>
                  <Animated.View style={{ opacity: showCloseButtonAnim }}>
                    <TouchableOpacity
                      style={styles.closeSearchButtonInline}
                      onPress={handleShowSearchCollapse}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.textHint} />
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </TouchableOpacity>

            {/* Sort button - fades out */}
            {!isShowSearchExpanded && (
              <Animated.View style={{ opacity: showShuffleOpacity, flex: 1 }}>
                <View ref={showSortButtonRef} collapsable={false} style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={styles.sortPillButton}
                    onPress={handleShowSortPress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sortPillButtonText}>
                      {getShowSortLabel(showSortType)}
                    </Text>
                    <Ionicons name={getShowSortIcon(showSortType)} size={18} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Shuffle button - fades out */}
            {!isShowSearchExpanded && (
              <Animated.View style={{ opacity: showShuffleOpacity }}>
                <TouchableOpacity
                  style={styles.shuffleButton}
                  onPress={handleShuffleShows}
                  accessibilityRole="button"
                  accessibilityLabel="Shuffle all favorite shows"
                  accessibilityHint="Double tap to play your favorite shows in random order"
                >
                  <Ionicons name="shuffle" size={20} color={COLORS.textPrimary} />
                  <Text style={styles.shuffleButtonText}>Shuffle</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Gradient fade overlay */}
          <LinearGradient
            colors={[COLORS.background, `${COLORS.background}B3`, `${COLORS.background}4D`, 'transparent']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.actionBarGradient}
            pointerEvents="none"
          />
        </View>

        {sortedAndFilteredShows.length === 0 && debouncedShowSearchQuery.trim() ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No shows found matching "{debouncedShowSearchQuery}"</Text>
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

    // Animated styles for songs search
    const songShuffleOpacity = songSearchAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.tabContentContainer}>
        {/* Action Bar Section with Gradient */}
        <View style={styles.actionBarSection}>
          <View style={styles.searchRow}>
            {/* Search input - expands to take full row */}
            <TouchableOpacity
              style={[
                styles.searchPillButton,
                isSongSearchExpanded && styles.searchInputContainerExpanded,
              ]}
              onPress={!isSongSearchExpanded ? handleSongSearchExpand : undefined}
              activeOpacity={1}
            >
              <Ionicons
                name="search"
                size={20}
                color={COLORS.textHint}
                style={isSongSearchExpanded ? styles.searchIconExpanded : undefined}
              />
              {isSongSearchExpanded && (
                <>
                  <Animated.View style={{ opacity: songInputAnim, flex: 1 }}>
                    <TextInput
                      ref={songSearchInputRef}
                      style={styles.searchInput}
                      placeholder="Song, date, venue"
                      placeholderTextColor={COLORS.textHint}
                      value={songSearchQuery}
                      onChangeText={setSongSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor="#FFFFFF"
                    />
                  </Animated.View>
                  <Animated.View style={{ opacity: songCloseButtonAnim }}>
                    <TouchableOpacity
                      style={styles.closeSearchButtonInline}
                      onPress={handleSongSearchCollapse}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.textHint} />
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </TouchableOpacity>

            {/* Sort button - fades out */}
            {!isSongSearchExpanded && (
              <Animated.View style={{ opacity: songShuffleOpacity, flex: 1 }}>
                <View ref={songSortButtonRef} collapsable={false} style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={styles.sortPillButton}
                    onPress={handleSongSortPress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sortPillButtonText}>
                      {getSongSortLabel(songSortType)}
                    </Text>
                    <Ionicons name={getSongSortIcon(songSortType)} size={18} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Shuffle button - fades out */}
            {!isSongSearchExpanded && (
              <Animated.View style={{ opacity: songShuffleOpacity }}>
                <TouchableOpacity
                  style={styles.shuffleButton}
                  onPress={handleShuffleSongs}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Shuffle all favorite songs"
                  accessibilityHint="Double tap to play your favorite songs in random order"
                >
                  <Ionicons name="shuffle" size={20} color={COLORS.textPrimary} />
                  <Text style={styles.shuffleButtonText}>Shuffle</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Gradient fade overlay */}
          <LinearGradient
            colors={[COLORS.background, `${COLORS.background}B3`, `${COLORS.background}4D`, 'transparent']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.actionBarGradient}
            pointerEvents="none"
          />
        </View>

        {sortedAndFilteredSongs.length === 0 && debouncedSongSearchQuery.trim() ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No songs found matching "{debouncedSongSearchQuery}"</Text>
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
      <View style={styles.headerSection}>
        {/* Page Header */}
        <PageHeader title="Favorites" />

        {/* Tab Navigation */}
        <View style={styles.tabContainer} onLayout={handleTabContainerLayout} accessibilityRole="tablist">
          {/* Sliding active indicator */}
          <Animated.View
            style={[
              styles.tabSlider,
              {
                width: tabWidth,
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, tabWidth],
                    }),
                  },
                ],
              },
            ]}
          />
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('shows')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Shows tab"
            accessibilityState={{ selected: activeTab === 'shows' }}
            accessibilityHint="Double tap to view favorite shows"
          >
            <Text style={[styles.tabText, activeTab === 'shows' && styles.activeTabText]}>
              Shows
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('songs')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Songs tab"
            accessibilityState={{ selected: activeTab === 'songs' }}
            accessibilityHint="Double tap to view favorite songs"
          >
            <Text style={[styles.tabText, activeTab === 'songs' && styles.activeTabText]}>
              Songs
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'shows' ? renderShowsTab() : renderSongsTab()}

      {/* Song Sort Dropdown */}
      <Modal
        visible={showSongSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSongSortModal(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setShowSongSortModal(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              { top: songSortButtonPosition.top, right: songSortButtonPosition.right }
            ]}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSongSortType('alphabetical');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                songSortType === 'alphabetical' && styles.dropdownItemTextSelected
              ]}>Alphabetical</Text>
              {songSortType === 'alphabetical' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSongSortType('dateSavedOldest');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                songSortType === 'dateSavedOldest' && styles.dropdownItemTextSelected
              ]}>Date Saved (Oldest First)</Text>
              {songSortType === 'dateSavedOldest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSongSortType('dateSavedNewest');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                songSortType === 'dateSavedNewest' && styles.dropdownItemTextSelected
              ]}>Date Saved (Newest First)</Text>
              {songSortType === 'dateSavedNewest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSongSortType('performanceDateOldest');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                songSortType === 'performanceDateOldest' && styles.dropdownItemTextSelected
              ]}>Performance Date (Oldest First)</Text>
              {songSortType === 'performanceDateOldest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSongSortType('performanceDateNewest');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                songSortType === 'performanceDateNewest' && styles.dropdownItemTextSelected
              ]}>Performance Date (Newest First)</Text>
              {songSortType === 'performanceDateNewest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Show Sort Dropdown */}
      <Modal
        visible={showShowSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShowSortModal(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setShowShowSortModal(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              { top: showSortButtonPosition.top, right: showSortButtonPosition.right }
            ]}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowSortType('alphabetical');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                showSortType === 'alphabetical' && styles.dropdownItemTextSelected
              ]}>Alphabetical</Text>
              {showSortType === 'alphabetical' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowSortType('dateSavedOldest');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                showSortType === 'dateSavedOldest' && styles.dropdownItemTextSelected
              ]}>Date Saved (Oldest First)</Text>
              {showSortType === 'dateSavedOldest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowSortType('dateSavedNewest');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                showSortType === 'dateSavedNewest' && styles.dropdownItemTextSelected
              ]}>Date Saved (Newest First)</Text>
              {showSortType === 'dateSavedNewest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowSortType('performanceDateOldest');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                showSortType === 'performanceDateOldest' && styles.dropdownItemTextSelected
              ]}>Performance Date (Oldest First)</Text>
              {showSortType === 'performanceDateOldest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowSortType('performanceDateNewest');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                showSortType === 'performanceDateNewest' && styles.dropdownItemTextSelected
              ]}>Performance Date (Newest First)</Text>
              {showSortType === 'performanceDateNewest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xs,
    height: 56,
  },
  tabSlider: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    bottom: SPACING.xs,
    backgroundColor: '#484848',
    borderRadius: RADIUS.xl,
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
    zIndex: 1,
  },
  tabText: {
    ...TYPOGRAPHY.heading4,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.textPrimary,
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
    paddingVertical: SPACING.sm,
    paddingBottom: 180,
  },
  songItem: {
    paddingVertical: SPACING.md,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchIconExpanded: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  sortPillButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  sortPillButtonText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '500',
    color: COLORS.textHint,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 48,
    gap: SPACING.sm,
  },
  shuffleButtonText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  searchPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.full,
    width: 48,
    height: 48,
  },
  searchInputContainerExpanded: {
    flex: 1,
    width: 'auto',
    borderRadius: RADIUS.xl,
    paddingLeft: 14, // Match icon position from collapsed state (48/2 - 20/2 = 14)
    paddingRight: SPACING.lg,
  },
  closeSearchButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSearchButtonInline: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  songsTabContainer: {
    flex: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  sortButtonText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    flex: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    minWidth: 180,
    ...SHADOWS.lg,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dropdownItemText: {
    ...TYPOGRAPHY.body,
  },
  dropdownItemTextSelected: {
    color: COLORS.accent,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});
