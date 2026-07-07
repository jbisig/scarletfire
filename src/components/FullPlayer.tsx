import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  Easing,
  InteractionManager,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { formatDate, formatTime, getVenueFromShow } from '../utils/formatters';
import { toFavoriteSong } from '../utils/favoriteSong';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePerformanceRating } from '../hooks/usePerformanceRating';
import { useAppActiveState } from '../hooks/useAppActiveState';
import { useVideoRemount } from '../hooks/useVideoRemount';
import { usePlayerProgress } from '../hooks/usePlayerProgress';
import { StarRating } from './StarRating';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { GESTURE_THRESHOLDS } from '../constants/thresholds';
import { haptics } from '../services/hapticService';
import { logger } from '../utils/logger';
import { nativeAudioPlayer, Event, CastState } from '../services/nativeAudioPlayer';
import { useShareSheet } from '../contexts/ShareSheetContext';
import { slugifyTrackTitle, type ShareItem } from '../services/shareService';
import { AddToCollectionPicker } from './collections/AddToCollectionPicker';
import { resolveVideoUri } from '../utils/resolveVideoUri';
import { WebVideoBackground } from './shared/WebVideoBackground';

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { height: initialScreenHeight } = Dimensions.get('window');

/**
 * Full-screen player tray that slides up from bottom
 */
export const FullPlayer = React.memo<FullPlayerProps>(({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const { state, play, pause, nextTrack, previousTrack, seekTo, isRadioMode, isShuffleMode, currentRadioTrack, progressRef, progressAnim } = usePlayer();
  const { isSongFavorite, addFavoriteSong, removeFavoriteSong } = useFavorites();
  const { getPlayCount } = usePlayCounts();
  const { videoSource, videoId, resetToFallback } = useVideoBackground();
  const { openShareTray } = useShareSheet();
  const webVideoUri = useMemo(() => Platform.OS === 'web' ? resolveVideoUri(videoSource) : '', [videoSource]);
  const progressBarRef = useRef<View>(null);
  const { height: screenHeight } = useWindowDimensions();

  // Animation for slide up/down
  const slideAnim = useRef(new Animated.Value(initialScreenHeight)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const isDismissingRef = useRef(false);
  const isInteractingRef = useRef(false);

  // Track app state to pause video when in background (saves battery) — native only
  const appState = useAppActiveState();

  // Cast state for Android
  const [castState, setCastState] = useState<CastState>('NO_DEVICES');

  // Force video remount when source changes by briefly unmounting
  const videoMounted = useVideoRemount(videoId);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);

  const handleVideoError = useCallback(() => {
    logger.video.warn('FullPlayer video failed to load, falling back to bundled video');
    resetToFallback();
  }, [resetToFallback]);

  // Cast state listener (Android only)
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Get initial cast state
    nativeAudioPlayer.getCastState().then(setCastState);

    // Listen for cast state changes
    const castSub = nativeAudioPlayer.addEventListener(Event.CastStateChanged, (data) => {
      setCastState(data.state);
    });

    return () => castSub.remove();
  }, []);

  const handleCastPress = useCallback(() => {
    haptics.medium();
    nativeAudioPlayer.showCastDialog();
  }, []);

  // Combined position = slide position + drag offset
  const translateY = Animated.add(slideAnim, dragOffset);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      isDismissingRef.current = false;
      setShouldRender(true);
      dragOffset.setValue(0);
      slideAnim.setValue(screenHeight);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else if (shouldRender && !isDismissingRef.current) {
      // Only animate if not already dismissed via gesture
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    } else if (!visible) {
      setShouldRender(false);
    }
  }, [visible]);

  const lastRewindTapRef = useRef<number>(0);
  // Bar measurement recorded on gesture grant (native `measure()` is async,
  // so move/release — separate PanResponder callbacks — need it stashed
  // somewhere; this stays here rather than in the hook since it's part of
  // the native-specific gesture wiring, not the shared progress math).
  const barMeasurements = useRef({ pageX: 0, width: 0 });

  const trackDurationMs = state.currentTrack?.duration ? state.currentTrack.duration * 1000 : 0;

  const {
    displayPosition,
    displayDuration,
    isDragging,
    progressWidth,
    thumbLeft,
    beginDrag,
    moveDrag,
    endDrag,
    cancelDrag,
  } = usePlayerProgress({
    progressRef,
    progressAnim,
    seekTo,
    trackDurationMs,
    enabled: visible,
    isPaused: useCallback(() => isInteractingRef.current, []),
    resyncOnDragToggle: true,
  });

  // Get performance rating from shared hook
  const performanceRating = usePerformanceRating();

  const isFavorite = state.currentTrack && state.currentShow
    ? isSongFavorite(state.currentTrack.id, state.currentShow.identifier)
    : false;

  const handleShare = useCallback(() => {
    const track = state.currentTrack;
    const show = state.currentShow;
    if (!track || !show) return;

    const item: ShareItem = {
      kind: 'song',
      showId: show.identifier,
      trackId: track.id,
      trackTitle: track.title,
      trackSlug: slugifyTrackTitle(track.title),
      date: show.date,
      venue: getVenueFromShow(show),
      rating: performanceRating,
    };

    haptics.light();
    openShareTray(item);
  }, [state.currentTrack, state.currentShow, performanceRating, openShareTray]);

  const handleRewind = (): void => {
    const now = Date.now();
    const timeSinceLastTap = now - lastRewindTapRef.current;
    if (timeSinceLastTap < 300) {
      // Double-tap: go to previous track (works in both show and radio mode)
      previousTrack();
      lastRewindTapRef.current = 0;
    } else {
      // Single tap: restart current track
      seekTo(0);
      lastRewindTapRef.current = now;
    }
  };

  const handleToggleFavoriteSong = (): void => {
    if (!state.currentTrack || !state.currentShow) return;
    haptics.medium();
    const trackId = state.currentTrack.id;
    const showIdentifier = state.currentShow.identifier;
    if (isSongFavorite(trackId, showIdentifier)) {
      removeFavoriteSong(trackId, showIdentifier);
    } else {
      addFavoriteSong(toFavoriteSong(state.currentTrack, state.currentShow));
    }
  };

  const handleNavigateToShow = (): void => {
    // Don't navigate if user is dragging or dismissing
    if (isInteractingRef.current || isDismissingRef.current) return;
    if (!state.currentShow) return;
    onClose();
    // Navigate to ShowDetail within ShowsTab stack so MiniPlayer remains visible
    // (MiniPlayer is rendered inside MainTabs, so navigating within a tab stack keeps it visible)
    // Navigate through the full hierarchy: MainTabs > ShowsTab > ShowDetail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation.navigate as any)('MainTabs', {
      screen: 'ShowsTab',
      params: {
        screen: 'ShowDetail',
        params: { identifier: state.currentShow.identifier },
      },
    });
  };

  // Progress bar pan responder — gesture wiring only; position math, drag
  // state, and duration fallback live in usePlayerProgress.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        haptics.light();
        progressBarRef.current?.measure((x, y, width, height, barPageX) => {
          barMeasurements.current = { pageX: barPageX, width };
          const touchX = barPageX + evt.nativeEvent.locationX;
          beginDrag(touchX, barPageX, width);
        });
      },
      onPanResponderMove: (evt) => {
        const { pageX: barPageX, width } = barMeasurements.current;
        const touchX = barPageX + evt.nativeEvent.locationX;
        moveDrag(touchX, barPageX, width);
      },
      onPanResponderRelease: (evt) => {
        const { pageX: barPageX, width } = barMeasurements.current;
        const touchX = barPageX + evt.nativeEvent.locationX;
        endDrag(touchX, barPageX, width);
      },
      onPanResponderTerminate: () => {
        cancelDrag();
      },
    })
  ).current;

  // Swipe down to dismiss - tracks drag position
  const swipeDownResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture if dragging down
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        // Mark as interacting to pause progress updates
        isInteractingRef.current = true;
        // Reset drag offset
        dragOffset.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          dragOffset.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const shouldDismiss =
          gestureState.dy > GESTURE_THRESHOLDS.DISMISS_DISTANCE ||
          gestureState.vy > GESTURE_THRESHOLDS.DISMISS_VELOCITY;

        if (shouldDismiss) {
          // Mark as dismissing to prevent duplicate animation
          isDismissingRef.current = true;
          // Reset interaction state immediately on dismiss
          isInteractingRef.current = false;
          // Calculate remaining distance and use velocity for natural feel
          const remainingDistance = screenHeight - gestureState.dy;
          const velocity = Math.max(gestureState.vy, 0.4); // Minimum velocity
          const duration = Math.min(400, Math.max(200, remainingDistance / velocity / 1.5));

          // Slide off screen with easing
          Animated.timing(dragOffset, {
            toValue: screenHeight,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            setShouldRender(false);
            onClose();
            // Reset after unmount
            setTimeout(() => {
              dragOffset.setValue(0);
              slideAnim.setValue(screenHeight);
            }, 0);
          });
        } else {
          // Snap back with a snappy spring
          Animated.spring(dragOffset, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start(() => {
            isInteractingRef.current = false;
          });
        }
      },
      onPanResponderTerminate: () => {
        // Reset interaction state immediately when gesture is interrupted
        isInteractingRef.current = false;
        // Snap back if gesture is interrupted
        Animated.spring(dragOffset, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  if (!shouldRender || !state.currentTrack) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      {/* Video Background - only play when visible and app is active to save battery */}
      <View style={styles.videoContainer} {...swipeDownResponder.panHandlers}>
        {Platform.OS === 'web' ? (
          webVideoUri ? (
            <WebVideoBackground uri={webVideoUri} videoId={videoId} onError={resetToFallback} />
          ) : null
        ) : (
          videoMounted && (() => {
            const { Video: ExpoVideo, ResizeMode: ExpoResizeMode } = require('expo-av');
            return (
              <ExpoVideo
                key={`video-${videoId}`}
                source={videoSource}
                style={styles.video}
                resizeMode={ExpoResizeMode.COVER}
                shouldPlay={visible && appState === 'active'}
                isLooping
                isMuted
                onError={handleVideoError}
              />
            );
          })()
        )}

        {/* Gradient overlay for text readability */}
        <LinearGradient
          colors={['rgba(18, 18, 18, 0)', COLORS.background]}
          locations={[0, 1]}
          style={styles.gradientOverlay}
        />

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close player"
          accessibilityHint="Double tap to minimize the player"
        >
          <Ionicons name="chevron-down" size={32} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Share button */}
        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareButton}
          accessibilityRole="button"
          accessibilityLabel="Share song"
          accessibilityHint="Double tap to open the share tray"
        >
          <Ionicons name="share-outline" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Cast button - Android only */}
        {Platform.OS === 'android' && castState !== 'NO_DEVICES' && (
          <TouchableOpacity
            onPress={handleCastPress}
            style={styles.castButton}
            accessibilityRole="button"
            accessibilityLabel={castState === 'CONNECTED' ? 'Disconnect from Chromecast' : 'Cast to Chromecast'}
            accessibilityHint="Double tap to open cast device selection"
          >
            <MaterialIcons
              name={castState === 'CONNECTED' ? 'cast-connected' : 'cast'}
              size={24}
              color={castState === 'CONNECTED' ? COLORS.accent : COLORS.textPrimary}
            />
          </TouchableOpacity>
        )}

        {/* Track Info */}
        <View style={styles.trackInfoContainer}>
          {/* Radio Mode Indicator */}
          {isRadioMode && (
            <View style={styles.radioIndicator}>
              <Ionicons name="radio" size={16} color={COLORS.textPrimary} />
              <Text style={styles.radioIndicatorText}>Radio</Text>
            </View>
          )}

          {/* Shuffle / Playlist Mode Indicator */}
          {isShuffleMode && (
            <View style={styles.radioIndicator}>
              <Ionicons
                name={state.shuffleType === 'playlist' ? 'musical-notes' : 'shuffle'}
                size={16}
                color={COLORS.textPrimary}
              />
              <Text style={styles.radioIndicatorText}>
                {state.shuffleType === 'playlist' || state.shuffleType === 'playlistShuffle'
                  ? 'Playlist'
                  : state.shuffleType === 'shows'
                    ? 'Saved Shows'
                    : 'Saved Songs'}
              </Text>
            </View>
          )}

          <Text style={styles.trackTitle} numberOfLines={2}>
            {state.currentTrack.title}
          </Text>

          {state.currentShow && (
            <View style={styles.showInfoRow}>
              <TouchableOpacity
                onPress={handleNavigateToShow}
                activeOpacity={0.7}
                style={styles.showLinkContainer}
                accessibilityRole="link"
                accessibilityLabel={`View show: ${getVenueFromShow(state.currentShow)}, ${formatDate(state.currentShow.date)}`}
                accessibilityHint="Double tap to view the full show"
              >
                <Text style={styles.showInfo} numberOfLines={1}>
                  {getVenueFromShow(state.currentShow)}
                </Text>
                <View style={styles.dateWithStars}>
                  <Text style={styles.showDate}>
                    {formatDate(state.currentShow.date)}
                  </Text>
                  {performanceRating && (
                    <StarRating tier={performanceRating} size={16} />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.trackActionsGroup}>
                {/* Add to Playlist */}
                <TouchableOpacity
                  style={styles.trackActionBtn}
                  onPress={() => setAddToPlaylistVisible(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Add to playlist"
                >
                  <Ionicons name="add" size={26} color={COLORS.textPrimary} />
                </TouchableOpacity>

                {/* Save Song (Heart) */}
                <TouchableOpacity
                  style={styles.trackActionBtn}
                  onPress={handleToggleFavoriteSong}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  accessibilityState={{ selected: isFavorite }}
                >
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={26}
                    color={isFavorite ? COLORS.accent : COLORS.textPrimary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Controls Section */}
      <View style={styles.controlsSection}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={styles.progressBarWrapper}
            ref={progressBarRef}
            collapsable={false}
            {...panResponder.panHandlers}
          >
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
            <Animated.View
              style={[
                styles.progressThumb,
                { left: thumbLeft },
                isDragging && styles.progressThumbActive
              ]}
              pointerEvents="none"
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
            <Text style={styles.timeText}>{formatTime(displayDuration)}</Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={() => { haptics.medium(); handleRewind(); }} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={36} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { haptics.heavy(); state.isPlaying ? pause() : play(); }}
            style={styles.playButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name={state.isPlaying ? 'pause' : 'play'}
              size={32}
              color={COLORS.background}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { haptics.medium(); nextTrack(); }}
            style={styles.controlButton}
            disabled={!isRadioMode && (!state.playlist || state.playlist.length === 0)}
          >
            <Ionicons
              name="play-skip-forward"
              size={36}
              color={(isRadioMode || (state.playlist && state.playlist.length > 0)) ? COLORS.textPrimary : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {state.currentTrack && state.currentShow && (
        <AddToCollectionPicker
          visible={addToPlaylistVisible}
          onClose={() => setAddToPlaylistVisible(false)}
          type="playlist"
          itemIdentifier={`${state.currentShow.identifier}::${state.currentTrack.id}`}
          itemMetadata={toFavoriteSong(state.currentTrack, state.currentShow)}
        />
      )}
    </Animated.View>
  );
});

FullPlayer.displayName = 'FullPlayer';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    overflow: 'hidden',
    zIndex: 1000,
    // @ts-ignore - web only: prevent browser pull-to-refresh from conflicting with swipe-to-dismiss
    ...(Platform.OS === 'web' ? { touchAction: 'none' } : {}),
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: SPACING.lg,
    padding: SPACING.sm,
    zIndex: 10,
  },
  castButton: {
    position: 'absolute',
    top: 60,
    // Shifted left by ~44px so it sits beside the share button without overlapping.
    // Share button is the rightmost element; cast sits inboard of it when present.
    right: SPACING.lg + 44,
    padding: SPACING.sm,
    zIndex: 10,
  },
  shareButton: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    padding: SPACING.sm,
    zIndex: 10,
  },
  trackInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xxl,
  },
  radioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm - 2,
  },
  radioIndicatorText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
  },
  trackTitle: {
    ...TYPOGRAPHY.heading1,
    marginBottom: SPACING.sm,
  },
  showInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showLinkContainer: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  showInfo: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.accent,
    marginBottom: SPACING.xs,
  },
  showDate: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
  dateWithStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackActionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsSection: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: 60,
  },
  progressContainer: {
    marginBottom: SPACING.xxl,
  },
  progressBarWrapper: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: COLORS.progressBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.textPrimary,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.sm,
    marginLeft: -6,
  },
  progressThumbActive: {
    width: 16,
    height: 16,
    borderRadius: RADIUS.sm,
    marginLeft: -8,
    transform: [{ scale: 1.1 }],
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  timeText: {
    ...TYPOGRAPHY.caption,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  controlButton: {
    padding: SPACING.md,
  },
  playButton: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
