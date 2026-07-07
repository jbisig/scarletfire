import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileImage } from './ProfileImage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';

export interface ScreenHeaderProps {
  /** Screen title shown next to the avatar (e.g. "Shows", "Favorites"). */
  title: string;
  isDesktop: boolean;
  /** Usually `insets.top + 8`. */
  topPadding: number;
  /** Measures the header row's rendered width — screens use this to size their search bar. */
  onHeaderLayout: (event: LayoutChangeEvent) => void;
  /** Raises the left/right sides above each other while the search bar is expanded. */
  isSearchExpanded: boolean;
  profileButtonRef: React.RefObject<View | null>;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  onProfilePress: () => void;
  /**
   * Right-side controls (search bar, filter/share buttons, ...). Each screen composes
   * its own set/order here since the buttons and their visibility rules genuinely differ
   * per screen.
   */
  rightContent: React.ReactNode;
  /** Gradient fade under the header row. Home shows it; Favorites doesn't. Defaults to true. */
  showGradient?: boolean;
  /** Extra content rendered below the header row, inside the same section (e.g. tab bar). */
  children?: React.ReactNode;
}

/**
 * Shared shell for the avatar/title/search/filter header used by HomeScreen and
 * FavoritesScreen. Intentionally does not own `useProfileDropdown` or render
 * `<ProfileDropdown>` itself — screens that need dropdown state for other purposes
 * (e.g. FavoritesScreen's share-profile flow) keep the hook call and pass down props.
 */
export function ScreenHeader({
  title,
  isDesktop,
  topPadding,
  onHeaderLayout,
  isSearchExpanded,
  profileButtonRef,
  avatarUrl,
  isAuthenticated,
  onProfilePress,
  rightContent,
  showGradient = true,
  children,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop, { paddingTop: topPadding }]}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]} onLayout={onHeaderLayout}>
        {/* Left side: Avatar and Title (gets covered by search bar) */}
        <View style={[styles.headerLeft, isDesktop && styles.headerLeftDesktop, isSearchExpanded && { zIndex: 0 }]}>
          {!isDesktop && (
            <TouchableOpacity
              ref={profileButtonRef}
              onPress={onProfilePress}
              activeOpacity={0.8}
            >
              <ProfileImage
                uri={isAuthenticated ? avatarUrl : null}
                style={styles.avatar}
              />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Right side: screen-specific search/filter/share controls */}
        <View style={[styles.headerRight, isSearchExpanded && { zIndex: 30 }]}>
          {rightContent}
        </View>
      </View>

      {children}

      {showGradient && (
        <LinearGradient
          colors={[COLORS.background, COLORS.background + '00']}
          locations={[0, 1]}
          style={[styles.headerGradient, isDesktop && styles.headerGradientDesktop]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    zIndex: 10,
    backgroundColor: COLORS.background,
  },
  headerSectionDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
  headerDesktop: {
    paddingHorizontal: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    position: 'absolute',
    left: LAYOUT.HORIZONTAL_PADDING,
    top: 0,
    bottom: SPACING.lg,
    zIndex: 20,
  },
  headerLeftDesktop: {
    left: 32,
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBackground,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading2,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: LAYOUT.headerButtonGap,
    zIndex: 10,
  },
  headerGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  headerGradientDesktop: {
    display: 'none',
  },
});
