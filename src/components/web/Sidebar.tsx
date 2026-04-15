import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../navigation/navigationRef';
import { useAuth } from '../../contexts/AuthContext';
import { profileService, UserProfile } from '../../services/profileService';
import { useWebAuthModal } from './WebAuthModal';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, WEB_LAYOUT } from '../../constants/theme';

interface SidebarItem {
  key: string;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS: SidebarItem[] = [
  { key: 'DiscoverTab', label: 'Discover', iconActive: 'compass', iconInactive: 'compass-outline' },
  { key: 'ShowsTab', label: 'Shows', iconActive: 'albums', iconInactive: 'albums-outline' },
  { key: 'SongsTab', label: 'Songs', iconActive: 'musical-notes', iconInactive: 'musical-notes-outline' },
  { key: 'FavoritesTab', label: 'Favorites', iconActive: 'heart', iconInactive: 'heart-outline' },
];

const appIcon = require('../../../assets/images/sign-in-logo.png');

interface SidebarProps {
  activeTab: string;
  onNavigate: (tabKey: string) => void;
}

export const Sidebar = React.memo(function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ bottom: 0, left: 0 });
  const settingsRef = useRef<View>(null);
  const { state: authState, logout } = useAuth();
  const { openAuthModal } = useWebAuthModal();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!authState.user?.id) {
      setProfile(null);
      return;
    }
    profileService.getUserProfile(authState.user.id).then(setProfile).catch(() => {});
  }, [authState.user?.id]);

  const handleProfileNav = useCallback(() => {
    setShowDropdown(false);
    if (profile?.username && navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'PublicProfile', params: { username: profile.username } }] })
      );
    }
  }, [profile?.username]);

  const handleSettingsPress = useCallback(() => {
    const node = settingsRef.current as any;
    const domNode = node?.getNode?.() || node;
    const rect = domNode?.getBoundingClientRect?.();
    if (rect) {
      setDropdownPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }
    setShowDropdown(prev => !prev);
  }, []);

  const handleSettingsNav = useCallback(() => {
    setShowDropdown(false);
    onNavigate('Settings');
  }, [onNavigate]);

  const handleLogout = useCallback(async () => {
    setShowDropdown(false);
    await logout();
  }, [logout]);

  const handleLogin = useCallback(() => {
    setShowDropdown(false);
    openAuthModal('login');
  }, [openAuthModal]);

  const handleSignup = useCallback(() => {
    setShowDropdown(false);
    openAuthModal('signup');
  }, [openAuthModal]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={appIcon} style={styles.logoIcon} />
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              onPress={() => onNavigate(item.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={isActive ? item.iconActive : item.iconInactive}
                  size={21}
                  color={isActive ? COLORS.textPrimary : '#999'}
                />
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {authState.isAuthenticated && profile?.username && (
          <TouchableOpacity
            style={styles.navItem}
            onPress={handleProfileNav}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={activeTab === 'ProfileTab' ? 'person' : 'person-outline'}
                size={21}
                color={activeTab === 'ProfileTab' ? COLORS.textPrimary : '#999'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'ProfileTab' && styles.navLabelActive,
              ]}
            >
              My Profile
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          ref={settingsRef}
          style={styles.navItem}
          onPress={handleSettingsPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name={activeTab === 'Settings' ? 'settings' : 'settings-outline'}
              size={21}
              color={activeTab === 'Settings' ? COLORS.textPrimary : '#999'}
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'Settings' && styles.navLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showDropdown} transparent animationType="none" onRequestClose={() => setShowDropdown(false)}>
        <Pressable style={styles.clickAway} onPress={() => setShowDropdown(false)}>
          <View style={[styles.dropdown, { bottom: dropdownPos.bottom, left: dropdownPos.left }]}>
            {authState.isAuthenticated ? (
              <>
                {profile?.is_public && profile.username && (
                  <>
                    <TouchableOpacity style={styles.dropdownItem} onPress={handleProfileNav} activeOpacity={0.7}>
                      <Text style={styles.dropdownText}>My Profile</Text>
                    </TouchableOpacity>
                    <View style={styles.dropdownDivider} />
                  </>
                )}
                <TouchableOpacity style={styles.dropdownItem} onPress={handleSettingsNav} activeOpacity={0.7}>
                  <Text style={styles.dropdownText}>Settings</Text>
                </TouchableOpacity>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout} activeOpacity={0.7}>
                  <Text style={styles.dropdownTextRed}>Log Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.dropdownItem} onPress={handleLogin} activeOpacity={0.7}>
                  <Text style={styles.dropdownText}>Log In</Text>
                </TouchableOpacity>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity style={styles.dropdownItem} onPress={handleSignup} activeOpacity={0.7}>
                  <Text style={styles.dropdownText}>Sign Up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: WEB_LAYOUT.sidebarWidth,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: WEB_LAYOUT.sidebarRadius,
    paddingTop: 0,
  },
  logoContainer: {
    paddingLeft: 10,
    paddingTop: 7,
    paddingBottom: 50,
  },
  logoIcon: {
    width: 61,
    height: 61,
    borderRadius: 8,
  },
  nav: {
    gap: 23,
    paddingHorizontal: 13,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    paddingTop: 2,
  },
  navLabel: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '500',
    fontSize: 20,
    color: '#999',
  },
  navLabelActive: {
    color: COLORS.textPrimary,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingHorizontal: 13,
    paddingBottom: 20,
  },
  clickAway: {
    flex: 1,
  },
  dropdown: {
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
    // @ts-ignore
    cursor: 'pointer',
  },
  dropdownText: {
    ...TYPOGRAPHY.body,
    // @ts-ignore
    whiteSpace: 'nowrap',
  },
  dropdownTextRed: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    // @ts-ignore
    whiteSpace: 'nowrap',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});
