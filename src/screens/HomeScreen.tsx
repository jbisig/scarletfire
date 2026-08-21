import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SectionList,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { ShowsFilterTray, ShowsFilterState, hasActiveFilters } from '../components/ShowsFilterTray';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { ScreenHeader } from '../components/ScreenHeader';
import { AnimatedSearchBar } from '../components/AnimatedSearchBar';
import { ErrorState, NoResultsState } from '../components/StateViews';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { matchesDateQuery, normalizeForSearch } from '../utils/formatters';
import { showDetailParams } from '../utils/showDetailParams';
import { makeShowTagFilter, sourceConstraintFromTags } from '../services/tagResolver';
import { parseTagsParam, stringifyTagsParam } from '../navigation/webLinking';
import { useDebounce } from '../hooks/useDebounce';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { SortDropdown } from '../components/SortDropdown';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileImage } from '../components/ProfileImage';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';
import { getOfficialReleasesForDate } from '../data/officialReleases';
import { STATE_ABBREVIATIONS } from '../constants/states';
import {
  HomeSortType,
  HOME_SORT_VALID_TYPES,
  HOME_SORT_OPTIONS,
  getHomeSortLabel,
  getHomeSortIcon,
} from '../constants/sortOptions';
import { useSortDropdown } from '../hooks/useSortDropdown';
import { compareByDate, compareAlphabetical } from '../utils/sortComparators';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

type ShowSortType = HomeSortType;
const VALID_SORT_TYPES = HOME_SORT_VALID_TYPES;

function getPrimaryDownloads(show: GratefulDeadShow): number {
  const primaryVersion = show.versions.find(v => v.identifier === show.primaryIdentifier);
  return primaryVersion?.downloads ?? 0;
}

// Pure filter function - moved outside component to avoid recreation on each render
function filterShows(shows: GratefulDeadShow[], query: string): GratefulDeadShow[] {
  if (!query.trim()) return shows;

  const lowerQuery = query.toLowerCase();
  const normalizedQuery = normalizeForSearch(query);

  // Check if query matches a state name, and if so, search for abbreviation.
  // Hoisted out of the per-show loop below — both only depend on the query,
  // not on the individual show, so recomputing them for every show was
  // pure waste (an O(states) scan repeated once per show in the list).
  const stateAbbr = STATE_ABBREVIATIONS[lowerQuery];
  const matchingStateAbbrs = Object.entries(STATE_ABBREVIATIONS)
    .filter(([stateName]) => stateName.startsWith(lowerQuery))
    .map(([, abbr]) => abbr);

  return shows.filter(show => {
    // Search in title
    if (show.title?.toLowerCase().includes(lowerQuery)) return true;

    // Search in venue
    if (show.venue?.toLowerCase().includes(lowerQuery)) return true;

    // Search in location (including state name to abbreviation conversion)
    if (show.location?.toLowerCase().includes(lowerQuery)) return true;

    if (stateAbbr && show.location?.toUpperCase().includes(stateAbbr)) return true;

    // Also check partial state name matches (e.g., "calif" matches "california" -> "CA")
    if (matchingStateAbbrs.length > 0) {
      for (const abbr of matchingStateAbbrs) {
        if (show.location?.toUpperCase().includes(abbr)) return true;
      }
    }

    // Fuzzy date matching - supports many common formats:
    // 5/8/77, 5-8-1977, May 8, 8 May 1977, 1977-05-08, etc.
    if (matchesDateQuery(show.date, query)) return true;

    // Search in official release names (e.g., "Europe 72", "Dick's Picks")
    // Uses fuzzy matching to handle apostrophes and punctuation differences
    const officialReleases = getOfficialReleasesForDate(show.date);
    if (officialReleases.length > 0) {
      for (const release of officialReleases) {
        // Exact match first
        if (release.name.toLowerCase().includes(lowerQuery)) return true;
        if (release.series.toLowerCase().includes(lowerQuery)) return true;
        // Fuzzy match (ignoring apostrophes/punctuation)
        const normalizedName = normalizeForSearch(release.name);
        const normalizedSeries = normalizeForSearch(release.series);
        if (normalizedName.includes(normalizedQuery)) return true;
        if (normalizedSeries.includes(normalizedQuery)) return true;
      }
    }

    return false;
  });
}

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { width: windowWidth } = useWindowDimensions();
  const [headerWidth, setHeaderWidth] = useState(windowWidth);
  const padding = isDesktop ? 32 : LAYOUT.HORIZONTAL_PADDING;
  const searchBarFullWidth = headerWidth - (padding * 2) - LAYOUT.headerButtonSize - LAYOUT.headerButtonGap;
  const sectionListRef = useRef<SectionList<GratefulDeadShow>>(null);
  const flatListRef = useRef<FlatList<GratefulDeadShow>>(null);
  const { showsByYear, isLoading, error } = useShows();
  const [filterTrayOpen, setFilterTrayOpen] = useState(false);

  // Initialize sort/filter state from URL params (if present)
  const [sortType, setSortType] = useState<ShowSortType>(() => {
    const urlSort = route.params?.sort;
    return urlSort && VALID_SORT_TYPES.includes(urlSort as ShowSortType)
      ? (urlSort as ShowSortType)
      : 'mostPopular';
  });
  const sortDropdown = useSortDropdown();
  const [appliedFilters, setAppliedFilters] = useState<ShowsFilterState>(() => {
    const urlYears = route.params?.years;
    return {
      selectedYears: urlYears ? urlYears.split(',').filter(Boolean) : [],
      selectedTags: parseTagsParam(route.params?.tags),
    };
  });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Sync sort/filter state to URL (web only)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const params: Record<string, string | undefined> = {
      sort: sortType !== 'mostPopular' ? sortType : undefined,
      years: appliedFilters.selectedYears.length > 0
        ? appliedFilters.selectedYears.join(',')
        : undefined,
      tags: stringifyTagsParam(appliedFilters.selectedTags),
    };
    navigation.setParams(params as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }, [sortType, appliedFilters, navigation]);

  // Search bar animation state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
    handleSupport,
    handleViewProfile,
    closeDropdown,
  } = useProfileDropdown();

  // Search bar handlers
  const handleSearchExpand = useCallback(() => {
    setIsSearchExpanded(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  }, []);

  // Memoize available years - only recalculate when showsByYear changes
  const availableYears = useMemo(() => {
    if (!showsByYear) return [];
    return Object.keys(showsByYear).sort((a, b) => parseInt(a) - parseInt(b));
  }, [showsByYear]);

  // Cascading filter computation — each stage only recomputes when its deps change

  // Stage 1: Filter by year and tags (recomputes only when filters change, not on search)
  const yearAndTagFiltered = useMemo(() => {
    if (!showsByYear) return [];

    // Determine which years to show based on filters
    let yearsToShow: string[];
    if (appliedFilters.selectedYears.length > 0) {
      yearsToShow = appliedFilters.selectedYears.filter(y => availableYears.includes(y));
    } else {
      yearsToShow = availableYears;
    }

    yearsToShow = yearsToShow.sort((a, b) => parseInt(a) - parseInt(b));

    const keep = makeShowTagFilter(appliedFilters.selectedTags);
    return yearsToShow.map(year => {
      const shows = appliedFilters.selectedTags.length > 0
        ? showsByYear[year].filter(s => keep(s.date))
        : showsByYear[year];
      return { title: year, data: shows };
    }).filter(section => section.data.length > 0);
  }, [showsByYear, appliedFilters, availableYears]);

  // Stage 2: Apply search filter on top of year/tag results
  const sections = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return yearAndTagFiltered;

    return yearAndTagFiltered
      .map(section => ({
        title: section.title,
        data: filterShows(section.data, debouncedSearchQuery),
      }))
      .filter(section => section.data.length > 0);
  }, [yearAndTagFiltered, debouncedSearchQuery]);

  // Flatten and sort shows for non-default sort types
  const sortedFlatShows = useMemo(() => {
    if (sortType === 'default') return [];
    const allShows = sections.flatMap(section => section.data);
    switch (sortType) {
      case 'mostPopular':
        return allShows.sort((a, b) => getPrimaryDownloads(b) - getPrimaryDownloads(a));
      case 'alphabetical':
        return allShows.sort((a, b) => compareAlphabetical(a.venue || '', b.venue || ''));
      case 'performanceDateNewest':
        return allShows.sort((a, b) => compareByDate(a.date, b.date, 'newest'));
      default:
        return allShows;
    }
  }, [sections, sortType]);

  // Scroll to top when filters, search query, or sort type changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sortType === 'default') {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: 0,
          itemIndex: 0,
          animated: false,
          viewOffset: 0,
        });
      } else {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [appliedFilters, debouncedSearchQuery, sortType]);

  const handleShowPress = useCallback((show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', showDetailParams(show, {
      sourceConstraint: sourceConstraintFromTags(appliedFilters.selectedTags),
    }));
  }, [navigation, appliedFilters.selectedTags]);

  const handleApplyFilters = useCallback((filters: ShowsFilterState) => {
    setAppliedFilters(filters);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <View style={[styles.header, isDesktop && styles.headerDesktop, { paddingTop: insets.top + 8 }]}>
          {!isDesktop && <ProfileImage uri={null} style={styles.avatar} />}
          <Text style={styles.headerTitle}>Shows</Text>
        </View>
        <SkeletonLoader variant="showCard" count={10} />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <ScreenHeader
        title="Shows"
        isDesktop={isDesktop}
        topPadding={insets.top + 8}
        onHeaderLayout={(e) => setHeaderWidth(e.nativeEvent.layout.width)}
        isSearchExpanded={isSearchExpanded}
        profileButtonRef={profileButtonRef}
        avatarUrl={avatarUrl}
        isAuthenticated={isAuthenticated}
        onProfilePress={handleProfilePress}
        rightContent={
          <>
            {/* Animated Search Bar */}
            <AnimatedSearchBar
              isExpanded={isSearchExpanded}
              onExpand={handleSearchExpand}
              onClose={handleSearchClose}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Date, venue, location, release"
              expandedWidth={searchBarFullWidth}
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
          </>
        }
      />

      {/* Filter Tray Modal */}
      <ShowsFilterTray
        isOpen={filterTrayOpen}
        onClose={() => setFilterTrayOpen(false)}
        appliedFilters={appliedFilters}
        onApply={handleApplyFilters}
        showsByYear={showsByYear}
      />

      {/* Profile Dropdown */}
      <ProfileDropdown
        state={dropdownState}
        isAuthenticated={isAuthenticated}
        onClose={closeDropdown}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSettings={handleSettings}
        onSupport={handleSupport}
        onViewProfile={handleViewProfile}
      />

      {/* Action Bar Section with Sort */}
      <View style={[styles.actionBarSection, isDesktop && styles.actionBarSectionDesktop]}>
        <View style={[styles.actionRow, isDesktop && styles.actionRowDesktop]}>
          <View ref={sortDropdown.buttonRef} collapsable={false}>
            <TouchableOpacity
              style={styles.sortLabelButton}
              onPress={sortDropdown.open}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sort shows by ${getHomeSortLabel(sortType)}`}
              accessibilityHint="Double tap to change sort order"
            >
              <Ionicons name={getHomeSortIcon(sortType)} size={16} color={COLORS.textSecondary} />
              <Text style={styles.sortLabelText}>{getHomeSortLabel(sortType)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={[COLORS.background, COLORS.background + '00']}
          locations={[0, 1]}
          style={[styles.actionBarGradient, isDesktop && styles.actionBarGradientDesktop]}
          pointerEvents="none"
        />
      </View>

      {/* Shows List */}
      {sections.length === 0 && debouncedSearchQuery.trim() ? (
        <NoResultsState query={debouncedSearchQuery} entityName="shows" />
      ) : sortType === 'default' ? (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.primaryIdentifier}
          renderItem={({ item }) => (
            <ShowCard show={item} onPress={handleShowPress} />
          )}
          renderSectionHeader={() => null}
          contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          initialNumToRender={10}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={sortedFlatShows}
          keyExtractor={(item) => item.primaryIdentifier}
          renderItem={({ item }) => (
            <ShowCard show={item} onPress={handleShowPress} />
          )}
          contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          initialNumToRender={10}
        />
      )}

      {/* Sort Dropdown */}
      <SortDropdown
        visible={sortDropdown.visible}
        onClose={sortDropdown.close}
        position={sortDropdown.position}
        options={HOME_SORT_OPTIONS}
        selectedValue={sortType}
        onSelect={setSortType}
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
  // Kept for the isLoading skeleton header below (a simpler, non-absolute layout
  // that doesn't go through <ScreenHeader>). ScreenHeader owns its own copies
  // of these for the real header.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
  headerDesktop: {
    paddingHorizontal: 32,
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
  actionBarSection: {
    backgroundColor: COLORS.background,
    zIndex: 10,
    overflow: 'visible',
  },
  actionBarSectionDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  actionBarGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  actionBarGradientDesktop: {
    display: 'none',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.md,
  },
  actionRowDesktop: {
    paddingLeft: LAYOUT.HORIZONTAL_PADDING + 8,
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
  listContent: {
    paddingTop: SPACING.sm + 8,
    paddingBottom: LAYOUT.listBottomPadding,
  },
  listContentDesktop: {
    padding: 16,
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
});
