import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { formatDate } from '../utils/formatters';
import { getSongPerformanceRating } from '../data/songPerformanceRatings';
import { StarRating } from './StarRating';

interface MiniPlayerProps {
  onPress: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { state, play, pause } = usePlayer();
  const { getPlayCount } = usePlayCounts();

  if (!state.currentTrack) return null;

  // Calculate progress percentage
  const progress = state.duration > 0 ? (state.position / state.duration) * 100 : 0;

  // Get play count for current track
  const playCount = state.currentTrack && state.currentShow
    ? getPlayCount(state.currentTrack.title, state.currentShow.identifier)
    : 0;

  // Get performance rating
  const performanceRating = state.currentTrack && state.currentShow
    ? getSongPerformanceRating(state.currentTrack.title, state.currentShow.date)
    : null;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {state.currentTrack.title}
          </Text>
          <View style={styles.showInfoRow}>
            {performanceRating && (
              <StarRating tier={performanceRating} size={12} />
            )}
            <Text style={styles.showTitle} numberOfLines={1}>
              {state.currentShow?.venue} on {state.currentShow?.date && formatDate(state.currentShow.date)}
            </Text>
            {playCount > 0 && (
              <View style={styles.playCountBadge}>
                <Ionicons name="play-circle" size={10} color="#ff6b6b" />
                <Text style={styles.playCountText}>
                  {playCount}
                </Text>
              </View>
            )}
          </View>
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
      </TouchableOpacity>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  showInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  showTitle: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  playCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  playCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  playButton: {
    padding: 8,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#333',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff6b6b',
  },
});
