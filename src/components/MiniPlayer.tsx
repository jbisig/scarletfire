import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, AppState, AppStateStatus } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { useShows } from '../contexts/ShowsContext';
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs.generated';
import { StarRating } from './StarRating';
import { COLORS, FONTS } from '../constants/theme';

interface MiniPlayerProps {
  onPress: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { state, play, pause, isRadioMode, currentRadioTrack, progressAnim } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const { videoSource, videoId } = useVideoBackground();
  const { getShowDetail } = useShows();

  // Track app state to pause video when in background (saves battery)
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  // Prefetch show details in background so navigation is instant when user taps show
  useEffect(() => {
    if (state.currentShow?.identifier) {
      // Fire and forget - preloads into cache
      getShowDetail(state.currentShow.identifier).catch(() => {
        // Ignore errors - this is just prefetching
      });
    }
  }, [state.currentShow?.identifier, getShowDetail]);

  // Memoize performance rating lookup using pre-computed data
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
      >
        {/* Video Background - only play when app is active to save battery */}
        <Video
          key={`video-${videoId}`}
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={appState === 'active'}
          isLooping
          isMuted
        />

        {/* Blur overlay */}
        <BlurView intensity={30} tint="systemThinMaterialDark" style={styles.blurOverlay}>
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
            >
              <Ionicons
                name={state.isPlaying ? 'pause' : 'play'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: 12,
    marginHorizontal: 12,
  },
  container: {
    height: 72,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
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
    paddingHorizontal: 12,
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  radioBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
    flexShrink: 0,
  },
  showTitle: {
    fontSize: 13,
    fontFamily: FONTS.secondary,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  playButton: {
    padding: 8,
  },
  progressBarContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.33)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
});
