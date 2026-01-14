import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GRATEFUL_DEAD_101_DATES } from '../constants/classicShows';

type GratefulDead101ScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GratefulDead101'>;

export function GratefulDead101Screen() {
  const navigation = useNavigation<GratefulDead101ScreenNavigationProp>();
  const { showsByYear, isLoading, loadShows } = useShows();
  const [beginnerShows, setBeginnerShows] = useState<GratefulDeadShow[]>([]);

  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    if (showsByYear) {
      // Get all shows and filter for beginner-friendly shows
      const allShows: GratefulDeadShow[] = [];
      Object.keys(showsByYear).forEach(year => {
        allShows.push(...showsByYear[year]);
      });

      const beginners = allShows.filter(show => {
        // Extract just the date part (YYYY-MM-DD) from the ISO timestamp
        const dateOnly = show.date.split('T')[0];
        return GRATEFUL_DEAD_101_DATES.includes(dateOnly);
      });

      // Sort by the order in GRATEFUL_DEAD_101_DATES array
      beginners.sort((a, b) => {
        const dateA = a.date.split('T')[0];
        const dateB = b.date.split('T')[0];
        return GRATEFUL_DEAD_101_DATES.indexOf(dateA) - GRATEFUL_DEAD_101_DATES.indexOf(dateB);
      });

      setBeginnerShows(beginners);
    }
  }, [showsByYear]);

  const handleShowPress = (show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading essential shows...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="school" size={48} color="#ff6b6b" />
          <Text style={styles.headerTitle}>Grateful Dead 101</Text>
          <Text style={styles.headerSubtitle}>
            10 essential shows perfect for first-time listeners
          </Text>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            New to the Grateful Dead? Start your journey with these carefully selected performances
            that showcase the band's legendary improvisation, diverse musical styles, and electric energy.
            Each show offers a perfect introduction to what made the Dead so special.
          </Text>
        </View>

        <View style={styles.showsList}>
          {beginnerShows.map((show, index) => (
            <View key={show.date} style={styles.showItem}>
              <View style={styles.showNumber}>
                <Text style={styles.showNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.showCardContainer}>
                <ShowCard show={show} onPress={handleShowPress} />
              </View>
            </View>
          ))}
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
    paddingBottom: 180,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  description: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  descriptionText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  showsList: {
    gap: 16,
  },
  showItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  showNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  showCardContainer: {
    flex: 1,
  },
});
