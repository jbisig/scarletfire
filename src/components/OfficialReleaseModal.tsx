import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Pressable,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfficialRelease } from '../data/officialReleases';
import { COLORS, FONTS } from '../constants/theme';
import { formatDate, getVenueFromShow } from '../utils/formatters';

interface ShowInfo {
  title?: string;
  venue?: string;
  date: string;
  location?: string;
}

interface OfficialReleaseModalProps {
  visible: boolean;
  releases: OfficialRelease[];
  show?: ShowInfo;
  onClose: () => void;
}

/**
 * Modal showing official release details with streaming links
 */
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const OfficialReleaseModal: React.FC<OfficialReleaseModalProps> = ({
  visible,
  releases,
  show,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const venueName = show ? getVenueFromShow(show) : null;

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  const renderRelease = (release: OfficialRelease, index: number) => (
    <View key={`${release.name}-${index}`} style={styles.releaseCard}>
      {/* Album art and show details */}
      <View style={styles.releaseHeader}>
        {release.artwork ? (
          <Image
            source={{ uri: release.artwork }}
            style={styles.albumArt}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.albumArtPlaceholder}>
            <Ionicons name="disc" size={32} color="#FFD700" />
          </View>
        )}
        <View style={styles.releaseInfo}>
          {/* Release title - large bold */}
          <Text style={styles.releaseTitle} numberOfLines={2}>
            {release.name}
          </Text>
          {/* Venue name - same style as date/location */}
          {venueName && (
            <Text style={styles.showDetail} numberOfLines={1}>
              {venueName}
            </Text>
          )}
          {/* Date */}
          {show && (
            <Text style={styles.showDetail}>{formatDate(show.date)}</Text>
          )}
          {/* Location */}
          {show?.location && (
            <Text style={styles.showDetail} numberOfLines={1}>
              {show.location}
            </Text>
          )}
        </View>
      </View>

      {/* Streaming links */}
      <View style={styles.streamingSection}>
        <View style={styles.streamingButtons}>
          {release.streaming?.spotify && (
            <TouchableOpacity
              style={styles.spotifyButton}
              onPress={() => handleOpenLink(release.streaming!.spotify!)}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../assets/images/Spotify_Logo_White.png')}
                style={styles.spotifyLogo}
                resizeMode="contain"
              />
              <Text style={styles.buttonText}>Spotify</Text>
            </TouchableOpacity>
          )}
          {release.streaming?.appleMusic && (
            <TouchableOpacity
              style={styles.appleMusicButton}
              onPress={() => handleOpenLink(release.streaming!.appleMusic!)}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Apple Music</Text>
            </TouchableOpacity>
          )}
        </View>
        {!release.streaming?.spotify && !release.streaming?.appleMusic && (
          <Text style={styles.noStreamingText}>
            No streaming links available
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={styles.backdropPressable} onPress={handleClose} />
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.container,
          { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Official Release</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Release list */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {releases.map((release, index) => renderRelease(release, index))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '70%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flexGrow: 0,
  },
  releaseCard: {
    marginBottom: 20,
  },
  releaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  albumArt: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  albumArtPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  releaseInfo: {
    flex: 1,
  },
  releaseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  showDetail: {
    fontSize: 14,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  streamingSection: {
  },
  streamingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  spotifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
  },
  spotifyLogo: {
    height: 20,
    width: 20,
  },
  appleMusicButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC3C44',
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.secondary,
    color: '#FFFFFF',
  },
  noStreamingText: {
    fontSize: 13,
    fontFamily: FONTS.secondary,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
