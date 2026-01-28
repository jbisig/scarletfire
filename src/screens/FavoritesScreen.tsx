import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { ShowCard } from '../components/ShowCard';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import showsData from '../data/shows.json';
import { ShowsByYear } from '../types/show.types';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { archiveApi } from '../services/archiveApi';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { StarRating } from '../components/StarRating';
import { useDebounce } from '../hooks/useDebounce';
import { PageHeader } from '../components/PageHeader';
import { COLORS, FONTS } from '../constants/theme';

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

        {playCount > 0 && (
          <View style={styles.playCountBadge}>
            <Text style={styles.playCountText}>
              {playCount} {playCount === 1 ? 'play' : 'plays'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

SongItem.displayName = 'SongItem';

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Favorites'>;

type TabType = 'shows' | 'songs';
type SongSortType = 'alphabetical' | 'dateSavedNewest' | 'dateSavedOldest' | 'performanceDateOldest' | 'performanceDateNewest';
type ShowSortType = 'dateSavedNewest' | 'dateSavedOldest' | 'performanceDateOldest' | 'performanceDateNewest';

export function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { favoriteShows, favoriteSongs, isLoading } = useFavorites();
  const { loadTrack } = usePlayer();
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
  const debouncedShowSearchQuery = useDebounce(showSearchQuery, 400);
  const debouncedSongSearchQuery = useDebounce(songSearchQuery, 400);
  const showSearchInputRef = useRef<TextInput>(null);
  const songSearchInputRef = useRef<TextInput>(null);
  const showSortButtonRef = useRef<View>(null);
  const songSortButtonRef = useRef<View>(null);
  const showsListRef = useRef<FlatList>(null);
  const songsListRef = useRef<FlatList>(null);

  // Tab sliding animation
  const [tabWidth, setTabWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activeTab === 'shows' ? 0 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [activeTab, slideAnim]);

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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E54C4F" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
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
        {/* Search Bar with Sort Button */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchInputContainer}
            onPress={() => showSearchInputRef.current?.focus()}
            activeOpacity={1}
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.66)" style={styles.searchIcon} />
            <TextInput
              ref={showSearchInputRef}
              style={styles.searchInput}
              placeholder="Date, venue, location"
              placeholderTextColor="rgba(255,255,255,0.66)"
              value={showSearchQuery}
              onChangeText={setShowSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#FFFFFF"
            />
            {showSearchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setShowSearchQuery('');
                  showSearchInputRef.current?.blur();
                }}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.66)" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <View ref={showSortButtonRef} collapsable={false}>
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
        {/* Search Bar with Sort Button */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchInputContainer}
            onPress={() => songSearchInputRef.current?.focus()}
            activeOpacity={1}
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.66)" style={styles.searchIcon} />
            <TextInput
              ref={songSearchInputRef}
              style={styles.searchInput}
              placeholder="Song, date, venue"
              placeholderTextColor="rgba(255,255,255,0.66)"
              value={songSearchQuery}
              onChangeText={setSongSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#FFFFFF"
            />
            {songSearchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSongSearchQuery('');
                  songSearchInputRef.current?.blur();
                }}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.66)" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <View ref={songSortButtonRef} collapsable={false}>
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
      {/* Page Header */}
      <PageHeader title="Favorites" />

      {/* Tab Navigation */}
      <View style={styles.tabContainer} onLayout={handleTabContainerLayout}>
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
        >
          <Text style={[styles.tabText, activeTab === 'shows' && styles.activeTabText]}>
            Shows
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('songs')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'songs' && styles.activeTabText]}>
            Songs
          </Text>
        </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: '#2a2a2a',
    borderRadius: 28,
    padding: 4,
    height: 56,
  },
  tabSlider: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: '#484848',
    borderRadius: 24,
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    zIndex: 1,
  },
  tabText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS.primary,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 180,
  },
  songItem: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  songContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  songDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  songDate: {
    fontSize: 14,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  playCountBadge: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playCountText: {
    fontSize: 12,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  songVenue: {
    fontSize: 14,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  tabContentContainer: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  sortPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    gap: 6,
  },
  sortPillButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: 'rgba(255,255,255,0.66)',
  },
  songsTabContainer: {
    flex: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  dropdownItemTextSelected: {
    color: COLORS.accent,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});
