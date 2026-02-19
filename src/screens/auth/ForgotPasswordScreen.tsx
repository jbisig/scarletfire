import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

export function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      await resetPasswordForEmail(email);
      setEmailSent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.spacer} />
        <View style={styles.content}>
          {emailSent ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.accent} />
              <Text style={styles.title}>Check Your Email</Text>
              <Text style={styles.subtitle}>
                We sent a password reset link to {email}
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Back to Log In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a link to reset your password.
              </Text>

              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <BlurView intensity={12} tint="light" style={styles.inputBlur}>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={COLORS.textPlaceholder}
                      selectionColor={COLORS.textPrimary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      autoFocus
                    />
                  </BlurView>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSendReset}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backLinkText}>Back to Log In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  spacer: {
    flex: 1,
    minHeight: SPACING.xxxxl,
  },
  content: {
    paddingHorizontal: SPACING.xxxxl,
    paddingBottom: 60,
  },
  successContainer: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.display,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },
  formContainer: {
    gap: SPACING.xl,
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
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 28,
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  backLinkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: '600',
  },
});
