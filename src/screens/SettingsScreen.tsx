import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
  TextInput,
  ScrollView,
  Linking as RNLinking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { profileService, UserProfile } from '../services/profileService';
import { followService } from '../services/followService';
import { ProfileImage } from '../components/ProfileImage';
import { BottomSheet } from '../components/BottomSheet';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [ownFollowerCount, setOwnFollowerCount] = useState(0);
  const [ownFollowingCount, setOwnFollowingCount] = useState(0);

  useFocusEffect(useCallback(() => {
    const userId = authState.user?.id;
    if (!userId) return;
    followService.getFollowCounts(userId)
      .then((c) => {
        setOwnFollowerCount(c.followers);
        setOwnFollowingCount(c.following);
      })
      .catch(() => { /* ignore */ });
  }, [authState.user?.id]));

  // Edit modal state — one of 'username' | 'displayName' at a time.
  const [editingField, setEditingField] = useState<'username' | 'displayName' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const avatarUrl = profileService.getAvatarUrl(authState.user);

  React.useEffect(() => {
    if (!authState.user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const p = await profileService.getUserProfile(authState.user!.id);
        if (cancelled) return;
        setProfile(p);
        if (p) {
          setUsername(p.username);
          setDisplayName(p.display_name || '');
        }
      } catch {
        // Silently fail — profile section will show empty fields
      } finally {
        if (!cancelled) setIsProfileLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authState.user?.id]);

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Must be at least 3 characters';
    if (value.length > 20) return 'Must be 20 characters or less';
    if (!/^[a-z0-9_-]+$/.test(value)) return 'Only lowercase letters, numbers, _ and -';
    return null;
  };

  const openEdit = (field: 'username' | 'displayName') => {
    setEditingField(field);
    setEditValue(field === 'username' ? username : displayName);
    setEditError(null);
  };

  const closeEdit = () => {
    if (editSaving) return;
    setEditingField(null);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editingField || !authState.user?.id) return;

    if (editingField === 'username') {
      const trimmed = editValue.toLowerCase().trim();
      if (!trimmed) {
        setEditError('Username cannot be empty');
        return;
      }
      const validationError = validateUsername(trimmed);
      if (validationError) {
        setEditError(validationError);
        return;
      }
      if (profile && trimmed === profile.username) {
        setEditingField(null);
        return;
      }

      setEditSaving(true);
      setEditError(null);
      try {
        const available = await profileService.checkUsernameAvailable(trimmed);
        if (!available) {
          setEditError('Username is already taken');
          return;
        }
        const updated = profile
          ? await profileService.updateUsername(authState.user.id, trimmed)
          : await profileService.createProfile(authState.user.id, trimmed);
        setProfile(updated);
        setUsername(updated.username);
        setEditingField(null);
      } catch {
        setEditError('Failed to save username');
      } finally {
        setEditSaving(false);
      }
      return;
    }

    // Display name
    const trimmed = editValue.trim();
    if (profile && trimmed === (profile.display_name || '')) {
      setEditingField(null);
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await profileService.updateDisplayName(authState.user.id, trimmed);
      setProfile(prev => (prev ? { ...prev, display_name: trimmed || null } : null));
      setDisplayName(trimmed);
      setEditingField(null);
    } catch {
      setEditError('Failed to save display name');
    } finally {
      setEditSaving(false);
    }
  };

  const handlePublicToggle = async (value: boolean) => {
    if (!authState.user?.id) return;

    if (profile) {
      setProfile(prev => prev ? { ...prev, is_public: value } : null);
      try {
        await profileService.setProfilePublic(authState.user.id, value);
      } catch {
        setProfile(prev => prev ? { ...prev, is_public: !value } : null);
      }
    } else if (value) {
      // Create a new profile when toggling on for the first time
      try {
        const defaultUsername = (authState.user.email?.split('@')[0] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
        const created = await profileService.createProfile(authState.user.id, defaultUsername || 'user');
        await profileService.setProfilePublic(authState.user.id, true);
        setProfile({ ...created, is_public: true });
        setUsername(created.username);
        setDisplayName(created.display_name || '');
      } catch {
        // Failed to create profile
      }
    }
  };

  // Auth guard: show sign-in prompt for unauthenticated users
  if (!authState.user) {
    return (
      <View
        style={[
          styles.container,
          isDesktop && styles.containerDesktop,
          Platform.OS === 'web' ? { paddingTop: insets.top } : null,
        ]}
      >
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
    <View
      style={[
        styles.container,
        isDesktop && styles.containerDesktop,
        // Modal presentation on native gives us its own top inset; only pad
        // on web where there's no system chrome above the header.
        Platform.OS === 'web' ? { paddingTop: insets.top } : null,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.headerLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={styles.headerLogoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
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

      {/* Public Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Public Profile</Text>

        {isProfileLoading ? (
          <ActivityIndicator size="small" color={COLORS.textSecondary} />
        ) : (
          <>
            {/* Follow counts */}
            {authState.user?.id && username && (
              <View style={styles.settingsCountsRow}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FollowList' as never, {
                    userId: authState.user!.id,
                    username,
                    mode: 'followers',
                  } as never)}
                >
                  <Text style={styles.settingsCountText}>
                    <Text style={styles.settingsCountNum}>{ownFollowerCount}</Text> Followers
                  </Text>
                </TouchableOpacity>
                <Text style={styles.settingsCountSep}>  ·  </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FollowList' as never, {
                    userId: authState.user!.id,
                    username,
                    mode: 'following',
                  } as never)}
                >
                  <Text style={styles.settingsCountText}>
                    <Text style={styles.settingsCountNum}>{ownFollowingCount}</Text> Following
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Make Profile Public Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Make Profile Public</Text>
                <Text style={styles.toggleHint}>
                  Allow others to see your favorites and listening history
                </Text>
              </View>
              <Switch
                value={profile?.is_public ?? false}
                onValueChange={handlePublicToggle}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor="#FFFFFF"
                // @ts-ignore - needed for web compatibility
                activeThumbColor="#FFFFFF"
                onTintColor={COLORS.accent}
              />
            </View>

            {/* Fields shown when public */}
            {(profile?.is_public) && (
              <>
                {/* Username */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Username</Text>
                  <View style={styles.lockedFieldRow}>
                    <Text style={styles.lockedFieldValue} numberOfLines={1}>
                      {username || '—'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => openEdit('username')}
                      style={styles.editFieldBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Edit username"
                    >
                      <Ionicons name="pencil" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.editFieldBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Display Name */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Display Name</Text>
                  <View style={styles.lockedFieldRow}>
                    <Text style={styles.lockedFieldValue} numberOfLines={1}>
                      {displayName || authState.user?.email?.split('@')[0] || '—'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => openEdit('displayName')}
                      style={styles.editFieldBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Edit display name"
                    >
                      <Ionicons name="pencil" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.editFieldBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* View Profile + URL */}
                {profile.username && (
                  <View style={styles.profileLinkSection}>
                    <TouchableOpacity
                      style={styles.viewProfileButton}
                      onPress={() => navigation.navigate('PublicProfile' as never, { username: profile.username } as never)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="person-outline" size={16} color={COLORS.textPrimary} />
                      <Text style={styles.viewProfileText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.profileUrlContainer}
                      onPress={() => RNLinking.openURL(`https://www.scarletfire.app/profile/${profile.username}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="link-outline" size={16} color={COLORS.accent} />
                      <Text style={styles.profileUrl}>
                        scarletfire.app/profile/{profile.username}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}
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

      <Text style={styles.versionText}>
        Version {Constants.expoConfig?.version ?? ''}
      </Text>
      </ScrollView>

      <BottomSheet
        visible={editingField !== null}
        onClose={closeEdit}
        cardStyle={styles.editSheetCard}
        swipeToDismiss={false}
      >
        {editingField && (
          <>
            <Text style={styles.editSheetTitle}>
              {editingField === 'username' ? 'Change Username' : 'Change Display Name'}
            </Text>
            <TextInput
              style={[styles.textInput, editError && styles.textInputError]}
              value={editValue}
              onChangeText={(text) => {
                if (editingField === 'username') {
                  setEditValue(text.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                } else {
                  setEditValue(text);
                }
                setEditError(null);
              }}
              autoFocus
              autoCapitalize={editingField === 'username' ? 'none' : 'sentences'}
              autoCorrect={editingField !== 'username'}
              maxLength={editingField === 'username' ? 20 : 50}
              placeholder={
                editingField === 'username'
                  ? 'choose a username'
                  : authState.user?.email?.split('@')[0] || 'your name'
              }
              placeholderTextColor={COLORS.textTertiary}
              editable={!editSaving}
            />
            {editError && <Text style={styles.fieldError}>{editError}</Text>}
            <View style={styles.editSheetActions}>
              <TouchableOpacity
                onPress={closeEdit}
                style={styles.editSheetCancel}
                disabled={editSaving}
              >
                <Text style={styles.editSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditSave}
                style={[styles.editSheetSave, editSaving && styles.editSheetSaveDisabled]}
                disabled={editSaving}
              >
                {editSaving ? (
                  <ActivityIndicator size="small" color={COLORS.textPrimary} />
                ) : (
                  <Text style={styles.editSheetSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </BottomSheet>
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
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
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
  headerLogout: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoutText: {
    ...TYPOGRAPHY.label,
    color: COLORS.accent,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
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
  versionText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textHint,
    textAlign: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  textInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInputError: {
    borderColor: COLORS.error,
  },
  fieldError: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  lockedFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lockedFieldValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  editFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  editFieldBtnText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  editSheetCard: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'web' ? SPACING.lg : 120,
    gap: SPACING.md,
  },
  editSheetTitle: {
    ...TYPOGRAPHY.heading4,
    fontSize: 18,
  },
  editSheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  editSheetCancel: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  editSheetCancelText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  editSheetSave: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  editSheetSaveDisabled: {
    opacity: 0.6,
  },
  editSheetSaveText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  settingsCountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  settingsCountText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  settingsCountNum: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  settingsCountSep: {
    color: COLORS.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  toggleLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  toggleHint: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileLinkSection: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
  },
  viewProfileText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
  },
  profileUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  profileUrl: {
    ...TYPOGRAPHY.label,
    color: COLORS.accent,
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
