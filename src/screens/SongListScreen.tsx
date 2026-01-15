import React, { useEffect, useState } from 'react';
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
import { RootStackParamList } from '../navigation/AppNavigator';
import { archiveApi } from '../services/archiveApi';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs';
import { generateSongData } from '../utils/generateSongData';

type SongListNavigationProp = StackNavigationProp<RootStackParamList, 'SongList'>;

interface SongItem {
  title: string;
  performanceCount: number;
  performances: Array<{ date: string; identifier: string; venue?: string }>;
}

export function SongListScreen() {
  const navigation = useNavigation<SongListNavigationProp>();
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadSongs();
    // TEMPORARY: Generate full song data with performances
    generateFullSongData();
  }, []);

  const generateFullSongData = async () => {
    if (isGenerating) return; // Prevent multiple runs
    setIsGenerating(true);

    try {
      console.log('🎸 Starting song data generation...');
      await generateSongData();
    } catch (error) {
      console.error('Failed to generate song data:', error);
    }
  };

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use hard-coded song list (pre-filtered for 3+ performances)
      setSongs(GRATEFUL_DEAD_SONGS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongPress = async (song: SongItem) => {
    // Navigate to performances screen - it will fetch actual performances on-demand
    navigation.navigate('SongPerformances', {
      songTitle: song.title,
      performances: song.performances,
    });
  };

  const renderSongItem = ({ item }: { item: SongItem }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handleSongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.performanceCount}>
          {item.performanceCount} performance{item.performanceCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = (letter: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{letter}</Text>
    </View>
  );

  // Group songs by first letter
  const getSectionedData = () => {
    const sections: { letter: string; data: SongItem[] }[] = [];
    let currentLetter = '';
    let currentData: SongItem[] = [];

    songs.forEach(song => {
      const firstLetter = song.title[0].toUpperCase();
      if (firstLetter !== currentLetter) {
        if (currentData.length > 0) {
          sections.push({ letter: currentLetter, data: currentData });
        }
        currentLetter = firstLetter;
        currentData = [song];
      } else {
        currentData.push(song);
      }
    });

    if (currentData.length > 0) {
      sections.push({ letter: currentLetter, data: currentData });
    }

    return sections;
  };

  const renderFlatListData = () => {
    const sections = getSectionedData();
    const flatData: Array<{ type: 'header' | 'item'; letter?: string; item?: SongItem }> = [];

    sections.forEach(section => {
      flatData.push({ type: 'header', letter: section.letter });
      section.data.forEach(song => {
        flatData.push({ type: 'item', item: song });
      });
    });

    return flatData;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>
          Loading songs... This may take a minute
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSongs}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isGenerating && (
        <View style={styles.generatingBanner}>
          <ActivityIndicator size="small" color="#ff6b6b" style={styles.bannerSpinner} />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerText}>Generating full performance data...</Text>
            <Text style={styles.bannerSubtext}>This will take 10-15 minutes. Check Metro logs for progress.</Text>
          </View>
        </View>
      )}
      <FlatList
        data={renderFlatListData()}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.letter!);
          }
          return renderSongItem({ item: item.item! });
        }}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `header-${item.letter}` : `song-${item.item!.title}-${index}`
        }
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 180,
  },
  sectionHeader: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  songItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  performanceCount: {
    fontSize: 14,
    color: '#999',
  },
  generatingBanner: {
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 2,
    borderBottomColor: '#ff6b6b',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerSpinner: {
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});
