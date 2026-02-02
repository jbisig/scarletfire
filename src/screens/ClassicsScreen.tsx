import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { EraPicker } from '../components/EraPicker';
import { DropdownMenu, DropdownOption } from '../components/DropdownMenu';
import { LoadingState } from '../components/StateViews';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ERAS, Era } from '../constants/classicShows';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

type ClassicsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Classics'>;
type SortType = 'performanceDate' | 'stars';

const SORT_OPTIONS: DropdownOption<SortType>[] = [
  { label: 'Date', value: 'performanceDate' },
  { label: 'Rating', value: 'stars' },
];

export function ClassicsScreen() {
  const navigation = useNavigation<ClassicsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { showsByYear, isLoading } = useShows();
  const listRef = useRef<FlatList<GratefulDeadShow>>(null);
  const [classicShows, setClassicShows] = useState<GratefulDeadShow[]>([]);
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [sortType, setSortType] = useState<SortType>('stars');

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
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [selectedEra, sortType]);

  const getSortLabel = (type: SortType): string => {
    const option = SORT_OPTIONS.find(o => o.value === type);
    return option?.label ?? 'Sort';
  };

  // Filter by era and sort based on sort type
  const sortedAndFilteredShows = useMemo(() => {
    let shows = [...classicShows];

    // Filter by era
    if (selectedEra) {
      shows = shows.filter(show => {
        const showYear = typeof show.year === 'number' ? show.year : parseInt(show.year, 10);
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

  const handleShowPress = useCallback((show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  }, [navigation]);

  const handleEraChange = (era: Era | null) => {
    setSelectedEra(era);
  };

  if (isLoading) {
    return <LoadingState message="Loading classic shows..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header Section with Gradient Fade */}
      <View style={styles.headerSection}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
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
            <DropdownMenu
              options={SORT_OPTIONS}
              selectedValue={sortType}
              onSelect={setSortType}
              triggerLabel={getSortLabel(sortType)}
            />
          </View>
        </View>

        {/* Gradient fade overlay */}
        <LinearGradient
          colors={[COLORS.background, 'transparent']}
          locations={[0, 1]}
          style={styles.headerGradient}
          pointerEvents="none"
        />
      </View>

      {/* Classic Shows List */}
      <FlatList
        ref={listRef}
        data={sortedAndFilteredShows}
        keyExtractor={(item) => item.primaryIdentifier}
        renderItem={({ item }) => (
          <ShowCard show={item} onPress={handleShowPress} />
        )}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={11}
        initialNumToRender={10}
      />
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
  headerGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...TYPOGRAPHY.heading2,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
});
