import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const LOGO_SIZE = screenWidth * 0.7; // 70% of screen width

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { skipLogin } = useAuth();

  return (
    <View style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={require('../../../assets/images/sign-in-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonsWrapper}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <BlurView intensity={10} tint="light" style={styles.secondaryButtonBlur}>
                <Text style={styles.secondaryButtonText}>Log In</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={skipLogin} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          <Text style={styles.benefitsText}>
            Sign in to backup your favorites.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxxl,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 60,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonsWrapper: {
    width: '100%',
    gap: SPACING.lg,
    marginBottom: SPACING.xxxl,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    paddingHorizontal: SPACING.xxxxl,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: RADIUS.full,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  secondaryButtonBlur: {
    paddingVertical: 18,
    paddingHorizontal: SPACING.xxxxl,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMedium,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: SPACING.md,
    marginBottom: 50,
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
  benefitsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
