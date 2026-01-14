import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useShows } from '../contexts/ShowsContext';
import { usePlayer } from '../contexts/PlayerContext';
import { TrackItem } from '../components/TrackItem';
import { VersionPicker } from '../components/VersionPicker';
import { ShowDetail, Track } from '../types/show.types';
import { formatDate } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';

type ShowDetailRouteProp = RouteProp<RootStackParamList, 'ShowDetail'>;

export function ShowDetailScreen() {
  const route = useRoute<ShowDetailRouteProp>();
  const { getShowDetail } = useShows();
  const { state: playerState, loadTrack } = usePlayer();

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  useEffect(() => {
    loadShowDetail(route.params.identifier);
  }, [route.params.identifier]);

  const loadShowDetail = async (identifier: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getShowDetail(identifier);
      setShow(detail);
      setSelectedVersion(identifier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load show');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionChange = async (versionIdentifier: string) => {
    if (versionIdentifier !== selectedVersion) {
      await loadShowDetail(versionIdentifier);
    }
  };

  const handleTrackPress = (track: Track) => {
    if (show) {
      loadTrack(track, show, show.tracks);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  if (error || !show) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Show not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{show.venue || show.title}</Text>
        <Text style={styles.date}>{formatDate(show.date)}</Text>
        {show.location && <Text style={styles.location}>{show.location}</Text>}

        {/* Version Picker */}
        {show.allVersions && show.allVersions.length > 1 && (
          <VersionPicker
            versions={show.allVersions}
            selectedVersion={selectedVersion}
            onVersionChange={handleVersionChange}
          />
        )}
      </View>

      <View style={styles.tracksContainer}>
        <Text style={styles.tracksTitle}>
          Tracks ({show.tracks.length})
        </Text>
        {show.tracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isPlaying={
              playerState.currentTrack?.id === track.id &&
              playerState.isPlaying
            }
            onPress={handleTrackPress}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 12,
  },
  tracksContainer: {
    paddingVertical: 16,
  },
  tracksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
});
