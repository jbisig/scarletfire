import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { formatDate, formatTime } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs.generated';
import { StarRating } from './StarRating';
import { COLORS, FONTS } from '../constants/theme';

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Full-screen player modal with video background and playback controls
 */
// Video source for background
const videoSource = require('../../assets/videos/background.mov');

export const FullPlayer = React.memo<FullPlayerProps>(({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const { state, play, pause, nextTrack, previousTrack, seekTo } = usePlayer();
  const { isSongFavorite, addFavoriteSong, removeFavoriteSong } = useFavorites();
  const { getPlayCount } = usePlayCounts();
  const progressBarRef = useRef<View>(null);

  // Video player for background
  const videoPlayer = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const lastRewindTapRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const barMeasurements = useRef({ pageX: 0, width: 0 });
  const currentTrackRef = useRef(state.currentTrack);
  const currentDurationRef = useRef(state.duration);

  // Update refs when state changes
  React.useEffect(() => {
    currentTrackRef.current = state.currentTrack;
    currentDurationRef.current = state.duration;
  }, [state.currentTrack, state.duration]);

  // Memoize performance rating lookup using pre-computed data
  const performanceRating = useMemo(() => {
    if (!state.currentTrack || !state.currentShow) return null;

    const song = GRATEFUL_DEAD_SONGS.find(s =>
      s.title.toLowerCase() === state.currentTrack!.title.toLowerCase()
    );

    if (!song) return null;

    const performance = song.performances.find(p => p.date === state.currentShow!.date);

    return performance?.rating || null;
  }, [state.currentTrack?.id, state.currentShow?.date]);

  // Memoize play count lookup
  const playCount = useMemo(() => {
    return state.currentTrack && state.currentShow
      ? getPlayCount(state.currentTrack.title, state.currentShow.identifier)
      : 0;
  }, [state.currentTrack?.id, state.currentShow?.identifier, getPlayCount]);

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
      previousTrack();
      lastRewindTapRef.current = 0;
    } else {
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
        venue: state.currentShow.venue,
        streamUrl: state.currentTrack.streamUrl,
      };
      addFavoriteSong(favoriteSong);
    }
  };

  const handleNavigateToShow = (): void => {
    if (!state.currentShow) return;
    onClose();
    navigation.navigate('ShowDetail', { identifier: state.currentShow.identifier });
  };

  // Progress bar pan responder for dragging
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

  // Swipe down to dismiss gesture
  const swipeDownResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          onClose();
        }
      },
    })
  ).current;

  if (!state.currentTrack) return null;

  const trackDuration = state.currentTrack.duration ? state.currentTrack.duration * 1000 : 0;
  const duration = state.duration > 0 ? state.duration : trackDuration;

  const currentPosition = isDragging ? dragPosition : state.position;
  const progress = duration > 0 ? (currentPosition / duration) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Video Background */}
        <View style={styles.videoContainer} {...swipeDownResponder.panHandlers}>
          <VideoView
            player={videoPlayer}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
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

          {/* Track Info - positioned at bottom of video */}
          <View style={styles.trackInfoContainer}>
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
                    {state.currentShow.venue}
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
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
              <View
                style={[
                  styles.progressThumb,
                  { left: `${progress * 100}%` },
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
              disabled={!state.playlist || state.playlist.length === 0}
            >
              <Ionicons
                name="play-skip-forward"
                size={36}
                color={state.playlist && state.playlist.length > 0 ? "#fff" : "#666"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

FullPlayer.displayName = 'FullPlayer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    alignItems: 'flex-start',
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
