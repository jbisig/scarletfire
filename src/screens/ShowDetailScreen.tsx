import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useShows } from '../contexts/ShowsContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { TrackItem } from '../components/TrackItem';
import { VersionPicker } from '../components/VersionPicker';
import { StarRating } from '../components/StarRating';
import { OfficialReleaseBadge } from '../components/OfficialReleaseBadge';
import { OfficialReleaseModal } from '../components/OfficialReleaseModal';
import { ShowCard } from '../components/ShowCard';
import { ShowDetail, Track, GratefulDeadShow, RecordingVersion } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AddToCollectionPicker } from '../components/collections/AddToCollectionPicker';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT, WEB_LAYOUT } from '../constants/theme';
import { getVenueFromShow } from '../utils/formatters';
import { GRATEFUL_DEAD_SONGS, Song } from '../constants/songs.generated';
import { getOfficialReleasesForDate } from '../data/officialReleases';
import { normalizeTrackTitle } from '../utils/titleNormalization';
import { matchTrackBySlug } from '../utils/trackMatching';
import { SIMILARITY_THRESHOLDS } from '../constants/thresholds';
import { getShowNotes } from '../utils/showNotes';
import { SHOW_NOTES_CITATION } from '../data/showNotes';
import { haptics } from '../services/hapticService';
import { useShareSheet } from '../contexts/ShareSheetContext';
import type { ShareItem } from '../services/shareService';

// Default profile image for logged out users (web header)

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

// HTML5 video background for web header
function WebVideoBackground({ uri, videoId, onError }: { uri: string; videoId: string; onError?: () => void }) {
  return React.createElement('video', {
    key: `show-header-video-${videoId}`,
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

// Pre-compute song lookup Map for O(1) access instead of O(n) find() on each track
const songsByTitle: Map<string, Song> = new Map(
  GRATEFUL_DEAD_SONGS.map(song => [song.title.toLowerCase(), song])
);

type ShowDetailRouteProp = RouteProp<RootStackParamList, 'ShowDetail'>;
type ShowDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ShowDetail'>;

export function ShowDetailScreen() {
  const route = useRoute<ShowDetailRouteProp>();
  const navigation = useNavigation<ShowDetailNavigationProp>();
  const { getShowDetail, getShowVersions, showsByYear } = useShows();
  const { state: playerState, loadTrack } = usePlayer();
  const { isShowFavorite, addFavoriteShow, removeFavoriteShow, isSongFavorite, addFavoriteSong, removeFavoriteSong } = useFavorites();
  const { getShowPlayCount } = usePlayCounts();

  const { trackTitle, venue: previewVenue, date: previewDate, location: previewLocation, classicTier: previewTier } = route.params;

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [justPressedTrackId, setJustPressedTrackId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [releaseModalVisible, setReleaseModalVisible] = useState(false);
  const [showNotesExpanded, setShowNotesExpanded] = useState(false);
  const { isDesktop } = useResponsive();
  const { openShareTray } = useShareSheet();

  // Resolve classicTier synchronously from preview or showsByYear so stars render
  // in the first paint instead of popping in after loadShowDetail completes.
  const classicTier = useMemo<1 | 2 | 3 | null>(() => {
    if (previewTier) return previewTier;
    const year = previewDate?.substring(0, 4) ?? show?.date?.substring(0, 4);
    if (!year || !showsByYear?.[year]) return null;
    const identifier = route.params.identifier;
    const match = showsByYear[year].find(
      s => s.primaryIdentifier === identifier || s.date === (previewDate ?? show?.date)
    );
    return match?.classicTier ?? null;
  }, [previewTier, previewDate, show?.date, showsByYear, route.params.identifier]);

  const hasSelectedFromUrl = useRef(false);

  // Video background for web header
  const { videoSource, videoId, resetToFallback } = useVideoBackground();
  const videoUri = useMemo(() => Platform.OS === 'web' ? resolveVideoUri(videoSource) : '', [videoSource]);


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

  // Look up show notes from Taper's Compendium
  const showNotesText = useMemo(() => {
    if (!show?.date) return null;
    return getShowNotes(show.date);
  }, [show?.date]);

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

  // Resolve identifier: if it's a date (YYYY-MM-DD), look up the primaryIdentifier
  const resolveIdentifier = useCallback((id: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(id) && showsByYear) {
      const year = id.substring(0, 4);
      const yearShows = showsByYear[year];
      if (yearShows) {
        const match = yearShows.find(s => s.date.substring(0, 10) === id);
        if (match) return match.primaryIdentifier;
      }
    }
    return id;
  }, [showsByYear]);

  /**
   * Mark a track as "selected" — used when the user arrives on this screen via
   * a URL-driven route (share link, pasted URL, etc.). The selected track gets
   * a sustained visual highlight in the tracklist; the user explicitly taps
   * play to start audio. Distinct from "playing" state which is driven by the
   * audio player.
   *
   * Could be extended to scroll the selected track into view — for now the
   * tracklist is short enough that scrolling isn't necessary; the highlight
   * alone conveys the selection.
   */
  const selectTrack = useCallback((track: Track) => {
    setSelectedTrackId(track.id);
  }, []);

  useEffect(() => {
    hasSelectedFromUrl.current = false;
    setShowNotesExpanded(false);
    loadShowDetail(resolveIdentifier(route.params.identifier));
  }, [route.params.identifier, resolveIdentifier]);

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

  // When the user taps play on the currently-selected track (or any other
  // track), clear the selection so the "selected" highlight doesn't fight
  // with the "playing" highlight on the same row.
  useEffect(() => {
    if (!selectedTrackId) return;
    if (playerState.currentTrack?.id && playerState.isPlaying) {
      // User started playing a track — drop any URL-driven selection.
      setSelectedTrackId(null);
    }
  }, [selectedTrackId, playerState.currentTrack?.id, playerState.isPlaying]);

  // Select track from URL slug (e.g. /show/:identifier/dark-star) — applies to
  // every URL-driven arrival with a trackTitle param, regardless of whether the
  // URL came from a share link, paste, or bookmark. One behavior: select and
  // highlight, don't auto-play. The user taps play explicitly to start audio.
  useEffect(() => {
    if (!trackTitle || !show || hasSelectedFromUrl.current) return;
    hasSelectedFromUrl.current = true;

    const bestMatch = matchTrackBySlug(
      trackTitle,
      show.tracks,
      SIMILARITY_THRESHOLDS.SEARCH_MATCH
    );

    if (bestMatch) {
      selectTrack(bestMatch);
    }
  }, [trackTitle, show, selectTrack]);

  const formatDateMMDDYYYY = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split('-');
    return `${month}/${day}/${year}`;
  };

  const loadShowDetail = async (identifier: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch show detail and all versions in parallel so the source picker
      // and tracklist render together in one commit — no layout shift from
      // versions loading after the initial render. If previewDate is
      // available (navigation from a list), we can start the versions
      // request immediately without waiting for the detail fetch.
      const detailPromise = getShowDetail(identifier);
      const versionsPromise: Promise<RecordingVersion[]> = previewDate
        ? getShowVersions(previewDate)
        : detailPromise.then(d => (d.date ? getShowVersions(d.date) : []));

      const [detail, versions] = await Promise.all([detailPromise, versionsPromise]);

      setShow(versions.length > 0 ? { ...detail, allVersions: versions } : detail);
      setSelectedVersion(identifier);

      // Warm the audio CDN connection for the first track so tapping play
      // doesn't pay the full TLS handshake + CDN cold-cache cost. Fire and
      // forget — errors ignored. Note: RN fetch uses a different URLSession
      // than AVPlayer, but this still warms archive.org's redirect and hits
      // the specific ia***.us.archive.org host that serves the file.
      if (detail.tracks.length > 0) {
        fetch(detail.tracks[0].streamUrl, { method: 'HEAD' }).catch(() => {});
      }

      // Update navigation title (also drives browser tab title via documentTitle formatter)
      const webTitle = detail.date
        ? (() => { const [y, m, d] = detail.date.split('-'); return `${parseInt(m)}/${parseInt(d)}/${y.slice(2)} - ${getVenueFromShow(detail)}`; })()
        : '';
      navigation.setOptions({
        title: Platform.OS === 'web' ? webTitle : '',
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
      // Update URL to include track title for shareable links
      if (Platform.OS === 'web') {
        navigation.setParams({ trackTitle: normalizeTrackTitle(track.title) });
      }
    }
  }, [show, loadTrack, navigation]);

  const handleToggleSaveSong = useCallback((track: Track) => {
    if (!show) return;
    if (isSongFavorite(track.id, show.identifier)) {
      removeFavoriteSong(track.id, show.identifier);
    } else {
      const favoriteSong: FavoriteSong = {
        trackId: track.id,
        trackTitle: track.title,
        showIdentifier: show.identifier,
        showDate: show.date,
        venue: getVenueFromShow(show),
        streamUrl: track.streamUrl,
      };
      addFavoriteSong(favoriteSong);
    }
  }, [show, isSongFavorite, removeFavoriteSong, addFavoriteSong]);

  const handleNextShowPress = useCallback((nextShow: GratefulDeadShow) => {
    navigation.push('ShowDetail', {
      identifier: nextShow.primaryIdentifier,
      venue: nextShow.venue,
      date: nextShow.date,
      location: nextShow.location,
      classicTier: nextShow.classicTier,
    });
  }, [navigation]);

  const handleShareShow = useCallback(() => {
    if (!show) return;

    const item: ShareItem = {
      kind: 'show',
      showId: show.identifier,
      date: show.date,
      venue: getVenueFromShow(show),
      tier: classicTier,
    };

    haptics.light();
    openShareTray(item);
  }, [show, classicTier, openShareTray]);

  // Register a headerRight share icon. Runs in a separate useEffect from the
  // initial title-setting call in loadShowDetail so the callback stays fresh
  // when `show` or `classicTier` change (e.g. when the user navigates between
  // versions or previews).
  const [addToCollectionVisible, setAddToCollectionVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => setAddToCollectionVisible(true)}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Add to collection"
          >
            <Ionicons name="folder-open-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShareShow}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Share show"
          >
            <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleShareShow]);

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

  if (isLoading && !previewVenue) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (error || (!show && !isLoading)) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Show not found'}</Text>
      </View>
    );
  }

  // Use real show data once loaded, but prefer preview values for
  // venue/date/location so the header doesn't visibly change when the
  // archive.org metadata comes in with slightly different formatting.
  // Clearing title ensures getVenueFromShow uses the stable venue field
  // instead of extracting a (potentially different) venue from title.
  const displayShow: ShowDetail = show
    ? {
        ...show,
        title: previewVenue ? '' : show.title,
        venue: previewVenue ?? show.venue,
        date: previewDate ?? show.date,
        location: previewLocation ?? show.location,
      }
    : ({
        identifier: route.params.identifier,
        date: previewDate ?? '',
        venue: previewVenue ?? '',
        location: previewLocation ?? '',
        tracks: [],
        source: '',
        year: previewDate ? parseInt(previewDate.substring(0, 4)) : 0,
      } as ShowDetail);

  const isSaved = isShowFavorite(displayShow.identifier);

  return (
    <ScrollView
      style={[styles.container, isDesktop && styles.containerDesktop]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={!isDesktop}
    >
      {/* Web: Header with video background + blur */}
      {Platform.OS === 'web' ? (
        <View style={styles.webHeaderWrapper}>
          {/* Video background */}
          {videoUri ? (
            <View style={styles.webHeaderVideo}>
              <WebVideoBackground uri={videoUri} videoId={videoId} onError={resetToFallback} />
            </View>
          ) : null}
          {/* Blur overlay */}
          <View style={styles.webHeaderBlur} />

          {/* Header content */}
          <View style={[styles.webHeaderContent, isDesktop && styles.webHeaderContentDesktop]}>
            {/* Back button + Avatar row */}
            <View style={styles.webNavRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={styles.webBackButton}
              >
                <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Show info section */}
            <View style={styles.webInfoSection}>
              {/* Venue + Details */}
              <View style={styles.webVenueBlock}>
                <Text style={styles.webVenue} numberOfLines={2}>{getVenueFromShow(displayShow)}</Text>

                {/* Details section with play count on mobile */}
                <View style={styles.webDetailsSectionRow}>
                  <View style={styles.webDetailsSection}>
                    {/* Date with stars */}
                    <View style={styles.webDateRow}>
                      <Text style={styles.webDate}>{formatDateMMDDYYYY(displayShow.date)}</Text>
                      {classicTier && (
                        <StarRating tier={classicTier} size={20} />
                      )}
                    </View>

                    {/* Location */}
                    <Text style={styles.webLocation}>
                      {displayShow.location || 'Unknown location'}
                    </Text>
                  </View>

                  {/* Play count badge - mobile web only */}
                  {!isDesktop && playCount > 0 && (
                    <View style={styles.playCountPillWeb}>
                      <Text style={styles.playCountPillText}>
                        {playCount} {playCount === 1 ? 'play' : 'plays'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Badges row (official releases only on web) */}
              {officialReleases.length > 0 && (
                <View style={styles.badgesRow}>
                  <OfficialReleaseBadge
                    onPress={() => setReleaseModalVisible(true)}
                    releaseTitle={officialReleases[0].name}
                  />
                </View>
              )}

            {/* Pills row: Source + Play Count (desktop) + Save */}
            <View style={styles.pillsRow}>
              <View style={[styles.pillsLeft, isDesktop && styles.pillsLeftDesktop]}>
                {displayShow.allVersions && displayShow.allVersions.length > 1 ? (
                  <VersionPicker
                    versions={displayShow.allVersions}
                    selectedVersion={selectedVersion}
                    onVersionChange={handleVersionChange}
                    webGlassStyle
                  />
                ) : show ? (
                  <View style={styles.sourceInfoPillWeb}>
                    <Text style={styles.webSourceText}>
                      {displayShow.allVersions?.[0]?.source || 'Unknown source'}
                    </Text>
                    <View style={styles.webDownloadsWrap}>
                      <Text style={styles.webDownloadsText} numberOfLines={1}>
                        {formatDownloads(displayShow.allVersions?.[0]?.downloads)}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.pillsRight}>
                {/* Play count pill - desktop only */}
                {isDesktop && playCount > 0 && (
                  <View style={styles.playCountPillWeb}>
                    <Text style={styles.playCountPillText}>
                      {playCount} {playCount === 1 ? 'play' : 'plays'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.savePillWeb}
                  onPress={handleShareShow}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Share show"
                >
                  <Ionicons
                    name="share-outline"
                    size={17}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.savePillText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.savePillWeb}
                  onPress={handleToggleFavorite}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? 'Remove show from favorites' : 'Save show to favorites'}
                  accessibilityState={{ selected: isSaved }}
                >
                  <Ionicons
                    name={isSaved ? 'heart' : 'heart-outline'}
                    size={17}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.savePillText}>{isSaved ? 'Saved' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            </View>
          </View>
        </View>
      ) : (
        /* Native: Original header */
        <View style={styles.headerContainer}>
          {/* Venue - full width at top */}
          <Text style={styles.venue} numberOfLines={2}>{getVenueFromShow(displayShow)}</Text>

          {/* Date/Location info row with Save button */}
          <View style={styles.infoRow}>
            <View style={styles.infoContainer}>
              {/* Date with stars */}
              <View style={styles.dateRow}>
                <Text style={styles.date}>{formatDateMMDDYYYY(displayShow.date)}</Text>
                {classicTier && (
                  <StarRating tier={classicTier} size={16} />
                )}
              </View>

              {/* Location */}
              <Text style={styles.sourceName}>
                {displayShow.location || 'Unknown location'}
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
          {displayShow.allVersions && displayShow.allVersions.length > 1 ? (
            <VersionPicker
              versions={displayShow.allVersions}
              selectedVersion={selectedVersion}
              onVersionChange={handleVersionChange}
            />
          ) : show ? (
            <View style={styles.sourceInfoPill}>
              <Text style={styles.sourceInfoText}>
                {displayShow.allVersions?.[0]?.source || 'Unknown source'}
              </Text>
              <Text style={styles.downloadsText}>
                {formatDownloads(displayShow.allVersions?.[0]?.downloads)}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={[styles.tracksContainer, isDesktop && styles.tracksContainerDesktop]}>
        {show ? show.tracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isPlaying={
              playerState.currentTrack?.id === track.id ||
              justPressedTrackId === track.id
            }
            onPress={handleTrackPress}
            rating={trackRatings[track.id]}
            isSaved={isSongFavorite(track.id, show.identifier)}
            onToggleSave={handleToggleSaveSong}
            isSelected={track.id === selectedTrackId}
          />
        )) : (
          <View style={styles.tracksLoading}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        )}
      </View>

      {/* Show Notes Section */}
      {showNotesText && (
        <View style={[styles.showNotesSection, isDesktop && styles.showNotesSectionDesktop]}>
          <View style={styles.divider} />
          <Text style={styles.showNotesHeader}>Show Notes</Text>
          <Text
            style={styles.showNotesText}
            numberOfLines={showNotesExpanded ? undefined : 3}
          >
            {showNotesText}
          </Text>
          <TouchableOpacity
            onPress={() => setShowNotesExpanded(!showNotesExpanded)}
            activeOpacity={0.7}
            style={styles.showNotesToggle}
          >
            <Text style={styles.showNotesToggleText}>
              {showNotesExpanded ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.showNotesCitation}>{SHOW_NOTES_CITATION}</Text>
        </View>
      )}

      {/* Next Tour Stops Section */}
      {nextTourStops.length > 0 && (
        <View style={[styles.nextTourStopsSection, isDesktop && styles.nextTourStopsSectionDesktop]}>
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
      {show && (
        <AddToCollectionPicker
          visible={addToCollectionVisible}
          onClose={() => setAddToCollectionVisible(false)}
          type="show_collection"
          itemIdentifier={show.identifier}
          itemMetadata={{
            title: show.title,
            date: show.date,
            venue: show.venue,
            location: show.location,
            primaryIdentifier: show.identifier,
          }}
        />
      )}
    </ScrollView>
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
    paddingBottom: LAYOUT.listBottomPadding,
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
  playCountPillWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 342,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.33)',
    paddingHorizontal: SPACING.lg,
    height: 35,
    // @ts-ignore
    backdropFilter: 'blur(34px)',
    WebkitBackdropFilter: 'blur(34px)',
  },
  playCountPillText: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    color: COLORS.textPrimary,
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
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pillsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    marginLeft: 'auto',
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
  pillsLeft: {
    flex: 1,
    minWidth: 0,
  },
  pillsLeftDesktop: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    minWidth: 'auto',
  },
  sourceInfoPillWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 342,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.33)',
    paddingHorizontal: SPACING.lg,
    height: 35,
    gap: 6,
    // @ts-ignore
    backdropFilter: 'blur(34px)',
    WebkitBackdropFilter: 'blur(34px)',
  },
  savePillWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 342,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.33)',
    paddingHorizontal: SPACING.lg,
    height: 35,
    gap: 6,
    // @ts-ignore
    backdropFilter: 'blur(34px)',
    WebkitBackdropFilter: 'blur(34px)',
  },
  savePillText: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    color: COLORS.textPrimary,
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
  // Web header styles
  webHeaderWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  webHeaderVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.68,
  },
  webHeaderBlur: {
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
  webHeaderContent: {
    position: 'relative',
    zIndex: 2,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 24,
  },
  webHeaderContentDesktop: {
    paddingHorizontal: 40,
  },
  webNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webBackButton: {
    // @ts-ignore
    cursor: 'pointer',
  },
  webInfoSection: {
    gap: 16,
  },
  webVenueBlock: {
    gap: 12,
  },
  webVenue: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '700',
    fontSize: 28,
    color: COLORS.textPrimary,
  },
  webDetailsSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webDetailsSection: {
    gap: 4,
    flex: 1,
  },
  webDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  webDate: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '500',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  webLocation: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '500',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  webSourceText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  webDownloadsWrap: {
    flex: 1,
    minWidth: 0,
  },
  webDownloadsText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: COLORS.textPrimary,
    opacity: 0.5,
  },
  tracksContainer: {
    paddingVertical: SPACING.sm,
  },
  tracksContainerDesktop: {
    padding: 24,
    paddingTop: 24,
  },
  tracksLoading: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  nextTourStopsSection: {
    marginTop: SPACING.sm,
  },
  nextTourStopsSectionDesktop: {
    padding: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    ...(Platform.OS === 'web' ? {
      marginHorizontal: 16,
    } : {}),
  },
  nextTourStopsHeader: {
    ...TYPOGRAPHY.heading2,
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.xs,
    ...(Platform.OS === 'web' ? {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    } : {}),
  },
  showNotesSection: {
    marginTop: SPACING.sm,
  },
  showNotesSectionDesktop: {
    padding: 24,
  },
  showNotesHeader: {
    ...TYPOGRAPHY.heading2,
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.sm,
    ...(Platform.OS === 'web' ? {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    } : {}),
  },
  showNotesText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xxl,
    lineHeight: 22,
    ...(Platform.OS === 'web' ? {
      paddingHorizontal: 16,
    } : {}),
  },
  showNotesToggle: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.sm,
    ...(Platform.OS === 'web' ? {
      paddingHorizontal: 16,
      // @ts-ignore
      cursor: 'pointer',
    } : {}),
  },
  showNotesToggleText: {
    ...TYPOGRAPHY.label,
    color: COLORS.accent,
  },
  showNotesCitation: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.xxl,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
    ...(Platform.OS === 'web' ? {
      paddingHorizontal: 16,
    } : {}),
  },
});
