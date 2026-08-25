import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { SongCard } from '../components/SongCard';
import { useResponsive } from '../hooks/useResponsive';
import { useCollections } from '../contexts/CollectionsContext';
import { useShareSheet } from '../contexts/ShareSheetContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { showDetailParams } from '../utils/showDetailParams';
import { GratefulDeadShow } from '../types/show.types';
import { Ionicons } from '@expo/vector-icons';
import { SortTray } from '../components/SortTray';
import { ActionSheet } from '../components/ActionSheet';
import { useToast } from '../contexts/ToastContext';
import { getShowDownloadsByDate } from '../utils/showLookup';
import { SegmentedTabs, SegmentedTabItem } from '../components/SegmentedTabs';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { ErrorState } from '../components/StateViews';
import { followService } from '../services/followService';
import { useAuth } from '../contexts/AuthContext';
import {
  SavedItemSortType,
  SAVED_SHOW_SORT_OPTIONS,
  SAVED_SONG_SORT_OPTIONS,
  getSavedItemSortLabel,
  getSortOptionIcon,
} from '../constants/sortOptions';
import { usePlaySavedSong } from '../hooks/usePlaySavedSong';
import { compareBySavedAt, compareByDate, compareAlphabetical } from '../utils/sortComparators';

type ProfileRouteParams = {
  PublicProfile: { username: string };
};

type TabType = 'shows' | 'songs' | 'collections';
type ShowSortType = SavedItemSortType;
type SongSortType = SavedItemSortType;
type ProfileFavoriteSong = PublicProfileData['favorites']['songs'][number];

// Discriminated union so the single FlatList backing the shows/songs tabs can
// hold either row type. keyExtractor below is type-prefixed so a show's
// primaryIdentifier can never collide with a song's trackId/showIdentifier.
type ProfileListRow =
  | { kind: 'show'; show: GratefulDeadShow }
  | { kind: 'song'; song: ProfileFavoriteSong };

const PUBLIC_PROFILE_TABS: SegmentedTabItem<TabType>[] = [
  { key: 'shows', label: 'Shows' },
  { key: 'songs', label: 'Songs' },
  { key: 'collections', label: 'Collections' },
];
const PUBLIC_PROFILE_TABS_NO_COLLECTIONS: SegmentedTabItem<TabType>[] = [
  { key: 'shows', label: 'Shows' },
  { key: 'songs', label: 'Songs' },
];

export function PublicProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ProfileRouteParams, 'PublicProfile'>>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { loadingSongId, playSong } = usePlaySavedSong();

  const username = route.params?.username ?? '';
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('shows');
  const [showSortType, setShowSortType] = useState<ShowSortType>('dateSavedNewest');
  const [songSortType, setSongSortType] = useState<SongSortType>('dateSavedNewest');
  const [publicCollections, setPublicCollections] = useState<Collection[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const { state: authState } = useAuth();
  const currentUser = authState.user;
  const isOwnProfile = !!currentUser && currentUser.id === data?.profile?.id;
  const { collections: ownedCollections } = useCollections();
  const [showSortTrayVisible, setShowSortTrayVisible] = useState(false);
  const [songSortTrayVisible, setSongSortTrayVisible] = useState(false);
  const [visibilityTrayVisible, setVisibilityTrayVisible] = useState(false);

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
    if (!data?.profile) {
      setPublicCollections([]);
      return;
    }
    const viewerOwnsProfile = currentUser?.id === data.profile.id;
    if (!data.profile.is_public && !viewerOwnsProfile) {
      setPublicCollections([]);
      return;
    }
    // Visitors see only what the owner made Public; the owner sees everything.
    (viewerOwnsProfile
      ? collectionsService.fetchCollections(data.profile.id)
      : collectionsService.fetchPublicCollections(data.profile.id))
      .then(setPublicCollections)
      .catch(() => setPublicCollections([]));
  }, [data, currentUser?.id]);

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

  const handleSongPress = useCallback((song: { trackId: string; trackTitle: string; showIdentifier: string; showDate: string; venue?: string }) => {
    playSong(song.showIdentifier, song.trackId);
  }, [playSong]);

  const displayName = data?.profile.display_name || username;

  const { openShareTray } = useShareSheet();
  const { showToast } = useToast();
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

  // Owner-only Public/Private picker (the badge in the header). Optimistic:
  // flip locally, revert with a toast if the server write fails.
  const handleSelectProfileVisibility = useCallback(
    async (value: 'public' | 'private') => {
      if (!data?.profile || !isOwnProfile || !currentUser) return;
      const next = value === 'public';
      if (next === data.profile.is_public) return;
      const prev = data;
      setData({ ...data, profile: { ...data.profile, is_public: next } });
      try {
        await profileService.setProfilePublic(currentUser.id, next);
        showToast(next ? 'Profile is now public' : 'Profile is now private', 'success');
      } catch (e) {
        setData(prev);
        showToast("Couldn't update visibility. Please try again.", 'error');
      }
    },
    [data, isOwnProfile, currentUser, showToast],
  );

  // Sorted favorite shows. Missing-savedAt policy intentionally matches
  // FavoritesScreen's canonical tri-state (see compareBySavedAt) instead of
  // the previous `(a.savedAt || 0)` behavior, which treated an absent
  // savedAt as if it were saved at the Unix epoch.
  const sortedFavoriteShows = useMemo(() => {
    if (!data) return [];
    const shows = [...data.favorites.shows];
    switch (showSortType) {
      case 'alphabetical':
        return shows.sort((a, b) => compareAlphabetical(a.venue || '', b.venue || ''));
      case 'dateSavedNewest':
        return shows.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'newest'));
      case 'dateSavedOldest':
        return shows.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'oldest'));
      case 'performanceDateOldest':
        return shows.sort((a, b) => compareByDate(a.date, b.date, 'oldest'));
      case 'performanceDateNewest':
        return shows.sort((a, b) => compareByDate(a.date, b.date, 'newest'));
      case 'mostPopular':
        return shows.sort(
          (a, b) => getShowDownloadsByDate(b.date) - getShowDownloadsByDate(a.date),
        );
      default:
        return shows;
    }
  }, [data, showSortType]);

  // Sorted favorite songs. Same canonical savedAt policy as shows above.
  const sortedFavoriteSongs = useMemo(() => {
    if (!data) return [];
    const songs = [...data.favorites.songs];
    switch (songSortType) {
      case 'alphabetical':
        return songs.sort((a, b) => compareAlphabetical(a.trackTitle, b.trackTitle));
      case 'dateSavedNewest':
        return songs.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'newest'));
      case 'dateSavedOldest':
        return songs.sort((a, b) => compareBySavedAt(a.savedAt, b.savedAt, 'oldest'));
      case 'performanceDateOldest':
        return songs.sort((a, b) => compareByDate(a.showDate, b.showDate, 'oldest'));
      case 'performanceDateNewest':
        return songs.sort((a, b) => compareByDate(a.showDate, b.showDate, 'newest'));
      default:
        return songs;
    }
  }, [data, songSortType]);

  // Takes the full show (not just identifier/venue/date) so ShowDetail gets
  // the full nav-param bundle — including location and classicTier — for
  // its first paint, instead of waiting on a refetch.
  const handleShowPress = useCallback((show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', showDetailParams(show));
  }, [navigation]);

  const renderSongRow = useCallback((song: ProfileFavoriteSong) => (
    <SongCard
      song={song}
      isLoading={loadingSongId === `${song.trackId}-${song.showIdentifier}`}
      onPress={handleSongPress}
      correctVenue
    />
  ), [loadingSongId, handleSongPress]);

  // Single FlatList backs both the shows and songs tabs (collections has its
  // own ScrollView inside CollectionsTab — see the header below). Switching
  // `data`/`renderItem` on the same FlatList instance — rather than swapping
  // in a differently-keyed FlatList per tab — keeps one mounted list so tab
  // switches don't remount/re-measure it.
  const listData = useMemo<ProfileListRow[]>(() => {
    if (activeTab === 'shows') {
      return sortedFavoriteShows.map((show) => ({ kind: 'show' as const, show }));
    }
    if (activeTab === 'songs') {
      return sortedFavoriteSongs.map((song) => ({ kind: 'song' as const, song }));
    }
    return [];
  }, [activeTab, sortedFavoriteShows, sortedFavoriteSongs]);

  const keyExtractor = useCallback((row: ProfileListRow) => (
    row.kind === 'show'
      ? `show-${row.show.primaryIdentifier}`
      : `song-${row.song.trackId}-${row.song.showIdentifier}`
  ), []);

  const renderItem = useCallback(({ item }: { item: ProfileListRow }) => (
    item.kind === 'show'
      ? <ShowCard show={item.show} onPress={handleShowPress} hideSaveBadge />
      : renderSongRow(item.song)
  ), [handleShowPress, renderSongRow]);

  const listRef = useRef<FlatList<ProfileListRow>>(null);

  // Tab switches change which array backs the same FlatList instance, so the
  // prior scroll offset doesn't correspond to anything meaningful in the new
  // tab's content. Old behavior (everything in ListHeaderComponent) kept a
  // single scroll container, so switching tabs preserved whatever offset the
  // user was at — but the content below the header changed instantly. With
  // real virtualization that's no longer sound (row heights/positions differ
  // per tab), so we adopt FavoritesScreen's convention: reset to top on tab
  // change instead of trying to preserve a now-meaningless offset.
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeTab]);

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
        <ErrorState
          icon="person-circle-outline"
          title="Profile not found"
          message="This profile doesn't exist or is private."
        />
      </View>
    );
  }

  // Header content for the shows tab: the bounded (max-10) two-column
  // "Recently Played"/"Top 10" rundown, plus the "Favorites (N)" section
  // title and sort control. The actual favorite show rows are the FlatList's
  // real `data` (rendered below this header) so they virtualize.
  const renderShowsTabHeader = () => (
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
                onPress={handleShowPress}
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
                onPress={handleShowPress}
                hideSaveBadge
              />
            )) : (
              <Text style={styles.emptyText}>No plays yet</Text>
            )}
          </View>
        </View>
      )}

      {/* Favorite Shows section title (rows render as FlatList data) */}
      {data.favorites.shows.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Favorites ({data.favorites.shows.length})
          </Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortTrayVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name={getSortOptionIcon(SAVED_SHOW_SORT_OPTIONS, showSortType)} size={14} color={COLORS.textSecondary} />
              <Text style={styles.sortButtonText}>{getSavedItemSortLabel(showSortType, 'show')}</Text>
            </TouchableOpacity>
        </View>
      )}

      <SortTray
        visible={showSortTrayVisible}
        onClose={() => setShowSortTrayVisible(false)}
        options={SAVED_SHOW_SORT_OPTIONS}
        selectedValue={showSortType}
        onSelect={setShowSortType}
      />
    </>
  );

  // Same idea for the songs tab — bounded two-column rundown + section title
  // here; the favorite song rows are the FlatList's real `data`.
  const renderSongsTabHeader = () => (
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

      {/* Favorite Songs section title (rows render as FlatList data) */}
      {data.favorites.songs.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Favorites ({data.favorites.songs.length})
          </Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSongSortTrayVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name={getSortOptionIcon(SAVED_SONG_SORT_OPTIONS, songSortType)} size={14} color={COLORS.textSecondary} />
              <Text style={styles.sortButtonText}>{getSavedItemSortLabel(songSortType, 'song')}</Text>
            </TouchableOpacity>
        </View>
      )}

      <SortTray
        visible={songSortTrayVisible}
        onClose={() => setSongSortTrayVisible(false)}
        options={SAVED_SONG_SORT_OPTIONS}
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
              isOwnProfile ? (
                <TouchableOpacity
                  style={styles.visibilityBadge}
                  onPress={() => setVisibilityTrayVisible(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Visibility: ${data.profile.is_public ? 'Public' : 'Private'}`}
                  accessibilityHint="Double tap to change who can see your profile"
                >
                  <Ionicons
                    name={data.profile.is_public ? 'globe-outline' : 'lock-closed'}
                    size={14}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.visibilityBadgeText}>
                    {data.profile.is_public ? 'Public' : 'Private'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ) : (
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
              )
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
        ref={listRef}
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        // Performance tuning consistent with FavoritesScreen's per-tab lists.
        removeClippedSubviews={true}
        maxToRenderPerBatch={activeTab === 'songs' ? 15 : 10}
        updateCellsBatchingPeriod={50}
        windowSize={11}
        initialNumToRender={activeTab === 'songs' ? 15 : 10}
        contentContainerStyle={[styles.listContentContainer, isDesktop && styles.listContentContainerDesktop]}
        ListHeaderComponent={
          <View style={styles.contentContainer}>
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
              {isDesktop && isOwnProfile && data?.profile && (
                <TouchableOpacity
                  style={styles.visibilityBadge}
                  onPress={() => setVisibilityTrayVisible(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Visibility: ${data.profile.is_public ? 'Public' : 'Private'}`}
                  accessibilityHint="Double tap to change who can see your profile"
                >
                  <Ionicons
                    name={data.profile.is_public ? 'globe-outline' : 'lock-closed'}
                    size={14}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.visibilityBadgeText}>
                    {data.profile.is_public ? 'Public' : 'Private'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
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
            <SegmentedTabs
              tabs={
                (data?.profile?.is_public || isOwnProfile)
                  ? PUBLIC_PROFILE_TABS
                  : PUBLIC_PROFILE_TABS_NO_COLLECTIONS
              }
              activeTab={activeTab}
              onTabChange={setActiveTab}
              containerStyle={[styles.tabContainer, !isDesktop && styles.mobileHorizontalPad]}
            />

            {/* Tab Content (header portion — bounded top-10/recent-10 rundown
                and the section title; the actual favorite rows are the
                FlatList's real `data`, rendered below this header) */}
            {activeTab === 'shows' ? (
              renderShowsTabHeader()
            ) : activeTab === 'songs' ? (
              renderSongsTabHeader()
            ) : (
              <CollectionsTab
                entries={(isOwnProfile ? ownedCollections : publicCollections).map((c) => ({
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
      />

      {/* Owner-only visibility tray. Mounted at the screen level (NOT inside
          a tab header render, where it would only exist on that tab). */}
      {isOwnProfile && data?.profile && (
        <ActionSheet
          visible={visibilityTrayVisible}
          onClose={() => setVisibilityTrayVisible(false)}
          title="Visibility"
          actions={[
            {
              label: 'Public',
              icon: 'globe-outline' as const,
              detail: 'Others can see your favorites and listening history',
              selected: data.profile.is_public,
              onPress: () => handleSelectProfileVisibility('public'),
            },
            {
              label: 'Private',
              icon: 'lock-closed-outline' as const,
              detail: 'Only you can see your profile',
              selected: !data.profile.is_public,
              onPress: () => handleSelectProfileVisibility('private'),
            },
          ]}
        />
      )}
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
    paddingTop: Platform.OS === 'web' ? SPACING.md : SPACING.xs,
    paddingBottom: Platform.OS === 'web' ? SPACING.md : SPACING.xs,
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
    // Same height as the share button beside it.
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    // Same fill as the share button beside it.
    backgroundColor: COLORS.cardBackground,
  },
  visibilityBadgeText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  // Header-only wrapper (profile info/stats/tabs). Horizontal padding now
  // lives on the FlatList's contentContainerStyle (listContentContainer*)
  // so it applies uniformly to the header AND the virtualized rows below it
  // — previously everything (including rows) was inside this View.
  contentContainer: {
    paddingTop: Platform.OS === 'web' ? SPACING.lg : 0,
  },
  listContentContainer: {
    paddingBottom: SPACING.xl,
  },
  listContentContainerDesktop: {
    paddingHorizontal: SPACING.xl,
  },
  mobileHorizontalPad: {
    // Margin, not padding: with the toggle-style SegmentedTabs this spacing
    // must sit OUTSIDE the container — padding would land inside it and
    // skew the sliding thumb's inset math.
    marginHorizontal: SPACING.lg,
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
  // Margins only — the shared row/gap/tab/active/inactive styling lives in <SegmentedTabs>.
  tabContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
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
});
