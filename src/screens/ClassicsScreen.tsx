import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { EraPicker } from '../components/EraPicker';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ERAS, CLASSIC_SHOW_DATES, Era } from '../constants/classicShows';

type ClassicsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Classics'>;
type SortType = 'performanceDate' | 'stars';

export function ClassicsScreen() {
  const navigation = useNavigation<ClassicsScreenNavigationProp>();
  const { showsByYear, isLoading } = useShows();
  const [classicShows, setClassicShows] = useState<GratefulDeadShow[]>([]);
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [sortType, setSortType] = useState<SortType>('performanceDate');
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    if (showsByYear) {
      // Get all shows and filter for classic shows
      const allShows: GratefulDeadShow[] = [];
      Object.keys(showsByYear).forEach(year => {
        allShows.push(...showsByYear[year]);
      });

      const classics = allShows.filter(show => {
        // Extract just the date part (YYYY-MM-DD) from the ISO timestamp
        const dateOnly = show.date.split('T')[0];
        return CLASSIC_SHOW_DATES.includes(dateOnly);
      });

      setClassicShows(classics);
    }
  }, [showsByYear]);

  const getSortLabel = (sort: SortType): string => {
    switch (sort) {
      case 'performanceDate':
        return 'Performance Date';
      case 'stars':
        return 'Stars';
      default:
        return 'Sort';
    }
  };

  // Filter by era and sort based on sort type
  const sortedAndFilteredShows = useMemo(() => {
    let shows = [...classicShows];

    // Filter by era
    if (selectedEra) {
      shows = shows.filter(show => {
        const showYear = parseInt(show.year);
        return showYear >= selectedEra.startYear && showYear <= selectedEra.endYear;
      });
    }

    // Sort based on selected sort type
    switch (sortType) {
      case 'performanceDate':
        return shows.sort((a, b) => a.date.localeCompare(b.date));
      case 'stars':
        // Sort by star rating: 3-star (tier 1) → 2-star (tier 2) → 1-star (tier 3)
        // Then by date within same tier
        return shows.sort((a, b) => {
          const tierA = a.classicTier || 999; // No tier goes last
          const tierB = b.classicTier || 999;

          if (tierA !== tierB) {
            return tierA - tierB; // tier 1 (3 stars) comes before tier 2 (2 stars), etc.
          }
          return a.date.localeCompare(b.date);
        });
      default:
        return shows;
    }
  }, [classicShows, selectedEra, sortType]);

  const handleShowPress = (show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  };

  const handleEraChange = (era: Era | null) => {
    setSelectedEra(era);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading classic shows...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Era Picker and Sort Button */}
      <View style={styles.filtersContainer}>
        <EraPicker
          eras={ERAS}
          selectedEra={selectedEra}
          onEraChange={handleEraChange}
        />
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={18} color="#ff6b6b" />
          <Text style={styles.sortButtonText}>{getSortLabel(sortType)}</Text>
        </TouchableOpacity>
      </View>

      {/* Classic Shows List */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.showsList}>
            {sortedAndFilteredShows.map((show) => (
              <ShowCard key={show.date} show={show} onPress={handleShowPress} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortType('performanceDate');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortOptionText}>Performance Date</Text>
              {sortType === 'performanceDate' && (
                <Ionicons name="checkmark" size={24} color="#ff6b6b" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortType('stars');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortOptionText}>Stars</Text>
              {sortType === 'stars' && (
                <Ionicons name="checkmark" size={24} color="#ff6b6b" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 180,
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
  content: {
    paddingVertical: 8,
  },
  showsList: {
    gap: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
});
