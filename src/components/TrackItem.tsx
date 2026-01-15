import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Track } from '../types/show.types';
import { formatDuration } from '../utils/formatters';

interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPress: (track: Track) => void;
}

/**
 * Individual track item component
 * Memoized to prevent unnecessary re-renders
 */
export const TrackItem = React.memo<TrackItemProps>(({ track, isPlaying, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.playing]}
      onPress={() => onPress(track)}
      activeOpacity={0.7}
    >
      <View style={styles.trackNumberContainer}>
        <Text style={[styles.trackNumber, isPlaying && styles.playingText]}>
          {track.trackNumber || ''}
        </Text>
      </View>
      <View style={styles.infoContainer}>
        <Text
          style={[styles.title, isPlaying && styles.playingText]}
          numberOfLines={2}
        >
          {track.title}
        </Text>
      </View>
      <Text style={[styles.duration, isPlaying && styles.playingText]}>
        {formatDuration(track.duration)}
      </Text>
    </TouchableOpacity>
  );
});

TrackItem.displayName = 'TrackItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  playing: {
    backgroundColor: '#ff6b6b20',
  },
  trackNumberContainer: {
    width: 32,
    marginRight: 12,
  },
  trackNumber: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#ffffff',
  },
  duration: {
    fontSize: 14,
    color: '#999',
    marginLeft: 12,
  },
  playingText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
});
