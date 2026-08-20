import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useShows } from '../contexts/ShowsContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { TrackItem } from '../components/TrackItem';
import { VersionPicker } from '../components/VersionPicker';
import { StarRating } from '../components/StarRating';
import { OfficialReleaseBadge } from '../components/OfficialReleaseBadge';
import { OfficialReleaseModal } from '../components/OfficialReleaseModal';
import { ShowCard } from '../components/ShowCard';
import { ShowDetail, Track, GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AddToCollectionPicker } from '../components/collections/AddToCollectionPicker';
import { useCollections } from '../contexts/CollectionsContext';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT, GLASS_PILL, GLASS_PILL_BLUR } from '../constants/theme';
import { formatLabel } from '../constants/tags';
import {
  getVenueFromShow,
  formatDateMMDDYYYY,
  formatDateMDYY,
  formatDownloadsLabel,
  formatCount,
} from '../utils/formatters';
import { getOfficialReleasesForDate } from '../data/officialReleases';
import { getCatalogVersions, withCurrentRecording } from '../services/recordingCatalog';
import { normalizeTrackTitle } from '../utils/titleNormalization';
import { matchTrackBySlug } from '../utils/trackMatching';
import { SIMILARITY_THRESHOLDS } from '../constants/thresholds';
import { getShowNotes } from '../utils/showNotes';
import { SHOW_NOTES_CITATION } from '../data/showNotes';
import { toFavoriteSong } from '../utils/favoriteSong';
import { showDetailParams } from '../utils/showDetailParams';
import { haptics } from '../services/hapticService';
import { getAllShowsSorted, findShowIndexByDate, resolveIdentifierFromDate } from '../utils/showLookup';
import { getClassicTier } from '../data/classicShowsTiers';
import { useShareSheet } from '../contexts/ShareSheetContext';
import type { ShareItem } from '../services/shareService';
import { resolveVideoUri } from '../utils/resolveVideoUri';
import { WebVideoBackground } from '../components/shared/WebVideoBackground';
import { GlassHeader } from '../components/web/GlassHeader';
import { ErrorState } from '../components/StateViews';
import { webStyle } from '../utils/webStyle';
import { useResolvedShowRating, usePerformanceRatingsVersion } from '../contexts/UserRatingsContext';
import { resolvePerformanceRating, ResolvedRating } from '../services/ratingResolver';
import { useRatingOverlay } from '../contexts/RatingOverlayContext';

// Default profile image for logged out users (web header)

type ShowDetailRouteProp = RouteProp<RootStackParamList, 'ShowDetail'>;
type ShowDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ShowDetail'>;

export function ShowDetailScreen() {
  const route = useRoute<ShowDetailRouteProp>();
  const navigation = useNavigation<ShowDetailNavigationProp>();
  const { getShowDetail, showsByYear } = useShows();
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

  // Displayed show rating: resolved so user overrides win over the system
  // tier and the header re-renders when the user rates/unrates the show.
  const showDate = previewDate ?? show?.date;
  const resolvedShowRating = useResolvedShowRating(showDate);
  const { openRatingOverlay } = useRatingOverlay();

  const hasSelectedFromUrl = useRef(false);

  // Request-generation token for loadShowDetail. Both the route-param effect
  // and handleVersionChange call loadShowDetail, and neither cancels the
  // other's in-flight request. Without this, a slow response for a version
  // the user has since navigated away from can land after a newer request
  // and overwrite its (more current) state. Every call captures the token at
  // increment time; only the call whose token still matches the ref when its
  // response arrives may apply setShow/setSelectedVersion/setLoading(false).
  const loadRequestTokenRef = useRef(0);

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

  // Pre-compute resolved track ratings (user override > system) for the show
  const ratingsVersion = usePerformanceRatingsVersion();
  const trackRatings = useMemo(() => {
    if (!show) return {};
    const ratings: Record<string, ResolvedRating | null> = {};
    show.tracks.forEach(track => {
      ratings[track.id] = resolvePerformanceRating(track.title, show.date);
    });
    return ratings;
  }, [show?.identifier, show?.date, ratingsVersion]);

  // Look up show notes from Taper's Compendium
  const showNotesText = useMemo(() => {
    if (!show?.date) return null;
    return getShowNotes(show.date);
  }, [show?.date]);

  // Find the next 3 shows after the current show's date — O(log n) via the
  // shared sorted catalog + binary search (src/utils/showLookup.ts) instead
  // of flattening and sorting the ~2,300-show catalog on every visit.
  //
  // The shared catalog (built from raw shows.json) doesn't carry the
  // classicTier enrichment that ShowsContext's `showsByYear` adds, so each
  // result is enriched here the same way ShowsContext does — otherwise a
  // classic show appearing in "Next Tour Stops" would silently lose its
  // star rating (both in this list and in the preview passed to the next
  // ShowDetailScreen via handleNextShowPress).
  const nextTourStops = useMemo(() => {
    if (!show) return [];

    const sorted = getAllShowsSorted();
    const startIndex = findShowIndexByDate(show.date);
    const stops: GratefulDeadShow[] = [];
    for (let i = startIndex; i < sorted.length && stops.length < 3; i++) {
      const candidate = sorted[i];
      const tier = getClassicTier(candidate.date);
      stops.push(tier ? { ...candidate, classicTier: tier } : candidate);
    }
    return stops;
  }, [show?.date]);

  // Resolve identifier: if it's a date (YYYY-MM-DD), look up the primaryIdentifier
  const resolveIdentifier = useCallback((id: string): string => {
    return resolveIdentifierFromDate(id);
  }, []);

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

  const loadShowDetail = async (identifier: string) => {
    // Claim a new generation token for this call. Any earlier in-flight call
    // whose response arrives after this point will see a mismatch below and
    // no-op instead of clobbering state with stale data.
    const requestToken = ++loadRequestTokenRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getShowDetail(identifier);

      // A newer loadShowDetail call started (and thus advanced the token)
      // while this one was in flight — this response is stale, discard it.
      if (loadRequestTokenRef.current !== requestToken) return;

      // Recordings come from the bundled catalog (all of them, with parsed
      // tags) — no second network request. withCurrentRecording guarantees
      // the recording actually loaded (identifier) is included even when
      // it's not in the catalog (brand-new Archive upload, or an old share
      // pointing at an item since delisted) — otherwise the picker had
      // nothing to mark as current.
      const versions = withCurrentRecording(getCatalogVersions(previewDate ?? detail.date ?? ''), identifier);
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
        ? `${formatDateMDYY(detail.date)} - ${getVenueFromShow(detail)}`
        : '';
      navigation.setOptions({
        title: Platform.OS === 'web' ? webTitle : '',
        headerLeftContainerStyle: {
          paddingLeft: 10,
        },
      });
    } catch (err) {
      if (loadRequestTokenRef.current !== requestToken) return;
      setError(err instanceof Error ? err.message : 'Failed to load show');
    } finally {
      if (loadRequestTokenRef.current === requestToken) setIsLoading(false);
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
      addFavoriteSong(toFavoriteSong(track, show));
    }
  }, [show, isSongFavorite, removeFavoriteSong, addFavoriteSong]);

  const handleTrackLongPress = useCallback(
    (track: Track) => {
      if (Platform.OS === 'web') return;
      if (!show) return;
      const saved = isSongFavorite(track.id, show.identifier);
      Alert.alert(track.title, undefined, [
        { text: 'Add to Playlist', onPress: () => setPickerTrack(track) },
        {
          text: saved ? 'Remove from Favorites' : 'Add to Favorites',
          onPress: () => handleToggleSaveSong(track),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [show, isSongFavorite, handleToggleSaveSong],
  );

  const handleNextShowPress = useCallback((nextShow: GratefulDeadShow) => {
    navigation.push('ShowDetail', showDetailParams(nextShow));
  }, [navigation]);

  const handleShareShow = useCallback(() => {
    if (!show) return;

    // resolvedShowRating is the user-override-aware rating (STAR scale) for
    // this show's date, kept in sync via useUserRatingsVersion. ShareItem's
    // tier field is legacy TIER scale, so invert back (tier = 4 - stars); a
    // 0-star override has no tier analog, so share no stars in that case.
    const item: ShareItem = {
      kind: 'show',
      showId: show.identifier,
      date: show.date,
      venue: getVenueFromShow(show),
      tier: resolvedShowRating && resolvedShowRating.stars > 0
        ? ((4 - resolvedShowRating.stars) as 1 | 2 | 3)
        : null,
      isUserRating: resolvedShowRating?.isUserRating ?? false,
    };

    haptics.light();
    openShareTray(item);
  }, [show, resolvedShowRating, openShareTray]);

  // Register a headerRight share icon. Runs in a separate useEffect from the
  // initial title-setting call in loadShowDetail so the callback stays fresh
  // when `show` or `resolvedShowRating` change (e.g. when the user navigates
  // between versions or previews, or updates their rating).
  const [addToCollectionVisible, setAddToCollectionVisible] = useState(false);
  const [pickerTrack, setPickerTrack] = useState<Track | null>(null);
  const { itemCountsByIdentifier } = useCollections();

  const handleAddToPlaylist = useCallback((track: Track) => {
    setPickerTrack(track);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShareShow}
          // paddingRight matches headerContainer's SPACING.xl so the share icon
          // aligns vertically with the heart icon in the info row below.
          style={{ paddingLeft: 16, paddingRight: 26, paddingVertical: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Share show"
        >
          <Ionicons name="share-outline" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
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
        // Only the primary (currently loaded) recording's data is ever read
        // back out of a favorite — the catalog is looked up fresh by date
        // for format/lineage — so persisting every version here just bloats
        // the favorite with ~10 KB of data that's never used.
        versions: (show.allVersions ?? []).filter(v => v.identifier === show.identifier),
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

  if (isLoading && !previewVenue) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (error || (!show && !isLoading)) {
    return <ErrorState message={error || 'Show not found'} />;
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
        title: '',
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
        <GlassHeader
          background={videoUri ? (
            <WebVideoBackground uri={videoUri} videoId={videoId} onError={resetToFallback} />
          ) : undefined}
          onBackPress={() => navigation.goBack()}
          isDesktop={isDesktop}
        >
            {/* Show info section */}
            <View style={styles.webInfoSection}>
              {/* Venue + Details */}
              <View style={styles.webVenueBlock}>
                <Text style={styles.webVenue} numberOfLines={2}>{getVenueFromShow(displayShow)}</Text>

                {/* Details section with play count on mobile + action buttons */}
                <View style={styles.webDetailsSectionRow}>
                  <View style={styles.webDetailsSection}>
                    {/* Date with stars */}
                    <View style={styles.webDateRow}>
                      <Text style={styles.webDate}>{formatDateMMDDYYYY(displayShow.date)}</Text>
                      <TouchableOpacity
                        onPress={() => openRatingOverlay({
                          kind: 'show',
                          date: displayShow.date,
                          venue: getVenueFromShow(displayShow),
                          location: displayShow.location,
                        })}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Rate this show"
                      >
                        <StarRating rating={resolvedShowRating} showPlaceholder size={20} />
                      </TouchableOpacity>
                    </View>

                    {/* Location */}
                    <Text style={styles.webLocation}>
                      {displayShow.location || 'Unknown location'}
                    </Text>
                  </View>

                  <View style={styles.webDetailsActions}>
                    {/* Play count badge - mobile web only */}
                    {!isDesktop && playCount > 0 && (
                      <View style={styles.playCountPillWeb}>
                        <Text style={styles.playCountPillText}>
                          {formatCount(playCount, 'play')}
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
                    </TouchableOpacity>
                    {(() => {
                      const collectionCount = show ? (itemCountsByIdentifier[show.identifier] ?? 0) : 0;
                      return (
                        <TouchableOpacity
                          style={styles.savePillWeb}
                          onPress={() => setAddToCollectionVisible(true)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={
                            collectionCount > 0
                              ? `Added to ${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'}`
                              : 'Add to collection'
                          }
                        >
                          <Ionicons
                            name={collectionCount > 0 ? 'folder' : 'folder-open-outline'}
                            size={17}
                            color={COLORS.textPrimary}
                          />
                          {collectionCount > 0 && (
                            <Text style={styles.savePillText}>{collectionCount}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })()}
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
                    </TouchableOpacity>
                  </View>
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
                      {formatLabel(displayShow.allVersions?.[0]?.format)}
                    </Text>
                    <View style={styles.webDownloadsWrap}>
                      <Text style={styles.webDownloadsText} numberOfLines={1}>
                        {formatDownloadsLabel(displayShow.allVersions?.[0]?.downloads)}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Play count pill - desktop only */}
              {isDesktop && playCount > 0 && (
                <View style={[styles.playCountPillWeb, styles.pillsRightSlot]}>
                  <Text style={styles.playCountPillText}>
                    {formatCount(playCount, 'play')}
                  </Text>
                </View>
              )}
            </View>
            </View>
        </GlassHeader>
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
                <TouchableOpacity
                  onPress={() => openRatingOverlay({
                    kind: 'show',
                    date: displayShow.date,
                    venue: getVenueFromShow(displayShow),
                    location: displayShow.location,
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Rate this show"
                >
                  <StarRating rating={resolvedShowRating} showPlaceholder size={16} />
                </TouchableOpacity>
              </View>

              {/* Location */}
              <Text style={styles.sourceName}>
                {displayShow.location || 'Unknown location'}
              </Text>
            </View>

            {/* Action icons: Add to Collection (+) / Save (heart) */}
            <View style={styles.showActionsGroup}>
              <TouchableOpacity
                style={styles.showActionBtn}
                onPress={() => setAddToCollectionVisible(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add to collection"
              >
                <Ionicons name="add" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.showActionBtn}
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove show from favorites' : 'Save show to favorites'}
                accessibilityState={{ selected: isSaved }}
              >
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isSaved ? COLORS.accent : COLORS.textPrimary}
                />
              </TouchableOpacity>
            </View>
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
                    {formatCount(playCount, 'play')}
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
                {formatLabel(displayShow.allVersions?.[0]?.format)}
              </Text>
              <Text style={styles.downloadsText}>
                {formatDownloadsLabel(displayShow.allVersions?.[0]?.downloads)}
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
            onRatingPress={(t) => openRatingOverlay({
              kind: 'performance',
              songTitle: t.title,
              date: show.date,
              venue: getVenueFromShow(displayShow),
              showIdentifier: show.identifier,
            })}
            isSaved={isSongFavorite(track.id, show.identifier)}
            onToggleSave={handleToggleSaveSong}
            onAddToPlaylist={handleAddToPlaylist}
            onLongPress={handleTrackLongPress}
            playlistCount={itemCountsByIdentifier[`${show.identifier}::${track.id}`] ?? 0}
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
      {show && addToCollectionVisible && (
        <AddToCollectionPicker
          visible
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

      {show && pickerTrack && (
        <AddToCollectionPicker
          visible
          onClose={() => setPickerTrack(null)}
          type="playlist"
          itemIdentifier={`${show.identifier}::${pickerTrack.id}`}
          itemMetadata={toFavoriteSong(pickerTrack, show)}
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
    // Matches OfficialReleaseBadge's (non-compact) vertical metrics so the
    // two pills in badgesRow render at the same height, borderless.
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
  },
  playCountText: {
    ...TYPOGRAPHY.captionSmall,
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  playCountPillWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...GLASS_PILL,
    paddingHorizontal: SPACING.lg,
    height: 35,
    ...(Platform.OS === 'web' && webStyle(GLASS_PILL_BLUR)),
  },
  playCountPillText: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  showActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  showActionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pillsRightSlot: {
    marginLeft: 'auto',
    flexShrink: 0,
  },
  webDetailsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
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
    ...GLASS_PILL,
    paddingHorizontal: SPACING.lg,
    height: 35,
    gap: 6,
    ...(Platform.OS === 'web' && webStyle(GLASS_PILL_BLUR)),
  },
  savePillWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...GLASS_PILL,
    paddingHorizontal: SPACING.lg,
    height: 35,
    gap: 6,
    ...(Platform.OS === 'web' && webStyle(GLASS_PILL_BLUR)),
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
  // Web header shell (wrapper/background/blur/nav row) now lives in <GlassHeader>.
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
