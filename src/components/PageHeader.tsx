import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

// Default profile image for logged out users
const LOGGED_OUT_PROFILE = require('../../assets/images/logged-out-pfp.png');

interface PageHeaderProps {
  title: string;
}

export const PageHeader = React.memo(function PageHeader({ title }: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const {
    profileButtonRef,
    avatarUrl,
    isAuthenticated,
    dropdownState,
    handleProfilePress,
    handleLogout,
    handleLogin,
    handleSettings,
    closeDropdown,
  } = useProfileDropdown();

  return (
    <>
      <View style={styles.headerSection}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            ref={profileButtonRef}
            onPress={handleProfilePress}
            activeOpacity={0.8}
          >
            <Image
              source={isAuthenticated && avatarUrl
                ? { uri: avatarUrl }
                : LOGGED_OUT_PROFILE
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Gradient fade overlay */}
        <LinearGradient
          colors={[COLORS.background, 'transparent']}
          locations={[0, 1]}
          style={styles.headerGradient}
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
      />
    </>
  );
});

const styles = StyleSheet.create({
  headerSection: {
    zIndex: 10,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  headerGradient: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBackground,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading2,
  },
});
