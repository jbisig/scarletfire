import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { ProfileImage } from '../components/ProfileImage';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const navigation = useNavigation();
  const { state: authState, logout, deleteAccount, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const avatarUrl = profileService.getAvatarUrl(authState.user);

  // Auth guard: show sign-in prompt for unauthenticated users
  if (!authState.user) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (isDesktop) {
              navigation.reset({ index: 0, routes: [{ name: 'DiscoverLanding' as never }] });
            } else {
              navigation.goBack();
            }
          }} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.authGuardContainer}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textTertiary} />
          <Text style={styles.authGuardTitle}>Sign in to access settings</Text>
          <Text style={styles.authGuardSubtitle}>
            Log in or create an account to manage your profile and preferences.
          </Text>
        </View>
      </View>
    );
  }

  const handleClose = () => {
    if (isDesktop) {
      // On web desktop, Settings is opened via stack reset so there's no back history.
      // Navigate to Discover as the default landing screen.
      navigation.reset({ index: 0, routes: [{ name: 'DiscoverLanding' as never }] });
    } else {
      navigation.goBack();
    }
  };

  const handleChangePhoto = async () => {
    if (!authState.user?.id) return;

    setIsUploading(true);
    try {
      const newUrl = await profileService.changeProfilePicture(authState.user.id);
      if (newUrl) {
        await refreshUser();
      }
    } catch (error) {
      // Error is already handled in profileService with an alert
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    if (!authState.user?.id || !avatarUrl) return;

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsRemoving(true);
            try {
              await profileService.removeAvatar(authState.user!.id);
              await refreshUser();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove profile photo. Please try again.');
            } finally {
              setIsRemoving(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    if (isDesktop) {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'DiscoverLanding' as never }] });
      return;
    }
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation for extra safety
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete your account and all associated data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      await deleteAccount();
                      navigation.goBack();
                    } catch (error) {
                      Alert.alert(
                        'Error',
                        'Failed to delete account. Please try again or contact support.'
                      );
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <ProfileImage
              uri={avatarUrl}
              style={styles.avatar}
              size={120}
            />
            {(isUploading || isRemoving) && (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.textPrimary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handleChangePhoto}
              disabled={isUploading || isRemoving}
            >
              <Ionicons name="camera" size={16} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.email}>{authState.user?.email}</Text>

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleChangePhoto}
              disabled={isUploading || isRemoving}
            >
              <Text style={styles.photoButtonText}>
                {isUploading ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>

            {avatarUrl && (
              <TouchableOpacity
                style={[styles.photoButton, styles.removeButton]}
                onPress={handleRemovePhoto}
                disabled={isUploading || isRemoving}
              >
                <Text style={styles.removeButtonText}>
                  {isRemoving ? 'Removing...' : 'Remove'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.accountItem}>
          <Text style={styles.accountLabel}>Email</Text>
          <Text style={styles.accountValue}>{authState.user?.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.accent} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={22} color={COLORS.error} />
          <Text style={styles.deleteText}>
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.deleteWarning}>
          This will permanently delete your account and all associated data.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerDesktop: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.cardBackground,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: COLORS.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  email: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  photoButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.cardBackground,
  },
  photoButtonText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeButtonText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accountLabel: {
    ...TYPOGRAPHY.body,
  },
  accountValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  logoutText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.accent,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  deleteText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.error,
  },
  deleteWarning: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '400',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  authGuardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  authGuardTitle: {
    ...TYPOGRAPHY.heading4,
    marginTop: SPACING.md,
  },
  authGuardSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
