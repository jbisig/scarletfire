import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs';
import { useDebounce } from '../hooks/useDebounce';
import { PageHeader } from '../components/PageHeader';
import { SearchBar } from '../components/SearchBar';
import { LoadingState, ErrorState, NoResultsState } from '../components/StateViews';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSongs(GRATEFUL_DEAD_SONGS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongPress = (song: SongItem) => {
    Keyboard.dismiss();
    navigation.navigate('SongPerformances', {
      songTitle: song.title,
      performances: song.performances,
    });
  };

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return songs;
    }
    const query = debouncedSearchQuery.toLowerCase();
    return songs.filter(song => song.title.toLowerCase().includes(query));
  }, [songs, debouncedSearchQuery]);

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

  if (isLoading) {
    return <LoadingState message="Loading songs... This may take a minute" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSongs} />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <PageHeader title="Songs" />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Songs"
          />
        </View>

        {/* Songs List */}
        {filteredSongs.length === 0 && debouncedSearchQuery.trim() ? (
          <NoResultsState query={debouncedSearchQuery} entityName="songs" />
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
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={50}
            windowSize={11}
            initialNumToRender={20}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  listContent: {
    paddingBottom: 180,
  },
  sectionHeader: {
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  sectionHeaderText: {
    ...TYPOGRAPHY.heading4,
    color: COLORS.accent,
  },
  songItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    ...TYPOGRAPHY.heading4,
    marginBottom: SPACING.xs,
  },
  performanceCount: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
});
