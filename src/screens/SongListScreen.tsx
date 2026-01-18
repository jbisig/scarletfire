import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs';

type SongListNavigationProp = StackNavigationProp<RootStackParamList, 'SongList'>;

interface SongItem {
  title: string;
  performanceCount: number;
  performances: Array<{ date: string; identifier: string; venue?: string }>;
}

export function SongListScreen() {
  const navigation = useNavigation<SongListNavigationProp>();
  const searchInputRef = useRef<TextInput>(null);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use hard-coded song list with full performance data
      setSongs(GRATEFUL_DEAD_SONGS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongPress = async (song: SongItem) => {
    // Dismiss keyboard to prevent double-tap issue
    Keyboard.dismiss();

    // Navigate to performances screen with full performance data
    navigation.navigate('SongPerformances', {
      songTitle: song.title,
      performances: song.performances,
    });
  };

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) {
      return songs;
    }
    const query = searchQuery.toLowerCase();
    return songs.filter(song =>
      song.title.toLowerCase().includes(query)
    );
  }, [songs, searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.blur();
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

    filteredSongs.forEach(song => {
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
      {/* Fixed Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search songs..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Songs List */}
      {filteredSongs.length === 0 && searchQuery.trim() ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No songs found matching "{searchQuery}"</Text>
        </View>
      ) : (
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
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
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
  emptyText: {
    fontSize: 16,
    color: '#999',
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
    fontSize: 27,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
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
});
