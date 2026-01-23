import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatDate } from '../utils/formatters';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useShows } from '../contexts/ShowsContext';
import { useShowOfTheDay } from '../contexts/ShowOfTheDayContext';
import { PageHeader } from '../components/PageHeader';
import { StarRating } from '../components/StarRating';
import { COLORS, FONTS } from '../constants/theme';

type DiscoverLandingNavigationProp = StackNavigationProp<RootStackParamList, 'DiscoverLanding'>;

// Background images for the cards
const SHOW_OF_THE_DAY_IMAGE = require('../../assets/images/from-stage.jpg');
const CLASSIC_SHOWS_IMAGE = require('../../assets/images/red-rocks.jpg');
const GD_101_IMAGE = require('../../assets/images/wall-of-sound.jpg');

export function DiscoverLandingScreen() {
  const navigation = useNavigation<DiscoverLandingNavigationProp>();
  const { hasShowBeenPlayed, getShowPlayCount } = usePlayCounts();
  const { getShowDetail, showDetailsCache } = useShows();
  const { show, isLoading, refreshShow } = useShowOfTheDay();
  const [showPlayCount, setShowPlayCount] = useState<number>(0);

  // Calculate play count when show changes
  useEffect(() => {
    if (!show || !hasShowBeenPlayed(show.primaryIdentifier)) {
      setShowPlayCount(0);
      return;
    }

    const cachedDetails = showDetailsCache.get(show.primaryIdentifier);
    if (cachedDetails) {
      const count = getShowPlayCount(show.primaryIdentifier, cachedDetails.tracks.length);
      setShowPlayCount(count);
      return;
    }

    const fetchPlayCount = async () => {
      try {
        const details = await getShowDetail(show.primaryIdentifier);
        const count = getShowPlayCount(show.primaryIdentifier, details.tracks.length);
        setShowPlayCount(count);
      } catch (error) {
        console.error('Failed to fetch show details for play count:', error);
        setShowPlayCount(0);
      }
    };

    fetchPlayCount();
  }, [show, hasShowBeenPlayed, showDetailsCache, getShowDetail, getShowPlayCount]);

  const handleViewShow = () => {
    if (show) {
      navigation.navigate('ShowDetail', { identifier: show.primaryIdentifier });
    }
  };

  const handlePickAnother = () => {
    refreshShow();
  };

  return (
    <View style={styles.container}>
      <PageHeader title="Discover" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.cardsContainer}>
            {/* Show of the Day Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleViewShow}
              disabled={isLoading || !show}
            >
              <ImageBackground
                source={SHOW_OF_THE_DAY_IMAGE}
                style={styles.imageCard}
                imageStyle={styles.imageCardBackground}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cardGradient}
                >
                  {/* Header row with title and refresh button */}
                  <View style={styles.sotdHeaderRow}>
                    <Text style={styles.cardTitle}>Show of the Day</Text>
                    <TouchableOpacity
                      onPress={handlePickAnother}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="refresh" size={28} color={COLORS.accent} />
                    </TouchableOpacity>
                  </View>

                  {isLoading ? (
                    <View style={styles.sotdLoading}>
                      <ActivityIndicator size="large" color={COLORS.accent} />
                    </View>
                  ) : show ? (
                    <View style={styles.showInfo}>
                      <Text style={styles.showVenue} numberOfLines={1}>
                        {show.venue || show.title}
                      </Text>
                      <View style={styles.dateStarsRow}>
                        <Text style={styles.showDate}>{formatDate(show.date)}</Text>
                        {show.classicTier && (
                          <StarRating tier={show.classicTier} size={16} />
                        )}
                      </View>
                      {show.location && (
                        <Text style={styles.showLocation}>{show.location}</Text>
                      )}
                    </View>
                  ) : null}
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            {/* Classic Shows Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Classics')}
            >
              <ImageBackground
                source={CLASSIC_SHOWS_IMAGE}
                style={styles.imageCard}
                imageStyle={styles.imageCardBackground}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cardGradient}
                >
                  <Text style={styles.cardTitle}>Classic Shows</Text>
                  <Text style={styles.cardDescription}>
                    Browse legendary performances from different eras.
                  </Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            {/* Grateful Dead 101 Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('GratefulDead101')}
            >
              <ImageBackground
                source={GD_101_IMAGE}
                style={styles.imageCard}
                imageStyle={styles.imageCardBackground}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cardGradient}
                >
                  <Text style={styles.cardTitle}>Grateful Dead 101</Text>
                  <Text style={styles.cardDescription}>
                    Get on the bus with 10 essential shows.
                  </Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  cardsContainer: {
    gap: 20,
  },
  imageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 180,
  },
  imageCardBackground: {
    borderRadius: 12,
  },
  cardGradient: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    minHeight: 180,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '500',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    opacity: 0.8,
    lineHeight: 22,
  },
  sotdHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingBottom: 6,
    marginBottom: 12,
  },
  sotdLoading: {
    paddingVertical: 30,
    alignItems: 'flex-start',
  },
  showInfo: {
    gap: 4,
  },
  showVenue: {
    fontSize: 22,
    fontWeight: '500',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  dateStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  showDate: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    opacity: 0.7,
  },
  showLocation: {
    fontSize: 16,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    opacity: 0.7,
  },
});
