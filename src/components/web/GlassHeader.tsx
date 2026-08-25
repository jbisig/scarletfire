import React from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

export interface GlassHeaderProps {
  /**
   * Background element (a `WebVideoBackground` or `ImageBackground`, etc). GlassHeader
   * owns the absolute-fill + 0.68 opacity wrapper around it, so the element itself should
   * NOT apply its own opacity/position styling — pass it "bare" (e.g. `style={{ flex: 1 }}`
   * for an `ImageBackground`). Omit entirely (e.g. while a video URI resolves) to render
   * just the blur overlay with no background layer.
   */
  background?: React.ReactNode;
  onBackPress: () => void;
  isDesktop?: boolean;
  /**
   * Gap between the back-chevron row and the content below it. ShowDetailScreen uses 24,
   * CollectionDetailScreen uses 20 — a genuine (small) visual difference between the two,
   * so it's a prop rather than a hard-coded value.
   */
  contentGap?: number;
  /** Extra overrides for the content wrapper (e.g. CollectionDetailScreen's native insets.top padding). */
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  /**
   * Fade the lower part of the header into the page background so the
   * content below (e.g. a track list) continues without a hard edge.
   */
  fadeToBackground?: boolean;
  /** Trailing control(s) in the nav row, opposite the back chevron. */
  navRight?: React.ReactNode;
  /**
   * Hide the built-in back-chevron nav row — for screens that render their own
   * sticky nav bar over the header (e.g. CollectionDetailScreen on native).
   */
  hideNav?: boolean;
}

/**
 * Full-bleed "glass" header: a background layer at 0.68 opacity, a
 * rgba(0,0,0,0.4) + blur(30px) overlay, and a zIndex-2 content area starting
 * with a back-chevron nav row. Shared by ShowDetailScreen and
 * CollectionDetailScreen. The show-of-the-day card used to borrow the overlay
 * piece from here; it darkens with CARD_SCRIM now, to match the carousel cards
 * beside it.
 */
export function GlassHeader({
  background,
  onBackPress,
  isDesktop,
  contentGap = 24,
  contentStyle,
  children,
  fadeToBackground = false,
  navRight,
  hideNav = false,
}: GlassHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {background ? <View style={styles.backgroundLayer}>{background}</View> : null}
      <GlassBlurOverlay />
      {fadeToBackground && (
        <LinearGradient
          colors={['rgba(18, 18, 18, 0)', COLORS.background]}
          locations={[0.25, 1]}
          style={styles.fade}
        />
      )}
      <View
        style={[
          styles.content,
          isDesktop && styles.contentDesktop,
          { gap: contentGap },
          contentStyle,
        ]}
      >
        {!hideNav && (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={onBackPress} activeOpacity={0.7} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            {navRight}
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

/** The rgba(0,0,0,0.4) + blur(30px) overlay piece on its own, for surfaces that don't fit the full GlassHeader shape (e.g. DiscoverLandingScreen's show-of-the-day card). */
export function GlassBlurOverlay() {
  return <View style={styles.blurOverlay} />;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.68,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    // @ts-ignore - web only
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    zIndex: 1,
  },
  fade: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  contentDesktop: {
    paddingHorizontal: 40,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    // @ts-ignore - web only
    cursor: 'pointer',
  },
});
