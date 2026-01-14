import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { YearPicker } from '../components/YearPicker';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { showsByYear, isLoading, error, loadShows } = useShows();
  const [sections, setSections] = useState<Array<{ title: string; data: GratefulDeadShow[] }>>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    if (showsByYear) {
      // Get all available years
      const yearArray = Object.keys(showsByYear);

      // For the year picker dropdown, show years in ascending order (1965 -> 1995)
      const yearsAscending = [...yearArray].sort((a, b) => parseInt(a) - parseInt(b));
      setAvailableYears(yearsAscending);

      // Filter sections based on selected year
      let yearsToShow = yearArray;
      if (selectedYear) {
        yearsToShow = [selectedYear];
      } else {
        // When "All Years" is selected, sort in ascending order (oldest first: 1965 -> 1995)
        yearsToShow = [...yearArray].sort((a, b) => parseInt(a) - parseInt(b));
      }

      const sectionData = yearsToShow.map(year => ({
        title: year,
        data: showsByYear[year],
      }));
      setSections(sectionData);
    }
  }, [showsByYear, selectedYear]);

  const handleShowPress = (show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  };

  const handleYearChange = (year: string | null) => {
    setSelectedYear(year);
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
      <YearPicker
        years={availableYears}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <ShowCard show={item} onPress={handleShowPress} />
        )}
        renderSectionHeader={({ section: { title } }) =>
          selectedYear ? null : (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
});
