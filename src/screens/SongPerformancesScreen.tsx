import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { archiveApi } from '../services/archiveApi';
import { formatDate } from '../utils/formatters';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { StarRating } from '../components/StarRating';

type SongPerformancesRouteProp = RouteProp<RootStackParamList, 'SongPerformances'>;
type SortType = 'date' | 'rating';

interface Performance {
  date: string;
  identifier: string;
  venue?: string;
}

// Calculate string similarity using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const distance = costs[s2.length];
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

function normalizeTrackTitle(title: string): string {
  return title
    .replace(/^\d+[\s.-]*/, '')
    .replace(/^Track\s+\d+[\s:]*/, '')
    .trim()
    .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\s*[#]\d+.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    .replace(/\s+[Jj]am\s*$/, '');
}

export function SongPerformancesScreen() {
  const route = useRoute<SongPerformancesRouteProp>();
  const { loadTrack } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const [loadingIdentifier, setLoadingIdentifier] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('date');
  const [showSortModal, setShowSortModal] = useState(false);

  const { songTitle, performances } = route.params;

  // Sort performances based on selected sort type
  const sortedPerformances = useMemo(() => {
    const performancesWithRatings = performances.map(perf => ({
      ...perf,
      rating: getSongPerformanceRating(songTitle, perf.date),
    }));

    switch (sortType) {
      case 'rating':
        // Sort by rating (1-3, with 1 being best), then by date
        // Unrated performances go to the end
        return performancesWithRatings.sort((a, b) => {
          if (a.rating === null && b.rating === null) {
            return a.date.localeCompare(b.date);
          }
          if (a.rating === null) return 1;
          if (b.rating === null) return -1;
          if (a.rating !== b.rating) {
            return a.rating - b.rating; // Lower tier number = better rating
          }
          return a.date.localeCompare(b.date);
        });

      case 'date':
      default:
        return performancesWithRatings.sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [performances, sortType, songTitle]);

  const handlePerformancePress = async (performance: Performance) => {
    try {
      setLoadingIdentifier(performance.identifier);

      // Fetch the show details using the real Archive.org identifier
      const showDetail = await archiveApi.getShowDetail(performance.identifier, false);

      // Find the track that matches this song using fuzzy matching
      let bestMatch = null;
      let bestScore = 0;
      const SIMILARITY_THRESHOLD = 0.85; // 85% similarity required

      for (const track of showDetail.tracks) {
        const normalizedTitle = normalizeTrackTitle(track.title);
        const similarity = calculateSimilarity(normalizedTitle, songTitle);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = track;
        }
      }

      if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
        // Load and play the matching track
        await loadTrack(bestMatch, showDetail, showDetail.tracks);
      } else {
        Alert.alert(
          'Song Not Found',
          `Could not find "${songTitle}" in this recording. The setlist may not match the available tracks.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to load performance:', error);
      Alert.alert(
        'Error Loading Show',
        'Unable to load this performance. Please try another one.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingIdentifier(null);
    }
  };

  const renderPerformanceItem = ({ item }: { item: Performance }) => {
    const isLoading = loadingIdentifier === item.identifier;
    const playCount = getPlayCount(songTitle, item.identifier);
    const performanceRating = getSongPerformanceRating(songTitle, item.date);

    return (
      <TouchableOpacity
        style={styles.performanceItem}
        onPress={() => handlePerformancePress(item)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <View style={styles.performanceInfo}>
          <View style={styles.performanceHeader}>
            <View style={styles.dateWithStars}>
              <Text style={styles.performanceDate}>{formatDate(item.date)}</Text>
              {performanceRating && (
                <StarRating tier={performanceRating} size={14} />
              )}
            </View>
            {playCount > 0 && (
              <View style={styles.playCountBadge}>
                <Ionicons name="play-circle" size={14} color="#ff6b6b" />
                <Text style={styles.playCountText}>
                  {playCount} {playCount === 1 ? 'play' : 'plays'}
                </Text>
              </View>
            )}
          </View>
          {item.venue && (
            <Text style={styles.performanceVenue} numberOfLines={2}>
              {item.venue}
            </Text>
          )}
        </View>
        {isLoading && (
          <ActivityIndicator size="small" color="#ff6b6b" />
        )}
      </TouchableOpacity>
    );
  };

  const getSortLabel = (type: SortType): string => {
    switch (type) {
      case 'rating':
        return 'Rating';
      case 'date':
        return 'Date';
      default:
        return 'Sort';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.songTitle} numberOfLines={2}>
          {songTitle}
        </Text>
        <View style={styles.performanceCountRow}>
          <Text style={styles.performanceCount}>
            {performances.length} performance{performances.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={18} color="#ff6b6b" />
            <Text style={styles.sortButtonText}>{getSortLabel(sortType)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedPerformances}
        renderItem={renderPerformanceItem}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      />

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortType('date');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortOptionText}>Performance Date</Text>
              {sortType === 'date' && (
                <Ionicons name="checkmark" size={24} color="#ff6b6b" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortType('rating');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortOptionText}>Rating (Best First)</Text>
              {sortType === 'rating' && (
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  songTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    marginBottom: 8,
  },
  performanceCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performanceCount: {
    fontSize: 16,
    color: '#999',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#333',
    borderRadius: 6,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 180,
  },
  performanceItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performanceInfo: {
    flex: 1,
    marginRight: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateWithStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  playCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  playCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  performanceVenue: {
    fontSize: 14,
    color: '#999',
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
