import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useVideoBackground } from '../contexts/VideoBackgroundContext';
import { formatDate } from '../utils/formatters';
import { GRATEFUL_DEAD_SONGS } from '../constants/songs.generated';
import { StarRating } from './StarRating';
import { COLORS, FONTS } from '../constants/theme';

interface MiniPlayerProps {
  onPress: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { state, play, pause, isRadioMode, currentRadioTrack } = usePlayer();
  const { getPlayCount } = usePlayCounts();
  const { videoSource } = useVideoBackground();

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

  // Calculate progress percentage
  const progress = state.duration > 0 ? (state.position / state.duration) * 100 : 0;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Video Background */}
        <Video
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
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
                {state.currentShow?.venue} on {state.currentShow?.date && formatDate(state.currentShow.date)}
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
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
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
