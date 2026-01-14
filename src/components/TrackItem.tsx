import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Track } from '../types/show.types';
import { formatDuration } from '../utils/formatters';

interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPress: (track: Track) => void;
}

export function TrackItem({ track, isPlaying, onPress }: TrackItemProps) {
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
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
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
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#ffffff',
  },
  duration: {
    fontSize: 12,
    color: '#999',
    marginLeft: 12,
  },
  playingText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
});
