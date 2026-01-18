import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites, FavoriteSong } from '../contexts/FavoritesContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { formatDate, formatTime } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { StarRating } from './StarRating';

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');

/**
 * Full-screen player modal with playback controls
 */
export const FullPlayer = React.memo<FullPlayerProps>(({ visible, onClose }) => {
  const navigation = useNavigation<NavigationProp>();
  const { state, play, pause, nextTrack, previousTrack, seekTo } = usePlayer();
  const { isSongFavorite, addFavoriteSong, removeFavoriteSong } = useFavorites();
  const { getPlayCount } = usePlayCounts();
  const progressBarRef = useRef<View>(null);
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

  const calculatePositionFromTouch = (pageX: number, trackDurationMs: number): number => {
    if (barMeasurements.current.width === 0) return 0;
    const relativeX = pageX - barMeasurements.current.pageX;
    const percentage = Math.max(0, Math.min(1, relativeX / barMeasurements.current.width));
    return percentage * trackDurationMs;
  };

  const handleRewind = (): void => {
    const now = Date.now();
    const timeSinceLastTap = now - lastRewindTapRef.current;

    console.log('Rewind tapped:', { timeSinceLastTap, isDoubleTap: timeSinceLastTap < 300 });

    if (timeSinceLastTap < 300) {
      // Double tap - go to previous track
      console.log('Double tap detected - calling previousTrack()');
      previousTrack();
      lastRewindTapRef.current = 0;
    } else {
      // Single tap - restart current track
      console.log('Single tap - seeking to 0');
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
    onClose(); // Close the full player first
    navigation.navigate('ShowDetail', { identifier: state.currentShow.identifier });
  };

  // Progress bar pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        // Measure the progress bar position
        progressBarRef.current?.measure((x, y, width, height, barPageX) => {
          barMeasurements.current = { pageX: barPageX, width };

          // Get duration from track metadata
          const trackDurationMs = currentTrackRef.current?.duration ? currentTrackRef.current.duration * 1000 : 0;
          const durationMs = currentDurationRef.current > 0 ? currentDurationRef.current : trackDurationMs;

          // Use locationX relative to the touch target
          const touchX = barPageX + evt.nativeEvent.locationX;
          const position = calculatePositionFromTouch(touchX, durationMs);

          isDraggingRef.current = true;
          setIsDragging(true);
          setDragPosition(position);
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (barMeasurements.current.width === 0) return;

        // Get duration from track metadata
        const trackDurationMs = currentTrackRef.current?.duration ? currentTrackRef.current.duration * 1000 : 0;
        const durationMs = currentDurationRef.current > 0 ? currentDurationRef.current : trackDurationMs;

        // Calculate absolute X from locationX and gesture movement
        const touchX = barMeasurements.current.pageX + evt.nativeEvent.locationX;
        const position = calculatePositionFromTouch(touchX, durationMs);
        setDragPosition(position);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (barMeasurements.current.width === 0) return;

        // Get duration from track metadata
        const trackDurationMs = currentTrackRef.current?.duration ? currentTrackRef.current.duration * 1000 : 0;
        const durationMs = currentDurationRef.current > 0 ? currentDurationRef.current : trackDurationMs;

        const touchX = barMeasurements.current.pageX + evt.nativeEvent.locationX;
        const position = calculatePositionFromTouch(touchX, durationMs);

        // Keep drag position briefly to prevent flash while seek completes
        setDragPosition(position);
        seekTo(position);

        // Delay setting isDragging to false to prevent visual jump
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

  // Swipe down to dismiss gesture - more sensitive for easier dismissal
  const swipeDownResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Trigger on downward swipes
        return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Dismiss if dragged down at least 50px
        if (gestureState.dy > 50) {
          onClose();
        }
      },
    })
  ).current;

  if (!state.currentTrack) return null;

  // Use track duration from metadata if playback duration isn't available yet
  const trackDuration = state.currentTrack.duration ? state.currentTrack.duration * 1000 : 0; // Convert to ms
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
        {/* Top Half - Draggable Area for Dismissal */}
        <View style={styles.topHalf} {...swipeDownResponder.panHandlers}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Track Info */}
          <View style={styles.trackInfoContainer}>
          <Text style={styles.trackTitle} numberOfLines={2}>
            {state.currentTrack.title}
          </Text>

          {/* Clickable Show Info */}
          {state.currentShow && (() => {
            const performanceRating = state.currentTrack
              ? getSongPerformanceRating(state.currentTrack.title, state.currentShow.date)
              : null;

            return (
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
                    <StarRating tier={performanceRating} size={18} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })()}

          {/* Play Count Badge */}
          {state.currentTrack && state.currentShow && (() => {
            const playCount = getPlayCount(state.currentTrack.title, state.currentShow.identifier);
            return playCount > 0 ? (
              <View style={styles.playCountBadge}>
                <Ionicons name="play-circle" size={16} color="#ff6b6b" />
                <Text style={styles.playCountText}>
                  {playCount} {playCount === 1 ? 'play' : 'plays'}
                </Text>
              </View>
            ) : null;
          })()}

          {/* Save Song Button */}
          {state.currentTrack && state.currentShow && (
            <TouchableOpacity
              style={styles.saveSongButton}
              onPress={handleToggleFavoriteSong}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  isSongFavorite(state.currentTrack.id, state.currentShow.identifier)
                    ? 'heart'
                    : 'heart-outline'
                }
                size={24}
                color={
                  isSongFavorite(state.currentTrack.id, state.currentShow.identifier)
                    ? '#ff6b6b'
                    : '#fff'
                }
              />
              <Text style={styles.saveSongButtonText}>
                {isSongFavorite(state.currentTrack.id, state.currentShow.identifier)
                  ? 'Saved'
                  : 'Save'}
              </Text>
            </TouchableOpacity>
          )}
          </View>
        </View>

        {/* Bottom Half - Progress Bar and Controls */}
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

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={handleRewind} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={40} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => state.isPlaying ? pause() : play()}
            style={styles.playButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name={state.isPlaying ? 'pause' : 'play'}
              size={48}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nextTrack}
            style={styles.controlButton}
            disabled={!state.playlist || state.playlist.length === 0}
          >
            <Ionicons
              name="play-skip-forward"
              size={40}
              color={state.playlist && state.playlist.length > 0 ? "#fff" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

FullPlayer.displayName = 'FullPlayer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },
  topHalf: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  trackInfoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  showLinkContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  showInfo: {
    fontSize: 18,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 4,
  },
  showDate: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  dateWithStars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveSongButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 8,
  },
  saveSongButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  playCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    marginTop: 8,
  },
  playCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarWrapper: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff6b6b',
  },
  progressThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    marginLeft: -10,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  progressThumbActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#999',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 80,
    height: 80,
    backgroundColor: '#ff6b6b',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
