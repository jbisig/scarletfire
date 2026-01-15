import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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

  const { songTitle, performances: initialPerformances } = route.params;
  const [performances, setPerformances] = useState<Performance[]>(initialPerformances || []);
  const [isLoadingPerformances, setIsLoadingPerformances] = useState(false);

  useEffect(() => {
    // If performances is empty, fetch them on-demand
    if (performances.length === 0) {
      loadPerformances();
    }
  }, []);

  const loadPerformances = async () => {
    try {
      setIsLoadingPerformances(true);

      // Fetch the full song catalog to find performances of this specific song
      const songVersionsMap = await archiveApi.getSongVersions();
      const songPerformances = songVersionsMap.get(songTitle) || [];

      setPerformances(songPerformances);
    } catch (error) {
      console.error('Failed to load performances:', error);
    } finally {
      setIsLoadingPerformances(false);
    }
  };

  const handlePerformancePress = async (performance: Performance) => {
    try {
      setLoadingIdentifier(performance.identifier);

      // Fetch the show details
      const showDetail = await archiveApi.getShowDetail(performance.identifier, false);

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
      }
    } catch (error) {
      console.error('Failed to load performance:', error);
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

  if (isLoadingPerformances) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.songTitle} numberOfLines={2}>
            {songTitle}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Loading performances...</Text>
          <Text style={styles.loadingSubtext}>
            Searching through the archive for all performances of this song
          </Text>
        </View>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});
