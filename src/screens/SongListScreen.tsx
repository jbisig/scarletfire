import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Dimensions,
  Image,
  TextInput,
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
import { ErrorState, NoResultsState } from '../components/StateViews';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

// Default profile image for logged out users
const LOGGED_OUT_PROFILE = require('../../assets/images/logged-out-pfp.png');

// Animation constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const BUTTON_SIZE = 40;
const BUTTON_GAP = 10;
const HORIZONTAL_PADDING = SPACING.xl;
// Full width = screen - padding on both sides (no filter button)
const SEARCH_BAR_FULL_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const ANIMATION_DURATION = 300;

type SongListNavigationProp = StackNavigationProp<RootStackParamList, 'SongList'>;

interface SongItem {
  title: string;
  performanceCount: number;
  performances: Array<{ date: string; identifier: string; venue?: string }>;
}

export function SongListScreen() {
  const navigation = useNavigation<SongListNavigationProp>();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search bar animation state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

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

  // Animated interpolations
  const searchBarWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BUTTON_SIZE, SEARCH_BAR_FULL_WIDTH],
    extrapolate: 'clamp',
  });

  // Expand search bar
  const handleSearchPress = useCallback(() => {
    setIsSearchExpanded(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [searchAnim]);

  // Collapse search bar
  const handleCloseSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchQuery('');
    setIsSearchExpanded(false);
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [searchAnim]);

  // Close search bar when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isSearchExpanded) {
        handleCloseSearch();
      }
    });
    return unsubscribe;
  }, [navigation, isSearchExpanded, handleCloseSearch]);

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
    return (
      <View style={styles.container}>
        <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={LOGGED_OUT_PROFILE} style={styles.avatar} />
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header Section with Gradient Fade */}
        <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            {/* Left side: Avatar and Title (gets covered by search bar) */}
            <View style={styles.headerLeft}>
              <TouchableOpacity
                ref={profileButtonRef}
                onPress={handleProfilePress}
                activeOpacity={0.8}
              >
                <Image
                  source={isAuthenticated && avatarUrl
                    ? { uri: avatarUrl }
                    : LOGGED_OUT_PROFILE
                  }
                  style={styles.avatar}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Songs</Text>
            </View>

            {/* Right side: Search button */}
            <View style={styles.headerRight}>
              {/* Animated Search Bar / Button */}
              <TouchableOpacity
                activeOpacity={isSearchExpanded ? 1 : 0.7}
                onPress={isSearchExpanded ? undefined : handleSearchPress}
                disabled={isSearchExpanded}
              >
                <Animated.View style={[styles.searchBarContainer, { width: searchBarWidth }]}>
                  <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color={COLORS.textHint} style={styles.searchIconCentered} />
                    {isSearchExpanded && (
                      <View style={styles.searchExpandedContent}>
                        <View style={styles.searchIconSpacer} />
                        <TextInput
                          ref={searchInputRef}
                          style={styles.searchInput}
                          placeholder="Search songs"
                          placeholderTextColor={COLORS.textHint}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoFocus
                          selectionColor={COLORS.textPrimary}
                        />
                        <TouchableOpacity
                          style={styles.closeSearchButton}
                          onPress={handleCloseSearch}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={20} color={COLORS.textHint} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Gradient fade overlay */}
          <LinearGradient
            colors={[COLORS.background, 'transparent']}
            locations={[0, 1]}
            style={styles.headerGradient}
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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSection: {
    zIndex: 10,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
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
  avatar: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBackground,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BUTTON_GAP,
    marginLeft: 'auto',
    zIndex: 10,
  },
  searchBarContainer: {
    height: BUTTON_SIZE,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    height: BUTTON_SIZE,
    overflow: 'hidden',
  },
  searchIconCentered: {
    position: 'absolute',
    left: 10,
  },
  searchExpandedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xs,
    gap: 10,
  },
  searchIconSpacer: {
    width: 20,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
  },
  closeSearchButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  headerGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
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
    paddingVertical: 8,
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
