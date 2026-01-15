import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useShows } from '../contexts/ShowsContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { TrackItem } from '../components/TrackItem';
import { VersionPicker } from '../components/VersionPicker';
import { ShowDetail, Track } from '../types/show.types';
import { formatDate } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';

type ShowDetailRouteProp = RouteProp<RootStackParamList, 'ShowDetail'>;
type ShowDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ShowDetail'>;

export function ShowDetailScreen() {
  const route = useRoute<ShowDetailRouteProp>();
  const navigation = useNavigation<ShowDetailNavigationProp>();
  const { getShowDetail } = useShows();
  const { state: playerState, loadTrack } = usePlayer();
  const { isShowFavorite, addFavoriteShow, removeFavoriteShow } = useFavorites();

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [justPressedTrackId, setJustPressedTrackId] = useState<string | null>(null);

  useEffect(() => {
    loadShowDetail(route.params.identifier);
  }, [route.params.identifier]);

  useEffect(() => {
    // Clear justPressedTrackId when the track is actually loading or playing
    if (
      justPressedTrackId &&
      playerState.currentTrack?.id === justPressedTrackId &&
      (playerState.isLoading || playerState.isPlaying)
    ) {
      setJustPressedTrackId(null);
    }
  }, [playerState.currentTrack?.id, playerState.isLoading, playerState.isPlaying, justPressedTrackId]);

  const formatDateMMDDYYYY = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${month}/${day}/${year}`;
  };

  const loadShowDetail = async (identifier: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getShowDetail(identifier);
      setShow(detail);
      setSelectedVersion(identifier);

      // Update navigation title with show date
      if (detail.date) {
        navigation.setOptions({
          title: formatDateMMDDYYYY(detail.date),
        });
      }
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

  const handleTrackPress = useCallback((track: Track) => {
    if (show) {
      setJustPressedTrackId(track.id);
      loadTrack(track, show, show.tracks);
    }
  }, [show, loadTrack]);

  const handleToggleFavorite = () => {
    if (show) {
      const showToSave = {
        date: show.date,
        year: show.year,
        venue: show.venue,
        location: show.location,
        versions: show.allVersions || [],
        primaryIdentifier: show.identifier,
        title: show.title,
      };

      if (isShowFavorite(show.identifier)) {
        removeFavoriteShow(show.identifier);
      } else {
        addFavoriteShow(showToSave);
      }
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{show.venue || show.title}</Text>
        <Text style={styles.date}>{formatDate(show.date)}</Text>
        {show.location && <Text style={styles.location}>{show.location}</Text>}

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isShowFavorite(show.identifier) ? 'heart' : 'heart-outline'}
            size={24}
            color={isShowFavorite(show.identifier) ? '#ff6b6b' : '#fff'}
          />
          <Text style={styles.saveButtonText}>
            {isShowFavorite(show.identifier) ? 'Saved' : 'Save Show'}
          </Text>
        </TouchableOpacity>

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
        {show.tracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isPlaying={
              playerState.currentTrack?.id === track.id ||
              justPressedTrackId === track.id
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#444',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  tracksContainer: {
    paddingVertical: 16,
  },
});
