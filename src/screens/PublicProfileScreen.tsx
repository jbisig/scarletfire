import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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
import { usePlayer } from '../contexts/PlayerContext';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';

type ProfileRouteParams = {
  PublicProfile: { username: string };
};

export function PublicProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ProfileRouteParams, 'PublicProfile'>>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { loadTrack } = usePlayer();

  const username = route.params?.username ?? '';
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

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

  // Compute top 10 shows and songs by play count
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

  const topSongs = useMemo(() => {
    if (!data) return [];
    const songCounts: Record<string, number> = {};
    for (const pc of data.playCounts) {
      const key = `${pc.trackId}:${pc.showIdentifier}`;
      songCounts[key] = (songCounts[key] || 0) + pc.count;
    }
    return data.favorites.songs
      .map(song => {
        const key = `${song.trackId}:${song.showIdentifier}`;
        return { song, plays: songCounts[key] || 0 };
      })
      .filter(s => s.plays > 0)
      .sort((a, b) => b.plays - a.plays)
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

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop, { paddingTop: insets.top }]}>
      <FlatList
        data={[]} // We use ListHeaderComponent for all content
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

            {/* Most Listened Shows */}
            {topShows.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Most Listened Shows</Text>
                {topShows.map((item, index) => (
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
                        {formatDate(item.show.date)}
                      </Text>
                      <Text style={styles.rankedItemSubtitle} numberOfLines={1}>
                        {getVenueFromShow(item.show)}
                      </Text>
                    </View>
                    <PlayCountBadge count={item.totalPlays} size="small" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Most Listened Songs */}
            {topSongs.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Most Listened Songs</Text>
                {topSongs.map((item, index) => (
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
                        {item.song.venue ? ` · ${item.song.venue}` : ''}
                      </Text>
                    </View>
                    <PlayCountBadge count={item.plays} size="small" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Favorite Shows */}
            {data.favorites.shows.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>
                  Favorite Shows ({data.favorites.shows.length})
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
                  />
                ))}
              </View>
            )}

            {/* Favorite Songs */}
            {data.favorites.songs.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>
                  Favorite Songs ({data.favorites.songs.length})
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
    paddingVertical: SPACING.md,
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
  songItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  songInfo: {
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
