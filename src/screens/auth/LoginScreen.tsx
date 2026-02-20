import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SocialAuthButtons } from './SocialAuthButtons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithEmail, skipLogin, state } = useAuth();
  const failedAttemptsRef = useRef(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const handleLogin = async () => {
    if (Date.now() < cooldownUntil) {
      const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
      Alert.alert('Please Wait', `Too many attempts. Try again in ${seconds} seconds.`);
      return;
    }
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    try {
      await loginWithEmail(email, password);
      failedAttemptsRef.current = 0;
    } catch (error) {
      failedAttemptsRef.current += 1;
      if (failedAttemptsRef.current >= 3) {
        const delay = Math.min(1000 * Math.pow(2, failedAttemptsRef.current - 3), 30000);
        setCooldownUntil(Date.now() + delay);
      }
      const errorMessage = getErrorMessage(error as AuthError);
      Alert.alert('Login Failed', errorMessage);
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
          <Text style={styles.title}>Welcome Back</Text>

          <View style={styles.formContainer}>
              {/* Email Input */}
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
                    selectionColor={COLORS.textPrimary}
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

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordLink}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Log In Button */}
              <TouchableOpacity
                style={[styles.primaryButton, state.isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={state.isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {state.isLoading ? 'Logging In...' : 'Log In'}
                </Text>
              </TouchableOpacity>

              <SocialAuthButtons disabled={state.isLoading} />

            {/* Sign Up Link */}
            <View style={styles.signupLink}>
              <Text style={styles.signupLinkText}>Don't have an account?   </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLinkButton}>Sign up</Text>
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

interface AuthError {
  code?: string;
  message?: string;
}

function getErrorMessage(error: AuthError): string {
  if (error.code === 'auth/user-not-found') {
    return 'No account found with this email';
  } else if (error.code === 'auth/wrong-password') {
    return 'Incorrect password';
  } else if (error.code === 'auth/invalid-email') {
    return 'Please enter a valid email address';
  } else if (error.code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please try again later.';
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
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  signupLinkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
  signupLinkButton: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.accent,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.accent,
    fontWeight: '600',
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
