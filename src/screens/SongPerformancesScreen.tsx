import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayer } from '../contexts/PlayerContext';
import { archiveApi } from '../services/archiveApi';
import { formatDate } from '../utils/formatters';

type SongPerformancesRouteProp = RouteProp<RootStackParamList, 'SongPerformances'>;

interface Performance {
  date: string;
  identifier: string;
  venue?: string;
}

export function SongPerformancesScreen() {
  const route = useRoute<SongPerformancesRouteProp>();
  const { loadTrack } = usePlayer();
  const [loadingIdentifier, setLoadingIdentifier] = useState<string | null>(null);

  const { songTitle, performances } = route.params;

  const handlePerformancePress = async (performance: Performance) => {
    try {
      setLoadingIdentifier(performance.identifier);

      // Search for shows on this date to find the real identifier
      const year = performance.date.split('-')[0];
      const allDocs = await archiveApi.searchShows(0, 100, year);

      // Find show(s) matching this date
      const matchingShows = allDocs.filter(doc => doc.date === performance.date);

      if (matchingShows.length === 0) {
        Alert.alert(
          'Recording Not Available',
          `No recording found for ${formatDate(performance.date)}${performance.venue ? ` at ${performance.venue}` : ''}.\n\nThis show was performed but may not have been recorded or isn't available in the Archive yet.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Use the first matching show (most downloads)
      const bestShow = matchingShows.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0];

      // Fetch the show details using the real identifier
      const showDetail = await archiveApi.getShowDetail(bestShow.identifier, false);

      // Find the track that matches this song
      const matchingTrack = showDetail.tracks.find(track => {
        const normalizedTitle = track.title
          .replace(/^\d+[\s.-]*/, '')
          .replace(/^Track\s+\d+[\s:]*/, '')
          .trim()
          .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
          .replace(/\s*[#]\d+.*$/i, '')
          .replace(/\s*\(.*?\)\s*$/, '')
          .replace(/\s*\[.*?\]\s*$/, '')
          .replace(/\s+[Jj]am\s*$/, '');

        return normalizedTitle.toLowerCase() === songTitle.toLowerCase();
      });

      if (matchingTrack) {
        // Load and play the matching track
        await loadTrack(matchingTrack, showDetail, showDetail.tracks);
      } else {
        Alert.alert(
          'Song Not Found',
          `Could not find "${songTitle}" in this recording. The setlist may not match the available tracks.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to load performance:', error);
      Alert.alert(
        'Error Loading Show',
        'Unable to load this performance. Please try another one.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingIdentifier(null);
    }
  };

  const renderPerformanceItem = ({ item }: { item: Performance }) => {
    const isLoading = loadingIdentifier === item.identifier;

    return (
      <TouchableOpacity
        style={styles.performanceItem}
        onPress={() => handlePerformancePress(item)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <View style={styles.performanceInfo}>
          <Text style={styles.performanceDate}>{formatDate(item.date)}</Text>
          {item.venue && (
            <Text style={styles.performanceVenue} numberOfLines={2}>
              {item.venue}
            </Text>
          )}
        </View>
        {isLoading && (
          <ActivityIndicator size="small" color="#ff6b6b" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.songTitle} numberOfLines={2}>
          {songTitle}
        </Text>
        <Text style={styles.performanceCount}>
          {performances.length} performance{performances.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={performances}
        renderItem={renderPerformanceItem}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  performanceCount: {
    fontSize: 16,
    color: '#999',
  },
  listContent: {
    paddingBottom: 180,
  },
  performanceItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performanceInfo: {
    flex: 1,
    marginRight: 16,
  },
  performanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  performanceVenue: {
    fontSize: 14,
    color: '#999',
  },
});
