import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  SectionList,
  TextInput,
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
import { YearPicker } from '../components/YearPicker';
import { PageHeader } from '../components/PageHeader';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatDate } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import { COLORS, FONTS } from '../constants/theme';
import { getOfficialReleasesForDate } from '../data/officialReleases';

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
    .replace(/[''`]/g, '')  // Remove various apostrophe types
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

    // Search in date (multiple formats)
    // Raw date: "1977-05-08" or "1977-05-08T00:00:00Z"
    if (show.date.includes(lowerQuery)) return true;

    // Year only
    if (show.year && String(show.year).includes(lowerQuery)) return true;

    // Extract date portion (handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SSZ" formats)
    const datePart = show.date.includes('T') ? show.date.split('T')[0] : show.date;
    const [year, month, day] = datePart.split('-');

    // Numeric date variations (using raw ISO date parts to avoid timezone issues)
    const dateVariations = [
      `${month}/${day}/${year}`,  // 05/08/1977
      `${month}/${day}`,          // 05/08
      `${parseInt(month)}/${parseInt(day)}/${year}`,  // 5/8/1977
      `${parseInt(month)}/${parseInt(day)}`,          // 5/8
    ];

    if (dateVariations.some(variation => variation.includes(lowerQuery))) return true;

    // Formatted date with month name: "May 8, 1977" (only for text searches)
    // Only use formatted date for searches that contain letters (month names)
    if (/[a-z]/.test(lowerQuery)) {
      const formattedDate = formatDate(show.date).toLowerCase();
      if (formattedDate.includes(lowerQuery)) return true;
    }

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
  const searchInputRef = useRef<TextInput>(null);
  const { showsByYear, isLoading, error } = useShows();
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
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

    const yearsToShow = selectedYear
      ? [selectedYear]
      : availableYears;

    return yearsToShow
      .map(year => ({
        title: year,
        data: filterShows(showsByYear[year], debouncedSearchQuery),
      }))
      .filter(section => section.data.length > 0);
  }, [showsByYear, selectedYear, availableYears, debouncedSearchQuery]);

  // Scroll to top when year selection or search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const scrollResponder = sectionListRef.current?.getScrollResponder();
      if (scrollResponder && 'scrollTo' in scrollResponder) {
        (scrollResponder as any).scrollTo({ x: 0, y: 0, animated: false });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedYear, debouncedSearchQuery]);

  const handleShowPress = useCallback((show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  }, [navigation]);

  const handleYearChange = useCallback((year: string | null) => {
    setSelectedYear(year);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.blur();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading shows...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Page Header with Profile */}
      <PageHeader title="Shows" />

      {/* Search and Filter Row */}
      <View style={styles.searchFilterRow}>
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
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
              onPress={handleClearSearch}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.66)" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Year Filter Pill */}
        <YearPicker
          years={availableYears}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          compact={true}
        />
      </View>

      {/* Shows List */}
      {sections.length === 0 && debouncedSearchQuery.trim() ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No shows found matching "{debouncedSearchQuery}"</Text>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  searchBar: {
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.accent,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 180,
  },
});
