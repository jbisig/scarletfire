import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayerActions } from '../contexts/PlayerContext';
import { useShows } from '../contexts/ShowsContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { matchTrackBySlug } from '../utils/trackMatching';
import { normalizeTrackTitle } from '../utils/titleNormalization';
import { SIMILARITY_THRESHOLDS } from '../constants/thresholds';
import { matchesDateQuery } from '../utils/formatters';
import { findShowByDate } from '../utils/showLookup';
import { findSongByTitle } from '../utils/songLookup';
import { ShowCard } from '../components/ShowCard';
import {
  ShowsFilterTray,
  ShowsFilterState,
  ShowsByYear,
  hasActiveFilters,
  createEmptyFilterState,
} from '../components/ShowsFilterTray';
import { makeShowTagFilter } from '../services/tagResolver';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { useAppActiveState } from '../hooks/useAppActiveState';
import { resolveVideoUri } from '../utils/resolveVideoUri';
import { WebVideoBackground } from '../components/shared/WebVideoBackground';
import { BlurBackground } from '../components/shared/BlurBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedSearchBar } from '../components/AnimatedSearchBar';
import { SortDropdown } from '../components/SortDropdown';
import { NoResultsState } from '../components/StateViews';
import { useDebounce } from '../hooks/useDebounce';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT, FONTS } from '../constants/theme';
import {
  PerformanceSortType,
  PERFORMANCE_SORT_OPTIONS,
  getPerformanceSortLabel,
  getPerformanceSortIcon,
} from '../constants/sortOptions';
import { useSortDropdown } from '../hooks/useSortDropdown';
import { compareByDate, compareAlphabetical } from '../utils/sortComparators';
import { compareByResolvedRating } from '../utils/performanceSort';
import { usePerformanceRatingsVersion } from '../contexts/UserRatingsContext';
import { resolvePerformanceRating } from '../services/ratingResolver';
import { useRatingOverlay } from '../contexts/RatingOverlayContext';

type SongPerformancesRouteProp = RouteProp<RootStackParamList, 'SongPerformances'>;
type SongPerformancesNavigationProp = StackNavigationProp<RootStackParamList, 'SongPerformances'>;
type SortType = PerformanceSortType;

// The header collapse is one discrete, hysteretic toggle: collapse past 72,
// expand back under 12. The header is an absolute overlay, so toggling can
// never resize the list; the hysteresis just keeps slow scrolling near the
// boundary from flip-flopping the animation.
const TITLE_COLLAPSE_AT = 72;
const TITLE_EXPAND_AT = 12;
const CONTROLS_ROW_HEIGHT = LAYOUT.headerButtonSize;

interface Performance {
  date: string;
  identifier: string;
  venue?: string;
  rating?: 1 | 2 | 3 | null;
}

export function SongPerformancesScreen() {
  const route = useRoute<SongPerformancesRouteProp>();
  const navigation = useNavigation<SongPerformancesNavigationProp>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { width: windowWidth } = useWindowDimensions();
  const [headerWidth, setHeaderWidth] = useState(windowWidth);
  const padding = isDesktop ? 32 : LAYOUT.HORIZONTAL_PADDING;
  const searchBarFullWidth = headerWidth - (padding * 2) - LAYOUT.headerButtonSize - LAYOUT.headerButtonGap;
  const { loadTrack } = usePlayerActions();
  const { getShowDetail } = useShows();
  const { getPlayCountStable } = usePlayCounts();
  const [sortType, setSortType] = useState<SortType>('ratingHighest');
  const [filterTrayOpen, setFilterTrayOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ShowsFilterState>(createEmptyFilterState);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const flatListRef = useRef<FlatList<Performance>>(null);
  const sortDropdown = useSortDropdown();
  const ratingsVersion = usePerformanceRatingsVersion();
  const { openRatingOverlay } = useRatingOverlay();

  // Header video backdrop — same treatment as the show detail header.
  const { videoSource, videoId, resetToFallback } = useVideoBackground();
  const appState = useAppActiveState();
  const videoUri = useMemo(() => (Platform.OS === 'web' ? resolveVideoUri(videoSource) : ''), [videoSource]);

  // Search animation state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Natural height of the big title line, measured so the collapse can
  // animate it to zero instead of leaving a blank band under the compact title.
  const [titleLineHeight, setTitleLineHeight] = useState(0);

  // The header is an absolute overlay: its collapse animations must never
  // resize the list, or the layout shift feeds back into scroll events as
  // phantom deltas (the popping this replaces). The list instead carries a
  // CONSTANT top padding equal to the fully-expanded header height —
  // correct at the top (where the header is always expanded), and irrelevant
  // once scrolled, where content simply slides under the opaque backdrop.
  const [listTopPadding, setListTopPadding] = useState(0);

  // Collapsing header (ShowDetail's sticky-title pattern): the big title
  // crossfades into a compact centered one as the list scrolls, and the
  // sort/search/filter bar collapses away on scroll-down, sliding back down
  // as soon as the user scrolls up.
  const scrollY = useRef(new Animated.Value(0)).current;
  const collapseAnim = useRef(new Animated.Value(0)).current; // 1 = header collapsed
  const titleCollapsedRef = useRef(false);
  const titleAnimatingRef = useRef(false);
  const isSearchExpandedRef = useRef(false);

  const bigTitleOpacity = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const compactTitleOpacity = collapseAnim;

  const setTitleCollapsed = useCallback((collapsed: boolean) => {
    if (titleCollapsedRef.current === collapsed) return;
    titleCollapsedRef.current = collapsed;
    titleAnimatingRef.current = true;
    Animated.timing(collapseAnim, {
      toValue: collapsed ? 1 : 0,
      duration: 220,
      useNativeDriver: false, // animates the title line's height
    }).start(() => {
      titleAnimatingRef.current = false;
    });
  }, [collapseAnim]);


  useEffect(() => {
    isSearchExpandedRef.current = isSearchExpanded;
  }, [isSearchExpanded]);

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const y = event.nativeEvent.contentOffset.y;
          // The header must not change under the user while they're typing
          // into the search field.
          if (isSearchExpandedRef.current) return;
          // One discrete, hysteretic state for the whole header — title and
          // controls bar together (see the threshold comments above).
          if (y >= TITLE_COLLAPSE_AT) setTitleCollapsed(true);
          else if (y <= TITLE_EXPAND_AT) setTitleCollapsed(false);
        },
      }),
    [scrollY, setTitleCollapsed]
  );

  // Search bar handlers
  const handleSearchExpand = useCallback(() => {
    setIsSearchExpanded(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  }, []);

  // Scroll to top when sort type or filters change
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [sortType, appliedFilters]);

  const { songTitle, performanceDate } = route.params;

  useEffect(() => {
    if (Platform.OS === 'web') {
      navigation.setOptions({ title: songTitle });
    }
  }, [navigation, songTitle]);

  // Look up performances from static song data
  const performances = useMemo(() => {
    const song = findSongByTitle(songTitle);
    return song?.performances ?? [];
  }, [songTitle]);

  // Auto-play if a performanceDate is in the URL (deep link)
  const hasAutoPlayedRef = useRef(false);
  useEffect(() => {
    if (!performanceDate || hasAutoPlayedRef.current || performances.length === 0) return;
    hasAutoPlayedRef.current = true;
    const match = performances.find(p => p.date.substring(0, 10) === performanceDate);
    if (match) {
      (async () => {
        try {
          const showDetail = await getShowDetail(match.identifier);
          const normalized = normalizeTrackTitle(songTitle);
          const track = showDetail.tracks.find(t => normalizeTrackTitle(t.title) === normalized);
          if (track) loadTrack(track, showDetail, showDetail.tracks);
        } catch { /* ignore */ }
      })();
    }
  }, [performanceDate, performances, songTitle, getShowDetail, loadTrack]);

  // Sort performances based on selected sort type
  const sortedPerformances = useMemo(() => {
    const sorted = [...performances];

    switch (sortType) {
      case 'alphabetical':
        return sorted.sort((a, b) => compareAlphabetical(a.venue || '', b.venue || ''));

      case 'performanceDateOldest':
        return sorted.sort((a, b) => compareByDate(a.date, b.date, 'oldest'));

      case 'performanceDateNewest':
        return sorted.sort((a, b) => compareByDate(a.date, b.date, 'newest'));

      case 'ratingHighest':
        // Resolved stars (user overrides win). Missing ratings sort last;
        // ties fall back to performance date, oldest first.
        return sorted
          .map(perf => ({
            perf,
            stars: resolvePerformanceRating(songTitle, perf.date)?.stars ?? null,
          }))
          .sort((a, b) => compareByResolvedRating(
            { date: a.perf.date, stars: a.stars },
            { date: b.perf.date, stars: b.stars },
            compareByDate,
          ))
          .map(({ perf }) => perf);

      default:
        return sorted;
    }
  }, [performances, sortType, songTitle, ratingsVersion]);

  // This song's performances grouped into the shows-by-year shape the
  // filter tray facets over (a per-song slice of the full catalog).
  const songShowsByYear = useMemo(() => {
    const byYear: ShowsByYear = {};
    for (const performance of performances) {
      const show = findShowByDate(performance.date);
      if (!show) continue;
      const year = performance.date.slice(0, 4);
      (byYear[year] ??= []).push(show);
    }
    return byYear;
  }, [performances]);

  // Stage 1: year + show-tag filters from the tray. A performance passes on
  // its show's date — the same predicate the Shows index uses.
  const trayFilteredPerformances = useMemo(() => {
    if (!hasActiveFilters(appliedFilters)) return sortedPerformances;
    const { selectedYears, selectedTags } = appliedFilters;
    const keep = selectedTags.length > 0 ? makeShowTagFilter(selectedTags) : null;
    return sortedPerformances.filter(performance => {
      const date = performance.date.slice(0, 10);
      if (selectedYears.length > 0 && !selectedYears.includes(date.slice(0, 4))) return false;
      return !keep || keep(date);
    });
  }, [sortedPerformances, appliedFilters]);

  // Stage 2: search on top of the tray results
  const filteredPerformances = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return trayFilteredPerformances;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return trayFilteredPerformances.filter((performance) => {
      const dateMatch = matchesDateQuery(performance.date, debouncedSearchQuery);
      const venueMatch = performance.venue?.toLowerCase().includes(query);
      return dateMatch || venueMatch;
    });
  }, [trayFilteredPerformances, debouncedSearchQuery]);

  const handlePerformancePress = useCallback(async (performance: Performance) => {
    try {
      const showDetail = await getShowDetail(performance.identifier);
      const matchedTrack = matchTrackBySlug(
        songTitle,
        showDetail.tracks,
        SIMILARITY_THRESHOLDS.SEARCH_MATCH
      );
      if (matchedTrack) {
        loadTrack(matchedTrack, showDetail, showDetail.tracks);
        // Update URL with performance date for shareable links
        if (Platform.OS === 'web') {
          navigation.setParams({ performanceDate: performance.date.substring(0, 10) });
        }
        return;
      }
      // No confident title match — fall through to ShowDetail so the user lands
      // on the tracklist and can pick manually.
      navigation.push('ShowDetail', {
        identifier: performance.identifier,
        trackTitle: songTitle,
      });
    } catch {
      // Fallback: navigate to show if loading fails
      navigation.push('ShowDetail', {
        identifier: performance.identifier,
        trackTitle: songTitle,
      });
    }
  }, [songTitle, navigation, getShowDetail, loadTrack]);

  const renderPerformanceItem = useCallback(({ item }: { item: Performance }) => {
    const show = findShowByDate(item.date);
    // Stable getter — doesn't change identity when some other song/show's
    // play count changes elsewhere in the app, so this callback (and the
    // ~400 ShowCard rows relying on it) doesn't churn on every play.
    const songPlayCount = getPlayCountStable(songTitle, item.identifier);
    const onPress = () => handlePerformancePress(item);

    if (show) {
      return (
        <ShowCard
          show={show}
          onPress={onPress}
          overrideResolvedRating={resolvePerformanceRating(songTitle, item.date)}
          overridePlayCount={songPlayCount}
          // Native keeps rating taps on the large player + show detail only;
          // list rows here are tappable on web where there's a pointer.
          onRatingPress={
            Platform.OS === 'web'
              ? () => openRatingOverlay({
                  kind: 'performance',
                  songTitle,
                  date: item.date,
                  venue: item.venue,
                  showIdentifier: item.identifier,
                })
              : undefined
          }
        />
      );
    }

    return (
      <TouchableOpacity
        style={styles.performanceItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.fallbackText}>{item.venue || item.date}</Text>
      </TouchableOpacity>
    );
  }, [handlePerformancePress, getPlayCountStable, songTitle, findShowByDate, openRatingOverlay, ratingsVersion]);

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      {/* Header — absolute overlay above the list (see listTopPadding) */}
      <View
        style={[styles.header, styles.headerOverlay, isDesktop && styles.headerDesktop, { paddingTop: isDesktop ? 16 : insets.top + 8 }]}
        onLayout={(e) => {
          setHeaderWidth(e.nativeEvent.layout.width);
          // Only trust the measurement when fully expanded and at rest —
          // mid-animation heights would poison the list's constant padding.
          if (!titleCollapsedRef.current && !titleAnimatingRef.current) {
            setListTopPadding(e.nativeEvent.layout.height);
          }
        }}
      >
        {/* Blurred gradient video backdrop — the show detail header's layer
            stack (video, dark blur, scrim, fade into the page), behind the
            unchanged header layout. pointerEvents="none" keeps the back
            button, search, and sort control tappable. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Platform.OS === 'web' ? (
            videoUri ? (
              <WebVideoBackground uri={videoUri} videoId={videoId} onError={resetToFallback} />
            ) : null
          ) : (
            (() => {
              const { Video, ResizeMode } = require('expo-av');
              return (
                <Video
                  key={`song-performances-header-${videoId}`}
                  source={videoSource}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={appState === 'active'}
                  isLooping
                  isMuted
                  onError={resetToFallback}
                />
              );
            })()
          )}
          <BlurBackground intensity={30} tint="dark" />
          <View style={styles.headerVideoOverlay} />
          <LinearGradient
            colors={['rgba(18, 18, 18, 0)', isDesktop ? COLORS.backgroundSecondary : COLORS.background]}
            locations={[0.15, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Back button, with the compact title fading in beside it as the
            header collapses */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Animated.Text
            style={[styles.compactTitle, { opacity: compactTitleOpacity }]}
            numberOfLines={1}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {songTitle}
          </Animated.Text>
        </View>

        {/* Title with performance count — hands off to the compact title,
            collapsing its height so no blank band is left behind. The inner
            view is unconstrained, so its onLayout always reports the natural
            height even mid-animation. */}
        <Animated.View
          style={{
            opacity: bigTitleOpacity,
            overflow: 'hidden',
            ...(isDesktop ? { marginTop: 8 } : null),
            height: titleLineHeight > 0
              ? collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [titleLineHeight, 0] })
              : undefined,
          }}
        >
          {/* Margin lives on the wrapper, NOT here: the measured height must
              be exactly what the animated wrapper needs to avoid clipping. */}
          <View
            style={styles.titleLine}
            onLayout={(e) => setTitleLineHeight(e.nativeEvent.layout.height)}
          >
            <Text style={styles.songTitle} numberOfLines={1}>
              {songTitle}
            </Text>
            <Text style={styles.performanceCount}>
              ({performances.length})
            </Text>
          </View>
        </Animated.View>

        {/* Controls row: sort at left, vertically centered with the search +
            filter buttons across from it. Rides the header collapse — only
            visible with the full header at the top. */}
        <Animated.View
          style={{
            height: collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [CONTROLS_ROW_HEIGHT, 0] }),
            opacity: bigTitleOpacity,
            overflow: 'hidden',
          }}
        >
        <View style={styles.controlsRow}>
          <View ref={sortDropdown.buttonRef} collapsable={false}>
            <TouchableOpacity
              style={styles.sortLabel}
              onPress={sortDropdown.open}
              activeOpacity={0.7}
            >
              <Ionicons name={getPerformanceSortIcon(sortType)} size={16} color={COLORS.textSecondary} />
              <Text style={styles.sortLabelText}>{getPerformanceSortLabel(sortType)}</Text>
            </TouchableOpacity>
          </View>

          {/* Search + Filter (absolute so the expanding search bar overlays
              the sort control instead of pushing it) */}
          <View style={styles.infoActions}>
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

            {/* Filter Button */}
            <TouchableOpacity
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
            </TouchableOpacity>
          </View>
        </View>
        </Animated.View>
      </View>

      {/* Filter Tray Modal */}
      <ShowsFilterTray
        isOpen={filterTrayOpen}
        onClose={() => setFilterTrayOpen(false)}
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        showsByYear={songShowsByYear}
      />

      {/* Sort Dropdown */}
      <SortDropdown
        visible={sortDropdown.visible}
        onClose={sortDropdown.close}
        position={sortDropdown.position}
        options={PERFORMANCE_SORT_OPTIONS}
        selectedValue={sortType}
        onSelect={setSortType}
      />

      <Animated.FlatList
        ref={flatListRef}
        data={filteredPerformances}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={renderPerformanceItem}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop, { paddingTop: listTopPadding }]}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          debouncedSearchQuery.trim() || hasActiveFilters(appliedFilters) ? (
            <NoResultsState
              query={debouncedSearchQuery.trim() || 'the selected filters'}
              entityName="performances"
            />
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
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerDesktop: {
    paddingHorizontal: 32,
    backgroundColor: COLORS.backgroundSecondary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: LAYOUT.headerButtonSize,
    height: 28,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  // Same voice as ShowDetail's sticky nav title; inset past the back button
  // on both sides so it stays centered and truncates before colliding.
  compactTitle: {
    position: 'absolute',
    left: LAYOUT.headerButtonSize + LAYOUT.headerButtonGap,
    right: LAYOUT.headerButtonSize + LAYOUT.headerButtonGap,
    alignSelf: 'center',
    textAlign: 'center',
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  songTitle: {
    ...TYPOGRAPHY.heading2,
    flexShrink: 1,
  },
  performanceCount: {
    fontSize: 26,
    fontFamily: FONTS.primaryRegular,
    fontWeight: '400',
    color: COLORS.textTertiary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CONTROLS_ROW_HEIGHT,
  },
  infoActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: LAYOUT.headerButtonGap,
    zIndex: 10,
  },
  headerVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
});
