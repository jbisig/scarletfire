import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
import { SearchBar } from '../components/SearchBar';
import { DropdownMenu, DropdownOption } from '../components/DropdownMenu';
import { NoResultsState } from '../components/StateViews';
import { useDebounce } from '../hooks/useDebounce';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { SIMILARITY_THRESHOLDS } from '../constants/thresholds';
import { normalizeTrackTitle } from '../utils/titleNormalization';
import { logger } from '../utils/logger';

type SongPerformancesRouteProp = RouteProp<RootStackParamList, 'SongPerformances'>;
type SortType = 'date' | 'rating';

interface Performance {
  date: string;
  identifier: string;
  venue?: string;
  rating?: 1 | 2 | 3 | null;
}

const allShowsByYear = showsData as ShowsByYear;

const SORT_OPTIONS: DropdownOption<SortType>[] = [
  { label: 'Date', value: 'date' },
  { label: 'Rating', value: 'rating' },
];

// Look up show details by performance date
function getShowByDate(performanceDate: string) {
  const normalizedDate = performanceDate.substring(0, 10);
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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const flatListRef = useRef<FlatList<Performance>>(null);

  // Scroll to top when sort type changes
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [sortType]);

  const { songTitle, performances } = route.params;

  // Sort performances based on selected sort type
  const sortedPerformances = useMemo(() => {
    const performancesWithRatings = performances;

    switch (sortType) {
      case 'rating':
        return performancesWithRatings.sort((a, b) => {
          if (!a.rating && !b.rating) {
            return a.date.localeCompare(b.date);
          }
          if (!a.rating) return 1;
          if (!b.rating) return -1;
          if (a.rating !== b.rating) {
            return a.rating - b.rating;
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
      const dateMatch = matchesDateQuery(performance.date, debouncedSearchQuery);
      const venueMatch = performance.venue?.toLowerCase().includes(query);
      return dateMatch || venueMatch;
    });
  }, [sortedPerformances, debouncedSearchQuery]);

  const handlePerformancePress = useCallback(async (performance: Performance) => {
    try {
      setLoadingIdentifier(performance.identifier);

      const showDetail = await archiveApi.getShowDetail(performance.identifier, false);

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
        await loadTrack(bestMatch, showDetail, showDetail.tracks);
      } else {
        Alert.alert(
          'Song Not Found',
          `Could not find "${songTitle}" in this recording. The setlist may not match the available tracks.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.player.error('Failed to load performance:', error);
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
    const songPlayCount = getPlayCount(songTitle, item.identifier);

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
    const option = SORT_OPTIONS.find(o => o.value === type);
    return option?.label ?? 'Sort';
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
          <View style={styles.searchBarWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Date, venue, location"
            />
          </View>
          <DropdownMenu
            options={SORT_OPTIONS}
            selectedValue={sortType}
            onSelect={setSortType}
            triggerLabel={getSortLabel(sortType)}
          />
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
            <NoResultsState query={debouncedSearchQuery} entityName="performances" />
          ) : null
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={50}
        windowSize={11}
        initialNumToRender={15}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.xl,
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
    ...TYPOGRAPHY.heading2,
    flexShrink: 1,
  },
  performanceCount: {
    ...TYPOGRAPHY.heading2,
    fontWeight: '300',
    color: COLORS.textTertiary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchBarWrapper: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 180,
  },
  performanceItemWrapper: {
    position: 'relative',
  },
  performanceItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fallbackText: {
    ...TYPOGRAPHY.body,
  },
  loadingOverlay: {
    position: 'absolute',
    right: SPACING.xxl,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
