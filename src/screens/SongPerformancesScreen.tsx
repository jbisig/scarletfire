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
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { archiveApi } from '../services/archiveApi';
import { formatDate } from '../utils/formatters';

type SongPerformancesRouteProp = RouteProp<RootStackParamList, 'SongPerformances'>;

interface Performance {
  date: string;
  identifier: string;
  venue?: string;
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

function normalizeTrackTitle(title: string): string {
  return title
    .replace(/^\d+[\s.-]*/, '')
    .replace(/^Track\s+\d+[\s:]*/, '')
    .trim()
    .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\s*[#]\d+.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    .replace(/\s+[Jj]am\s*$/, '');
}

export function SongPerformancesScreen() {
  const route = useRoute<SongPerformancesRouteProp>();
  const { loadTrack } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const [loadingIdentifier, setLoadingIdentifier] = useState<string | null>(null);

  const { songTitle, performances } = route.params;

  const handlePerformancePress = async (performance: Performance) => {
    try {
      setLoadingIdentifier(performance.identifier);

      // Fetch the show details using the real Archive.org identifier
      const showDetail = await archiveApi.getShowDetail(performance.identifier, false);

      // Find the track that matches this song using fuzzy matching
      let bestMatch = null;
      let bestScore = 0;
      const SIMILARITY_THRESHOLD = 0.85; // 85% similarity required

      for (const track of showDetail.tracks) {
        const normalizedTitle = normalizeTrackTitle(track.title);
        const similarity = calculateSimilarity(normalizedTitle, songTitle);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = track;
        }
      }

      if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
        // Load and play the matching track
        await loadTrack(bestMatch, showDetail, showDetail.tracks);
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
    const playCount = getPlayCount(songTitle, item.identifier);

    return (
      <TouchableOpacity
        style={styles.performanceItem}
        onPress={() => handlePerformancePress(item)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <View style={styles.performanceInfo}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceDate}>{formatDate(item.date)}</Text>
            {playCount > 0 && (
              <View style={styles.playCountBadge}>
                <Ionicons name="play-circle" size={14} color="#ff6b6b" />
                <Text style={styles.playCountText}>
                  {playCount} {playCount === 1 ? 'play' : 'plays'}
                </Text>
              </View>
            )}
          </View>
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
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
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
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  performanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  playCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  playCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  performanceVenue: {
    fontSize: 14,
    color: '#999',
  },
});
