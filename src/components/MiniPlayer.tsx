import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, AppState, AppStateStatus, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { useShows } from '../contexts/ShowsContext';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { usePerformanceRating } from '../hooks/usePerformanceRating';
import { StarRating } from './StarRating';
import { BlurBackground } from './shared/BlurBackground';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { logger } from '../utils/logger';

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

interface MiniPlayerProps {
  onPress: () => void;
}

export const MiniPlayer = React.memo(function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { state, play, pause, isRadioMode, isShuffleMode, currentRadioTrack, progressAnim } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const { videoSource, videoId, resetToFallback } = useVideoBackground();
  const { getShowDetail } = useShows();
  const webVideoUri = useMemo(() => Platform.OS === 'web' ? resolveVideoUri(videoSource) : '', [videoSource]);

  // Track app state to pause video when in background (saves battery) — native only
  const [appState, setAppState] = useState<AppStateStatus>(
    Platform.OS !== 'web' ? AppState.currentState : 'active'
  );

  // Force video remount when source changes by briefly unmounting
  const [videoMounted, setVideoMounted] = useState(true);
  const prevVideoIdRef = useRef(videoId);

  useEffect(() => {
    if (videoId !== prevVideoIdRef.current) {
      prevVideoIdRef.current = videoId;
      // Briefly unmount video to force clean reload
      setVideoMounted(false);
      const timer = setTimeout(() => setVideoMounted(true), 50);
      return () => clearTimeout(timer);
    }
  }, [videoId]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  const handleVideoError = useCallback((error: string) => {
    logger.player.error('MiniPlayer video failed to load:', error);
    resetToFallback();
  }, [resetToFallback]);

  // Prefetch show details in background so navigation is instant when user taps show
  useEffect(() => {
    if (state.currentShow?.identifier) {
      // Fire and forget - preloads into cache
      getShowDetail(state.currentShow.identifier).catch(() => {
        // Ignore errors - this is just prefetching
      });
    }
  }, [state.currentShow?.identifier, getShowDetail]);

  // Get performance rating from shared hook
  const performanceRating = usePerformanceRating();

  // Memoize play count lookup
  const playCount = useMemo(() => {
    return state.currentTrack && state.currentShow
      ? getPlayCount(state.currentTrack.title, state.currentShow.identifier)
      : 0;
  }, [state.currentTrack?.id, state.currentShow?.identifier, getPlayCount]);

  if (!state.currentTrack) return null;

  // Animated progress width from context
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Now playing: ${state.currentTrack.title}. Double tap to open full player.`}
        accessibilityHint="Opens the full screen player"
      >
        {/* Video Background */}
        {Platform.OS === 'web' ? (
          webVideoUri ? React.createElement('video', {
            key: `mini-video-${videoId}`,
            src: webVideoUri,
            autoPlay: true,
            loop: true,
            muted: true,
            playsInline: true,
            ref: (el: HTMLVideoElement | null) => { if (el) el.playbackRate = 0.5; },
            style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
          }) : null
        ) : (
          videoMounted && (() => {
            const { Video, ResizeMode } = require('expo-av');
            return (
              <Video
                key={`video-${videoId}`}
                source={videoSource}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={appState === 'active'}
                isLooping
                isMuted
                onError={handleVideoError}
              />
            );
          })()
        )}

        {/* Overlay - BlurView on iOS, CSS blur on web, semi-transparent View on Android */}
        <View style={styles.blurOverlay}>
          <BlurBackground intensity={30} tint="dark" />
          <View style={styles.contentOverlay}>
            <View style={styles.infoContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {state.currentTrack.title}
                </Text>
                {isRadioMode && (
                  <View style={styles.radioBadge}>
                    <Ionicons name="radio" size={12} color={COLORS.textPrimary} />
                  </View>
                )}
                {isShuffleMode && (
                  <View style={styles.radioBadge}>
                    <Ionicons name="shuffle" size={12} color={COLORS.textPrimary} />
                  </View>
                )}
              </View>
              <Text style={styles.showTitle} numberOfLines={1}>
                {state.currentShow && getVenueFromShow(state.currentShow)} on {state.currentShow?.date && formatDate(state.currentShow.date)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                state.isPlaying ? pause() : play();
              }}
              style={styles.playButton}
              accessibilityRole="button"
              accessibilityLabel={state.isPlaying ? 'Pause' : 'Play'}
              accessibilityHint={state.isPlaying ? 'Double tap to pause' : 'Double tap to play'}
            >
              <Ionicons
                name={state.isPlaying ? 'pause' : 'play'}
                size={28}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md,
  },
  container: {
    height: 72,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADIUS.md,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  infoContainer: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  trackTitle: {
    ...TYPOGRAPHY.labelLarge,
    flexShrink: 1,
  },
  radioBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm - 2,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },
  showTitle: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '400',
    opacity: 0.85,
  },
  playButton: {
    padding: SPACING.sm,
  },
  progressBarContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.sm,
  },
});
