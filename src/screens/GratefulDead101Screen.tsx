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
import { COLORS, FONTS } from '../constants/theme';

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading essential shows...</Text>
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
        <Text style={styles.title}>Grateful Dead 101</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          New to the Grateful Dead? Start your journey with these 10 essential shows.
        </Text>
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
  listContent: {
    paddingBottom: 180,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
