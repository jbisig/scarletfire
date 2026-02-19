import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayer } from '../contexts/PlayerContext';
import { useShows } from '../contexts/ShowsContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { normalizeTrackTitle } from '../utils/titleNormalization';
import { matchesDateQuery } from '../utils/formatters';
import showsData from '../data/shows.json';
import { GratefulDeadShow, ShowsByYear } from '../types/show.types';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs.generated';
import { ShowCard } from '../components/ShowCard';
import { AnimatedSearchBar } from '../components/AnimatedSearchBar';
import { SortDropdown, SortOption } from '../components/SortDropdown';
import { NoResultsState } from '../components/StateViews';
import { useDebounce } from '../hooks/useDebounce';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, LAYOUT } from '../constants/theme';

// Layout constants
const HORIZONTAL_PADDING = SPACING.xl;
// Pre-compute song lookup Map for O(1) access
const songsByTitle: Map<string, typeof GRATEFUL_DEAD_SONGS[number]> = new Map(
  GRATEFUL_DEAD_SONGS.map(song => [song.title.toLowerCase(), song])
);

type SongPerformancesRouteProp = RouteProp<RootStackParamList, 'SongPerformances'>;
type SongPerformancesNavigationProp = StackNavigationProp<RootStackParamList, 'SongPerformances'>;
type SortType = 'alphabetical' | 'performanceDateOldest' | 'performanceDateNewest' | 'ratingHighest';

const SORT_OPTIONS: SortOption<SortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'performanceDateOldest', label: 'Performance Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Performance Date (Newest First)' },
  { value: 'ratingHighest', label: 'Rating (Highest First)' },
];

interface Performance {
  date: string;
  identifier: string;
  venue?: string;
  rating?: 1 | 2 | 3 | null;
}

const allShowsByYear = showsData as ShowsByYear;

// Look up show details by performance date
function getShowByDate(performanceDate: string) {
  const normalizedDate = performanceDate.substring(0, 10);
  const year = normalizedDate.substring(0, 4);
  const yearShows = allShowsByYear[year];
  if (!yearShows) return undefined;
  return yearShows.find(s => s.date.substring(0, 10) === normalizedDate);
}


export function SongPerformancesScreen() {
  const route = useRoute<SongPerformancesRouteProp>();
  const navigation = useNavigation<SongPerformancesNavigationProp>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { width: windowWidth } = useWindowDimensions();
  const [headerWidth, setHeaderWidth] = useState(windowWidth);
  const padding = isDesktop ? 32 : HORIZONTAL_PADDING;
  const searchBarFullWidth = headerWidth - (padding * 2);
  const { loadTrack } = usePlayer();
  const { getShowDetail } = useShows();
  const { getPlayCount } = usePlayCounts();
  const [sortType, setSortType] = useState<SortType>('performanceDateOldest');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const flatListRef = useRef<FlatList<Performance>>(null);
  const sortButtonRef = useRef<View>(null);

  // Search animation state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortButtonPosition, setSortButtonPosition] = useState({ top: 0, left: 0 });

  // Search bar handlers
  const handleSearchExpand = useCallback(() => {
    setIsSearchExpanded(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  }, []);

  // Handle sort button press
  const handleSortPress = useCallback(() => {
    sortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSortButtonPosition({ top: pageY + height + 8, left: pageX });
      setShowSortModal(true);
    });
  }, []);

  // Get sort label based on current sort type
  const getSortLabel = (type: SortType): string => {
    switch (type) {
      case 'alphabetical':
        return 'Alphabetical';
      case 'performanceDateOldest':
      case 'performanceDateNewest':
        return 'Performance Date';
      case 'ratingHighest':
        return 'Rating';
      default:
        return 'Sort';
    }
  };

  // Get sort icon based on current sort type
  const getSortIcon = (type: SortType): 'arrow-up' | 'arrow-down' => {
    switch (type) {
      case 'performanceDateOldest':
        return 'arrow-up';
      default:
        return 'arrow-down';
    }
  };

  // Scroll to top when sort type changes
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [sortType]);

  const { songTitle } = route.params;

  useEffect(() => {
    if (Platform.OS === 'web') {
      navigation.setOptions({ title: songTitle });
    }
  }, [navigation, songTitle]);

  // Look up performances from static song data
  const performances = useMemo(() => {
    const song = songsByTitle.get(songTitle.toLowerCase());
    return song?.performances ?? [];
  }, [songTitle]);

  // Sort performances based on selected sort type
  const sortedPerformances = useMemo(() => {
    const sorted = [...performances];

    switch (sortType) {
      case 'alphabetical':
        return sorted.sort((a, b) => {
          const venueA = a.venue || '';
          const venueB = b.venue || '';
          return venueA.localeCompare(venueB);
        });

      case 'performanceDateOldest':
        return sorted.sort((a, b) => a.date.localeCompare(b.date));

      case 'performanceDateNewest':
        return sorted.sort((a, b) => b.date.localeCompare(a.date));

      case 'ratingHighest':
        return sorted.sort((a, b) => {
          if (!a.rating && !b.rating) {
            return a.date.localeCompare(b.date);
          }
          if (!a.rating) return 1;
          if (!b.rating) return -1;
          if (a.rating !== b.rating) {
            return b.rating - a.rating; // Highest first
          }
          return a.date.localeCompare(b.date);
        });

      default:
        return sorted;
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
      const showDetail = await getShowDetail(performance.identifier);
      const normalizedSongTitle = normalizeTrackTitle(songTitle);
      const matchedTrack = showDetail.tracks.find(
        t => normalizeTrackTitle(t.title) === normalizedSongTitle
      );
      if (matchedTrack) {
        loadTrack(matchedTrack, showDetail, showDetail.tracks);
      }
    } catch {
      // Fallback: navigate to show if loading fails
      navigation.push('ShowDetail', {
        identifier: performance.identifier,
        trackTitle: songTitle,
      });
    }
  }, [songTitle, navigation, getShowDetail, loadTrack]);

  const renderPerformanceItem = useCallback(({ item }: { item: Performance }) => {
    const show = getShowByDate(item.date);
    const songPlayCount = getPlayCount(songTitle, item.identifier);

    if (show) {
      return (
        <ShowCard
          show={show}
          onPress={() => handlePerformancePress(item)}
          overrideRating={item.rating}
          overridePlayCount={songPlayCount}
        />
      );
    }

    return (
      <TouchableOpacity
        style={styles.performanceItem}
        onPress={() => handlePerformancePress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.fallbackText}>{item.venue || item.date}</Text>
      </TouchableOpacity>
    );
  }, [handlePerformancePress, getPlayCount, songTitle]);

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      {/* Header */}
      <View style={[styles.header, isDesktop && styles.headerDesktop, { paddingTop: isDesktop ? 16 : insets.top + 8 }]} onLayout={(e) => setHeaderWidth(e.nativeEvent.layout.width)}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Title Row with Search */}
        <View style={[styles.titleRow, isDesktop && styles.titleRowDesktop]}>
          {/* Left side: Title (gets covered by search bar) */}
          <View style={styles.titleContent}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {songTitle}
            </Text>
            <Text style={styles.performanceCount}>
              ({performances.length})
            </Text>
          </View>

          {/* Right side: Search button */}
          <View style={styles.titleRight}>
            <AnimatedSearchBar
              isExpanded={isSearchExpanded}
              onExpand={handleSearchExpand}
              onClose={handleSearchClose}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Date, venue, location"
              expandedWidth={searchBarFullWidth}
              closeOnClear
            />
          </View>
        </View>

        {/* Sort Row */}
        <View style={styles.sortRow}>
          <View ref={sortButtonRef} collapsable={false}>
            <TouchableOpacity
              style={styles.sortLabel}
              onPress={handleSortPress}
              activeOpacity={0.7}
            >
              <Ionicons name={getSortIcon(sortType)} size={16} color={COLORS.textSecondary} />
              <Text style={styles.sortLabelText}>{getSortLabel(sortType)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sort Dropdown */}
      <SortDropdown
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        position={sortButtonPosition}
        options={SORT_OPTIONS}
        selectedValue={sortType}
        onSelect={setSortType}
      />

      <FlatList
        ref={flatListRef}
        data={filteredPerformances}
        renderItem={renderPerformanceItem}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
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
  containerDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  headerDesktop: {
    paddingHorizontal: 32,
    backgroundColor: COLORS.backgroundSecondary,
  },
  backButton: {
    width: LAYOUT.headerButtonSize,
    height: 28,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: LAYOUT.headerButtonSize,
  },
  titleRowDesktop: {
    marginTop: 8,
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    position: 'absolute',
    left: 0,
    right: LAYOUT.headerButtonSize + LAYOUT.headerButtonGap,
    top: 0,
    bottom: 0,
  },
  songTitle: {
    ...TYPOGRAPHY.heading2,
    flexShrink: 1,
  },
  performanceCount: {
    fontSize: 26,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '400',
    color: COLORS.textTertiary,
  },
  titleRight: {
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabelText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingBottom: LAYOUT.listBottomPadding,
  },
  listContentDesktop: {
    padding: 16,
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
