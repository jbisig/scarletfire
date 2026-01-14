import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate } from '../utils/formatters';

interface ShowCardProps {
  show: GratefulDeadShow;
  onPress: (show: GratefulDeadShow) => void;
}

export function ShowCard({ show, onPress }: ShowCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(show)}
      activeOpacity={0.7}
    >
      <Text style={styles.date}>{formatDate(show.date)}</Text>
      {show.venue && (
        <Text style={styles.venue} numberOfLines={1}>
          {show.venue}
        </Text>
      )}
      {show.location && (
        <Text style={styles.location} numberOfLines={1}>
          {show.location}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#2a2a2a',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  date: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
    marginBottom: 6,
  },
  venue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#999999',
  },
});
