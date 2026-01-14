import React, { useEffect, useState } from 'react';
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
import { archiveApi } from '../services/archiveApi';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';

type SOTDScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SOTD'>;

export function SOTDScreen() {
  const navigation = useNavigation<SOTDScreenNavigationProp>();
  const [show, setShow] = useState<GratefulDeadShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShowOfTheDay();
  }, []);

  const loadShowOfTheDay = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch top 365 most downloaded shows
      const topShows = await archiveApi.getTopShows(365);

      if (topShows.length === 0) {
        setError('No shows found');
        return;
      }

      // Select a random show
      const randomIndex = Math.floor(Math.random() * topShows.length);
      const selectedShow = topShows[randomIndex];

      setShow(selectedShow);
    } catch (err) {
      console.error('Error loading show of the day:', err);
      setError('Failed to load show of the day');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewShow = () => {
    if (show) {
      navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
    }
  };

  const handleRefresh = () => {
    loadShowOfTheDay();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="star" size={48} color="#ff6b6b" />
          <Text style={styles.headerTitle}>Show of the Day</Text>
          <Text style={styles.headerSubtitle}>
            Randomly selected from the top 365 most popular shows
          </Text>
        </View>

        <View style={styles.showCard}>
          <Text style={styles.date}>{formatDate(show.date)}</Text>
          <Text style={styles.venue}>{show.venue || show.title}</Text>
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
          <Ionicons name="refresh" size={20} color="#ff6b6b" />
          <Text style={styles.refreshButtonText}>Pick Another Show</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  showCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  date: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
    marginBottom: 8,
  },
  venue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginLeft: 8,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
