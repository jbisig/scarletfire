import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { profileService } from '../../services/profileService';
import { useUsernameAvailability } from '../../hooks/useUsernameAvailability';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

function suggestUsername(email: string | undefined): string {
  const prefix = (email?.split('@')[0] ?? '').toLowerCase();
  return prefix.replace(/[^a-z0-9_-]/g, '').slice(0, 20);
}

export function ProfileOnboardingSetupScreen() {
  const navigation = useNavigation();
  const { state: authState } = useAuth();
  const { refresh } = useProfile();

  const [username, setUsername] = useState(() => suggestUsername(authState.user?.email));
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const status = useUsernameAvailability(username);
  const canSubmit = status.state === 'available' && !submitting;

  const statusMessage = useMemo(() => {
    switch (status.state) {
      case 'idle': return '';
      case 'checking': return 'Checking...';
      case 'available': return 'Available';
      case 'taken': return 'Already taken';
      case 'invalid': return status.message;
    }
  }, [status]);

  const statusColor = useMemo(() => {
    if (status.state === 'available') return COLORS.success ?? '#4ade80';
    if (status.state === 'taken' || status.state === 'invalid') return COLORS.error;
    return COLORS.textTertiary;
  }, [status.state]);

  const handleUsernameChange = (v: string) => {
    // Mirror the profile-username format: lowercase + only allowed chars.
    setUsername(v.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
  };

  const handleSubmit = async () => {
    const userId = authState.user?.id;
    if (!userId || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await profileService.completeProfileOnboarding(userId, {
        username,
        displayName: displayName.trim() || undefined,
      });
      await refresh();
      // ProfileContext flips needsProfileSetup=false → AppNavigator shows MainTabs.
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') {
        setSubmitError('That username was just taken — try another.');
      } else {
        setSubmitError("Couldn't create your profile. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Pick your username</Text>
        <Text style={styles.subtitle}>
          This is how other Heads will find you. You can change your display name later.
        </Text>

        <View style={styles.fieldGroup}>
          <View style={styles.inputWrapper}>
            <BlurView intensity={12} tint="light" style={styles.inputBlur}>
              <Text style={styles.prefix}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="username"
                placeholderTextColor={COLORS.textPlaceholder}
                selectionColor={COLORS.textPrimary}
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                maxLength={20}
              />
              {status.state === 'checking' && (
                <ActivityIndicator style={styles.statusIcon} color={COLORS.textTertiary} />
              )}
              {status.state === 'available' && (
                <Ionicons
                  style={styles.statusIcon}
                  name="checkmark-circle"
                  size={20}
                  color={statusColor}
                />
              )}
            </BlurView>
          </View>
          {!!statusMessage && (
            <Text style={[styles.statusText, { color: statusColor }]}>{statusMessage}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.inputWrapper}>
            <BlurView intensity={12} tint="light" style={styles.inputBlur}>
              <TextInput
                style={[styles.input, styles.inputWithoutPrefix]}
                placeholder="Your name (optional)"
                placeholderTextColor={COLORS.textPlaceholder}
                selectionColor={COLORS.textPrimary}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                maxLength={50}
              />
            </BlurView>
          </View>
        </View>

        {!!submitError && <Text style={styles.errorBanner}>{submitError}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.textPrimary} />
            : <Text style={styles.primaryButtonText}>Create profile</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xxxxl,
    paddingVertical: SPACING.xxxxl,
  },
  title: {
    ...TYPOGRAPHY.display,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxxxl,
  },
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  inputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMedium,
    paddingHorizontal: 28,
  },
  prefix: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textTertiary,
    marginRight: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  inputWithoutPrefix: {
    paddingLeft: 0,
  },
  statusIcon: {
    marginLeft: SPACING.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.sm,
    marginLeft: SPACING.lg,
  },
  errorBanner: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  backText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
});
