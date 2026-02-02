import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShows } from '../contexts/ShowsContext';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GRATEFUL_DEAD_101_DATES } from '../constants/classicShows';
import { ShowCard } from '../components/ShowCard';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { SkeletonLoader } from '../components/SkeletonLoader';

type GratefulDead101ScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GratefulDead101'>;

export function GratefulDead101Screen() {
  const navigation = useNavigation<GratefulDead101ScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { showsByYear, isLoading } = useShows();
  const [beginnerShows, setBeginnerShows] = useState<GratefulDeadShow[]>([]);

  useEffect(() => {
    if (showsByYear) {
      // Get all shows and filter for beginner-friendly shows
      const allShows: GratefulDeadShow[] = [];
      Object.keys(showsByYear).forEach(year => {
        allShows.push(...showsByYear[year]);
      });

      const beginners = allShows.filter(show => {
        // Extract just the date part (YYYY-MM-DD) from the ISO timestamp
        const dateOnly = show.date.split('T')[0];
        return GRATEFUL_DEAD_101_DATES.includes(dateOnly);
      });

      // Sort by the order in GRATEFUL_DEAD_101_DATES array
      beginners.sort((a, b) => {
        const dateA = a.date.split('T')[0];
        const dateB = b.date.split('T')[0];
        return GRATEFUL_DEAD_101_DATES.indexOf(dateA) - GRATEFUL_DEAD_101_DATES.indexOf(dateB);
      });

      setBeginnerShows(beginners);
    }
  }, [showsByYear]);

  const handleShowPress = useCallback((show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  }, [navigation]);

  const renderShowItem = useCallback(({ item }: { item: GratefulDeadShow }) => {
    return <ShowCard show={item} onPress={handleShowPress} />;
  }, [handleShowPress]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Grateful Dead 101</Text>
            <Text style={styles.subtitle}>
              New to the Grateful Dead? Start your journey with these 10 essential shows.
            </Text>
          </View>
          <LinearGradient
            colors={[COLORS.background, 'transparent']}
            locations={[0, 1]}
            style={styles.headerGradient}
            pointerEvents="none"
          />
        </View>
        <SkeletonLoader variant="showCard" count={10} />
      </View>
    );
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
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Grateful Dead 101</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            New to the Grateful Dead? Start your journey with these 10 essential shows.
          </Text>
        </View>

        {/* Gradient fade overlay */}
        <LinearGradient
          colors={[COLORS.background, 'transparent']}
          locations={[0, 1]}
          style={styles.headerGradient}
          pointerEvents="none"
        />
      </View>

      <FlatList
        data={beginnerShows}
        renderItem={renderShowItem}
        keyExtractor={(item) => item.primaryIdentifier}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No shows available</Text>
          </View>
        }
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  backButton: {
    width: SPACING.xxxxl,
    height: SPACING.xxxxl,
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
  listContent: {
    paddingBottom: 180,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.xxxxl,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
