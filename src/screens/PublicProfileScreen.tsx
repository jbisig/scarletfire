import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileService, PublicProfileData } from '../services/profileService';
import { ProfileImage } from '../components/ProfileImage';
import { ShowCard } from '../components/ShowCard';
import { StarRating } from '../components/StarRating';
import { PlayCountBadge } from '../components/PlayCountBadge';
import { useResponsive } from '../hooks/useResponsive';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

type ProfileRouteParams = {
  PublicProfile: { username: string };
};

type TabType = 'shows' | 'songs';

export function PublicProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ProfileRouteParams, 'PublicProfile'>>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();

  const username = route.params?.username ?? '';
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('shows');

  useEffect(() => {
    if (!username) {
      setError(true);
      setIsLoading(false);
      return;
    }

    profileService.getPublicProfile(username)
      .then((result) => {
        if (!result) {
          setError(true);
        } else {
          setData(result);
        }
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [username]);

  // Compute top 10 shows by play count
  const topShows = useMemo(() => {
    if (!data) return [];
    const showCounts: Record<string, number> = {};
    for (const pc of data.playCounts) {
      showCounts[pc.showIdentifier] = (showCounts[pc.showIdentifier] || 0) + pc.count;
    }
    return data.favorites.shows
      .map(show => ({
        show,
        totalPlays: showCounts[show.primaryIdentifier] || 0,
      }))
      .filter(s => s.totalPlays > 0)
      .sort((a, b) => b.totalPlays - a.totalPlays)
      .slice(0, 10);
  }, [data]);

  // Compute top 10 songs by play count
  const topSongs = useMemo(() => {
    if (!data) return [];
    const songCounts: Record<string, number> = {};
    for (const pc of data.playCounts) {
      const key = `${pc.trackTitle}:${pc.showIdentifier}`;
      songCounts[key] = (songCounts[key] || 0) + pc.count;
    }
    return data.favorites.songs
      .map(song => {
        const key = `${song.trackTitle}:${song.showIdentifier}`;
        return { song, plays: songCounts[key] || 0 };
      })
      .filter(s => s.plays > 0)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
  }, [data]);

  // Compute recently played shows (by most recent lastPlayedAt)
  const recentShows = useMemo(() => {
    if (!data) return [];
    // Get most recent play per show
    const showLastPlayed: Record<string, number> = {};
    for (const pc of data.playCounts) {
      const existing = showLastPlayed[pc.showIdentifier] || 0;
      if (pc.lastPlayedAt > existing) {
        showLastPlayed[pc.showIdentifier] = pc.lastPlayedAt;
      }
    }
    // Match to favorite shows and sort by recency
    return data.favorites.shows
      .filter(show => showLastPlayed[show.primaryIdentifier])
      .map(show => ({
        show,
        lastPlayedAt: showLastPlayed[show.primaryIdentifier],
      }))
      .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
      .slice(0, 10);
  }, [data]);

  // Compute recently played songs (by lastPlayedAt)
  const recentSongs = useMemo(() => {
    if (!data) return [];
    // Get last played time per song
    const songLastPlayed: Record<string, number> = {};
    for (const pc of data.playCounts) {
      const key = `${pc.trackTitle}:${pc.showIdentifier}`;
      const existing = songLastPlayed[key] || 0;
      if (pc.lastPlayedAt > existing) {
        songLastPlayed[key] = pc.lastPlayedAt;
      }
    }
    return data.favorites.songs
      .filter(song => songLastPlayed[`${song.trackTitle}:${song.showIdentifier}`])
      .map(song => ({
        song,
        lastPlayedAt: songLastPlayed[`${song.trackTitle}:${song.showIdentifier}`],
      }))
      .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
      .slice(0, 10);
  }, [data]);

  const displayName = data?.profile.display_name || username;

  const totalPlays = useMemo(() => {
    if (!data) return 0;
    return data.playCounts.reduce((sum, pc) => sum + pc.count, 0);
  }, [data]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textTertiary} />
          <Text style={styles.errorTitle}>Profile not found</Text>
          <Text style={styles.errorSubtitle}>
            This profile doesn't exist or is private.
          </Text>
        </View>
      </View>
    );
  }

  const handleShowPress = (identifier: string, venue?: string, date?: string) => {
    navigation.navigate('ShowDetail', { identifier, venue, date });
  };

  const formatRecentDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const renderShowsTab = () => (
    <>
      {/* Two-column: Recently Played + Most Listened */}
      {(recentShows.length > 0 || topShows.length > 0) && (
        <View style={styles.twoColumnRow}>
          {/* Recently Played Shows */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            {recentShows.length > 0 ? recentShows.map(item => (
              <TouchableOpacity
                key={`recent-${item.show.primaryIdentifier}`}
                style={styles.rankedItem}
                onPress={() => handleShowPress(
                  item.show.primaryIdentifier,
                  getVenueFromShow(item.show),
                  item.show.date,
                )}
                activeOpacity={0.7}
              >
                <View style={styles.rankedItemInfo}>
                  <Text style={styles.rankedItemTitle} numberOfLines={1}>
                    {formatDate(item.show.date)} - {getVenueFromShow(item.show)}
                  </Text>
                </View>
                <Text style={styles.recentTime}>{formatRecentDate(item.lastPlayedAt)}</Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No recent plays</Text>
            )}
          </View>

          {/* Most Listened Shows */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Most Listened</Text>
            {topShows.length > 0 ? topShows.map((item, index) => (
              <TouchableOpacity
                key={item.show.primaryIdentifier}
                style={styles.rankedItem}
                onPress={() => handleShowPress(
                  item.show.primaryIdentifier,
                  getVenueFromShow(item.show),
                  item.show.date,
                )}
                activeOpacity={0.7}
              >
                <Text style={styles.rankNumber}>{index + 1}</Text>
                <View style={styles.rankedItemInfo}>
                  <Text style={styles.rankedItemTitle} numberOfLines={1}>
                    {formatDate(item.show.date)} - {getVenueFromShow(item.show)}
                  </Text>
                </View>
                <Text style={styles.recentTime}>{item.totalPlays} plays</Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No plays yet</Text>
            )}
          </View>
        </View>
      )}

      {/* Favorite Shows */}
      {data.favorites.shows.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            Favorites ({data.favorites.shows.length})
          </Text>
          {data.favorites.shows.map(show => (
            <ShowCard
              key={show.primaryIdentifier}
              show={show}
              onPress={() => handleShowPress(
                show.primaryIdentifier,
                getVenueFromShow(show),
                show.date,
              )}
              hideSaveBadge
            />
          ))}
        </View>
      )}
    </>
  );

  const renderSongsTab = () => (
    <>
      {/* Two-column: Recently Played + Most Listened */}
      {(recentSongs.length > 0 || topSongs.length > 0) && (
        <View style={styles.twoColumnRow}>
          {/* Recently Played Songs */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            {recentSongs.length > 0 ? recentSongs.map(item => (
              <TouchableOpacity
                key={`recent-${item.song.trackId}-${item.song.showIdentifier}`}
                style={styles.songItem}
                onPress={() => handleShowPress(item.song.showIdentifier)}
                activeOpacity={0.7}
              >
                <View style={styles.songContentRow}>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {item.song.trackTitle}
                    </Text>
                    <Text style={styles.songDate}>
                      {formatDate(item.song.showDate)}
                    </Text>
                  </View>
                  <Text style={styles.recentTime}>{formatRecentDate(item.lastPlayedAt)}</Text>
                </View>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No recent plays</Text>
            )}
          </View>

          {/* Most Listened Songs */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Most Listened</Text>
            {topSongs.length > 0 ? topSongs.map((item, index) => (
              <TouchableOpacity
                key={`${item.song.trackId}-${item.song.showIdentifier}`}
                style={styles.rankedItem}
                onPress={() => handleShowPress(item.song.showIdentifier)}
                activeOpacity={0.7}
              >
                <Text style={styles.rankNumber}>{index + 1}</Text>
                <View style={styles.rankedItemInfo}>
                  <Text style={styles.rankedItemTitle} numberOfLines={1}>
                    {item.song.trackTitle}
                  </Text>
                  <Text style={styles.rankedItemSubtitle} numberOfLines={1}>
                    {formatDate(item.song.showDate)}
                  </Text>
                </View>
                <Text style={styles.recentTime}>{item.plays} plays</Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No plays yet</Text>
            )}
          </View>
        </View>
      )}

      {/* Favorite Songs */}
      {data.favorites.songs.length > 0 && (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            Favorites ({data.favorites.songs.length})
          </Text>
          {data.favorites.songs.map(song => {
            const performanceRating = getSongPerformanceRating(song.trackTitle, song.showDate);
            return (
              <TouchableOpacity
                key={`${song.trackId}-${song.showIdentifier}`}
                style={styles.songItem}
                onPress={() => handleShowPress(song.showIdentifier)}
                activeOpacity={0.7}
              >
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.trackTitle}
                  </Text>
                  <View style={styles.songMeta}>
                    <Text style={styles.songDate}>
                      {formatDate(song.showDate)}
                    </Text>
                    {performanceRating && (
                      <StarRating tier={performanceRating} size={12} />
                    )}
                  </View>
                  {song.venue && (
                    <Text style={styles.songVenue} numberOfLines={1}>
                      {song.venue}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop, { paddingTop: insets.top }]}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View style={styles.contentContainer}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <ProfileImage
                uri={data.avatarUrl}
                style={styles.avatar}
              />
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.username}>@{data.profile.username}</Text>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <Text style={styles.statText}>
                {data.favorites.shows.length} Shows
              </Text>
              <Text style={styles.statDot}>·</Text>
              <Text style={styles.statText}>
                {data.favorites.songs.length} Songs
              </Text>
              <Text style={styles.statDot}>·</Text>
              <Text style={styles.statText}>
                {totalPlays} Plays
              </Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer} accessibilityRole="tablist">
              {(['shows', 'songs'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityLabel={`${tab === 'shows' ? 'Shows' : 'Songs'} tab`}
                  accessibilityState={{ selected: activeTab === tab }}
                >
                  <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                    {tab === 'shows' ? 'Shows' : 'Songs'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'shows' ? renderShowsTab() : renderSongsTab()}
          </View>
        }
        keyExtractor={() => 'profile'}
      />
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  errorTitle: {
    ...TYPOGRAPHY.heading4,
    marginTop: SPACING.md,
  },
  errorSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  contentContainer: {
    padding: SPACING.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBackground,
    marginBottom: SPACING.md,
  },
  displayName: {
    ...TYPOGRAPHY.heading2,
    textAlign: 'center',
  },
  username: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  statText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statDot: {
    ...TYPOGRAPHY.label,
    color: COLORS.textTertiary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
  },
  activeTab: {
    backgroundColor: COLORS.accent,
  },
  inactiveTab: {
    backgroundColor: COLORS.cardBackground,
  },
  activeTabText: {
    fontSize: 20,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    color: COLORS.textPrimary,
    ...(Platform.OS === 'android' && {
      paddingTop: 2,
    }),
  },
  inactiveTabText: {
    fontSize: 20,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    color: COLORS.textSecondary,
    ...(Platform.OS === 'android' && {
      paddingTop: 2,
    }),
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  column: {
    flex: 1,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
    paddingVertical: SPACING.lg,
  },
  listSection: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
  },
  rankedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  rankNumber: {
    ...TYPOGRAPHY.heading4,
    color: COLORS.textTertiary,
    width: 28,
    textAlign: 'center',
  },
  rankedItemInfo: {
    flex: 1,
  },
  rankedItemTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  rankedItemSubtitle: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recentTime: {
    ...TYPOGRAPHY.label,
    color: COLORS.textTertiary,
  },
  songItem: {
    minHeight: 44,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'center',
  },
  songContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  songDate: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
  },
  songVenue: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textTertiary,
  },
});
