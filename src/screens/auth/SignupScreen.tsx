import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

export function SignupScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUpWithEmail, loginWithGoogle, loginWithApple, skipLogin, state } = useAuth();

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    try {
      await signUpWithEmail(email, password);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      Alert.alert('Signup Failed', errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message || 'An error occurred');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await loginWithApple();
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple Sign-In Failed', error.message || 'An error occurred');
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
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <BlurView intensity={12} tint="light" style={styles.inputBlur}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.textPlaceholder}
                    selectionColor="#FFFFFF"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </BlurView>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <BlurView intensity={12} tint="light" style={styles.inputBlur}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textPlaceholder}
                    selectionColor="#FFFFFF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={COLORS.textPlaceholder}
                    />
                  </TouchableOpacity>
                </BlurView>
              </View>

              {/* Create Account Button */}
              <TouchableOpacity
                style={[styles.primaryButton, state.isLoading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={state.isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {state.isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In Button */}
              <TouchableOpacity
                style={[styles.socialButton, state.isLoading && styles.buttonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={state.isLoading}
                activeOpacity={0.8}
              >
                <BlurView intensity={6} tint="light" style={styles.socialButtonBlur}>
                  <Ionicons name="logo-google" size={20} color="#fff" />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </BlurView>
              </TouchableOpacity>

              {/* Apple Sign In Button (iOS only) */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.socialButton, state.isLoading && styles.buttonDisabled]}
                  onPress={handleAppleSignIn}
                  disabled={state.isLoading}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={6} tint="light" style={styles.socialButtonBlur}>
                    <Ionicons name="logo-apple" size={22} color="#fff" />
                    <Text style={styles.socialButtonText}>Continue with Apple</Text>
                  </BlurView>
                </TouchableOpacity>
              )}

              {/* Login Link */}
              <View style={styles.loginLink}>
                <Text style={styles.loginLinkText}>Already have an account?   </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLinkButton}>Log in</Text>
                </TouchableOpacity>
              </View>

              {/* Skip for Now */}
              <TouchableOpacity onPress={skipLogin} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
          </View>
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

function getErrorMessage(error: any): string {
  if (error.code === 'auth/email-already-in-use') {
    return 'An account with this email already exists';
  } else if (error.code === 'auth/invalid-email') {
    return 'Please enter a valid email address';
  } else if (error.code === 'auth/weak-password') {
    return 'Password should be at least 6 characters';
  }
  return error.message || 'An error occurred. Please try again.';
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
  title: {
    ...TYPOGRAPHY.display,
    fontWeight: '500',
    marginBottom: SPACING.xxxxl,
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
  eyeButton: {
    paddingRight: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
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
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  loginLinkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
  loginLinkButton: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.accent,
  },
  skipButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
});
