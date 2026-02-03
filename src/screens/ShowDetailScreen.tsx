import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useShows } from '../contexts/ShowsContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { TrackItem } from '../components/TrackItem';
import { VersionPicker } from '../components/VersionPicker';
import { StarRating } from '../components/StarRating';
import { OfficialReleaseBadge } from '../components/OfficialReleaseBadge';
import { OfficialReleaseModal } from '../components/OfficialReleaseModal';
import { ShowCard } from '../components/ShowCard';
import { ShowDetail, Track, GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { getVenueFromShow } from '../utils/formatters';
import { GRATEFUL_DEAD_SONGS, Song } from '../constants/songs.generated';
import { getOfficialReleasesForDate } from '../data/officialReleases';

// Pre-compute song lookup Map for O(1) access instead of O(n) find() on each track
const songsByTitle: Map<string, Song> = new Map(
  GRATEFUL_DEAD_SONGS.map(song => [song.title.toLowerCase(), song])
);

type ShowDetailRouteProp = RouteProp<RootStackParamList, 'ShowDetail'>;
type ShowDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ShowDetail'>;

export function ShowDetailScreen() {
  const route = useRoute<ShowDetailRouteProp>();
  const navigation = useNavigation<ShowDetailNavigationProp>();
  const { getShowDetail, showsByYear } = useShows();
  const { state: playerState, loadTrack } = usePlayer();
  const { isShowFavorite, addFavoriteShow, removeFavoriteShow } = useFavorites();
  const { getShowPlayCount } = usePlayCounts();

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [justPressedTrackId, setJustPressedTrackId] = useState<string | null>(null);
  const [classicTier, setClassicTier] = useState<1 | 2 | 3 | null>(null);
  const [releaseModalVisible, setReleaseModalVisible] = useState(false);

  // Get official releases for this show
  const officialReleases = useMemo(() => {
    if (!show?.date) return [];
    return getOfficialReleasesForDate(show.date);
  }, [show?.date]);

  // Calculate play count for this show
  const playCount = useMemo(() => {
    if (!show) return 0;
    return getShowPlayCount(show.identifier, show.tracks.length);
  }, [show?.identifier, show?.tracks.length, getShowPlayCount]);

  // Pre-compute track ratings for the current show using O(1) Map lookup
  const trackRatings = useMemo(() => {
    if (!show) return {};
    const ratings: Record<string, 1 | 2 | 3 | null> = {};

    show.tracks.forEach(track => {
      const song = songsByTitle.get(track.title.toLowerCase());
      if (song) {
        const performance = song.performances.find(p => p.date === show.date);
        ratings[track.id] = performance?.rating || null;
      }
    });

    return ratings;
  }, [show?.identifier, show?.date]);

  // Find the next 3 shows after the current show's date
  const nextTourStops = useMemo(() => {
    if (!show || !showsByYear) return [];

    const currentDate = show.date;
    const allShows: GratefulDeadShow[] = [];

    // Collect all shows from all years
    Object.values(showsByYear).forEach(yearShows => {
      allShows.push(...yearShows);
    });

    // Filter shows that are after the current date (excluding current show) and sort by date
    const futureShows = allShows
      .filter(s => s.date > currentDate && s.primaryIdentifier !== show.identifier)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Return the first 3
    return futureShows.slice(0, 3);
  }, [show?.date, showsByYear]);

  useEffect(() => {
    loadShowDetail(route.params.identifier);
  }, [route.params.identifier]);

  useEffect(() => {
    // Clear justPressedTrackId when the track is actually loading or playing
    if (
      justPressedTrackId &&
      playerState.currentTrack?.id === justPressedTrackId &&
      (playerState.isLoading || playerState.isPlaying)
    ) {
      setJustPressedTrackId(null);
    }
  }, [playerState.currentTrack?.id, playerState.isLoading, playerState.isPlaying, justPressedTrackId]);

  const formatDateMMDDYYYY = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${month}/${day}/${year}`;
  };

  const loadShowDetail = async (identifier: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getShowDetail(identifier);
      setShow(detail);
      setSelectedVersion(identifier);

      // Look up classic tier from showsByYear
      if (showsByYear && detail.year) {
        const yearShows = showsByYear[detail.year.toString()];
        if (yearShows) {
          const matchingShow = yearShows.find(s => s.primaryIdentifier === identifier || s.date === detail.date);
          if (matchingShow?.classicTier) {
            setClassicTier(matchingShow.classicTier);
          }
        }
      }

      // Update navigation title - empty title, just show back button
      navigation.setOptions({
        title: '',
        headerLeftContainerStyle: {
          paddingLeft: 10,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load show');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionChange = async (versionIdentifier: string) => {
    if (versionIdentifier !== selectedVersion) {
      await loadShowDetail(versionIdentifier);
    }
  };

  const handleTrackPress = useCallback((track: Track) => {
    if (show) {
      setJustPressedTrackId(track.id);
      loadTrack(track, show, show.tracks);
    }
  }, [show, loadTrack]);

  const handleNextShowPress = useCallback((nextShow: GratefulDeadShow) => {
    navigation.push('ShowDetail', { identifier: nextShow.primaryIdentifier });
  }, [navigation]);

  const handleToggleFavorite = () => {
    if (show) {
      const showToSave = {
        date: show.date,
        year: show.year,
        venue: show.venue,
        location: show.location,
        versions: show.allVersions || [],
        primaryIdentifier: show.identifier,
        title: show.title,
      };

      if (isShowFavorite(show.identifier)) {
        removeFavoriteShow(show.identifier);
      } else {
        addFavoriteShow(showToSave);
      }
    }
  };

  const formatDownloads = (downloads: number | undefined) => {
    if (!downloads) return '';
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}k downloads`;
    }
    return `${downloads} downloads`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (error || !show) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Show not found'}</Text>
      </View>
    );
  }

  const isSaved = isShowFavorite(show.identifier);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerContainer}>
        {/* Venue - full width at top */}
        <Text style={styles.venue} numberOfLines={2}>{getVenueFromShow(show)}</Text>

        {/* Date/Location info row with Save button */}
        <View style={styles.infoRow}>
          <View style={styles.infoContainer}>
            {/* Date with stars */}
            <View style={styles.dateRow}>
              <Text style={styles.date}>{formatDateMMDDYYYY(show.date)}</Text>
              {classicTier && (
                <StarRating tier={classicTier} size={16} />
              )}
            </View>

            {/* Location */}
            <Text style={styles.sourceName}>
              {show.location || 'Unknown location'}
            </Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSaved && styles.saveButtonActive
            ]}
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove show from favorites' : 'Save show to favorites'}
            accessibilityHint={isSaved ? 'Double tap to remove this show from your favorites' : 'Double tap to save this show to your favorites'}
            accessibilityState={{ selected: isSaved }}
          >
            {isSaved ? (
              <Ionicons name="checkmark-sharp" size={18} color={COLORS.textPrimary} />
            ) : (
              <Ionicons name="add" size={21} color={COLORS.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Badges row - Official Release and Play Count */}
        {(officialReleases.length > 0 || playCount > 0) && (
          <View style={styles.badgesRow}>
            {officialReleases.length > 0 && (
              <OfficialReleaseBadge
                onPress={() => setReleaseModalVisible(true)}
                releaseTitle={officialReleases[0].name}
              />
            )}
            {playCount > 0 && (
              <View style={styles.playCountBadge}>
                <Text style={styles.playCountText}>
                  {playCount} {playCount === 1 ? 'play' : 'plays'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Version Picker / Source Info Pill */}
        {show.allVersions && show.allVersions.length > 1 ? (
          <VersionPicker
            versions={show.allVersions}
            selectedVersion={selectedVersion}
            onVersionChange={handleVersionChange}
          />
        ) : (
          <View style={styles.sourceInfoPill}>
            <Text style={styles.sourceInfoText}>
              {show.allVersions?.[0]?.source || 'Unknown source'}
            </Text>
            <Text style={styles.downloadsText}>
              {formatDownloads(show.allVersions?.[0]?.downloads)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tracksContainer}>
        {show.tracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isPlaying={
              playerState.currentTrack?.id === track.id ||
              justPressedTrackId === track.id
            }
            onPress={handleTrackPress}
            rating={trackRatings[track.id]}
          />
        ))}
      </View>

      {/* Next Tour Stops Section */}
      {nextTourStops.length > 0 && (
        <View style={styles.nextTourStopsSection}>
          <View style={styles.divider} />
          <Text style={styles.nextTourStopsHeader}>Next Tour Stops</Text>
          {nextTourStops.map((nextShow) => (
            <ShowCard
              key={nextShow.primaryIdentifier}
              show={nextShow}
              onPress={handleNextShowPress}
            />
          ))}
        </View>
      )}

      {/* Official Release Modal */}
      <OfficialReleaseModal
        visible={releaseModalVisible}
        releases={officialReleases}
        show={show || undefined}
        onClose={() => setReleaseModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingBottom: 100,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  headerContainer: {
    padding: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  venue: {
    ...TYPOGRAPHY.heading2,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  infoContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.xs,
  },
  date: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  sourceName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  playCountBadge: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playCountText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  saveButton: {
    width: 33,
    height: 33,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  sourceInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  sourceInfoText: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
  },
  downloadsText: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  tracksContainer: {
    paddingVertical: SPACING.sm,
  },
  nextTourStopsSection: {
    marginTop: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  nextTourStopsHeader: {
    ...TYPOGRAPHY.heading2,
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.xs,
  },
});
