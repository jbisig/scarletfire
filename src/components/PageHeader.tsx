import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { useResponsive } from '../hooks/useResponsive';
import { ProfileDropdown } from './ProfileDropdown';
import { ProfileImage } from './ProfileImage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';

// Match HomeScreen's horizontal padding
const HORIZONTAL_PADDING = SPACING.xl;

interface PageHeaderProps {
  title: string;
}

/**
 * Reusable page header component that matches the Shows screen header layout.
 * Uses the same structure as HomeScreen but without search/filter buttons.
 */
export const PageHeader = React.memo(function PageHeader({ title }: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const {
    profileButtonRef,
    avatarUrl,
    isAuthenticated,
    dropdownState,
    handleProfilePress,
    handleLogout,
    handleLogin,
    handleSettings,
    handleViewProfile,
    closeDropdown,
  } = useProfileDropdown();

  return (
    <>
      <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          {/* Left side: Avatar and Title - matches HomeScreen headerLeft */}
          <View style={[styles.headerLeft, isDesktop && styles.headerLeftDesktop]}>
            {!isDesktop && (
              <TouchableOpacity
                ref={profileButtonRef}
                onPress={handleProfilePress}
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

          {/* Spacer to maintain header height (matches headerRight button height) */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Gradient fade overlay */}
        <LinearGradient
          colors={[COLORS.background, COLORS.background + '00']}
          locations={[0, 1]}
          style={[styles.headerGradient, isDesktop && styles.headerGradientDesktop]}
          pointerEvents="none"
        />
      </View>

      <ProfileDropdown
        state={dropdownState}
        isAuthenticated={isAuthenticated}
        onClose={closeDropdown}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSettings={handleSettings}
        onViewProfile={handleViewProfile}
      />
    </>
  );
});

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
    paddingHorizontal: HORIZONTAL_PADDING,
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
    left: HORIZONTAL_PADDING,
    top: 0,
    bottom: SPACING.lg,
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
  headerSpacer: {
    // Match the height of AnimatedSearchBar (headerButtonSize + 4) to maintain consistent header height
    height: LAYOUT.headerButtonSize + 4,
    marginLeft: 'auto',
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
