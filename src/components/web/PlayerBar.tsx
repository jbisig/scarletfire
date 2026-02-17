import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../navigation/navigationRef';
import { usePlayer } from '../../contexts/PlayerContext';
import { useVideoBackground } from '../../contexts/VideoBackgroundContext';
import { formatDate, formatTime, getVenueFromShow } from '../../utils/formatters';
import { COLORS, WEB_LAYOUT } from '../../constants/theme';

// Resolve video source to a URL string for HTML5 video
function resolveVideoUri(source: number | { uri: string } | string): string {
  if (typeof source === 'string') {
    // On web, require() for assets often returns a string URL directly
    return source;
  }
  if (typeof source === 'number') {
    // require() result — try Image.resolveAssetSource
    try {
      const resolved = Image.resolveAssetSource(source);
      return resolved?.uri || '';
    } catch {
      return '';
    }
  }
  if (source && typeof source === 'object' && 'uri' in source) {
    return source.uri;
  }
  // Last resort: try default export pattern from metro
  if (source && typeof source === 'object' && 'default' in (source as any)) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return (source as any).default; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  return '';
}

// HTML5 video element rendered via React.createElement for React Native Web compatibility
function VideoBackground({ uri, videoId }: { uri: string; videoId: string }) {
  return React.createElement('video', {
    key: `player-bar-video-${videoId}`,
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
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

export function PlayerBar() {
  const {
    state,
    play,
    pause,
    nextTrack,
    previousTrack,
    seekTo,
    isRadioMode,
    isShuffleMode,
    progressRef,
    progressAnim,
  } = usePlayer();

  const { videoSource, videoId } = useVideoBackground();
  const videoUri = useMemo(() => resolveVideoUri(videoSource), [videoSource]);

  const progressBarRef = useRef<View>(null);

  // Time display updated periodically
  const [timeDisplay, setTimeDisplay] = useState({ position: 0, duration: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDisplay({ ...progressRef.current });
    }, 500);
    return () => clearInterval(interval);
  }, [progressRef]);

  const handleProgressBarClick = useCallback(
    (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const nativeEvent = e.nativeEvent;
      if (!progressBarRef.current) return;

      progressBarRef.current.measure((_x, _y, width, _height, pageX) => {
        const clickX = (nativeEvent.pageX || nativeEvent.clientX) - pageX;
        const percentage = Math.max(0, Math.min(1, clickX / width));
        const duration = progressRef.current.duration;
        if (duration > 0) {
          seekTo(percentage * duration);
        }
      });
    },
    [seekTo, progressRef]
  );

  if (!state.currentTrack) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Select a track to start playing</Text>
        </View>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const trackDuration = state.currentTrack.duration ? state.currentTrack.duration * 1000 : 0;
  const duration = timeDisplay.duration > 0 ? timeDisplay.duration : trackDuration;

  return (
    <View style={styles.container}>
      {/* Video background */}
      {videoUri ? (
        <View style={styles.videoContainer}>
          <VideoBackground uri={videoUri} videoId={videoId} />
        </View>
      ) : null}

      {/* Blur overlay on top of video */}
      <View style={styles.blurOverlay} />

      <View style={styles.content}>
        {/* Left: Track info — links to show detail */}
        <TouchableOpacity
          style={styles.trackInfo}
          activeOpacity={0.7}
          onPress={() => {
            if (state.currentShow?.identifier && navigationRef.isReady()) {
              navigationRef.dispatch(
                CommonActions.navigate({ name: 'ShowDetail', params: { identifier: state.currentShow.identifier } })
              );
            }
          }}
        >
          <Text style={styles.trackTitle} numberOfLines={1}>
            {state.currentTrack.title}
          </Text>
          {state.currentShow && (
            <Text style={styles.showInfo} numberOfLines={1}>
              {getVenueFromShow(state.currentShow)} on {formatDate(state.currentShow.date)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Center: Controls + Progress — absolutely centered in the bar */}
        <View style={styles.centerSection}>
          <View style={styles.controls}>
            <TouchableOpacity onPress={previousTrack} style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={20} color={COLORS.textPrimary} style={{ opacity: 0.6 }} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (state.isPlaying ? pause() : play())}
              style={styles.playButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name={state.isPlaying ? 'pause' : 'play'}
                size={32}
                color={COLORS.textPrimary}
                style={!state.isPlaying ? { marginLeft: 3 } : undefined}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={nextTrack}
              style={styles.controlButton}
              disabled={!isRadioMode && !isShuffleMode && (!state.playlist || state.playlist.length === 0)}
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={
                  isRadioMode || isShuffleMode || (state.playlist && state.playlist.length > 0)
                    ? COLORS.textPrimary
                    : COLORS.textMuted
                }
                style={{ opacity: isRadioMode || isShuffleMode || (state.playlist && state.playlist.length > 0) ? 0.6 : 0.3 }}
              />
            </TouchableOpacity>
          </View>

          {/* Progress bar with time */}
          <View style={styles.progressRow}>
            <Text style={styles.timeText}>{formatTime(timeDisplay.position)}</Text>
            <TouchableOpacity
              ref={progressBarRef}
              style={styles.progressBarWrapper}
              onPress={handleProgressBarClick}
              activeOpacity={1}
            >
              <View style={styles.progressBarBackground}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
            </TouchableOpacity>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WEB_LAYOUT.playerBarHeight,
    borderRadius: WEB_LAYOUT.playerBarRadius,
    overflow: 'hidden',
    position: 'relative',
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.68,
    overflow: 'hidden',
    borderRadius: WEB_LAYOUT.playerBarRadius,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    // @ts-ignore - web only
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    position: 'relative',
    zIndex: 2,
  },
  trackInfo: {
    width: 220,
    zIndex: 2,
    // @ts-ignore
    cursor: 'pointer',
  },
  trackTitle: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  showInfo: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '400',
    fontSize: 15,
    color: COLORS.textPrimary,
    opacity: 0.66,
  },
  centerSection: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    // @ts-ignore - web transform
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    alignItems: 'center',
    width: 453,
    zIndex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    padding: 4,
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  timeText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: COLORS.textPrimary,
    opacity: 0.66,
    textAlign: 'center',
    // @ts-ignore
    whiteSpace: 'nowrap',
  },
  progressBarWrapper: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.33)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.textPrimary,
    borderRadius: 6,
  },
});
