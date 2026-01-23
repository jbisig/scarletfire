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
import { TrackItem } from '../components/TrackItem';
import { VersionPicker } from '../components/VersionPicker';
import { StarRating } from '../components/StarRating';
import { ShowCard } from '../components/ShowCard';
import { ShowDetail, Track, GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, FONTS } from '../constants/theme';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs.generated';

type ShowDetailRouteProp = RouteProp<RootStackParamList, 'ShowDetail'>;
type ShowDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ShowDetail'>;

export function ShowDetailScreen() {
  const route = useRoute<ShowDetailRouteProp>();
  const navigation = useNavigation<ShowDetailNavigationProp>();
  const { getShowDetail, showsByYear } = useShows();
  const { state: playerState, loadTrack } = usePlayer();
  const { isShowFavorite, addFavoriteShow, removeFavoriteShow } = useFavorites();

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [justPressedTrackId, setJustPressedTrackId] = useState<string | null>(null);
  const [classicTier, setClassicTier] = useState<1 | 2 | 3 | null>(null);

  // Pre-compute track ratings for the current show
  const trackRatings = useMemo(() => {
    if (!show) return {};
    const ratings: Record<string, 1 | 2 | 3 | null> = {};

    show.tracks.forEach(track => {
      const song = GRATEFUL_DEAD_SONGS.find(s =>
        s.title.toLowerCase() === track.title.toLowerCase()
      );
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
        headerBackTitleVisible: false,
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
        {/* Venue - Large white title */}
        <Text style={styles.venue}>{show.venue || show.title}</Text>

        {/* Source and Save button row */}
        <View style={styles.sourceRow}>
          <View style={styles.sourceInfo}>
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
          >
            {isSaved ? (
              <Ionicons name="checkmark-sharp" size={18} color="#fff" />
            ) : (
              <Ionicons name="add" size={21} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

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
              {show.source || 'Unknown source'}
            </Text>
            <Text style={styles.downloadsText}>
              {formatDownloads(show.downloads)}
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
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.accent,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 8,
  },
  venue: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourceInfo: {
    flex: 1,
    marginRight: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    color: COLORS.accent,
  },
  sourceName: {
    fontSize: 16,
    fontFamily: FONTS.primary,
    color: COLORS.accent,
  },
  saveButton: {
    width: 33,
    height: 33,
    borderRadius: 17,
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
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  sourceInfoText: {
    fontSize: 15,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  downloadsText: {
    fontSize: 15,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  tracksContainer: {
    paddingVertical: 8,
  },
  nextTourStopsSection: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  nextTourStopsHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
});
