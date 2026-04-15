import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';

// Grow a rendered-count from `initial` up to `total` in `chunk`-size steps,
// pacing with setTimeout so skeleton rows are visible while the list fills.
// Pass a `resetKey` (e.g. the active tab) to restart the progression when
// the consumer switches contexts.
function useProgressiveCount(
  total: number,
  resetKey: unknown,
  initial: number = 0,
  chunk: number = 8,
  intervalMs: number = 120,
): number {
  const [state, setState] = useState<{ key: unknown; count: number }>(() => ({
    key: resetKey,
    count: Math.min(total, initial),
  }));

  // Render-phase reset so the new tab paints skeletons on the first frame
  // instead of waiting for the post-render effect to clear the stale count.
  if (state.key !== resetKey) {
    setState({ key: resetKey, count: Math.min(total, initial) });
  }

  const effectiveCount = state.key === resetKey ? state.count : Math.min(total, initial);

  useEffect(() => {
    if (total <= initial) return;
    let current = initial;
    let cancelled = false;
    const id = setInterval(() => {
      if (cancelled) return;
      current = Math.min(current + chunk, total);
      setState((prev) => (prev.key === resetKey ? { key: resetKey, count: current } : prev));
      if (current >= total) clearInterval(id);
    }, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [total, resetKey, initial, chunk, intervalMs]);

  return effectiveCount;
}
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
import { collectionsService } from '../services/collectionsService';
import { CollectionsTab } from '../components/collections/CollectionsTab';
import { Collection } from '../types/collection.types';
import { ProfileImage } from '../components/ProfileImage';
import { ShowCard } from '../components/ShowCard';
import { StarRating } from '../components/StarRating';
import { useResponsive } from '../hooks/useResponsive';
import { usePlayer } from '../contexts/PlayerContext';
import { useShareSheet } from '../contexts/ShareSheetContext';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { RootStackParamList } from '../navigation/AppNavigator';
import { archiveApi } from '../services/archiveApi';
import { FavoriteSong } from '../contexts/FavoritesContext';
import { logger } from '../utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { SortDropdown, SortOption } from '../components/SortDropdown';
import { PlayCountBadge } from '../components/PlayCountBadge';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { followService } from '../services/followService';
import { useAuth } from '../contexts/AuthContext';
import showsData from '../data/shows.json';
import { ShowsByYear } from '../types/show.types';

const allShowsByYear = showsData as ShowsByYear;

function getCorrectVenue(showDate: string): string | undefined {
  const normalizedDate = showDate.substring(0, 10);
  const year = normalizedDate.substring(0, 4);
  const yearShows = allShowsByYear[year];
  if (!yearShows) return undefined;
  const show = yearShows.find(s => s.date.substring(0, 10) === normalizedDate);
  if (show) return getVenueFromShow(show);
  return undefined;
}

type ProfileRouteParams = {
  PublicProfile: { username: string };
};

type TabType = 'shows' | 'songs' | 'collections';
type ShowSortType = 'dateSavedNewest' | 'dateSavedOldest' | 'performanceDateOldest' | 'performanceDateNewest' | 'alphabetical';
type SongSortType = 'dateSavedNewest' | 'dateSavedOldest' | 'performanceDateOldest' | 'performanceDateNewest' | 'alphabetical';

const SHOW_SORT_OPTIONS: SortOption<ShowSortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'dateSavedOldest', label: 'Date Saved (Oldest First)' },
  { value: 'dateSavedNewest', label: 'Date Saved (Newest First)' },
  { value: 'performanceDateOldest', label: 'Show Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Show Date (Newest First)' },
];

const SONG_SORT_OPTIONS: SortOption<SongSortType>[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'dateSavedOldest', label: 'Date Saved (Oldest First)' },
  { value: 'dateSavedNewest', label: 'Date Saved (Newest First)' },
  { value: 'performanceDateOldest', label: 'Performance Date (Oldest First)' },
  { value: 'performanceDateNewest', label: 'Performance Date (Newest First)' },
];

function getSortLabel(sortType: ShowSortType | SongSortType): string {
  switch (sortType) {
    case 'alphabetical': return 'Alphabetical';
    case 'dateSavedNewest': case 'dateSavedOldest': return 'Date Saved';
    case 'performanceDateOldest': case 'performanceDateNewest': return 'Date';
    default: return 'Sort';
  }
}

function getSortIcon(sortType: ShowSortType | SongSortType): 'arrow-up' | 'arrow-down' {
  return sortType === 'dateSavedOldest' || sortType === 'performanceDateOldest' ? 'arrow-up' : 'arrow-down';
}

function SongRow({ song, trailingContent, loadingSongId, isDesktop, onPress }: {
  song: { trackId: string; trackTitle: string; showIdentifier: string; showDate: string; venue?: string };
  trailingContent?: React.ReactNode;
  loadingSongId: string | null;
  isDesktop: boolean;
  onPress: (song: { trackId: string; trackTitle: string; showIdentifier: string; showDate: string; venue?: string }) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const performanceRating = getSongPerformanceRating(song.trackTitle, song.showDate);
  const venue = getCorrectVenue(song.showDate) || song.venue;
  const songKey = `${song.trackId}-${song.showIdentifier}`;
  const isSongLoading = loadingSongId === songKey;

  return (
    <TouchableOpacity
      style={[styles.songItem, isSongLoading && styles.songItemLoading, isDesktop && isHovered && styles.songItemHovered]}
      onPress={() => onPress(song)}
      activeOpacity={0.7}
      disabled={isSongLoading}
      // @ts-ignore - web only mouse events
      onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
      onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
    >
      <View style={styles.songContentRow}>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {song.trackTitle}
          </Text>
          <View style={styles.songDateRow}>
            <Text style={styles.songDate}>
              {formatDate(song.showDate)}
            </Text>
            {performanceRating && (
              <StarRating tier={performanceRating} size={14} />
            )}
          </View>
          {venue && (
            <Text style={styles.songVenue} numberOfLines={1}>
              {venue}
            </Text>
          )}
        </View>
        {trailingContent}
      </View>
    </TouchableOpacity>
  );
}

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
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('shows');
  const [showSortType, setShowSortType] = useState<ShowSortType>('dateSavedNewest');
  const [songSortType, setSongSortType] = useState<SongSortType>('dateSavedNewest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [songSortModal, setSongSortModal] = useState(false);
  const [showSortPosition, setShowSortPosition] = useState({ top: 0, left: 0 });
  const [songSortPosition, setSongSortPosition] = useState({ top: 0, left: 0 });
  const [publicCollections, setPublicCollections] = useState<Collection[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const { state: authState } = useAuth();
  const currentUser = authState.user;
  const isOwnProfile = !!currentUser && currentUser.id === data?.profile?.id;
  const showSortRef = useRef<View>(null);
  const songSortRef = useRef<View>(null);

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
          setIsFollowing(result.viewerIsFollowing);
          setFollowerCount(result.followerCount);
          setFollowingCount(result.followingCount);
        }
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [username]);

  const handleToggleFollow = useCallback(async () => {
    if (!currentUser) {
      navigation.navigate('Settings' as never);
      return;
    }
    if (!data?.profile?.id || followBusy) return;
    const prevFollowing = isFollowing;
    const prevCount = followerCount;
    setFollowBusy(true);
    setIsFollowing(!prevFollowing);
    setFollowerCount(prevCount + (prevFollowing ? -1 : 1));
    try {
      if (prevFollowing) {
        await followService.unfollowUser(data.profile.id);
      } else {
        await followService.followUser(data.profile.id);
      }
    } catch {
      setIsFollowing(prevFollowing);
      setFollowerCount(prevCount);
    } finally {
      setFollowBusy(false);
    }
  }, [currentUser, data?.profile?.id, followBusy, isFollowing, followerCount, navigation]);

  useEffect(() => {
    if (!data?.profile?.is_public) {
      setPublicCollections([]);
      return;
    }
    collectionsService
      .fetchCollections(data.profile.id)
      .then(setPublicCollections)
      .catch(() => setPublicCollections([]));
  }, [data]);

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

  const handleSongPress = useCallback(async (song: { trackId: string; trackTitle: string; showIdentifier: string; showDate: string; venue?: string }) => {
    const songKey = `${song.trackId}-${song.showIdentifier}`;
    try {
      setLoadingSongId(songKey);
      const showDetail = await archiveApi.getShowDetail(song.showIdentifier);
      const track = showDetail.tracks.find(t => t.id === song.trackId);
      if (track) {
        await loadTrack(track, showDetail, showDetail.tracks);
      }
    } catch (error) {
      logger.player.error('Failed to load song:', error);
    } finally {
      setLoadingSongId(null);
    }
  }, [loadTrack]);

  const displayName = data?.profile.display_name || username;

  const { openShareTray } = useShareSheet();
  const handleShareProfile = useCallback(() => {
    if (!data) return;
    openShareTray({
      kind: 'profile',
      username: data.profile.username,
      displayName,
      showCount: data.favorites.shows.length,
      songCount: data.favorites.songs.length,
    });
  }, [data, displayName, openShareTray]);

  // Sorted favorite shows
  const sortedFavoriteShows = useMemo(() => {
    if (!data) return [];
    const shows = [...data.favorites.shows];
    switch (showSortType) {
      case 'alphabetical':
        return shows.sort((a, b) => (a.venue || '').localeCompare(b.venue || ''));
      case 'dateSavedNewest':
        return shows.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      case 'dateSavedOldest':
        return shows.sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
      case 'performanceDateOldest':
        return shows.sort((a, b) => a.date.localeCompare(b.date));
      case 'performanceDateNewest':
        return shows.sort((a, b) => b.date.localeCompare(a.date));
      default:
        return shows;
    }
  }, [data, showSortType]);

  // Sorted favorite songs
  const sortedFavoriteSongs = useMemo(() => {
    if (!data) return [];
    const songs = [...data.favorites.songs];
    switch (songSortType) {
      case 'alphabetical':
        return songs.sort((a, b) => a.trackTitle.localeCompare(b.trackTitle));
      case 'dateSavedNewest':
        return songs.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      case 'dateSavedOldest':
        return songs.sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
      case 'performanceDateOldest':
        return songs.sort((a, b) => a.showDate.localeCompare(b.showDate));
      case 'performanceDateNewest':
        return songs.sort((a, b) => b.showDate.localeCompare(a.showDate));
      default:
        return songs;
    }
  }, [data, songSortType]);

  const handleShowSortPress = () => {
    showSortRef.current?.measure((_x, _y, _w, h, pageX, pageY) => {
      setShowSortPosition({ top: pageY + h + 8, left: pageX });
      setShowSortModal(true);
    });
  };

  const visibleShowCount = useProgressiveCount(sortedFavoriteShows.length, activeTab === 'shows');
  const visibleSongCount = useProgressiveCount(sortedFavoriteSongs.length, activeTab === 'songs');

  const handleSongSortPress = () => {
    songSortRef.current?.measure((_x, _y, _w, h, pageX, pageY) => {
      setSongSortPosition({ top: pageY + h + 8, left: pageX });
      setSongSortModal(true);
    });
  };

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
        <View style={[styles.twoColumnRow, !isDesktop && styles.twoColumnStacked]}>
          {/* Recently Played Shows */}
          <View style={styles.column}>
            <Text style={styles.columnSectionTitle}>Recently Played</Text>
            {recentShows.length > 0 ? recentShows.map(item => (
              <ShowCard
                key={`recent-${item.show.primaryIdentifier}`}
                show={item.show}
                onPress={() => handleShowPress(
                  item.show.primaryIdentifier,
                  getVenueFromShow(item.show),
                  item.show.date,
                )}
                hideSaveBadge
              />
            )) : (
              <Text style={styles.emptyText}>No recent plays</Text>
            )}
          </View>

          {/* Most Listened Shows */}
          <View style={styles.column}>
            <Text style={styles.columnSectionTitle}>Top 10</Text>
            {topShows.length > 0 ? topShows.map(item => (
              <ShowCard
                key={item.show.primaryIdentifier}
                show={item.show}
                onPress={() => handleShowPress(
                  item.show.primaryIdentifier,
                  getVenueFromShow(item.show),
                  item.show.date,
                )}
                hideSaveBadge
              />
            )) : (
              <Text style={styles.emptyText}>No plays yet</Text>
            )}
          </View>
        </View>
      )}

      {/* Favorite Shows */}
      {data.favorites.shows.length > 0 && (
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Favorites ({data.favorites.shows.length})
            </Text>
            <View ref={showSortRef} collapsable={false}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={handleShowSortPress}
                activeOpacity={0.7}
              >
                <Ionicons name={getSortIcon(showSortType)} size={14} color={COLORS.textSecondary} />
                <Text style={styles.sortButtonText}>{getSortLabel(showSortType)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {sortedFavoriteShows.slice(0, visibleShowCount).map(show => (
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
          {visibleShowCount < sortedFavoriteShows.length && (
            <SkeletonLoader
              variant="showCard"
              count={Math.min(sortedFavoriteShows.length - visibleShowCount, 6)}
            />
          )}
        </View>
      )}

      <SortDropdown
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        position={showSortPosition}
        options={SHOW_SORT_OPTIONS}
        selectedValue={showSortType}
        onSelect={setShowSortType}
      />
    </>
  );

  const renderSongRow = (song: typeof data.favorites.songs[0], trailingContent?: React.ReactNode) => {
    return (
      <SongRow
        song={song}
        trailingContent={trailingContent}
        loadingSongId={loadingSongId}
        isDesktop={isDesktop}
        onPress={handleSongPress}
      />
    );
  };

  const renderSongsTab = () => (
    <>
      {/* Two-column: Recently Played + Top 10 */}
      {(recentSongs.length > 0 || topSongs.length > 0) && (
        <View style={[styles.twoColumnRow, !isDesktop && styles.twoColumnStacked]}>
          {/* Recently Played Songs */}
          <View style={styles.column}>
            <Text style={styles.columnSectionTitle}>Recently Played</Text>
            {recentSongs.length > 0 ? recentSongs.map(item => (
              <React.Fragment key={`recent-${item.song.trackId}-${item.song.showIdentifier}`}>
                {renderSongRow(item.song)}
              </React.Fragment>
            )) : (
              <Text style={styles.emptyText}>No recent plays</Text>
            )}
          </View>

          {/* Top 10 Songs */}
          <View style={styles.column}>
            <Text style={styles.columnSectionTitle}>Top 10</Text>
            {topSongs.length > 0 ? topSongs.map(item => (
              <React.Fragment key={`top-${item.song.trackId}-${item.song.showIdentifier}`}>
                {renderSongRow(item.song)}
              </React.Fragment>
            )) : (
              <Text style={styles.emptyText}>No plays yet</Text>
            )}
          </View>
        </View>
      )}

      {/* Favorite Songs */}
      {data.favorites.songs.length > 0 && (
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Favorites ({data.favorites.songs.length})
            </Text>
            <View ref={songSortRef} collapsable={false}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={handleSongSortPress}
                activeOpacity={0.7}
              >
                <Ionicons name={getSortIcon(songSortType)} size={14} color={COLORS.textSecondary} />
                <Text style={styles.sortButtonText}>{getSortLabel(songSortType)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {sortedFavoriteSongs.slice(0, visibleSongCount).map(song => (
            <React.Fragment key={`fav-${song.trackId}-${song.showIdentifier}`}>
              {renderSongRow(song, <PlayCountBadge count={0} size="small" />)}
            </React.Fragment>
          ))}
          {visibleSongCount < sortedFavoriteSongs.length && (
            <SkeletonLoader
              variant="songItem"
              count={Math.min(sortedFavoriteSongs.length - visibleSongCount, 6)}
            />
          )}
        </View>
      )}

      <SortDropdown
        visible={songSortModal}
        onClose={() => setSongSortModal(false)}
        position={songSortPosition}
        options={SONG_SORT_OPTIONS}
        selectedValue={songSortType}
        onSelect={setSongSortType}
      />
    </>
  );

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop, { paddingTop: insets.top }]}>
      {!isDesktop && (navigation.canGoBack() || data?.profile) && (
        <View style={styles.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          <View style={styles.headerRight}>
            {data?.profile && (
              <View style={styles.visibilityBadge}>
                <Ionicons
                  name={data.profile.is_public ? 'globe-outline' : 'lock-closed'}
                  size={14}
                  color={COLORS.textPrimary}
                />
                <Text style={styles.visibilityBadgeText}>
                  {data.profile.is_public ? 'Public' : 'Private'}
                </Text>
              </View>
            )}
            {data?.profile && (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareProfile}
                accessibilityRole="button"
                accessibilityLabel={`Share ${displayName}'s profile`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View style={[styles.contentContainer, !isDesktop && styles.contentContainerMobile]}>
            {/* Profile Header */}
            <View style={[styles.profileHeader, !isDesktop && styles.mobileHorizontalPad]}>
              <ProfileImage
                uri={data.avatarUrl}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.displayName}>{displayName}</Text>
                <Text style={styles.username}>@{data.profile.username}</Text>
                <View style={styles.countsRow}>
                  <TouchableOpacity
                    onPress={() => navigation.push('FollowList', {
                      userId: data.profile.id,
                      username: data.profile.username,
                      mode: 'followers',
                    })}
                  >
                    <Text style={styles.countText}>
                      <Text style={styles.countNum}>{followerCount}</Text> Followers
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.countSep}>  ·  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.push('FollowList', {
                      userId: data.profile.id,
                      username: data.profile.username,
                      mode: 'following',
                    })}
                  >
                    <Text style={styles.countText}>
                      <Text style={styles.countNum}>{followingCount}</Text> Following
                    </Text>
                  </TouchableOpacity>
                </View>
                {!isOwnProfile && (
                  <TouchableOpacity
                    style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                    onPress={handleToggleFollow}
                    disabled={followBusy}
                    accessibilityRole="button"
                    accessibilityLabel={isFollowing ? 'Unfollow' : 'Follow'}
                  >
                    <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                    {isFollowing && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={COLORS.textPrimary}
                        style={styles.followBtnIcon}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              {isDesktop && (
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShareProfile}
                  accessibilityRole="button"
                  accessibilityLabel={`Share ${displayName}'s profile`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Tab Navigation */}
            <View style={[styles.tabContainer, !isDesktop && styles.mobileHorizontalPad]} accessibilityRole="tablist">
              {(data?.profile?.is_public
                ? (['shows', 'songs', 'collections'] as const)
                : (['shows', 'songs'] as const)
              ).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityLabel={`${tab === 'shows' ? 'Shows' : tab === 'songs' ? 'Songs' : 'Collections'} tab`}
                  accessibilityState={{ selected: activeTab === tab }}
                >
                  <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                    {tab === 'shows' ? 'Shows' : tab === 'songs' ? 'Songs' : 'Collections'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'shows' ? (
              renderShowsTab()
            ) : activeTab === 'songs' ? (
              renderSongsTab()
            ) : (
              <CollectionsTab
                entries={publicCollections.map((c) => ({
                  kind: 'owned' as const,
                  collection: c,
                  sortKey: c.updatedAt,
                }))}
                onEntryPress={(e) => {
                  if (e.kind !== 'owned') return;
                  navigation.navigate('CollectionDetail', {
                    username,
                    slug: e.collection.slug,
                    readOnly: true,
                  });
                }}
                emptyMessage="No public collections."
              />
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  visibilityBadge: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMedium,
  },
  visibilityBadgeText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '600',
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  contentContainerMobile: {
    paddingHorizontal: 0,
  },
  mobileHorizontalPad: {
    paddingHorizontal: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  profileInfo: {
    flex: 1,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cardBackground,
    marginTop: SPACING.sm,
  },
  displayName: {
    ...TYPOGRAPHY.heading2,
  },
  username: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
  },
  countText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  countNum: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  countSep: {
    color: COLORS.textSecondary,
  },
  followBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.lg,
  },
  followBtnIcon: {
    marginLeft: 4,
  },
  followBtnActive: {},
  followBtnText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
  },
  followBtnTextActive: {
    color: COLORS.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: SPACING.md,
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
    fontSize: 16,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    color: COLORS.textPrimary,
    ...(Platform.OS === 'android' && {
      paddingTop: 2,
    }),
  },
  inactiveTabText: {
    fontSize: 16,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    color: COLORS.textSecondary,
    ...(Platform.OS === 'android' && {
      paddingTop: 2,
    }),
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: SPACING.xxxl,
    marginBottom: SPACING.xxl,
  },
  twoColumnStacked: {
    flexDirection: 'column',
    gap: SPACING.xxl,
  },
  column: {
    flex: 1,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  listSection: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: Platform.OS === 'web' ? SPACING.lg : SPACING.xxl,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  columnSectionTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingLeft: Platform.OS === 'web' ? SPACING.lg : SPACING.xxl,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sortButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    color: COLORS.textSecondary,
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
  songItemHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  songItemLoading: {
    opacity: 0.5,
  },
  songItem: {
    paddingVertical: 8,
    paddingHorizontal: SPACING.xxl,
    ...(Platform.OS === 'web' ? {
      backgroundColor: 'transparent',
      paddingHorizontal: 16,
      borderRadius: 12,
      marginVertical: 2,
    } : {}),
  },
  songContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  songTitle: {
    ...TYPOGRAPHY.heading4,
    marginBottom: SPACING.xs,
  },
  songDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  songDate: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  songVenue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
});
