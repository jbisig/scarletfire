import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  SectionList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { YearPicker } from '../components/YearPicker';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatDate } from '../utils/formatters';

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

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const sectionListRef = useRef<SectionList<any>>(null);
  const searchInputRef = useRef<TextInput>(null);
  const { showsByYear, isLoading, error } = useShows();
  const [sections, setSections] = useState<Array<{ title: string; data: GratefulDeadShow[] }>>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter shows based on search query
  const filterShows = (shows: GratefulDeadShow[], query: string): GratefulDeadShow[] => {
    if (!query.trim()) return shows;

    const lowerQuery = query.toLowerCase();
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

      return false;
    });
  };

  useEffect(() => {
    if (showsByYear) {
      // Get all available years
      const yearArray = Object.keys(showsByYear);

      // For the year picker dropdown, show years in ascending order (1965 -> 1995)
      const yearsAscending = [...yearArray].sort((a, b) => parseInt(a) - parseInt(b));
      setAvailableYears(yearsAscending);

      // Filter sections based on selected year and search query
      let yearsToShow = yearArray;
      if (selectedYear) {
        yearsToShow = [selectedYear];
      } else {
        // When "All Years" is selected, sort in ascending order (oldest first: 1965 -> 1995)
        yearsToShow = [...yearArray].sort((a, b) => parseInt(a) - parseInt(b));
      }

      const sectionData = yearsToShow.map(year => ({
        title: year,
        data: filterShows(showsByYear[year], searchQuery),
      })).filter(section => section.data.length > 0); // Remove empty sections

      setSections(sectionData);

      // Scroll to top when year selection or search query changes
      setTimeout(() => {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: 0,
          itemIndex: 0,
          animated: false,
        });
      }, 100);
    }
  }, [showsByYear, selectedYear, searchQuery]);

  const handleShowPress = (show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  };

  const handleYearChange = (year: string | null) => {
    setSelectedYear(year);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.blur();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading shows...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar with integrated Year Filter */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Date, venue, location"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
        <View style={styles.yearPickerContainer}>
          <YearPicker
            years={availableYears}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            compact={true}
          />
        </View>
      </View>

      {/* Shows List */}
      {sections.length === 0 && searchQuery.trim() ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No shows found matching "{searchQuery}"</Text>
        </View>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <ShowCard show={item} onPress={handleShowPress} />
          )}
          renderSectionHeader={() => null}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  yearPickerContainer: {
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 180,
  },
});
