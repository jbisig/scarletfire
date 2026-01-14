import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../contexts/PlayerContext';
import { formatDate } from '../utils/formatters';

interface MiniPlayerProps {
  onPress: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { state, play, pause } = usePlayer();

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
        <View style={styles.infoContainer}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {state.currentTrack.title}
          </Text>
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
  showTitle: {
    fontSize: 12,
    color: '#999',
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
