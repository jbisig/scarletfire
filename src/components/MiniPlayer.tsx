import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { useAppActiveState } from '../hooks/useAppActiveState';
import { useVideoRemount } from '../hooks/useVideoRemount';
import { useSlowLoading } from '../hooks/useSlowLoading';
import { BlurBackground } from './shared/BlurBackground';
import { WebVideoBackground } from './shared/WebVideoBackground';
import { StarRating } from './StarRating';
import { usePerformanceRating } from '../hooks/usePerformanceRating';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { logger } from '../utils/logger';

import { resolveVideoUri } from '../utils/resolveVideoUri';
import { stableShowIdentifier } from '../services/sourceSelection';

interface MiniPlayerProps {
  onPress: () => void;
}

export const MiniPlayer = React.memo(function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { state, play, pause, isRadioMode, isShuffleMode, currentRadioTrack, progressAnim } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const { videoSource, videoId, resetToFallback } = useVideoBackground();
  const webVideoUri = useMemo(() => Platform.OS === 'web' ? resolveVideoUri(videoSource) : '', [videoSource]);

  // Track app state to pause video when in background (saves battery) — native only
  const appState = useAppActiveState();

  // Force video remount when source changes by briefly unmounting
  const videoMounted = useVideoRemount(videoId);

  const handleVideoError = useCallback((error: string) => {
    logger.player.error('MiniPlayer video failed to load:', error);
    resetToFallback();
  }, [resetToFallback]);

  // Prefetch-show-detail effect now lives once in PlayerContext (was
  // duplicated identically here and in FullPlayer).

  // Memoize play count lookup. Keyed by the show's stable identity (catalog
  // primary) to match how PlayerContext records plays — not the recording
  // actually loaded. See sourceSelection.ts.
  const playCount = useMemo(() => {
    return state.currentTrack && state.currentShow
      ? getPlayCount(
          state.currentTrack.title,
          stableShowIdentifier(state.currentShow.date, state.currentShow.identifier),
        )
      : 0;
  }, [state.currentTrack?.id, state.currentShow?.identifier, state.currentShow?.date, getPlayCount]);

  // Resolved rating for the current track (display-only here — rating taps
  // live on the large player and show detail screen).
  const performanceRating = usePerformanceRating();

  // Stream start is the moment users most often wonder "did that work?" —
  // show a spinner immediately, and after ~3 s say where the wait is.
  const isBuffering = state.isLoading || state.isBuffering;
  const isSlow = useSlowLoading(isBuffering);

  if (!state.currentTrack) return null;

  const showLine = state.currentShow
    ? `${getVenueFromShow(state.currentShow)}${state.currentShow.date ? ` on ${formatDate(state.currentShow.date)}` : ''}`
    : '';
  const subtitle = isSlow ? 'Still loading from archive.org…' : showLine;

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
        accessibilityLabel={`${isBuffering ? 'Loading' : 'Now playing'}: ${state.currentTrack.title}. Double tap to open full player.`}
        accessibilityHint="Opens the full screen player"
        accessibilityState={{ busy: isBuffering }}
      >
        {/* Video Background */}
        {Platform.OS === 'web' ? (
          webVideoUri ? (
            <WebVideoBackground uri={webVideoUri} videoId={videoId} onError={resetToFallback} />
          ) : null
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
                {performanceRating && (
                  <StarRating rating={performanceRating} size={12} style={styles.titleStars} />
                )}
                {isRadioMode && (
                  <View style={styles.radioBadge}>
                    <Ionicons name="radio" size={12} color={COLORS.textPrimary} />
                  </View>
                )}
                {isShuffleMode && (
                  <View style={styles.radioBadge}>
                    <Ionicons
                      name={state.shuffleType === 'playlist' ? 'musical-notes' : 'shuffle'}
                      // 'playlistShuffle' keeps the shuffle icon; 'playlist' shows musical-notes
                      size={12}
                      color={COLORS.textPrimary}
                    />
                  </View>
                )}
              </View>
              <Text style={[styles.showTitle, isSlow && styles.showTitleSlow]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                state.isPlaying ? pause() : play();
              }}
              style={styles.playButton}
              accessibilityRole="button"
              accessibilityLabel={isBuffering ? 'Loading' : state.isPlaying ? 'Pause' : 'Play'}
              accessibilityHint={state.isPlaying ? 'Double tap to pause' : 'Double tap to play'}
              accessibilityState={{ busy: isBuffering }}
            >
              {isBuffering ? (
                <ActivityIndicator size="small" color={COLORS.textPrimary} style={styles.playSpinner} />
              ) : (
                <Ionicons
                  name={state.isPlaying ? 'pause' : 'play'}
                  size={28}
                  color={COLORS.textPrimary}
                />
              )}
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
  titleStars: {
    marginLeft: SPACING.sm,
    flexShrink: 0,
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
  showTitleSlow: {
    opacity: 1,
    fontWeight: '500',
  },
  playButton: {
    padding: SPACING.sm,
    // Match the 28px glyph so swapping in the spinner doesn't shift layout.
    width: 28 + SPACING.sm * 2,
    height: 28 + SPACING.sm * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playSpinner: {
    // ActivityIndicator "small" is 20px; keep it optically centred in the
    // 28px slot the play/pause glyph occupies.
    width: 28,
    height: 28,
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
