import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SectionList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { ShowsFilterTray, ShowsFilterState, createEmptyFilterState, hasActiveFilters, getFilterCount } from '../components/ShowsFilterTray';
import { PageHeader } from '../components/PageHeader';
import { SearchBar } from '../components/SearchBar';
import { LoadingState, ErrorState, NoResultsState } from '../components/StateViews';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { matchesDateQuery } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
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
  const sectionListRef = useRef<SectionList<any>>(null);
  const { showsByYear, isLoading, error } = useShows();
  const [filterTrayOpen, setFilterTrayOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ShowsFilterState>(createEmptyFilterState);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

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
      const scrollResponder = sectionListRef.current?.getScrollResponder();
      if (scrollResponder && 'scrollTo' in scrollResponder) {
        (scrollResponder as any).scrollTo({ x: 0, y: 0, animated: false });
      }
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
    return <LoadingState message="Loading shows..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <View style={styles.container}>
      {/* Page Header with Profile */}
      <PageHeader title="Shows" />

      {/* Search and Filter Row */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Date, venue, location"
          />
        </View>

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
            size={18}
            color={hasActiveFilters(appliedFilters) ? COLORS.textPrimary : COLORS.textHint}
          />
          <Text style={[
            styles.filterButtonText,
            hasActiveFilters(appliedFilters) && styles.filterButtonTextActive,
          ]}>
            {hasActiveFilters(appliedFilters) ? `${getFilterCount(appliedFilters)}` : 'Filter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tray Modal */}
      <ShowsFilterTray
        isOpen={filterTrayOpen}
        onClose={() => setFilterTrayOpen(false)}
        appliedFilters={appliedFilters}
        onApply={handleApplyFilters}
        showsByYear={showsByYear}
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
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: 10,
  },
  searchBarWrapper: {
    flex: 1,
  },
  listContent: {
    paddingVertical: SPACING.sm,
    paddingBottom: 180,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    gap: SPACING.sm - 2,
  },
  filterButtonActive: {
    backgroundColor: COLORS.accent,
  },
  filterButtonText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '500',
    color: COLORS.textHint,
  },
  filterButtonTextActive: {
    color: COLORS.textPrimary,
  },
});
