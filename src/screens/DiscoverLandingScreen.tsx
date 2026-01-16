import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { archiveApi } from '../services/archiveApi';
import { GratefulDeadShow } from '../types/show.types';
import { formatDate } from '../utils/formatters';

type DiscoverLandingNavigationProp = StackNavigationProp<RootStackParamList, 'DiscoverLanding'>;

export function DiscoverLandingScreen() {
  const navigation = useNavigation<DiscoverLandingNavigationProp>();
  const [show, setShow] = useState<GratefulDeadShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadShowOfTheDay();
  }, []);

  const loadShowOfTheDay = async () => {
    setIsLoading(true);

    try {
      // Fetch top 365 most downloaded shows
      const topShows = await archiveApi.getTopShows(365);

      if (topShows.length === 0) {
        return;
      }

      // Select a random show
      const randomIndex = Math.floor(Math.random() * topShows.length);
      const selectedShow = topShows[randomIndex];

      setShow(selectedShow);
    } catch (err) {
      console.error('Error loading show of the day:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewShow = () => {
    if (show) {
      navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
    }
  };

  const handlePickAnother = () => {
    loadShowOfTheDay();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Navigation Cards */}
        <View style={styles.cardsContainer}>
          {/* Show of the Day Card */}
          <View style={styles.sotdCard}>
            <View style={styles.sotdHeader}>
              <Text style={styles.sotdTitle}>Show of the Day</Text>
            </View>

            {isLoading ? (
              <View style={styles.sotdLoading}>
                <ActivityIndicator size="large" color="#ff6b6b" />
              </View>
            ) : show ? (
              <>
                <View style={styles.showInfo}>
                  <Text style={styles.showDate}>{formatDate(show.date)}</Text>
                  <Text style={styles.showVenue}>{show.venue || show.title}</Text>
                  {show.location && (
                    <Text style={styles.showLocation}>{show.location}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={handleViewShow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewButtonText}>View Show</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pickAnotherButton}
                  onPress={handlePickAnother}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickAnotherButtonText}>Pick Another Show</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          {/* Classics Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Classics')}
            activeOpacity={0.7}
          >
            <Text style={styles.cardTitle}>Classic Shows</Text>
            <Text style={styles.cardDescription}>
              Browse 47 legendary performances from different eras of the band's history
            </Text>
          </TouchableOpacity>

          {/* Grateful Dead 101 Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('GratefulDead101')}
            activeOpacity={0.7}
          >
            <Text style={styles.cardTitle}>Grateful Dead 101</Text>
            <Text style={styles.cardDescription}>
              10 essential shows perfect for first-time listeners and newcomers
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 33,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#999',
    lineHeight: 22,
  },
  sotdCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  sotdHeader: {
    marginBottom: 20,
  },
  sotdTitle: {
    fontSize: 33,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
  },
  sotdLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  showInfo: {
    marginBottom: 16,
  },
  showDate: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
    marginBottom: 8,
  },
  showVenue: {
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'FamiljenGrotesk',
    color: '#ffffff',
    marginBottom: 6,
  },
  showLocation: {
    fontSize: 15,
    color: '#999',
  },
  viewButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pickAnotherButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  pickAnotherButtonText: {
    fontSize: 15,
    color: '#ff6b6b',
    fontWeight: '600',
  },
});
