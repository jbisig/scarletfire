import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
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
import { archiveApi } from '../services/archiveApi';

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Favorites'>;

type TabType = 'shows' | 'songs';
type SongSortType = 'alphabetical' | 'dateSaved' | 'performanceDate';
type ShowSortType = 'dateSaved' | 'performanceDate';

export function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { favoriteShows, favoriteSongs, isLoading } = useFavorites();
  const { loadTrack } = usePlayer();
  const [activeTab, setActiveTab] = useState<TabType>('shows');
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const [songSortType, setSongSortType] = useState<SongSortType>('alphabetical');
  const [showSortType, setShowSortType] = useState<ShowSortType>('performanceDate');
  const [showSongSortModal, setShowSongSortModal] = useState(false);
  const [showShowSortModal, setShowShowSortModal] = useState(false);

  // Sort songs based on selected sort type
  const sortedSongs = useMemo(() => {
    const songs = [...favoriteSongs];

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
  }, [favoriteSongs, songSortType]);

  // Sort shows based on selected sort type
  const sortedShows = useMemo(() => {
    const shows = [...favoriteShows];

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
  }, [favoriteShows, showSortType]);

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

  const handleShowPress = (show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  };

  const handleSongPress = async (song: FavoriteSong) => {
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
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
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
      <View style={styles.songsTabContainer}>
        {/* Sort Button */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowShowSortModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={18} color="#ff6b6b" />
          <Text style={styles.sortButtonText}>
            Sort: {getShowSortLabel(showSortType)}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#999" />
        </TouchableOpacity>

        <FlatList
          data={sortedShows}
          keyExtractor={(item) => item.primaryIdentifier}
          renderItem={({ item }) => (
            <ShowCard show={item} onPress={handleShowPress} />
          )}
          contentContainerStyle={styles.listContent}
        />
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
      <View style={styles.songsTabContainer}>
        {/* Sort Button */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSongSortModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={18} color="#ff6b6b" />
          <Text style={styles.sortButtonText}>
            Sort: {getSongSortLabel(songSortType)}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#999" />
        </TouchableOpacity>

        <FlatList
          data={sortedSongs}
        keyExtractor={(item) => `${item.trackId}-${item.showIdentifier}`}
        renderItem={({ item }) => {
          const isLoading = loadingSongId === `${item.trackId}-${item.showIdentifier}`;

          return (
            <TouchableOpacity
              style={styles.songItem}
              onPress={() => handleSongPress(item)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={2}>
                  {item.trackTitle}
                </Text>
                <Text style={styles.songDate}>
                  {formatDate(item.showDate)}
                </Text>
                {item.venue && (
                  <Text style={styles.songVenue} numberOfLines={1}>
                    {item.venue}
                  </Text>
                )}
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color="#ff6b6b" />
              ) : (
                <Ionicons name="play-circle-outline" size={32} color="#ff6b6b" />
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shows' && styles.activeTab]}
          onPress={() => setActiveTab('shows')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'shows' && styles.activeTabText]}>
            Shows ({favoriteShows.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'songs' && styles.activeTab]}
          onPress={() => setActiveTab('songs')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'songs' && styles.activeTabText]}>
            Songs ({favoriteSongs.length})
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
            <Text style={styles.modalTitle}>Sort By</Text>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSongSortType('alphabetical');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortOptionText}>Alphabetical</Text>
              {songSortType === 'alphabetical' && (
                <Ionicons name="checkmark" size={24} color="#ff6b6b" />
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
              <Text style={styles.sortOptionText}>Date Saved</Text>
              {songSortType === 'dateSaved' && (
                <Ionicons name="checkmark" size={24} color="#ff6b6b" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSongSortType('performanceDate');
                setShowSongSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortOptionText}>Performance Date</Text>
              {songSortType === 'performanceDate' && (
                <Ionicons name="checkmark" size={24} color="#ff6b6b" />
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
            <Text style={styles.modalTitle}>Sort By</Text>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setShowSortType('dateSaved');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortOptionText}>Date Saved</Text>
              {showSortType === 'dateSaved' && (
                <Ionicons name="checkmark" size={24} color="#ff6b6b" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setShowSortType('performanceDate');
                setShowShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortOptionText}>Performance Date</Text>
              {showSortType === 'performanceDate' && (
                <Ionicons name="checkmark" size={24} color="#ff6b6b" />
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
    backgroundColor: '#1a1a1a',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#ff6b6b',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#ff6b6b',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
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
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  songInfo: {
    flex: 1,
    marginRight: 16,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    marginBottom: 4,
  },
  songDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ff6b6b',
    marginBottom: 2,
  },
  songVenue: {
    fontSize: 13,
    color: '#999',
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
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    marginBottom: 20,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
});
