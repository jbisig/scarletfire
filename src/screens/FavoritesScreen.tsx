import React, { useState, useMemo, useRef, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { ShowCard } from '../components/ShowCard';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatDate } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { archiveApi } from '../services/archiveApi';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { StarRating } from '../components/StarRating';
import { useDebounce } from '../hooks/useDebounce';
import { PageHeader } from '../components/PageHeader';
import { COLORS, FONTS } from '../constants/theme';

// Memoized song item component to prevent unnecessary re-renders
interface SongItemProps {
  song: FavoriteSong;
  isLoading: boolean;
  playCount: number;
  onPress: (song: FavoriteSong) => void;
}

const SongItem = React.memo<SongItemProps>(({ song, isLoading, playCount, onPress }) => {
  const performanceRating = getSongPerformanceRating(song.trackTitle, song.showDate);

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

          {song.venue && (
            <Text style={styles.songVenue} numberOfLines={1}>
              {song.venue}
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
type SongSortType = 'alphabetical' | 'dateSaved' | 'performanceDate';
type ShowSortType = 'dateSaved' | 'performanceDate';

export function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { favoriteShows, favoriteSongs, isLoading } = useFavorites();
  const { loadTrack } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const [activeTab, setActiveTab] = useState<TabType>('shows');
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const [songSortType, setSongSortType] = useState<SongSortType>('alphabetical');
  const [showSortType, setShowSortType] = useState<ShowSortType>('performanceDate');
  const [showSongSortModal, setShowSongSortModal] = useState(false);
  const [showShowSortModal, setShowShowSortModal] = useState(false);
  const [showSearchQuery, setShowSearchQuery] = useState('');
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const debouncedShowSearchQuery = useDebounce(showSearchQuery, 400);
  const debouncedSongSearchQuery = useDebounce(songSearchQuery, 400);
  const showSearchInputRef = useRef<TextInput>(null);
  const songSearchInputRef = useRef<TextInput>(null);

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

      case 'dateSaved':
        return songs.sort((a, b) => {
          // Songs without savedAt go to the top (oldest)
          if (!a.savedAt && !b.savedAt) return 0;
          if (!a.savedAt) return -1;
          if (!b.savedAt) return 1;
          // Oldest saves at top, newest at bottom (ascending order)
          return a.savedAt - b.savedAt;
        });

      case 'performanceDate':
        return songs.sort((a, b) => a.showDate.localeCompare(b.showDate));

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
      case 'dateSaved':
        return shows.sort((a, b) => {
          // Shows without savedAt go to the top (oldest)
          if (!a.savedAt && !b.savedAt) return 0;
          if (!a.savedAt) return -1;
          if (!b.savedAt) return 1;
          // Oldest saves at top, newest at bottom (ascending order)
          return a.savedAt - b.savedAt;
        });

      case 'performanceDate':
        return shows.sort((a, b) => a.date.localeCompare(b.date));

      default:
        return shows;
    }
  }, [favoriteShows, showSortType, debouncedShowSearchQuery]);

  const getSongSortLabel = (sortType: SongSortType): string => {
    switch (sortType) {
      case 'alphabetical':
        return 'Alphabetical';
      case 'dateSaved':
        return 'Date Saved';
      case 'performanceDate':
        return 'Performance Date';
      default:
        return 'Sort';
    }
  };

  const getShowSortLabel = (sortType: ShowSortType): string => {
    switch (sortType) {
      case 'dateSaved':
        return 'Date Saved';
      case 'performanceDate':
        return 'Performance Date';
      default:
        return 'Sort';
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
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>No Favorite Shows Yet</Text>
          <Text style={styles.emptyText}>
            Tap the save button on any show to add it to your favorites
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
          <TouchableOpacity
            style={styles.sortPillButton}
            onPress={() => setShowShowSortModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortPillButtonText}>
              {showSortType === 'performanceDate' ? 'Perform. Date' : 'Date Saved'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {sortedAndFilteredShows.length === 0 && debouncedShowSearchQuery.trim() ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No shows found matching "{debouncedShowSearchQuery}"</Text>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <FlatList
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
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyTitle}>No Favorite Songs Yet</Text>
          <Text style={styles.emptyText}>
            Tap the save button in the player to save individual song performances
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
          <TouchableOpacity
            style={styles.sortPillButton}
            onPress={() => setShowSongSortModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortPillButtonText}>
              {getSongSortLabel(songSortType)}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {sortedAndFilteredSongs.length === 0 && debouncedSongSearchQuery.trim() ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No songs found matching "{debouncedSongSearchQuery}"</Text>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <FlatList
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
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shows' && styles.activeTab]}
          onPress={() => setActiveTab('shows')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'shows' && styles.activeTabText]}>
            Shows
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'songs' && styles.activeTab]}
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

      {/* Song Sort Modal */}
      <Modal
        visible={showSongSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSongSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSongSortModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort</Text>
            </View>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSongSortType('alphabetical');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortOptionText,
                songSortType === 'alphabetical' && styles.sortOptionTextSelected
              ]}>Alphabetical</Text>
              {songSortType === 'alphabetical' && (
                <Ionicons name="checkmark" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSongSortType('dateSaved');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortOptionText,
                songSortType === 'dateSaved' && styles.sortOptionTextSelected
              ]}>Date Saved</Text>
              {songSortType === 'dateSaved' && (
                <Ionicons name="checkmark" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortOption, styles.sortOptionLast]}
              onPress={() => {
                setSongSortType('performanceDate');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortOptionText,
                songSortType === 'performanceDate' && styles.sortOptionTextSelected
              ]}>Performance Date</Text>
              {songSortType === 'performanceDate' && (
                <Ionicons name="checkmark" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Show Sort Modal */}
      <Modal
        visible={showShowSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort</Text>
            </View>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setShowSortType('dateSaved');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortOptionText,
                showSortType === 'dateSaved' && styles.sortOptionTextSelected
              ]}>Date Saved</Text>
              {showSortType === 'dateSaved' && (
                <Ionicons name="checkmark" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortOption, styles.sortOptionLast]}
              onPress={() => {
                setShowSortType('performanceDate');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortOptionText,
                showSortType === 'performanceDate' && styles.sortOptionTextSelected
              ]}>Performance Date</Text>
              {showSortType === 'performanceDate' && (
                <Ionicons name="checkmark" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
    marginHorizontal: 24,
  },
  tab: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: 'center',
    marginBottom: -1,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.accent,
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: COLORS.border,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: COLORS.border,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  sortPillButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortOptionLast: {
    borderBottomWidth: 0,
  },
  sortOptionText: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: FONTS.secondary,
  },
  sortOptionTextSelected: {
    color: COLORS.accent,
  },
});
