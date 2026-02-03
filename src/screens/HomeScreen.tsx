import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SectionList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Easing,
  Dimensions,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { ShowsFilterTray, ShowsFilterState, createEmptyFilterState, hasActiveFilters } from '../components/ShowsFilterTray';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { ErrorState, NoResultsState } from '../components/StateViews';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { matchesDateQuery } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';

// Default profile image for logged out users
const LOGGED_OUT_PROFILE = require('../../assets/images/logged-out-pfp.png');

// Layout constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = SPACING.xl;
// Full width = screen - padding on both sides - filter button - gap
const SEARCH_BAR_FULL_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - LAYOUT.headerButtonSize - LAYOUT.headerButtonGap;
import { getOfficialReleasesForDate, expandDisplaySeries, getYearsForAnySeries } from '../data/officialReleases';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// State name to abbreviation mapping
const STATE_ABBREVIATIONS: { [key: string]: string } = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH',
  'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
  'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN',
  'texas': 'TX', 'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA',
  'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

// Normalize string for fuzzy matching - removes apostrophes and special characters
function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''`'\u2018\u2019\u201B]/g, '')  // Remove all apostrophe/quote variants
    .replace(/[^\w\s]/g, ' ')  // Replace other punctuation with spaces
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .trim();
}

// Pure filter function - moved outside component to avoid recreation on each render
function filterShows(shows: GratefulDeadShow[], query: string): GratefulDeadShow[] {
  if (!query.trim()) return shows;

  const lowerQuery = query.toLowerCase();
  const normalizedQuery = normalizeForSearch(query);
  return shows.filter(show => {
    // Search in title
    if (show.title?.toLowerCase().includes(lowerQuery)) return true;

    // Search in venue
    if (show.venue?.toLowerCase().includes(lowerQuery)) return true;

    // Search in location (including state name to abbreviation conversion)
    if (show.location?.toLowerCase().includes(lowerQuery)) return true;

    // Check if query matches a state name, and if so, search for abbreviation
    const stateAbbr = STATE_ABBREVIATIONS[lowerQuery];
    if (stateAbbr && show.location?.toUpperCase().includes(stateAbbr)) return true;

    // Also check partial state name matches (e.g., "calif" matches "california" -> "CA")
    const matchingStates = Object.entries(STATE_ABBREVIATIONS).filter(([stateName]) =>
      stateName.startsWith(lowerQuery)
    );
    if (matchingStates.length > 0) {
      for (const [, abbr] of matchingStates) {
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
  const insets = useSafeAreaInsets();
  const sectionListRef = useRef<SectionList<GratefulDeadShow>>(null);
  const searchInputRef = useRef<TextInput>(null);
  const { showsByYear, isLoading, error } = useShows();
  const [filterTrayOpen, setFilterTrayOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ShowsFilterState>(createEmptyFilterState);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Search bar animation state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded

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
    closeDropdown,
  } = useProfileDropdown();

  // Animated interpolations
  const searchBarWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [LAYOUT.headerButtonSize + 4, SEARCH_BAR_FULL_WIDTH],
    extrapolate: 'clamp',
  });

  // Expand search bar
  const handleSearchPress = useCallback(() => {
    setIsSearchExpanded(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: LAYOUT.animationDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [searchAnim]);

  // Collapse search bar
  const handleCloseSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchQuery('');
    setIsSearchExpanded(false);
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: LAYOUT.animationDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [searchAnim]);

  // Close search bar when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isSearchExpanded) {
        handleCloseSearch();
      }
    });
    return unsubscribe;
  }, [navigation, isSearchExpanded, handleCloseSearch]);

  // Memoize available years - only recalculate when showsByYear changes
  const availableYears = useMemo(() => {
    if (!showsByYear) return [];
    return Object.keys(showsByYear).sort((a, b) => parseInt(a) - parseInt(b));
  }, [showsByYear]);

  // Memoize sections - only recalculate when dependencies change
  const sections = useMemo(() => {
    if (!showsByYear) return [];

    // Determine which years to show based on filters
    let yearsToShow: string[];
    if (appliedFilters.selectedYears.length > 0) {
      // Show only selected years
      yearsToShow = appliedFilters.selectedYears.filter(y => availableYears.includes(y));
    } else if (appliedFilters.selectedSeries.length > 0) {
      // Show years that have releases from selected series
      yearsToShow = getYearsForAnySeries(appliedFilters.selectedSeries)
        .filter(y => availableYears.includes(y));
    } else {
      // Show all years
      yearsToShow = availableYears;
    }

    // Sort years numerically
    yearsToShow = yearsToShow.sort((a, b) => parseInt(a) - parseInt(b));

    // Expand selected series for filtering
    const expandedSeries = appliedFilters.selectedSeries.length > 0
      ? expandDisplaySeries(appliedFilters.selectedSeries)
      : [];

    return yearsToShow
      .map(year => {
        let shows = showsByYear[year];

        // Apply search filter
        shows = filterShows(shows, debouncedSearchQuery);

        // Apply series filter
        if (expandedSeries.length > 0) {
          shows = shows.filter(show => {
            const releases = getOfficialReleasesForDate(show.date);
            return releases.some(r => expandedSeries.includes(r.series));
          });
        }

        return { title: year, data: shows };
      })
      .filter(section => section.data.length > 0);
  }, [showsByYear, appliedFilters, availableYears, debouncedSearchQuery]);

  // Scroll to top when filters or search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: false,
        viewOffset: 0,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [appliedFilters, debouncedSearchQuery]);

  const handleShowPress = useCallback((show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  }, [navigation]);

  const handleApplyFilters = useCallback((filters: ShowsFilterState) => {
    setAppliedFilters(filters);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Image source={LOGGED_OUT_PROFILE} style={styles.avatar} />
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
    <View style={styles.container}>
      {/* Header Section with Gradient Fade */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          {/* Left side: Avatar and Title (gets covered by search bar) */}
          <View style={styles.headerLeft}>
            <TouchableOpacity
              ref={profileButtonRef}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              <Image
                source={isAuthenticated && avatarUrl
                  ? { uri: avatarUrl }
                  : LOGGED_OUT_PROFILE
                }
                style={styles.avatar}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Shows</Text>
          </View>

          {/* Right side: Search and Filter buttons */}
          <View style={styles.headerRight}>
            {/* Animated Search Bar / Button */}
            <TouchableOpacity
              activeOpacity={isSearchExpanded ? 1 : 0.7}
              onPress={isSearchExpanded ? undefined : handleSearchPress}
              disabled={isSearchExpanded}
            >
              <Animated.View style={[styles.searchContainer, { width: searchBarWidth }]}>
                <View style={styles.searchInputWrapper}>
                  <Ionicons name="search" size={20} color={COLORS.textHint} style={styles.searchIconCentered} />
                  {isSearchExpanded && (
                    <View style={styles.searchExpandedContent}>
                      <View style={styles.searchIconSpacer} />
                      <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Date, venue, location, release"
                        placeholderTextColor={COLORS.textHint}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                        selectionColor={COLORS.textPrimary}
                      />
                      <TouchableOpacity
                        style={styles.closeSearchButton}
                        onPress={handleCloseSearch}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.textHint} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>

            {/* Filter Button */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters(appliedFilters) && styles.filterButtonActive,
              ]}
              onPress={() => setFilterTrayOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={hasActiveFilters(appliedFilters) ? COLORS.textPrimary : COLORS.textHint}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Gradient fade overlay */}
        <LinearGradient
          colors={[COLORS.background, COLORS.background + '00']}
          locations={[0, 1]}
          style={styles.headerGradient}
          pointerEvents="none"
        />
      </View>

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
      />

      {/* Shows List */}
      {sections.length === 0 && debouncedSearchQuery.trim() ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <NoResultsState query={debouncedSearchQuery} entityName="shows" />
        </TouchableWithoutFeedback>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.primaryIdentifier}
          renderItem={({ item }) => (
            <ShowCard show={item} onPress={handleShowPress} />
          )}
          renderSectionHeader={() => null}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          initialNumToRender={10}
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    position: 'absolute',
    left: HORIZONTAL_PADDING,
    top: 0,
    bottom: SPACING.lg,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.headerButtonGap,
    marginLeft: 'auto',
    zIndex: 10,
  },
  searchContainer: {
    height: LAYOUT.headerButtonSize + 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    padding: 2,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    height: LAYOUT.headerButtonSize,
    overflow: 'hidden',
  },
  searchIconCentered: {
    position: 'absolute',
    left: 10,
  },
  searchExpandedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xs,
    gap: 10,
  },
  searchIconSpacer: {
    width: 20,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
  },
  closeSearchButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  headerGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  listContent: {
    paddingTop: SPACING.sm + 8,
    paddingBottom: LAYOUT.listBottomPadding,
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
