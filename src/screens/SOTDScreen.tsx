import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useShowOfTheDay } from '../contexts/ShowOfTheDayContext';
import { COLORS } from '../constants/theme';

type SOTDScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SOTD'>;

export function SOTDScreen() {
  const navigation = useNavigation<SOTDScreenNavigationProp>();
  const { show, isLoading, error, refreshShow } = useShowOfTheDay();

  const handleViewShow = () => {
    if (show) {
      navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
    }
  };

  const handleRefresh = () => {
    refreshShow();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading show of the day...</Text>
      </View>
    );
  }

  if (error || !show) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'No show found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
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
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    paddingBottom: 180,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  showCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  date: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  venue: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  versionsInfo: {
    marginBottom: 20,
  },
  versionsText: {
    fontSize: 14,
    color: '#ccc',
  },
  viewButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  refreshButtonText: {
    fontSize: 16,
    color: COLORS.accent,
    marginLeft: 8,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});
