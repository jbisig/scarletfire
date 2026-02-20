import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

interface AuthError {
  code?: string;
  message?: string;
}

interface SocialAuthButtonsProps {
  disabled?: boolean;
}

export function SocialAuthButtons({ disabled }: SocialAuthButtonsProps) {
  const { loginWithGoogle, loginWithApple } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      const authError = error as AuthError;
      Alert.alert('Google Sign-In Failed', authError.message || 'An error occurred');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await loginWithApple();
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple Sign-In Failed', authError.message || 'An error occurred');
    }
  };

  return (
    <>
      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Sign In Button */}
      <TouchableOpacity
        style={[styles.socialButton, disabled && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <BlurView intensity={6} tint="light" style={styles.socialButtonBlur}>
          <Ionicons name="logo-google" size={20} color={COLORS.textPrimary} />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </BlurView>
      </TouchableOpacity>

      {/* Apple Sign In Button (iOS only) */}
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[styles.socialButton, disabled && styles.buttonDisabled]}
          onPress={handleAppleSignIn}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <BlurView intensity={6} tint="light" style={styles.socialButtonBlur}>
            <Ionicons name="logo-apple" size={22} color={COLORS.textPrimary} />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </BlurView>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceFocused,
  },
  dividerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
    paddingHorizontal: SPACING.xl,
  },
  socialButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  socialButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    backgroundColor: COLORS.surfaceLight,
    gap: SPACING.md,
  },
  socialButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
