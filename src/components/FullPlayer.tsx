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
import { usePlayer } from '../contexts/PlayerContext';
import { formatDate, formatTime } from '../utils/formatters';

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const PROGRESS_BAR_WIDTH = screenWidth - 48; // Account for padding

export function FullPlayer({ visible, onClose }: FullPlayerProps) {
  const { state, play, pause, nextTrack, previousTrack, seekTo } = usePlayer();
  const progressBarRef = useRef<View>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const lastRewindTapRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const barMeasurements = useRef({ pageX: 0, width: 0 });

  const calculatePositionFromTouch = (pageX: number) => {
    if (barMeasurements.current.width === 0) return 0;
    const relativeX = pageX - barMeasurements.current.pageX;
    const percentage = Math.max(0, Math.min(1, relativeX / barMeasurements.current.width));
    return percentage * state.duration;
  };

  const handleProgressTouch = (evt: any) => {
    if (isDraggingRef.current) return;
    progressBarRef.current?.measure((x, y, width, height, barPageX, pageY) => {
      barMeasurements.current = { pageX: barPageX, width };
      const position = calculatePositionFromTouch(evt.nativeEvent.pageX);
      seekTo(position);
    });
  };

  const handleRewind = () => {
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDraggingRef.current = true;
        setIsDragging(true);
        // Measure once at the start
        progressBarRef.current?.measure((x, y, width, height, barPageX, pageY) => {
          barMeasurements.current = { pageX: barPageX, width };
          const position = calculatePositionFromTouch(evt.nativeEvent.pageX);
          setDragPosition(position);
        });
      },
      onPanResponderMove: (evt) => {
        // Use cached measurements for smooth dragging
        const position = calculatePositionFromTouch(evt.nativeEvent.pageX);
        setDragPosition(position);
      },
      onPanResponderRelease: (evt) => {
        const position = calculatePositionFromTouch(evt.nativeEvent.pageX);
        seekTo(position);
        setIsDragging(false);
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 100);
      },
    })
  ).current;

  if (!state.currentTrack) return null;

  const currentPosition = isDragging ? dragPosition : state.position;
  const progress = state.duration > 0 ? (currentPosition / state.duration) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header with close button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Album Art Placeholder */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArtPlaceholder}>
            <Ionicons name="musical-notes" size={80} color="#ff6b6b" />
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfoContainer}>
          <Text style={styles.trackTitle} numberOfLines={2}>
            {state.currentTrack.title}
          </Text>
          <Text style={styles.showInfo} numberOfLines={1}>
            {state.currentShow?.venue} on {state.currentShow?.date && formatDate(state.currentShow.date)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <TouchableOpacity
            style={styles.progressBarWrapper}
            ref={progressBarRef}
            onPress={handleProgressTouch}
            activeOpacity={1}
            {...panResponder.panHandlers}
          >
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <View
              style={[styles.progressThumb, { left: `${progress * 100}%` }]}
            />
          </TouchableOpacity>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
            <Text style={styles.timeText}>{formatTime(state.duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={handleRewind}
            style={styles.controlButton}
          >
            <Ionicons
              name="play-skip-back"
              size={40}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (state.isPlaying) {
                pause();
              } else {
                play();
              }
            }}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  closeButton: {
    padding: 8,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  albumArtPlaceholder: {
    width: 320,
    height: 320,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  trackInfoContainer: {
    marginBottom: 40,
  },
  trackTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  showInfo: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressBarWrapper: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
    paddingVertical: 10,
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
