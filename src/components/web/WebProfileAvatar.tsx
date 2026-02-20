import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Pressable, Modal } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../navigation/navigationRef';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { useWebAuthModal } from './WebAuthModal';
import { ProfileImage } from '../ProfileImage';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export const WebProfileAvatar = React.memo(function WebProfileAvatar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const avatarRef = useRef<View>(null);
  const { state: authState, logout } = useAuth();
  const avatarUrl = profileService.getAvatarUrl(authState.user);
  const { openAuthModal } = useWebAuthModal();

  const handleProfilePress = useCallback(() => {
    // Measure avatar position to place dropdown below it
    const node = avatarRef.current as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const domNode = node?.getNode?.() || node;
    const rect = domNode?.getBoundingClientRect?.();
    if (rect) {
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setShowDropdown(prev => !prev);
  }, []);

  const handleLogin = useCallback(() => {
    setShowDropdown(false);
    openAuthModal('login');
  }, [openAuthModal]);

  const handleSignup = useCallback(() => {
    setShowDropdown(false);
    openAuthModal('signup');
  }, [openAuthModal]);

  const handleLogout = useCallback(async () => {
    setShowDropdown(false);
    await logout();
  }, [logout]);

  const handleSettings = useCallback(() => {
    setShowDropdown(false);
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Settings' }] })
      );
    }
  }, []);

  return (
    <View style={styles.container} ref={avatarRef}>
      <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8} style={styles.avatarWrapper}>
        <ProfileImage
          uri={authState.isAuthenticated ? avatarUrl : null}
          style={styles.avatarImage}
        />
      </TouchableOpacity>

      <Modal visible={showDropdown} transparent animationType="none" onRequestClose={() => setShowDropdown(false)}>
        <Pressable style={styles.clickAway} onPress={() => setShowDropdown(false)}>
          <View style={[styles.dropdown, { top: dropdownPos.top, right: dropdownPos.right }]}>
            {authState.isAuthenticated ? (
              <>
                <TouchableOpacity style={styles.dropdownItem} onPress={handleSettings} activeOpacity={0.7}>
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
    position: 'relative',
    zIndex: 100,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    // @ts-ignore
    cursor: 'pointer',
  },
  avatarImage: {
    width: 36,
    height: 36,
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
