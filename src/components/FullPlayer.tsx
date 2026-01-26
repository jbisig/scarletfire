import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
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
import { GRATEFUL_DEAD_SONGS } from '../constants/songs.generated';
import { StarRating } from './StarRating';
import { COLORS, FONTS } from '../constants/theme';

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { height: screenHeight } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100; // Distance to drag before it dismisses on release
const VELOCITY_THRESHOLD = 0.5; // Velocity that triggers dismiss

/**
 * Full-screen player tray that slides up from bottom
 */
export const FullPlayer = React.memo<FullPlayerProps>(({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const { state, play, pause, nextTrack, previousTrack, seekTo, isRadioMode, currentRadioTrack } = usePlayer();
  const { isSongFavorite, addFavoriteSong, removeFavoriteSong } = useFavorites();
  const { getPlayCount } = usePlayCounts();
  const { videoSource, videoIndex } = useVideoBackground();
  const { getShowDetail } = useShows();
  const progressBarRef = useRef<View>(null);

  // Animation for slide up/down
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const isDismissingRef = useRef(false);
  const isInteractingRef = useRef(false);

  // Animated progress value to avoid re-renders during playback
  const progressAnim = useRef(new Animated.Value(0)).current;

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
  const currentDurationRef = useRef(state.duration);

  // Update refs when state changes
  useEffect(() => {
    currentTrackRef.current = state.currentTrack;
    currentDurationRef.current = state.duration;
  }, [state.currentTrack, state.duration]);

  // Prefetch show details in background so navigation is instant
  useEffect(() => {
    if (state.currentShow?.identifier) {
      // Fire and forget - preloads into cache
      getShowDetail(state.currentShow.identifier).catch(() => {
        // Ignore errors - this is just prefetching
      });
    }
  }, [state.currentShow?.identifier, getShowDetail]);

  // Reset progress immediately when track changes
  useEffect(() => {
    progressAnim.setValue(0);
  }, [state.currentTrack?.id, progressAnim]);

  // Update animated progress value without causing re-renders
  // This runs on position change but only updates the Animated.Value
  useEffect(() => {
    if (isDragging || isInteractingRef.current) return; // Don't update during user interaction

    const trackDuration = state.currentTrack?.duration ? state.currentTrack.duration * 1000 : 0;
    const duration = state.duration > 0 ? state.duration : trackDuration;
    const progress = duration > 0 ? (state.position / duration) : 0;

    // Use setValue for immediate update without animation
    progressAnim.setValue(progress);
  }, [state.position, state.duration, state.currentTrack?.duration, isDragging, progressAnim]);

  // Memoize performance rating lookup
  const performanceRating = useMemo(() => {
    // For radio mode, use the rating from the current radio track
    if (isRadioMode && currentRadioTrack) {
      return currentRadioTrack.performance.tier;
    }

    if (!state.currentTrack || !state.currentShow) return null;
    const song = GRATEFUL_DEAD_SONGS.find(s =>
      s.title.toLowerCase() === state.currentTrack!.title.toLowerCase()
    );
    if (!song) return null;
    const performance = song.performances.find(p => p.date === state.currentShow!.date);
    return performance?.rating || null;
  }, [state.currentTrack?.id, state.currentShow?.date, isRadioMode, currentRadioTrack]);

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
    if (!state.currentShow) return;
    onClose();
    // Navigate to ShowDetail within ShowsTab stack so MiniPlayer remains visible
    // (MiniPlayer is rendered inside MainTabs, so navigating within a tab stack keeps it visible)
    // Navigate through the full hierarchy: MainTabs > ShowsTab > ShowDetail
    navigation.navigate('MainTabs', {
      screen: 'ShowsTab',
      params: {
        screen: 'ShowDetail',
        params: { identifier: state.currentShow.identifier },
      },
    });
  };

  // Progress bar pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        progressBarRef.current?.measure((x, y, width, height, barPageX) => {
          barMeasurements.current = { pageX: barPageX, width };
          const trackDurationMs = currentTrackRef.current?.duration ? currentTrackRef.current.duration * 1000 : 0;
          const durationMs = currentDurationRef.current > 0 ? currentDurationRef.current : trackDurationMs;
          const touchX = barPageX + evt.nativeEvent.locationX;
          const position = calculatePositionFromTouch(touchX, durationMs);
          isDraggingRef.current = true;
          setIsDragging(true);
          setDragPosition(position);
        });
      },
      onPanResponderMove: (evt) => {
        if (barMeasurements.current.width === 0) return;
        const trackDurationMs = currentTrackRef.current?.duration ? currentTrackRef.current.duration * 1000 : 0;
        const durationMs = currentDurationRef.current > 0 ? currentDurationRef.current : trackDurationMs;
        const touchX = barMeasurements.current.pageX + evt.nativeEvent.locationX;
        const position = calculatePositionFromTouch(touchX, durationMs);
        setDragPosition(position);
      },
      onPanResponderRelease: (evt) => {
        if (barMeasurements.current.width === 0) return;
        const trackDurationMs = currentTrackRef.current?.duration ? currentTrackRef.current.duration * 1000 : 0;
        const durationMs = currentDurationRef.current > 0 ? currentDurationRef.current : trackDurationMs;
        const touchX = barMeasurements.current.pageX + evt.nativeEvent.locationX;
        const position = calculatePositionFromTouch(touchX, durationMs);
        setDragPosition(position);
        seekTo(position);
        // Update progress animation to the seek position
        const seekProgress = durationMs > 0 ? position / durationMs : 0;
        progressAnim.setValue(seekProgress);
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
          gestureState.dy > DISMISS_THRESHOLD ||
          gestureState.vy > VELOCITY_THRESHOLD;

        if (shouldDismiss) {
          // Mark as dismissing to prevent duplicate animation
          isDismissingRef.current = true;
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
        // Snap back if gesture is interrupted
        Animated.spring(dragOffset, {
          toValue: 0,
          useNativeDriver: true,
        }).start(() => {
          isInteractingRef.current = false;
        });
      },
    })
  ).current;

  if (!shouldRender || !state.currentTrack) return null;

  const trackDuration = state.currentTrack.duration ? state.currentTrack.duration * 1000 : 0;
  const duration = state.duration > 0 ? state.duration : trackDuration;
  const currentPosition = isDragging ? dragPosition : state.position;
  // Only used for time display, not for progress bar animation
  const displayProgress = duration > 0 ? (currentPosition / duration) : 0;

  // Animated width for progress bar (avoids re-renders)
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // For thumb position during drag, we still use the drag position
  const thumbProgress = isDragging ? (duration > 0 ? (dragPosition / duration) : 0) : displayProgress;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      {/* Video Background */}
      <View style={styles.videoContainer} {...swipeDownResponder.panHandlers}>
        <Video
          key={`video-${videoIndex}`}
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
        />

        {/* Gradient overlay for text readability */}
        <LinearGradient
          colors={['rgba(18, 18, 18, 0)', '#121212']}
          locations={[0, 1]}
          style={styles.gradientOverlay}
        />

        {/* Close button */}
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="chevron-down" size={32} color="#fff" />
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

          <Text style={styles.trackTitle} numberOfLines={2}>
            {state.currentTrack.title}
          </Text>

          {state.currentShow && (
            <View style={styles.showInfoRow}>
              <TouchableOpacity
                onPress={handleNavigateToShow}
                activeOpacity={0.7}
                style={styles.showLinkContainer}
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
              >
                {isFavorite ? (
                  <Ionicons name="checkmark-sharp" size={18} color="#fff" />
                ) : (
                  <Ionicons name="add" size={21} color="#fff" />
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
              <Animated.View style={[styles.progressBarFill, { width: isDragging ? `${thumbProgress * 100}%` : progressWidth }]} />
            </View>
            <View
              style={[
                styles.progressThumb,
                { left: `${thumbProgress * 100}%` },
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
          <TouchableOpacity onPress={handleRewind} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={36} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => state.isPlaying ? pause() : play()}
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
            onPress={nextTrack}
            style={styles.controlButton}
            disabled={!isRadioMode && (!state.playlist || state.playlist.length === 0)}
          >
            <Ionicons
              name="play-skip-forward"
              size={36}
              color={(isRadioMode || (state.playlist && state.playlist.length > 0)) ? "#fff" : "#666"}
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  trackInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  radioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    gap: 6,
  },
  radioIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  trackTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  showInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showLinkContainer: {
    flex: 1,
    marginRight: 16,
  },
  showInfo: {
    fontSize: 18,
    fontFamily: FONTS.secondary,
    color: COLORS.accent,
    marginBottom: 4,
  },
  showDate: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
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
  controlsSection: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  progressContainer: {
    marginBottom: 24,
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
    borderRadius: 6,
    marginLeft: -6,
  },
  progressThumbActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    transform: [{ scale: 1.1 }],
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
