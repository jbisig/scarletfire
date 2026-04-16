import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { profileService } from '../../services/profileService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import type { ProfileOnboardingStackParamList } from '../../navigation/ProfileOnboardingNavigator';

export function ProfileOnboardingIntroScreen() {
  const navigation = useNavigation<NavigationProp<ProfileOnboardingStackParamList>>();
  const { state: authState } = useAuth();
  const { refresh } = useProfile();
  const [isDismissing, setIsDismissing] = useState(false);

  const handleSkip = async () => {
    const userId = authState.user?.id;
    if (!userId || isDismissing) return;
    setIsDismissing(true);
    try {
      await profileService.dismissProfileOnboarding(userId);
      await refresh();
      // On success, ProfileContext flips needsProfileSetup=false and
      // AppNavigator unmounts this stack into MainTabs. No explicit nav needed.
    } catch {
      setIsDismissing(false);
      Alert.alert(
        "Couldn't save",
        'There was a problem. Check your connection and try again.',
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Make it yours</Text>
        <Text style={styles.subtitle}>
          Set up a public profile to share what you're listening to with other Heads.
        </Text>

        <View style={styles.featureList}>
          <FeatureRow
            icon="link-outline"
            title="Get a shareable profile"
            description="Your own URL like deadplayer.app/yourname"
          />
          <FeatureRow
            icon="people-outline"
            title="Follow other Heads"
            description="See what your friends are spinning"
          />
          <FeatureRow
            icon="flame-outline"
            title="Show off your top shows"
            description="Your favorites and most-played shows, on display"
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('ProfileOnboardingSetup')}
          activeOpacity={0.8}
          disabled={isDismissing}
        >
          <Text style={styles.primaryButtonText}>Set up my profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isDismissing}
        >
          <Text style={styles.skipText}>{isDismissing ? 'Saving...' : 'Maybe later'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={22} color={COLORS.accent} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
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
  featureList: {
    gap: SPACING.xl,
    marginBottom: SPACING.xxxxl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
  },
  featureIcon: {
    width: 36,
    alignItems: 'center',
    paddingTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
});
