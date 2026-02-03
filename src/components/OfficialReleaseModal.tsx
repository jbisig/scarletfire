import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Pressable,
  Image,
  Animated,
  Dimensions,
  PanResponder,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfficialRelease } from '../data/officialReleases';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, BRAND_COLORS } from '../constants/theme';
import { GESTURE_THRESHOLDS } from '../constants/thresholds';
import { logger } from '../utils/logger';
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

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const isDismissingRef = useRef(false);

  // Combined position = slide position + drag offset
  const translateY = Animated.add(slideAnim, dragOffset);

  useEffect(() => {
    if (visible) {
      isDismissingRef.current = false;
      setShouldRender(true);
      dragOffset.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
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
    } else if (shouldRender && !isDismissingRef.current) {
      // Animate out if not already dismissing via gesture
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
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
      setShouldRender(false);
      onClose();
      dragOffset.setValue(0);
    });
  };

  // Swipe down to dismiss - smooth like FullPlayer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture if dragging down
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        dragOffset.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          dragOffset.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldDismiss =
          gestureState.dy > GESTURE_THRESHOLDS.DISMISS_DISTANCE ||
          gestureState.vy > GESTURE_THRESHOLDS.DISMISS_VELOCITY;

        if (shouldDismiss) {
          isDismissingRef.current = true;
          // Calculate remaining distance and use velocity for natural feel
          const remainingDistance = SCREEN_HEIGHT - gestureState.dy;
          const velocity = Math.max(gestureState.vy, 0.4);
          const duration = Math.min(400, Math.max(200, remainingDistance / velocity / 1.5));

          // Slide off screen with easing
          Animated.parallel([
            Animated.timing(dragOffset, {
              toValue: SCREEN_HEIGHT,
              duration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShouldRender(false);
            onClose();
            dragOffset.setValue(0);
            slideAnim.setValue(SCREEN_HEIGHT);
          });
        } else {
          // Snap back with a snappy spring
          Animated.spring(dragOffset, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Snap back if gesture is interrupted
        Animated.spring(dragOffset, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      logger.api.error('Failed to open link:', error);
    }
  };

  const renderReleaseInfo = (release: OfficialRelease, index: number) => (
    <View key={`info-${release.name}-${index}`} style={styles.releaseCard}>
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
            <Ionicons name="disc" size={32} color={COLORS.accent} />
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
    </View>
  );

  const renderStreamingButtons = (release: OfficialRelease, index: number) => (
    <View key={`buttons-${release.name}-${index}`}>
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
            Not available on streaming services
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible || shouldRender}
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
          { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
        ]}
      >
        {/* Draggable area - everything above the buttons */}
        <View {...panResponder.panHandlers} style={styles.dragHandle}>
          <View style={styles.handleBar} />

          {/* Release info (album art + show details) */}
          {releases.map((release, index) => renderReleaseInfo(release, index))}
        </View>

        {/* Streaming buttons - not draggable */}
        {releases.map((release, index) => renderStreamingButtons(release, index))}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.backdrop,
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
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    maxHeight: '70%',
  },
  dragHandle: {
    // Draggable area for swipe-to-dismiss
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.xxl,
  },
  releaseCard: {
    marginBottom: SPACING.xl,
  },
  releaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: SPACING.xxl,
  },
  albumArt: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
  },
  albumArtPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  releaseInfo: {
    flex: 1,
  },
  releaseTitle: {
    ...TYPOGRAPHY.heading4,
    marginBottom: SPACING.sm - 2,
  },
  showDetail: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  streamingSection: {
  },
  streamingButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  spotifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_COLORS.spotify,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
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
    backgroundColor: BRAND_COLORS.appleMusic,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  buttonText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noStreamingText: {
    ...TYPOGRAPHY.labelSmall,
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
