import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  AppState,
  AppStateStatus,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { useShows } from '../contexts/ShowsContext';
import { formatDate, formatTime, getVenueFromShow } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePerformanceRating } from '../hooks/usePerformanceRating';
import { StarRating } from './StarRating';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { GESTURE_THRESHOLDS } from '../constants/thresholds';
import { haptics } from '../services/hapticService';
import { BUNDLED_VIDEO } from '../constants/videoSources';

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { height: screenHeight } = Dimensions.get('window');

/**
 * Full-screen player tray that slides up from bottom
 */
export const FullPlayer = React.memo<FullPlayerProps>(({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const { state, play, pause, nextTrack, previousTrack, seekTo, isRadioMode, isShuffleMode, currentRadioTrack, progressRef, progressAnim } = usePlayer();
  const { isSongFavorite, addFavoriteSong, removeFavoriteSong } = useFavorites();
  const { getPlayCount } = usePlayCounts();
  const { videoSource, videoId } = useVideoBackground();
  const { getShowDetail } = useShows();
  const progressBarRef = useRef<View>(null);

  // Animation for slide up/down
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const isDismissingRef = useRef(false);
  const isInteractingRef = useRef(false);

  // Track app state to pause video when in background (saves battery)
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Fallback to bundled video if current video fails to load
  const [useVideoFallback, setUseVideoFallback] = useState(false);
  const currentVideoSource = useVideoFallback ? BUNDLED_VIDEO : videoSource;

  // Reset fallback when video changes
  useEffect(() => {
    setUseVideoFallback(false);
  }, [videoId]);

  const handleVideoError = useCallback(() => {
    console.warn('[FullPlayer] Video failed to load, falling back to bundled video');
    setUseVideoFallback(true);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  // Time display via ref to avoid re-renders on every update
  // Only force re-render when position changes by more than 1 second
  const timeDisplayRef = useRef({ position: 0, duration: 0 });
  const [, forceTimeUpdate] = useState(0);

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

  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const lastRewindTapRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const barMeasurements = useRef({ pageX: 0, width: 0 });
  const currentTrackRef = useRef(state.currentTrack);

  // Update refs when state changes
  useEffect(() => {
    currentTrackRef.current = state.currentTrack;
  }, [state.currentTrack]);

  // Prefetch show details in background so navigation is instant
  useEffect(() => {
    if (state.currentShow?.identifier) {
      // Fire and forget - preloads into cache
      getShowDetail(state.currentShow.identifier).catch(() => {
        // Ignore errors - this is just prefetching
      });
    }
  }, [state.currentShow?.identifier, getShowDetail]);

  // Update time display at regular intervals (for text only, not animation)
  // Uses ref to avoid re-renders; only forces update when position changes significantly
  useEffect(() => {
    if (!visible) return;

    // Update ref immediately
    timeDisplayRef.current = { ...progressRef.current };
    forceTimeUpdate(n => n + 1);

    // Then update every second for the time text, but only re-render if changed by >= 1 second
    const interval = setInterval(() => {
      if (!isDragging && !isInteractingRef.current) {
        const prev = timeDisplayRef.current;
        const next = progressRef.current;
        // Only force re-render if position changed by at least 1 second
        if (Math.abs(next.position - prev.position) >= 1000 || prev.duration !== next.duration) {
          timeDisplayRef.current = { ...next };
          forceTimeUpdate(n => n + 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, progressRef, isDragging]);

  // Get performance rating from shared hook
  const performanceRating = usePerformanceRating();

  const isFavorite = state.currentTrack && state.currentShow
    ? isSongFavorite(state.currentTrack.id, state.currentShow.identifier)
    : false;

  const calculatePositionFromTouch = (pageX: number, trackDurationMs: number): number => {
    if (barMeasurements.current.width === 0) return 0;
    const relativeX = pageX - barMeasurements.current.pageX;
    const percentage = Math.max(0, Math.min(1, relativeX / barMeasurements.current.width));
    return percentage * trackDurationMs;
  };

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
      const favoriteSong: FavoriteSong = {
        trackId: state.currentTrack.id,
        trackTitle: state.currentTrack.title,
        showIdentifier: state.currentShow.identifier,
        showDate: state.currentShow.date,
        venue: getVenueFromShow(state.currentShow),
        streamUrl: state.currentTrack.streamUrl,
      };
      addFavoriteSong(favoriteSong);
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

  // Helper to get current duration from ref or track metadata
  const getDurationMs = useCallback(() => {
    const refDuration = progressRef.current.duration;
    const trackDurationMs = currentTrackRef.current?.duration ? currentTrackRef.current.duration * 1000 : 0;
    return refDuration > 0 ? refDuration : trackDurationMs;
  }, [progressRef]);

  // Progress bar pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        haptics.light();
        progressBarRef.current?.measure((x, y, width, height, barPageX) => {
          barMeasurements.current = { pageX: barPageX, width };
          const durationMs = getDurationMs();
          const touchX = barPageX + evt.nativeEvent.locationX;
          const position = calculatePositionFromTouch(touchX, durationMs);
          isDraggingRef.current = true;
          setIsDragging(true);
          setDragPosition(position);
        });
      },
      onPanResponderMove: (evt) => {
        if (barMeasurements.current.width === 0) return;
        const durationMs = getDurationMs();
        const touchX = barMeasurements.current.pageX + evt.nativeEvent.locationX;
        const position = calculatePositionFromTouch(touchX, durationMs);
        setDragPosition(position);
      },
      onPanResponderRelease: (evt) => {
        if (barMeasurements.current.width === 0) return;
        const durationMs = getDurationMs();
        const touchX = barMeasurements.current.pageX + evt.nativeEvent.locationX;
        const position = calculatePositionFromTouch(touchX, durationMs);
        setDragPosition(position);
        seekTo(position);
        // Update time display ref immediately after seek
        timeDisplayRef.current = { position, duration: durationMs };
        setTimeout(() => {
          setIsDragging(false);
          isDraggingRef.current = false;
        }, 200);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 100);
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

  const trackDuration = state.currentTrack.duration ? state.currentTrack.duration * 1000 : 0;
  const timeDisplay = timeDisplayRef.current;
  const duration = timeDisplay.duration > 0 ? timeDisplay.duration : trackDuration;
  const currentPosition = isDragging ? dragPosition : timeDisplay.position;

  // Animated width for progress bar (avoids re-renders)
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // Animated thumb position (same source as fill bar to stay in sync)
  const thumbLeft = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // For drag position only
  const dragProgress = duration > 0 ? (dragPosition / duration) : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      {/* Video Background - only play when visible and app is active to save battery */}
      <View style={styles.videoContainer} {...swipeDownResponder.panHandlers}>
        <Video
          key={`video-${videoId}-${useVideoFallback ? 'fallback' : 'primary'}`}
          source={currentVideoSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={visible && appState === 'active'}
          isLooping
          isMuted
          onError={handleVideoError}
        />

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

        {/* Track Info */}
        <View style={styles.trackInfoContainer}>
          {/* Radio Mode Indicator */}
          {isRadioMode && (
            <View style={styles.radioIndicator}>
              <Ionicons name="radio" size={16} color={COLORS.textPrimary} />
              <Text style={styles.radioIndicatorText}>Radio</Text>
            </View>
          )}

          {/* Shuffle Mode Indicator */}
          {isShuffleMode && (
            <View style={styles.radioIndicator}>
              <Ionicons name="shuffle" size={16} color={COLORS.textPrimary} />
              <Text style={styles.radioIndicatorText}>
                {state.shuffleType === 'shows' ? 'Saved Shows' : 'Saved Songs'}
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

              {/* Save Song Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isFavorite && styles.saveButtonActive
                ]}
                onPress={handleToggleFavoriteSong}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                accessibilityHint={isFavorite ? 'Double tap to remove this song from your favorites' : 'Double tap to save this song to your favorites'}
                accessibilityState={{ selected: isFavorite }}
              >
                {isFavorite ? (
                  <Ionicons name="checkmark-sharp" size={18} color={COLORS.textPrimary} />
                ) : (
                  <Ionicons name="add" size={21} color={COLORS.textPrimary} />
                )}
              </TouchableOpacity>
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
              <Animated.View style={[styles.progressBarFill, { width: isDragging ? `${dragProgress * 100}%` : progressWidth }]} />
            </View>
            <Animated.View
              style={[
                styles.progressThumb,
                { left: isDragging ? `${dragProgress * 100}%` : thumbLeft },
                isDragging && styles.progressThumbActive
              ]}
              pointerEvents="none"
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
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
