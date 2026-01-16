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
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { EraPicker } from '../components/EraPicker';
import { GratefulDeadShow } from '../types/show.types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ERAS, CLASSIC_SHOW_DATES, Era } from '../constants/classicShows';

type ClassicsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Classics'>;

export function ClassicsScreen() {
  const navigation = useNavigation<ClassicsScreenNavigationProp>();
  const { showsByYear, isLoading, loadShows } = useShows();
  const [classicShows, setClassicShows] = useState<GratefulDeadShow[]>([]);
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);

  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    if (showsByYear) {
      // Get all shows and filter for classic shows
      const allShows: GratefulDeadShow[] = [];
      Object.keys(showsByYear).forEach(year => {
        allShows.push(...showsByYear[year]);
      });

      const classics = allShows.filter(show => {
        // Extract just the date part (YYYY-MM-DD) from the ISO timestamp
        const dateOnly = show.date.split('T')[0];
        return CLASSIC_SHOW_DATES.includes(dateOnly);
      });

      // Sort by date
      classics.sort((a, b) => a.date.localeCompare(b.date));
      setClassicShows(classics);
    }
  }, [showsByYear]);

  const handleShowPress = (show: GratefulDeadShow) => {
    navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
  };

  const handleEraChange = (era: Era | null) => {
    setSelectedEra(era);
  };

  const getDisplayShows = () => {
    if (selectedEra) {
      return classicShows.filter(show => {
        const showYear = parseInt(show.year);
        return showYear >= selectedEra.startYear && showYear <= selectedEra.endYear;
      });
    }
    return classicShows;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading classic shows...</Text>
      </View>
    );
  }

  const displayShows = getDisplayShows();

  return (
    <View style={styles.container}>
      {/* Era Picker */}
      <EraPicker
        eras={ERAS}
        selectedEra={selectedEra}
        onEraChange={handleEraChange}
      />

      {/* Classic Shows List */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.showsList}>
            {displayShows.map((show) => (
              <ShowCard key={show.date} show={show} onPress={handleShowPress} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
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
    paddingVertical: 8,
  },
  showsList: {
    gap: 0,
  },
});
