import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { archiveApi } from '../services/archiveApi';
import { matchesDateQuery } from '../utils/formatters';
import showsData from '../data/shows.json';
import { GratefulDeadShow, ShowsByYear } from '../types/show.types';
import { ShowCard } from '../components/ShowCard';
import { useDebounce } from '../hooks/useDebounce';
import { COLORS, FONTS } from '../constants/theme';
import { SIMILARITY_THRESHOLDS } from '../constants/thresholds';
import { normalizeTrackTitle } from '../utils/titleNormalization';

type SongPerformancesRouteProp = RouteProp<RootStackParamList, 'SongPerformances'>;
type SortType = 'date' | 'rating';

interface Performance {
  date: string;
  identifier: string;
  venue?: string;
  rating?: 1 | 2 | 3 | null; // Pre-computed performance rating
}

const allShowsByYear = showsData as ShowsByYear;

// Look up show details by performance date
function getShowByDate(performanceDate: string) {
  const normalizedDate = performanceDate.substring(0, 10); // YYYY-MM-DD
  const year = normalizedDate.substring(0, 4);
  const yearShows = allShowsByYear[year];
  if (!yearShows) return undefined;

  return yearShows.find(s => s.date.substring(0, 10) === normalizedDate);
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

export function SongPerformancesScreen() {
  const route = useRoute<SongPerformancesRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { loadTrack } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const [loadingIdentifier, setLoadingIdentifier] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('date');
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortButtonPosition, setSortButtonPosition] = useState({ top: 0, right: 0 });
  const sortButtonRef = useRef<View>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const searchInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<Performance>>(null);

  const handleSortPress = () => {
    sortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSortButtonPosition({ top: pageY + height + 8, right: 20 });
      setShowSortModal(true);
    });
  };

  // Scroll to top when sort type changes
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [sortType]);

  const { songTitle, performances } = route.params;

  // Sort performances based on selected sort type
  const sortedPerformances = useMemo(() => {
    // Ratings are now pre-computed in the data structure, no runtime lookup needed
    const performancesWithRatings = performances;

    switch (sortType) {
      case 'rating':
        // Sort by rating (1-3, with 1 being best), then by date
        // Unrated performances go to the end
        return performancesWithRatings.sort((a, b) => {
          if (!a.rating && !b.rating) {
            return a.date.localeCompare(b.date);
          }
          if (!a.rating) return 1;
          if (!b.rating) return -1;
          if (a.rating !== b.rating) {
            return a.rating - b.rating; // Lower tier number = better rating
          }
          return a.date.localeCompare(b.date);
        });

      case 'date':
      default:
        return performancesWithRatings.sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [performances, sortType]);

  // Filter performances based on search query
  const filteredPerformances = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return sortedPerformances;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return sortedPerformances.filter((performance) => {
      // Fuzzy date matching - supports many common formats
      const dateMatch = matchesDateQuery(performance.date, debouncedSearchQuery);
      const venueMatch = performance.venue?.toLowerCase().includes(query);
      return dateMatch || venueMatch;
    });
  }, [sortedPerformances, debouncedSearchQuery]);

  const handlePerformancePress = useCallback(async (performance: Performance) => {
    try {
      setLoadingIdentifier(performance.identifier);

      // Fetch the show details using the real Archive.org identifier
      const showDetail = await archiveApi.getShowDetail(performance.identifier, false);

      // Find the track that matches this song using fuzzy matching
      let bestMatch = null;
      let bestScore = 0;

      for (const track of showDetail.tracks) {
        const normalizedTitle = normalizeTrackTitle(track.title);
        const similarity = calculateSimilarity(normalizedTitle, songTitle);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = track;
        }
      }

      if (bestMatch && bestScore >= SIMILARITY_THRESHOLDS.SEARCH_MATCH) {
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
  }, [songTitle, loadTrack]);

  const renderPerformanceItem = useCallback(({ item }: { item: Performance }) => {
    const isLoading = loadingIdentifier === item.identifier;
    const show = getShowByDate(item.date);
    // Get play count for this specific song performance
    const songPlayCount = getPlayCount(songTitle, item.identifier);

    // If we have a full show object, use ShowCard for consistent display
    if (show) {
      return (
        <View style={styles.performanceItemWrapper}>
          <ShowCard
            show={show}
            onPress={() => handlePerformancePress(item)}
            overrideRating={item.rating}
            overridePlayCount={songPlayCount}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          )}
        </View>
      );
    }

    // Fallback for performances without a matching show (shouldn't happen often)
    return (
      <TouchableOpacity
        style={styles.performanceItem}
        onPress={() => handlePerformancePress(item)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <Text style={styles.fallbackText}>{item.venue || item.date}</Text>
        {isLoading && (
          <ActivityIndicator size="small" color={COLORS.accent} />
        )}
      </TouchableOpacity>
    );
  }, [loadingIdentifier, handlePerformancePress, getPlayCount, songTitle]);

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {songTitle}
          </Text>
          <Text style={styles.performanceCount}>
            ({performances.length})
          </Text>
        </View>

        {/* Search Row */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchInputContainer}
            onPress={() => searchInputRef.current?.focus()}
            activeOpacity={1}
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.66)" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Date, venue, location"
              placeholderTextColor="rgba(255,255,255,0.66)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#FFFFFF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.66)" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <View ref={sortButtonRef} collapsable={false}>
            <TouchableOpacity
              style={styles.sortPillButton}
              onPress={handleSortPress}
              activeOpacity={0.7}
            >
              <Text style={styles.sortPillButtonText}>{getSortLabel(sortType)}</Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={filteredPerformances}
        renderItem={renderPerformanceItem}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          debouncedSearchQuery.trim() ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#666" />
              <Text style={styles.emptyStateText}>
                No performances found for "{debouncedSearchQuery}"
              </Text>
            </View>
          ) : null
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={50}
        windowSize={11}
        initialNumToRender={15}
      />

      {/* Sort Dropdown */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              { top: sortButtonPosition.top, right: sortButtonPosition.right }
            ]}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSortType('date');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                sortType === 'date' && styles.dropdownItemTextSelected
              ]}>Date</Text>
              {sortType === 'date' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSortType('rating');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                sortType === 'rating' && styles.dropdownItemTextSelected
              ]}>Rating</Text>
              {sortType === 'rating' && (
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  songTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  performanceCount: {
    fontSize: 28,
    fontWeight: '300',
    fontFamily: FONTS.primary,
    color: COLORS.textTertiary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  listContent: {
    paddingBottom: 180,
  },
  performanceItemWrapper: {
    position: 'relative',
  },
  performanceItem: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fallbackText: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  loadingOverlay: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
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
    minWidth: 140,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
