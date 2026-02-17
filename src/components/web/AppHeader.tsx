import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, WEB_LAYOUT } from '../../constants/theme';

interface AppHeaderProps {
  onSettingsPress: () => void;
}

export function AppHeader({ onSettingsPress }: AppHeaderProps) {
  const { state: authState, showLogin } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.right}>
        {authState.isAuthenticated ? (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onSettingsPress}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={showLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WEB_LAYOUT.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.xxl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  spacer: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  profileButton: {
    padding: SPACING.sm,
  },
  signInButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  signInText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  settingsButton: {
    padding: SPACING.sm,
  },
});
