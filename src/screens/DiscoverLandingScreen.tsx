import React, { useEffect, useMemo, useCallback, useState } from 'react';
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
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useShows } from '../contexts/ShowsContext';
import { useShowOfTheDay } from '../contexts/ShowOfTheDayContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { PageHeader } from '../components/PageHeader';
import { StarRating } from '../components/StarRating';
import { ActionPillButton } from '../components/ActionPillButton';
import { ShowCarousel } from '../components/ShowCarousel';
import { radioService } from '../services/radioService';
import { GRATEFUL_DEAD_101_DATES } from '../constants/classicShows';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SOTD_CARD_WIDTH = SCREEN_WIDTH - (SPACING.xl * 2); // Full width minus horizontal padding

type DiscoverLandingNavigationProp = StackNavigationProp<RootStackParamList, 'DiscoverLanding'>;

export const DiscoverLandingScreen = React.memo(function DiscoverLandingScreen() {
  const navigation = useNavigation<DiscoverLandingNavigationProp>();
  const { playCounts } = usePlayCounts();
  const { showsByYear } = useShows();
  const { show, isLoading, refreshShow } = useShowOfTheDay();
  const { startRadio, startShuffleSongs, startShuffleShows, state: playerState } = usePlayer();
  const { favoriteShows, favoriteSongs } = useFavorites();
  const { videoSource, videoId } = useVideoBackground();

  // Track app state to pause video when in background (saves battery)
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  // Prefetch radio tracks in the background for instant start
  useEffect(() => {
    radioService.prefetch(10);
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
      navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
    }
  };

  const handlePickAnother = () => {
    refreshShow();
  };

  const handleShowPress = useCallback((selectedShow: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: selectedShow.primaryIdentifier });
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

  // Classic Shows: Filter shows with classicTier, sorted by rating (tier 1 = best)
  // Excludes shows already in GD 101 to avoid duplicates
  const classicShows = useMemo(() => {
    const gd101DateSet = new Set(GRATEFUL_DEAD_101_DATES);
    const allClassics: GratefulDeadShow[] = [];
    for (const yearShows of Object.values(showsByYear)) {
      for (const s of yearShows) {
        // Only include if it has a classic tier AND is not in GD 101
        if (s.classicTier && !gd101DateSet.has(s.date.substring(0, 10))) {
          allClassics.push(s);
        }
      }
    }
    // Sort by tier (1 is best), then by date
    return allClassics
      .sort((a, b) => {
        const tierDiff = (a.classicTier || 4) - (b.classicTier || 4);
        if (tierDiff !== 0) return tierDiff;
        return a.date.localeCompare(b.date);
      })
      .slice(0, 15);
  }, [showsByYear]);

  // GD 101: Shows from the curated beginner list
  const gd101Shows = useMemo(() => {
    const shows: GratefulDeadShow[] = [];
    for (const date of GRATEFUL_DEAD_101_DATES) {
      for (const yearShows of Object.values(showsByYear)) {
        // Compare just the date portion (handles ISO format with timestamp)
        const found = yearShows.find(s => s.date.substring(0, 10) === date);
        if (found) {
          shows.push(found);
          break;
        }
      }
    }
    return shows;
  }, [showsByYear]);

  // Determine which button label to use and whether to show it
  const hasSavedContent = favoriteSongs.length > 0 || favoriteShows.length > 0;
  const savedButtonLabel = favoriteSongs.length > 0 ? 'Saved Songs' : 'Shuffle Shows';

  return (
    <View style={styles.container}>
      <PageHeader title="Discover" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
              <Video
                key={`sotd-video-${videoId}`}
                source={videoSource}
                style={styles.sotdVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay={appState === 'active'}
                isLooping
                isMuted
              />
              <BlurView intensity={30} tint="systemThinMaterialDark" style={styles.sotdBlurOverlay}>
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
              </BlurView>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <View style={[styles.actionsRow, !hasSavedContent && styles.actionsRowSingle]}>
            <View style={hasSavedContent ? styles.buttonWrapper : styles.buttonWrapperFull}>
              <ActionPillButton
                icon="radio"
                label="Start Radio"
                onPress={handleRadioPress}
                loading={playerState.isRadioLoading}
                fullWidth={!hasSavedContent}
              />
            </View>
            {hasSavedContent && (
              <View style={styles.buttonWrapper}>
                <ActionPillButton
                  icon="shuffle"
                  label={savedButtonLabel}
                  onPress={handleSavedPress}
                  loading={playerState.isShuffleLoading}
                />
              </View>
            )}
          </View>
        </View>

        {/* Jump Back In Carousel */}
        {recentlyPlayedShows.length > 0 && (
          <ShowCarousel
            title="Jump Back In"
            shows={recentlyPlayedShows}
            onShowPress={handleShowPress}
            extraData={playCounts}
            color="blue"
          />
        )}

        {/* Classic Shows Carousel */}
        <ShowCarousel
          title="Classic Shows"
          shows={classicShows}
          onShowPress={handleShowPress}
          color="blue"
        />

        {/* Grateful Dead 101 Carousel */}
        <ShowCarousel
          title="Grateful Dead 101"
          shows={gd101Shows}
          onShowPress={handleShowPress}
          color="blue"
        />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: 184,
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
    height: 100,
  },
  sotdVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  sotdBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: SPACING.lg,
    justifyContent: 'center',
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
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sotdLocation: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.85)',
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
  buttonWrapperFull: {
    width: '100%',
  },
});
