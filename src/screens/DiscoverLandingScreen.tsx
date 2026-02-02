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
import { formatDate, getVenueFromShow } from '../utils/formatters';
import { usePlayCounts } from '../contexts/PlayCountsContext';
import { useShows } from '../contexts/ShowsContext';
import { useShowOfTheDay } from '../contexts/ShowOfTheDayContext';
import { usePlayer } from '../contexts/PlayerContext';
import { PageHeader } from '../components/PageHeader';
import { StarRating } from '../components/StarRating';
import { radioService } from '../services/radioService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { logger } from '../utils/logger';

type DiscoverLandingNavigationProp = StackNavigationProp<RootStackParamList, 'DiscoverLanding'>;

// Background images for the cards
const SHOW_OF_THE_DAY_IMAGE = require('../../assets/images/from-stage.jpg');
const CLASSIC_SHOWS_IMAGE = require('../../assets/images/red-rocks.jpg');
const GD_101_IMAGE = require('../../assets/images/wall-of-sound.jpg');
const RADIO_IMAGE = require('../../assets/images/radio.webp');

export const DiscoverLandingScreen = React.memo(function DiscoverLandingScreen() {
  const navigation = useNavigation<DiscoverLandingNavigationProp>();
  const { hasShowBeenPlayed, getShowPlayCount } = usePlayCounts();
  const { getShowDetail, showDetailsCache } = useShows();
  const { show, isLoading, refreshShow } = useShowOfTheDay();
  const { startRadio, isRadioMode, state: playerState } = usePlayer();
  const [showPlayCount, setShowPlayCount] = useState<number>(0);

  const handleRadioPress = async () => {
    await startRadio();
  };

  // Prefetch radio tracks in the background for instant start
  useEffect(() => {
    radioService.prefetch(10);
  }, []);

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
        logger.api.error('Failed to fetch show details for play count:', error);
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
              accessibilityRole="button"
              accessibilityLabel={show ? `Show of the Day: ${getVenueFromShow(show)}, ${formatDate(show.date)}` : 'Show of the Day: Loading'}
              accessibilityHint="Double tap to view this show"
              accessibilityState={{ disabled: isLoading || !show }}
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
                      accessibilityRole="button"
                      accessibilityLabel="Pick another show"
                      accessibilityHint="Double tap to get a different random show"
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
                        {getVenueFromShow(show)}
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

            {/* Radio Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleRadioPress}
              disabled={playerState.isRadioLoading}
              accessibilityRole="button"
              accessibilityLabel={isRadioMode ? 'Radio: Now Playing' : 'Radio: Non-stop legendary performances'}
              accessibilityHint="Double tap to start radio mode"
              accessibilityState={{ disabled: playerState.isRadioLoading }}
            >
              <ImageBackground
                source={RADIO_IMAGE}
                style={styles.smallImageCard}
                imageStyle={styles.imageCardBackground}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.smallCardGradient}
                >
                  <View style={styles.radioTitleRow}>
                    <Ionicons name="radio" size={24} color={COLORS.textPrimary} style={styles.radioIcon} />
                    <Text style={styles.cardTitle}>Radio</Text>
                    {isRadioMode && (
                      <View style={styles.nowPlayingBadge}>
                        <Text style={styles.nowPlayingText}>Now Playing</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDescription}>
                    {playerState.isRadioLoading ? 'Loading...' : 'The music never stops.'}
                  </Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            {/* Classic Shows Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Classics')}
              accessibilityRole="button"
              accessibilityLabel="Classic Shows: Legendary shows from different eras"
              accessibilityHint="Double tap to browse classic shows"
            >
              <ImageBackground
                source={CLASSIC_SHOWS_IMAGE}
                style={styles.smallImageCard}
                imageStyle={styles.imageCardBackground}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.smallCardGradient}
                >
                  <Text style={styles.cardTitle}>Classic Shows</Text>
                  <Text style={styles.cardDescription}>
                    Legendary shows from different eras.
                  </Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            {/* Grateful Dead 101 Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('GratefulDead101')}
              accessibilityRole="button"
              accessibilityLabel="Grateful Dead 101: Get on the bus with 10 essential shows"
              accessibilityHint="Double tap to view essential shows for beginners"
            >
              <ImageBackground
                source={GD_101_IMAGE}
                style={styles.smallImageCard}
                imageStyle={styles.imageCardBackground}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.smallCardGradient}
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 184,
  },
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  cardsContainer: {
    gap: SPACING.xl,
  },
  imageCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    minHeight: 180,
  },
  smallImageCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    minHeight: 120,
  },
  imageCardBackground: {
    borderRadius: RADIUS.md,
  },
  cardGradient: {
    flex: 1,
    padding: SPACING.xxl,
    justifyContent: 'center',
    minHeight: 180,
  },
  smallCardGradient: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    justifyContent: 'center',
    minHeight: 120,
  },
  cardTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: '500',
    fontSize: 26,
    marginBottom: SPACING.sm,
  },
  cardDescription: {
    ...TYPOGRAPHY.body,
    opacity: 0.8,
    lineHeight: 22,
  },
  sotdHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderMedium,
    paddingBottom: SPACING.sm - 2,
    marginBottom: SPACING.md,
  },
  sotdLoading: {
    paddingVertical: 30,
    alignItems: 'flex-start',
  },
  showInfo: {
    gap: SPACING.xs,
  },
  showVenue: {
    ...TYPOGRAPHY.heading3,
    fontWeight: '500',
    fontSize: 22,
  },
  dateStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  showDate: {
    ...TYPOGRAPHY.body,
    opacity: 0.7,
  },
  showLocation: {
    ...TYPOGRAPHY.body,
    opacity: 0.7,
  },
  radioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioIcon: {
    marginRight: SPACING.sm,
  },
  nowPlayingBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.md,
  },
  nowPlayingText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
});
