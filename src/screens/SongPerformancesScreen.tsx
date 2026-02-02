import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { archiveApi } from '../services/archiveApi';
import { matchesDateQuery } from '../utils/formatters';
import showsData from '../data/shows.json';
import { GratefulDeadShow, ShowsByYear } from '../types/show.types';
import { ShowCard } from '../components/ShowCard';
import { NoResultsState } from '../components/StateViews';
import { useDebounce } from '../hooks/useDebounce';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

// Animation constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const BUTTON_SIZE = 40;
const BUTTON_GAP = 10;
const HORIZONTAL_PADDING = SPACING.xl;
// Full width = screen - padding on both sides (no filter button)
const SEARCH_BAR_FULL_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const ANIMATION_DURATION = 300;
import { SIMILARITY_THRESHOLDS } from '../constants/thresholds';
import { normalizeTrackTitle } from '../utils/titleNormalization';
import { logger } from '../utils/logger';

type SongPerformancesRouteProp = RouteProp<RootStackParamList, 'SongPerformances'>;
type SortType = 'alphabetical' | 'performanceDateOldest' | 'performanceDateNewest' | 'ratingHighest';

interface Performance {
  date: string;
  identifier: string;
  venue?: string;
  rating?: 1 | 2 | 3 | null;
}

const allShowsByYear = showsData as ShowsByYear;

// Look up show details by performance date
function getShowByDate(performanceDate: string) {
  const normalizedDate = performanceDate.substring(0, 10);
  const year = normalizedDate.substring(0, 4);
  const yearShows = allShowsByYear[year];
  if (!yearShows) return undefined;
  return yearShows.find(s => s.date.substring(0, 10) === normalizedDate);
}

// Calculate string similarity using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const distance = costs[s2.length];
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

export function SongPerformancesScreen() {
  const route = useRoute<SongPerformancesRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { loadTrack } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const [loadingIdentifier, setLoadingIdentifier] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('performanceDateOldest');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const flatListRef = useRef<FlatList<Performance>>(null);
  const searchInputRef = useRef<TextInput>(null);
  const sortButtonRef = useRef<View>(null);

  // Search animation state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortButtonPosition, setSortButtonPosition] = useState({ top: 0, left: 0 });
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Animated interpolations
  const searchBarWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BUTTON_SIZE, SEARCH_BAR_FULL_WIDTH],
    extrapolate: 'clamp',
  });
  // Expand search bar
  const handleSearchPress = useCallback(() => {
    setIsSearchExpanded(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
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
      duration: ANIMATION_DURATION,
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

  // Handle search text change - close if cleared via X button
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (text === '' && isSearchExpanded) {
      handleCloseSearch();
    }
  }, [isSearchExpanded, handleCloseSearch]);

  // Handle sort button press
  const handleSortPress = useCallback(() => {
    sortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSortButtonPosition({ top: pageY + height + 8, left: pageX });
      setShowSortModal(true);
    });
  }, []);

  // Get sort label based on current sort type
  const getSortLabel = (type: SortType): string => {
    switch (type) {
      case 'alphabetical':
        return 'Alphabetical';
      case 'performanceDateOldest':
      case 'performanceDateNewest':
        return 'Performance Date';
      case 'ratingHighest':
        return 'Rating';
      default:
        return 'Sort';
    }
  };

  // Get sort icon based on current sort type
  const getSortIcon = (type: SortType): 'arrow-up' | 'arrow-down' => {
    switch (type) {
      case 'performanceDateOldest':
        return 'arrow-up';
      default:
        return 'arrow-down';
    }
  };

  // Scroll to top when sort type changes
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [sortType]);

  const { songTitle, performances } = route.params;

  // Sort performances based on selected sort type
  const sortedPerformances = useMemo(() => {
    const sorted = [...performances];

    switch (sortType) {
      case 'alphabetical':
        return sorted.sort((a, b) => {
          const venueA = a.venue || '';
          const venueB = b.venue || '';
          return venueA.localeCompare(venueB);
        });

      case 'performanceDateOldest':
        return sorted.sort((a, b) => a.date.localeCompare(b.date));

      case 'performanceDateNewest':
        return sorted.sort((a, b) => b.date.localeCompare(a.date));

      case 'ratingHighest':
        return sorted.sort((a, b) => {
          if (!a.rating && !b.rating) {
            return a.date.localeCompare(b.date);
          }
          if (!a.rating) return 1;
          if (!b.rating) return -1;
          if (a.rating !== b.rating) {
            return b.rating - a.rating; // Highest first
          }
          return a.date.localeCompare(b.date);
        });

      default:
        return sorted;
    }
  }, [performances, sortType]);

  // Filter performances based on search query
  const filteredPerformances = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return sortedPerformances;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return sortedPerformances.filter((performance) => {
      const dateMatch = matchesDateQuery(performance.date, debouncedSearchQuery);
      const venueMatch = performance.venue?.toLowerCase().includes(query);
      return dateMatch || venueMatch;
    });
  }, [sortedPerformances, debouncedSearchQuery]);

  const handlePerformancePress = useCallback(async (performance: Performance) => {
    try {
      setLoadingIdentifier(performance.identifier);

      const showDetail = await archiveApi.getShowDetail(performance.identifier, false);

      let bestMatch = null;
      let bestScore = 0;

      for (const track of showDetail.tracks) {
        const normalizedTitle = normalizeTrackTitle(track.title);
        const similarity = calculateSimilarity(normalizedTitle, songTitle);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = track;
        }
      }

      if (bestMatch && bestScore >= SIMILARITY_THRESHOLDS.SEARCH_MATCH) {
        await loadTrack(bestMatch, showDetail, showDetail.tracks);
      } else {
        Alert.alert(
          'Song Not Found',
          `Could not find "${songTitle}" in this recording. The setlist may not match the available tracks.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.player.error('Failed to load performance:', error);
      Alert.alert(
        'Error Loading Show',
        'Unable to load this performance. Please try another one.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingIdentifier(null);
    }
  }, [songTitle, loadTrack]);

  const renderPerformanceItem = useCallback(({ item }: { item: Performance }) => {
    const isLoading = loadingIdentifier === item.identifier;
    const show = getShowByDate(item.date);
    const songPlayCount = getPlayCount(songTitle, item.identifier);

    if (show) {
      return (
        <View style={styles.performanceItemWrapper}>
          <ShowCard
            show={show}
            onPress={() => handlePerformancePress(item)}
            overrideRating={item.rating}
            overridePlayCount={songPlayCount}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.performanceItem}
        onPress={() => handlePerformancePress(item)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <Text style={styles.fallbackText}>{item.venue || item.date}</Text>
        {isLoading && (
          <ActivityIndicator size="small" color={COLORS.accent} />
        )}
      </TouchableOpacity>
    );
  }, [loadingIdentifier, handlePerformancePress, getPlayCount, songTitle]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Title Row with Search */}
        <View style={styles.titleRow}>
          {/* Left side: Title (gets covered by search bar) */}
          <View style={styles.titleContent}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {songTitle}
            </Text>
            <Text style={styles.performanceCount}>
              ({performances.length})
            </Text>
          </View>

          {/* Right side: Search button */}
          <View style={styles.titleRight}>
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
                        placeholder="Date, venue, location"
                        placeholderTextColor={COLORS.textHint}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
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
          </View>
        </View>

        {/* Sort Row */}
        <View style={styles.sortRow}>
          <View ref={sortButtonRef} collapsable={false}>
            <TouchableOpacity
              style={styles.sortLabel}
              onPress={handleSortPress}
              activeOpacity={0.7}
            >
              <Ionicons name={getSortIcon(sortType)} size={16} color={COLORS.textSecondary} />
              <Text style={styles.sortLabelText}>{getSortLabel(sortType)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sort Modal */}
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
              { top: sortButtonPosition.top, left: sortButtonPosition.left }
            ]}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSortType('alphabetical');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                sortType === 'alphabetical' && styles.dropdownItemTextSelected
              ]}>Alphabetical</Text>
              {sortType === 'alphabetical' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSortType('performanceDateOldest');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                sortType === 'performanceDateOldest' && styles.dropdownItemTextSelected
              ]}>Performance Date (Oldest First)</Text>
              {sortType === 'performanceDateOldest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSortType('performanceDateNewest');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                sortType === 'performanceDateNewest' && styles.dropdownItemTextSelected
              ]}>Performance Date (Newest First)</Text>
              {sortType === 'performanceDateNewest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSortType('ratingHighest');
                setShowSortModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownItemText,
                sortType === 'ratingHighest' && styles.dropdownItemTextSelected
              ]}>Rating (Highest First)</Text>
              {sortType === 'ratingHighest' && (
                <Ionicons name="checkmark" size={20} color={COLORS.accent} />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <FlatList
        ref={flatListRef}
        data={filteredPerformances}
        renderItem={renderPerformanceItem}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          debouncedSearchQuery.trim() ? (
            <NoResultsState query={debouncedSearchQuery} entityName="performances" />
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
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  backButton: {
    width: BUTTON_SIZE,
    height: 28,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: BUTTON_SIZE,
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    position: 'absolute',
    left: 0,
    right: BUTTON_SIZE + BUTTON_GAP,
    top: 0,
    bottom: 0,
  },
  songTitle: {
    ...TYPOGRAPHY.heading2,
    flexShrink: 1,
  },
  performanceCount: {
    fontSize: 26,
    fontFamily: 'FamiljenGrotesk-Regular',
    color: COLORS.textTertiary,
  },
  titleRight: {
    marginLeft: 'auto',
    zIndex: 10,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  searchContainer: {
    height: BUTTON_SIZE,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    height: BUTTON_SIZE,
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
  listContent: {
    paddingBottom: 180,
  },
  performanceItemWrapper: {
    position: 'relative',
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
  loadingOverlay: {
    position: 'absolute',
    right: SPACING.xxl,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  // Dropdown styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    minWidth: 150,
    ...SHADOWS.lg,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dropdownItemText: {
    ...TYPOGRAPHY.body,
  },
  dropdownItemTextSelected: {
    color: COLORS.accent,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});
