import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

// Default profile image for logged out users
const LOGGED_OUT_PROFILE = require('../../assets/images/logged-out-pfp.png');

interface PageHeaderProps {
  title: string;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const PageHeader = React.memo(function PageHeader({ title }: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { state: authState, logout, showLogin } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profileButtonPosition, setProfileButtonPosition] = useState({ top: 0, left: 0 });
  const profileButtonRef = useRef<View>(null);

  const avatarUrl = profileService.getAvatarUrl(authState.user);

  const handleProfilePress = () => {
    profileButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setProfileButtonPosition({ top: pageY + height + 8, left: pageX });
      setShowProfileDropdown(true);
    });
  };

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    await logout();
  };

  const handleLogin = async () => {
    setShowProfileDropdown(false);
    await showLogin();
  };

  const handleSettings = () => {
    setShowProfileDropdown(false);
    navigation.navigate('Settings');
  };

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
              source={authState.isAuthenticated && avatarUrl
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

      {/* Profile Dropdown */}
      <Modal
        visible={showProfileDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileDropdown(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setShowProfileDropdown(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              { top: profileButtonPosition.top, left: 16 }
            ]}
          >
            {authState.isAuthenticated ? (
              <>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleSettings}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>Settings</Text>
                </TouchableOpacity>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemTextRed}>Log Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownItemText}>Log In</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
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
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    minWidth: 150,
    ...SHADOWS.lg,
  },
  dropdownItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dropdownItemText: {
    ...TYPOGRAPHY.body,
  },
  dropdownItemTextRed: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});
