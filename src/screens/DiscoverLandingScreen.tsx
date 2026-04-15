import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  AppState,
  AppStateStatus,
  Platform,
  Image,
} from 'react-native';
import { logger } from '../utils/logger';
import { BlurBackground } from '../components/shared/BlurBackground';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useShows } from '../contexts/ShowsContext';
import { useShowOfTheDay } from '../contexts/ShowOfTheDayContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCollections } from '../contexts/CollectionsContext';
import { CreateCollectionModal } from '../components/collections/CreateCollectionModal';
import { CollectionCarousel } from '../components/CollectionCarousel';
import { CollectionType } from '../types/collection.types';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { PageHeader } from '../components/PageHeader';
import { StarRating } from '../components/StarRating';
import { ActionPillButton } from '../components/ActionPillButton';
import { ShowCarousel, ShowCarouselRef } from '../components/ShowCarousel';
import { radioService } from '../services/radioService';
import { GRATEFUL_DEAD_101_DATES } from '../constants/classicShows';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT, BRAND_COLORS } from '../constants/theme';

// Default screen width — components should use useWindowDimensions for responsive sizing
const SOTD_CARD_PADDING = SPACING.xl * 2;

// Resolve video source to URL string for HTML5 video (web only)
function resolveVideoUri(source: number | { uri: string } | string): string {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') {
    try { return Image.resolveAssetSource(source)?.uri || ''; } catch { return ''; }
  }
  if (source && typeof source === 'object' && 'uri' in source) return source.uri;
  if (source && typeof source === 'object' && 'default' in (source as any)) return (source as any).default; // eslint-disable-line @typescript-eslint/no-explicit-any
  return '';
}

// HTML5 video background for web SOTD card
function WebVideoBackground({ uri, videoId, onError }: { uri: string; videoId: string; onError?: () => void }) {
  return React.createElement('video', {
    key: `sotd-video-${videoId}`,
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    ref: (el: HTMLVideoElement | null) => {
      if (!el) return;
      el.playbackRate = 0.5;
      if (onError) {
        el.onerror = () => onError();
        const t = setTimeout(() => { if (el.readyState === 0) onError(); }, 5000);
        el.onloadeddata = () => clearTimeout(t);
      }
    },
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  });
}

type DiscoverLandingNavigationProp = StackNavigationProp<RootStackParamList, 'DiscoverLanding'>;

export const DiscoverLandingScreen = React.memo(function DiscoverLandingScreen() {
  const { isDesktop } = useResponsive();
  const navigation = useNavigation<DiscoverLandingNavigationProp>();
  const { playCounts } = usePlayCounts();
  const { showsByYear } = useShows();
  const { show, isLoading, refreshShow } = useShowOfTheDay();
  const { startRadio, startShuffleSongs, startShuffleShows, state: playerState } = usePlayer();
  const { favoriteShows, favoriteSongs, isLoading: favoritesLoading } = useFavorites();
  const { videoSource, videoId, resetToFallback } = useVideoBackground();
  const webVideoUri = useMemo(() => Platform.OS === 'web' ? resolveVideoUri(videoSource) : '', [videoSource]);

  // Track app state to pause video when in background (saves battery) — native only
  const [appState, setAppState] = useState<AppStateStatus>(
    Platform.OS !== 'web' ? AppState.currentState : 'active'
  );

  const handleVideoError = useCallback((error: string) => {
    logger.player.error('Video background failed to load:', error);
    resetToFallback();
  }, [resetToFallback]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  // Refs for carousel scroll reset
  const jumpBackInRef = useRef<ShowCarouselRef>(null);
  const classicsRef = useRef<ShowCarouselRef>(null);

  // Reset all carousels to the beginning when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      jumpBackInRef.current?.scrollToStart();
      classicsRef.current?.scrollToStart();
    }, [])
  );

  // Prefetch radio tracks in the background for instant radio start.
  // Delayed so a user tapping a show card immediately on app launch doesn't
  // have their getShowDetail fetch contend with the prefetch batches.
  // networkPriority.waitForIdle() is a second line of defense if the user
  // taps after the delay elapses.
  useEffect(() => {
    const timer = setTimeout(() => {
      radioService.prefetch(10);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleRadioPress = async () => {
    await startRadio();
  };

  const handleSavedPress = async () => {
    if (favoriteSongs.length > 0) {
      await startShuffleSongs(favoriteSongs);
    } else if (favoriteShows.length > 0) {
      await startShuffleShows(favoriteShows);
    }
  };

  const handleViewShow = () => {
    if (show) {
      navigation.navigate('ShowDetail', {
        identifier: show.primaryIdentifier,
        venue: show.venue,
        date: show.date,
        location: show.location,
        classicTier: show.classicTier,
      });
    }
  };

  const handlePickAnother = () => {
    refreshShow();
  };

  const handleShowPress = useCallback((selectedShow: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', {
      identifier: selectedShow.primaryIdentifier,
      venue: selectedShow.venue,
      date: selectedShow.date,
      location: selectedShow.location,
      classicTier: selectedShow.classicTier,
    });
  }, [navigation]);

  // Jump Back In: Recently played shows sorted by most recent
  const recentlyPlayedShows = useMemo(() => {
    // Get unique show identifiers with most recent lastPlayedAt
    const showTimestamps = new Map<string, number>();
    playCounts.forEach(pc => {
      const existing = showTimestamps.get(pc.showIdentifier);
      if (!existing || pc.lastPlayedAt > existing) {
        showTimestamps.set(pc.showIdentifier, pc.lastPlayedAt);
      }
    });

    // Sort by most recent and take top 10
    const sortedIdentifiers = Array.from(showTimestamps.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([identifier]) => identifier);

    // Look up full show objects from showsByYear
    const shows: GratefulDeadShow[] = [];
    for (const identifier of sortedIdentifiers) {
      for (const yearShows of Object.values(showsByYear)) {
        const found = yearShows.find(s => s.primaryIdentifier === identifier);
        if (found) {
          shows.push(found);
          break;
        }
      }
    }

    return shows;
  }, [playCounts, showsByYear]);

  // Classic Shows: All classicTier shows merged with the curated Grateful Dead 101
  // list. Deduped by primary identifier; sorted by tier (1 = best), then date.
  const classicShows = useMemo(() => {
    const allClassics: GratefulDeadShow[] = [];
    const seen = new Set<string>();
    for (const yearShows of Object.values(showsByYear)) {
      for (const s of yearShows) {
        if (s.classicTier && !seen.has(s.primaryIdentifier)) {
          allClassics.push(s);
          seen.add(s.primaryIdentifier);
        }
      }
    }
    for (const date of GRATEFUL_DEAD_101_DATES) {
      for (const yearShows of Object.values(showsByYear)) {
        const found = yearShows.find(s => s.date.substring(0, 10) === date);
        if (found && !seen.has(found.primaryIdentifier)) {
          allClassics.push(found);
          seen.add(found.primaryIdentifier);
          break;
        }
      }
    }
    const topDownloads = (s: GratefulDeadShow) =>
      s.versions.reduce((max, v) => Math.max(max, v.downloads || 0), 0);
    return allClassics
      .sort((a, b) => {
        const diff = topDownloads(b) - topDownloads(a);
        if (diff !== 0) return diff;
        return a.date.localeCompare(b.date);
      })
      .slice(0, 25);
  }, [showsByYear]);

  // Collections + playlists for the "Your ..." carousels
  const { collections } = useCollections();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState<CollectionType>('show_collection');

  const showCollections = useMemo(
    () => collections.filter(c => c.type === 'show_collection'),
    [collections],
  );
  const playlists = useMemo(
    () => collections.filter(c => c.type === 'playlist'),
    [collections],
  );

  const handleCollectionPress = useCallback((collectionId: string) => {
    navigation.navigate('CollectionDetail', { collectionId });
  }, [navigation]);

  const handleCreatePress = useCallback((type: CollectionType) => {
    setCreateType(type);
    setCreateModalVisible(true);
  }, []);

  // Determine which button label to use and whether to show it
  // While favorites are loading, assume there might be saved content to prevent layout shift
  const hasSavedContent = favoritesLoading || favoriteSongs.length > 0 || favoriteShows.length > 0;
  const savedButtonLabel = favoriteSongs.length > 0 ? 'Saved Songs' : 'Shuffle Shows';

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <PageHeader title="Discover" />
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}>
        {/* Show of the Day Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Show of the Day</Text>
            <TouchableOpacity
              onPress={handlePickAnother}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Pick another show"
              accessibilityHint="Double tap to get a different random show"
            >
              <Ionicons name="refresh" size={24} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleViewShow}
            disabled={isLoading || !show}
            accessibilityRole="button"
            accessibilityLabel={show ? `Show of the Day: ${getVenueFromShow(show)}, ${formatDate(show.date)}` : 'Show of the Day: Loading'}
            accessibilityHint="Double tap to view this show"
            accessibilityState={{ disabled: isLoading || !show }}
          >
            <View style={styles.sotdCard}>
              {/* Video background - absolute fill */}
              {Platform.OS === 'web' ? (
                webVideoUri ? (
                  <View style={styles.sotdVideoContainer}>
                    <WebVideoBackground uri={webVideoUri} videoId={videoId} onError={resetToFallback} />
                  </View>
                ) : null
              ) : (() => {
                const { Video, ResizeMode } = require('expo-av');
                return (
                  <Video
                    key={`sotd-video-${videoId}`}
                    source={videoSource}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={appState === 'active'}
                    isLooping
                    isMuted
                    onError={handleVideoError}
                  />
                );
              })()}
              {/* Overlay */}
              {Platform.OS === 'web' && <View style={styles.sotdWebBlur} />}
              <View style={styles.sotdBlurOverlay}>
                {Platform.OS !== 'web' && <BlurBackground intensity={30} tint="dark" />}
                {isLoading ? (
                  <View style={styles.sotdLoading}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                  </View>
                ) : show ? (
                  <View style={styles.sotdContent}>
                    <Text style={styles.sotdVenue} numberOfLines={1}>
                      {getVenueFromShow(show)}
                    </Text>
                    <View style={styles.sotdDateRow}>
                      <Text style={styles.sotdDate}>{formatDate(show.date)}</Text>
                      {show.classicTier && (
                        <StarRating tier={show.classicTier} size={12} />
                      )}
                    </View>
                    {show.location && (
                      <Text style={styles.sotdLocation}>{show.location}</Text>
                    )}
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <View style={[styles.actionsRow, !hasSavedContent && styles.actionsRowSingle]}>
            <View style={hasSavedContent ? [styles.buttonWrapper, isDesktop && styles.buttonWrapperDesktop] : [styles.buttonWrapperFull, isDesktop && styles.buttonWrapperFullDesktop]}>
              <ActionPillButton
                icon="radio"
                label="Start Radio"
                onPress={handleRadioPress}
                loading={playerState.isRadioLoading}
                fullWidth={!hasSavedContent}
              />
            </View>
            {hasSavedContent && (
              <View style={[styles.buttonWrapper, isDesktop && styles.buttonWrapperDesktop]}>
                <ActionPillButton
                  icon="shuffle"
                  label={favoritesLoading ? 'Loading...' : savedButtonLabel}
                  onPress={handleSavedPress}
                  loading={playerState.isShuffleLoading}
                  disabled={favoritesLoading}
                />
              </View>
            )}
            {isDesktop && favoriteSongs.length > 0 && favoriteShows.length > 0 && (
              <View style={[styles.buttonWrapper, isDesktop && styles.buttonWrapperDesktop]}>
                <ActionPillButton
                  icon="shuffle"
                  label="Shuffle Shows"
                  onPress={() => startShuffleShows(favoriteShows)}
                  loading={playerState.isShuffleLoading}
                />
              </View>
            )}
          </View>
        </View>

        {/* Jump Back In Carousel */}
        {recentlyPlayedShows.length > 0 && (
          <ShowCarousel
            ref={jumpBackInRef}
            title="Jump Back In"
            shows={recentlyPlayedShows}
            onShowPress={handleShowPress}
            extraData={playCounts}
            color="blue"
          />
        )}

        {/* Classic Shows Carousel */}
        <ShowCarousel
          ref={classicsRef}
          title="Classic Shows"
          shows={classicShows}
          onShowPress={handleShowPress}
          color="blue"
        />

        {/* Your Show Collections */}
        <CollectionCarousel
          title="Your Show Collections"
          collections={showCollections}
          type="show_collection"
          onCollectionPress={handleCollectionPress}
          onCreatePress={() => handleCreatePress('show_collection')}
        />

        {/* Your Playlists */}
        <CollectionCarousel
          title="Your Playlists"
          collections={playlists}
          type="playlist"
          onCollectionPress={handleCollectionPress}
          onCreatePress={() => handleCreatePress('playlist')}
        />
      </ScrollView>

      <CreateCollectionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        initialType={createType}
        onCreated={(id) => {
          navigation.navigate('CollectionDetail', { collectionId: id });
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
    // @ts-ignore - web: prevent scroll chaining to parent/browser
    ...(Platform.OS === 'web' ? { overscrollBehavior: 'contain' } : {}),
  },
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: LAYOUT.listBottomPadding,
  },
  scrollContentDesktop: {
    padding: 16,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading4,
  },
  sotdCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    minHeight: 80, // Ensure video has space to render
    // @ts-ignore - web: force clipping on rounded corners
    ...(Platform.OS === 'web' ? { WebkitMaskImage: 'radial-gradient(white, black)' } : {}),
  },
  sotdVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.68,
  },
  sotdWebBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    // @ts-ignore - web only
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    zIndex: 1,
  },
  sotdBlurOverlay: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    position: 'relative',
    zIndex: 2,
  },
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sotdLoading: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  sotdContent: {
    gap: 2,
  },
  sotdVenue: {
    ...TYPOGRAPHY.label,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  sotdDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  sotdDate: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: BRAND_COLORS.textSoft,
  },
  sotdLocation: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: BRAND_COLORS.textSoft,
  },
  actionsSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionsRowSingle: {
    justifyContent: 'center',
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonWrapperDesktop: {
    flex: undefined,
    width: 200,
  },
  buttonWrapperFull: {
    width: '100%',
  },
  buttonWrapperFullDesktop: {
    width: 200,
  },
});
