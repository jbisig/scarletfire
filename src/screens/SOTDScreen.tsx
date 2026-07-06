import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useShowOfTheDay } from '../contexts/ShowOfTheDayContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';
import { LoadingState, ErrorState } from '../components/StateViews';

type SOTDScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export function SOTDScreen() {
  const navigation = useNavigation<SOTDScreenNavigationProp>();
  const { show, isLoading, error, refreshShow } = useShowOfTheDay();

  const handleViewShow = () => {
    if (show) {
      navigation.navigate('ShowDetail', {
        identifier: show.primaryIdentifier,
        venue: show.venue,
        date: show.date,
        location: show.location,
        classicTier: show.classicTier,
      });
    }
  };

  const handleRefresh = () => {
    refreshShow();
  };

  if (isLoading) {
    return <LoadingState message="Loading show of the day..." />;
  }

  if (error || !show) {
    return (
      <ErrorState
        message={error || 'No show found'}
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="star" size={48} color={COLORS.accent} />
          <Text style={styles.headerTitle}>Show of the Day</Text>
          <Text style={styles.headerSubtitle}>
            Randomly selected from the top 365 most popular shows
          </Text>
        </View>

        <View style={styles.showCard}>
          <Text style={styles.date}>{formatDate(show.date)}</Text>
          <Text style={styles.venue}>{getVenueFromShow(show)}</Text>
          {show.location && (
            <Text style={styles.location}>{show.location}</Text>
          )}

          {show.versions.length > 0 && (
            <View style={styles.versionsInfo}>
              <Text style={styles.versionsText}>
                {show.versions.length} recording{show.versions.length > 1 ? 's' : ''} available
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.viewButton}
            onPress={handleViewShow}
            activeOpacity={0.7}
          >
            <Text style={styles.viewButtonText}>View Show</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={COLORS.accent} />
          <Text style={styles.refreshButtonText}>Pick Another Show</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: LAYOUT.listBottomPadding,
  },
  content: {
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
    marginTop: SPACING.xl,
  },
  headerTitle: {
    ...TYPOGRAPHY.displayLarge,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  showCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.xxl,
    marginBottom: SPACING.xxl,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  date: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.accent,
    marginBottom: SPACING.sm,
  },
  venue: {
    ...TYPOGRAPHY.display,
    marginBottom: SPACING.sm,
  },
  location: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  versionsInfo: {
    marginBottom: SPACING.xl,
  },
  versionsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textTertiary,
  },
  viewButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  refreshButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.accent,
    marginLeft: SPACING.sm,
  },
});
