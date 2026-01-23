import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { EraPicker } from '../components/EraPicker';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ERAS, Era } from '../constants/classicShows';
import { COLORS, FONTS } from '../constants/theme';

type ClassicsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Classics'>;
type SortType = 'performanceDate' | 'stars';

export function ClassicsScreen() {
  const navigation = useNavigation<ClassicsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { showsByYear, isLoading } = useShows();
  const scrollViewRef = useRef<ScrollView>(null);
  const sortButtonRef = useRef<View>(null);
  const [classicShows, setClassicShows] = useState<GratefulDeadShow[]>([]);
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [sortType, setSortType] = useState<SortType>('stars');
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortButtonPosition, setSortButtonPosition] = useState({ top: 0, right: 0 });

  const handleSortPress = () => {
    sortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSortButtonPosition({ top: pageY + height + 8, right: 20 });
      setShowSortModal(true);
    });
  };

  useEffect(() => {
    if (showsByYear) {
      // Get all shows and filter for classic shows (any show with a star rating)
      const allShows: GratefulDeadShow[] = [];
      Object.keys(showsByYear).forEach(year => {
        allShows.push(...showsByYear[year]);
      });

      // Filter for shows with a classicTier (1, 2, or 3 stars)
      const classics = allShows.filter(show => show.classicTier !== undefined);

      setClassicShows(classics);
    }
  }, [showsByYear]);

  // Scroll to top when era or sort type changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [selectedEra, sortType]);

  const getSortLabel = (sort: SortType): string => {
    switch (sort) {
      case 'performanceDate':
        return 'Date';
      case 'stars':
        return 'Rating';
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
        // Sort by star rating: 3-star shows first, then 2-star, then 1-star
        // Tier 1 = 3 stars, Tier 2 = 2 stars, Tier 3 = 1 star
        // Then by date within same tier
        return shows.sort((a, b) => {
          const tierA = a.classicTier || 999; // No tier goes last
          const tierB = b.classicTier || 999;

          if (tierA !== tierB) {
            return tierA - tierB; // Lower tier number = more stars, comes first
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
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading classic shows...</Text>
      </View>
    );
  }

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

        {/* Title */}
        <Text style={styles.title}>Classic Shows</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          The most legendary performances from the band's 30-year history.
        </Text>

        {/* Era Picker and Sort Button Row */}
        <View style={styles.filtersRow}>
          <EraPicker
            eras={ERAS}
            selectedEra={selectedEra}
            onEraChange={handleEraChange}
          />
          <View ref={sortButtonRef} collapsable={false}>
            <TouchableOpacity
              style={styles.sortPillButton}
              onPress={handleSortPress}
              activeOpacity={0.7}
            >
              <Text style={styles.sortPillButtonText}>{getSortLabel(sortType)}</Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Classic Shows List */}
      <ScrollView ref={scrollViewRef} style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.showsList}>
          {sortedAndFilteredShows.map((show) => (
            <ShowCard key={show.date} show={show} onPress={handleShowPress} />
          ))}
        </View>
      </ScrollView>

      {/* Sort Dropdown */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              { top: sortButtonPosition.top, right: sortButtonPosition.right }
            ]}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSortType('performanceDate');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                sortType === 'performanceDate' && styles.dropdownItemTextSelected
              ]}>Date</Text>
              {sortType === 'performanceDate' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSortType('stars');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                sortType === 'stars' && styles.dropdownItemTextSelected
              ]}>Rating</Text>
              {sortType === 'stars' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  sortPillButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  showsList: {
    gap: 0,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  dropdownItemTextSelected: {
    color: COLORS.accent,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});
