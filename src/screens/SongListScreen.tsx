import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs';
import { useDebounce } from '../hooks/useDebounce';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { AnimatedSearchBar } from '../components/AnimatedSearchBar';
import { ErrorState, NoResultsState } from '../components/StateViews';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { WebProfileAvatar } from '../components/web/WebProfileAvatar';
import { ProfileImage } from '../components/ProfileImage';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';

// Layout constants
const HORIZONTAL_PADDING = SPACING.xl;

type SongListNavigationProp = StackNavigationProp<RootStackParamList, 'SongList'>;

interface SongItem {
  title: string;
  performanceCount: number;
  performances: Array<{ date: string; identifier: string; venue?: string }>;
}

const SongListItem = React.memo<{ item: SongItem; onPress: (song: SongItem) => void }>(
  function SongListItem({ item, onPress }) {
    const { isDesktop } = useResponsive();
    const [isHovered, setIsHovered] = useState(false);
    return (
      <TouchableOpacity
        style={[styles.songItem, isDesktop && isHovered && styles.songItemHovered]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        // @ts-ignore - web only mouse events
        onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
        onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
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
  }
);

export function SongListScreen() {
  const navigation = useNavigation<SongListNavigationProp>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { width: windowWidth } = useWindowDimensions();
  const [headerWidth, setHeaderWidth] = useState(windowWidth);
  const padding = isDesktop ? 32 : HORIZONTAL_PADDING;
  const searchBarFullWidth = headerWidth - (padding * 2);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search bar animation state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Profile dropdown
  const {
    profileButtonRef,
    avatarUrl,
    isAuthenticated,
    dropdownState,
    handleProfilePress,
    handleLogout,
    handleLogin,
    handleSettings,
    closeDropdown,
  } = useProfileDropdown();

  // Search bar handlers
  const handleSearchExpand = useCallback(() => {
    setIsSearchExpanded(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  }, []);

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
    <SongListItem item={item} onPress={handleSongPress} />
  );

  const renderSectionHeader = (letter: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{letter}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.header, isDesktop && styles.headerDesktop]}>
            <View style={[styles.headerLeft, isDesktop && styles.headerLeftDesktop]}>
              {!isDesktop && <ProfileImage uri={null} style={styles.avatar} />}
              <Text style={styles.headerTitle}>Songs</Text>
            </View>
          </View>
        </View>
        <SkeletonLoader variant="songItem" count={15} />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSongs} />;
  }

  const Wrapper = Platform.OS === 'web' ? View : TouchableWithoutFeedback;

  return (
    <Wrapper {...(Platform.OS !== 'web' ? { onPress: Keyboard.dismiss } : { style: { flex: 1 } })}>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* Header Section with Gradient Fade */}
        <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.header, isDesktop && styles.headerDesktop]} onLayout={(e) => setHeaderWidth(e.nativeEvent.layout.width)}>
            {/* Left side: Avatar and Title (gets covered by search bar) */}
            <View style={[styles.headerLeft, isDesktop && styles.headerLeftDesktop]}>
              {!isDesktop && (
                <TouchableOpacity
                  ref={profileButtonRef}
                  onPress={handleProfilePress}
                  activeOpacity={0.8}
                >
                  <ProfileImage
                    uri={isAuthenticated ? avatarUrl : null}
                    style={styles.avatar}
                  />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>Songs</Text>
            </View>

            {/* Right side: Search button */}
            <View style={styles.headerRight}>
              {/* Animated Search Bar */}
              <AnimatedSearchBar
                isExpanded={isSearchExpanded}
                onExpand={handleSearchExpand}
                onClose={handleSearchClose}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search songs"
                expandedWidth={searchBarFullWidth}
              />

              {isDesktop && <WebProfileAvatar />}
            </View>
          </View>

          {/* Gradient fade overlay */}
          <LinearGradient
            colors={[COLORS.background, COLORS.background + '00']}
            locations={[0, 1]}
            style={[styles.headerGradient, isDesktop && styles.headerGradientDesktop]}
            pointerEvents="none"
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
            contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={50}
            windowSize={11}
            initialNumToRender={20}
          />
        )}

        {/* Profile Dropdown */}
        <ProfileDropdown
          state={dropdownState}
          isAuthenticated={isAuthenticated}
          onClose={closeDropdown}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onSettings={handleSettings}
        />
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerSection: {
    zIndex: 10,
    backgroundColor: COLORS.background,
  },
  headerSectionDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
  headerDesktop: {
    paddingHorizontal: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    position: 'absolute',
    left: HORIZONTAL_PADDING,
    top: 0,
    bottom: SPACING.lg,
  },
  headerLeftDesktop: {
    left: 32,
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBackground,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading2,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: LAYOUT.headerButtonGap,
    zIndex: 10,
  },
  headerGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  headerGradientDesktop: {
    display: 'none',
  },
  listContent: {
    paddingBottom: LAYOUT.listBottomPadding,
  },
  listContentDesktop: {
    padding: 16,
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
    paddingVertical: 8,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginVertical: 2,
    } : {}),
  },
  songItemHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
