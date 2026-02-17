import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../navigation/navigationRef';
import { usePlayer } from '../../contexts/PlayerContext';
import { useVideoBackground } from '../../contexts/VideoBackgroundContext';
import { useFavorites, FavoriteSong } from '../../contexts/FavoritesContext';
import { formatDate, formatTime, getVenueFromShow } from '../../utils/formatters';
import { COLORS, RADIUS, WEB_LAYOUT } from '../../constants/theme';

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
  const { isSongFavorite, addFavoriteSong, removeFavoriteSong } = useFavorites();

  const isSaved = state.currentTrack && state.currentShow
    ? isSongFavorite(state.currentTrack.id, state.currentShow.identifier)
    : false;

  const handleToggleSave = useCallback(() => {
    if (!state.currentTrack || !state.currentShow) return;
    if (isSongFavorite(state.currentTrack.id, state.currentShow.identifier)) {
      removeFavoriteSong(state.currentTrack.id, state.currentShow.identifier);
    } else {
      const song: FavoriteSong = {
        trackId: state.currentTrack.id,
        trackTitle: state.currentTrack.title,
        showIdentifier: state.currentShow.identifier,
        showDate: state.currentShow.date,
        venue: getVenueFromShow(state.currentShow),
        streamUrl: state.currentTrack.streamUrl,
      };
      addFavoriteSong(song);
    }
  }, [state.currentTrack, state.currentShow, isSongFavorite, removeFavoriteSong, addFavoriteSong]);

  const progressBarRef = useRef<View>(null);

  // Time display via ref to avoid re-renders on every update
  // Only force re-render when position changes by >= 1 second
  const timeDisplayRef = useRef({ position: 0, duration: 0 });
  const [, forceTimeUpdate] = useState(0);

  // Drag and hover state for progress bar
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const isDraggingRef = useRef(false);
  const [isProgressHovered, setIsProgressHovered] = useState(false);

  // Helper to get current duration from ref or track metadata
  const getDurationMs = useCallback(() => {
    const refDuration = progressRef.current.duration;
    const trackDurationMs = state.currentTrack?.duration ? state.currentTrack.duration * 1000 : 0;
    return refDuration > 0 ? refDuration : trackDurationMs;
  }, [progressRef, state.currentTrack]);

  useEffect(() => {
    // Update ref immediately
    timeDisplayRef.current = { ...progressRef.current };
    forceTimeUpdate(n => n + 1);

    // Update every second, but only re-render if changed by >= 1 second
    const interval = setInterval(() => {
      if (!isDraggingRef.current) {
        const prev = timeDisplayRef.current;
        const next = progressRef.current;
        if (Math.abs(next.position - prev.position) >= 1000 || prev.duration !== next.duration) {
          timeDisplayRef.current = { ...next };
          forceTimeUpdate(n => n + 1);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [progressRef, state.currentTrack]);

  // Mouse event handlers for click-and-drag seeking
  // Uses getBoundingClientRect directly (web-only component) to avoid async measure() issues
  const handleMouseDown = useCallback(
    (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const clientX = e.nativeEvent?.clientX ?? e.clientX;
      const barNode = progressBarRef.current as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!barNode) return;

      // Get rect synchronously via DOM API
      const domNode = barNode.getNode?.() || barNode;
      const rect = domNode.getBoundingClientRect?.();
      if (!rect) return;

      const barLeft = rect.left;
      const barWidth = rect.width;

      const durationMs = getDurationMs();

      const calcPosition = (cx: number) => {
        const pct = Math.max(0, Math.min(1, (cx - barLeft) / barWidth));
        return pct * durationMs;
      };

      const position = calcPosition(clientX);
      isDraggingRef.current = true;
      setIsDragging(true);
      setDragPosition(position);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        setDragPosition(calcPosition(moveEvent.clientX));
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const pos = calcPosition(upEvent.clientX);
        setDragPosition(pos);
        seekTo(pos);
        timeDisplayRef.current = { position: pos, duration: durationMs };
        forceTimeUpdate(n => n + 1);
        setTimeout(() => {
          setIsDragging(false);
          isDraggingRef.current = false;
          setIsProgressHovered(false);
        }, 200);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [seekTo, getDurationMs]
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

  // Animated width for progress bar
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // Animated thumb position (same source as fill bar)
  const thumbLeft = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const timeDisplay = timeDisplayRef.current;
  const trackDuration = state.currentTrack.duration ? state.currentTrack.duration * 1000 : 0;
  const duration = timeDisplay.duration > 0 ? timeDisplay.duration : trackDuration;
  const currentPosition = isDragging ? dragPosition : timeDisplay.position;
  const dragProgress = duration > 0 ? Math.max(0, Math.min(1, dragPosition / duration)) : 0;

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
        {/* Left: Track info + save button */}
        <View style={styles.trackInfoRow}>
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
          <TouchableOpacity
            style={[styles.saveButton, isSaved && styles.saveButtonActive]}
            onPress={handleToggleSave}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? 'checkmark-sharp' : 'add'}
              size={13}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

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
            <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
            <View
              ref={progressBarRef}
              style={styles.progressBarWrapper}
              // @ts-ignore - web mouse events
              onMouseDown={handleMouseDown}
              onMouseEnter={() => setIsProgressHovered(true)}
              onMouseLeave={() => { if (!isDraggingRef.current) setIsProgressHovered(false); }}
            >
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: isDragging ? `${dragProgress * 100}%` : progressWidth },
                  ]}
                />
              </View>
              {(isProgressHovered || isDragging) && (
                <Animated.View
                  style={[
                    styles.progressThumb,
                    { left: isDragging ? `${dragProgress * 100}%` : thumbLeft },
                    isDragging && styles.progressThumbActive,
                  ]}
                  pointerEvents="none"
                />
              )}
            </View>
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
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  trackInfo: {
    maxWidth: 220,
    // @ts-ignore
    cursor: 'pointer',
  },
  saveButton: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
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
    position: 'relative',
    // @ts-ignore
    cursor: 'pointer',
    // @ts-ignore - prevent text selection while dragging
    userSelect: 'none',
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
  progressThumb: {
    position: 'absolute',
    top: '50%',
    width: 10,
    height: 10,
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    marginLeft: -5,
    marginTop: -5,
  },
  progressThumbActive: {
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    // @ts-ignore - web transform
    transform: [{ scale: 1.1 }],
  },
});
