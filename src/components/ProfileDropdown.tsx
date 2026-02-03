import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { ProfileDropdownState } from '../hooks/useProfileDropdown';

interface ProfileDropdownProps {
  state: ProfileDropdownState;
  isAuthenticated: boolean;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

export const ProfileDropdown = React.memo<ProfileDropdownProps>(function ProfileDropdown({
  state,
  isAuthenticated,
  onClose,
  onLogin,
  onLogout,
  onSettings,
}) {
  return (
    <Modal
      visible={state.isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.container,
            { top: state.position.top, left: 16 }
          ]}
        >
          {isAuthenticated ? (
            <>
              <TouchableOpacity
                style={styles.item}
                onPress={onSettings}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                accessibilityHint="Double tap to open settings"
              >
                <Text style={styles.itemText}>Settings</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.item}
                onPress={onLogout}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Log Out"
                accessibilityHint="Double tap to log out of your account"
              >
                <Text style={styles.itemTextRed}>Log Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.item}
              onPress={onLogin}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Log In"
              accessibilityHint="Double tap to log in to your account"
            >
              <Text style={styles.itemText}>Log In</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    position: 'absolute',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    minWidth: 150,
    ...SHADOWS.lg,
  },
  item: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  itemText: {
    ...TYPOGRAPHY.body,
  },
  itemTextRed: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});
