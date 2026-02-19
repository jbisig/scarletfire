import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

// ─── Context ─────────────────────────────────────────────────────────────────

interface WebAuthModalContextType {
  openAuthModal: (screen?: 'login' | 'signup') => void;
}

const WebAuthModalContext = createContext<WebAuthModalContextType>({
  openAuthModal: () => {},
});

export const useWebAuthModal = () => useContext(WebAuthModalContext);

// ─── Provider + Modal ────────────────────────────────────────────────────────

export function WebAuthModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [initialScreen, setInitialScreen] = useState<'login' | 'signup'>('login');

  const openAuthModal = useCallback((screen: 'login' | 'signup' = 'login') => {
    setInitialScreen(screen);
    setVisible(true);
  }, []);
  const closeAuthModal = useCallback(() => setVisible(false), []);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <WebAuthModalContext.Provider value={{ openAuthModal }}>
      {children}
      <WebAuthModalContent visible={visible} onClose={closeAuthModal} initialScreen={initialScreen} />
    </WebAuthModalContext.Provider>
  );
}

// ─── Modal Content ───────────────────────────────────────────────────────────

type AuthScreen = 'login' | 'signup' | 'forgotPassword';

function WebAuthModalContent({ visible, onClose, initialScreen }: { visible: boolean; onClose: () => void; initialScreen: AuthScreen }) {
  const [screen, setScreen] = useState<AuthScreen>(initialScreen);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, resetPasswordForEmail, skipLogin, state } = useAuth();

  // Sync screen when modal opens with a new initialScreen
  React.useEffect(() => {
    if (visible) setScreen(initialScreen);
  }, [visible, initialScreen]);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError(null);
    setForgotPasswordSent(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    try {
      setError(null);
      await loginWithEmail(email, password);
      handleClose();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(getLoginErrorMessage(err));
    }
  }, [email, password, loginWithEmail, handleClose]);

  const handleSignup = useCallback(async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    try {
      setError(null);
      await signUpWithEmail(email, password);
      handleClose();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(getSignupErrorMessage(err));
    }
  }, [email, password, signUpWithEmail, handleClose]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setError(null);
      await loginWithGoogle();
      handleClose();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Google sign-in failed');
    }
  }, [loginWithGoogle, handleClose]);

  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    try {
      setError(null);
      setForgotPasswordLoading(true);
      await resetPasswordForEmail(email);
      setForgotPasswordSent(true);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Failed to send reset email');
    } finally {
      setForgotPasswordLoading(false);
    }
  }, [email, resetPasswordForEmail]);

  const switchScreen = useCallback((target: AuthScreen) => {
    setError(null);
    setForgotPasswordSent(false);
    setScreen(target);
  }, []);

  const isLogin = screen === 'login';
  const isForgotPassword = screen === 'forgotPassword';

  const getTitle = () => {
    if (isForgotPassword) return 'Reset Password';
    return isLogin ? 'Welcome Back' : 'Create Account';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.title}>{getTitle()}</Text>

          {/* Forgot password success state */}
          {isForgotPassword && forgotPasswordSent ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.accent} />
              <Text style={styles.successText}>Check your email for a reset link.</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => switchScreen('login')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Back to Log In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Error message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {isForgotPassword && (
                <Text style={styles.forgotSubtitle}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
              )}

              {/* Email Input */}
              <View style={styles.inputWrapper}>
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
              </View>

              {/* Password Input (hidden on forgot password) */}
              {!isForgotPassword && (
                <>
                  <View style={styles.inputWrapper}>
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
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textPlaceholder} />
                    </TouchableOpacity>
                  </View>

                  {/* Forgot password link (login only) */}
                  {isLogin && (
                    <TouchableOpacity
                      onPress={() => switchScreen('forgotPassword')}
                      style={styles.forgotPasswordLink}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Primary Button */}
              <TouchableOpacity
                style={[styles.primaryButton, (state.isLoading || forgotPasswordLoading) && styles.buttonDisabled]}
                onPress={isForgotPassword ? handleForgotPassword : (isLogin ? handleLogin : handleSignup)}
                disabled={state.isLoading || forgotPasswordLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {isForgotPassword
                    ? (forgotPasswordLoading ? 'Sending...' : 'Send Reset Link')
                    : state.isLoading
                      ? (isLogin ? 'Logging In...' : 'Creating Account...')
                      : (isLogin ? 'Log In' : 'Create Account')
                  }
                </Text>
              </TouchableOpacity>

              {/* Divider + social auth (hidden on forgot password) */}
              {!isForgotPassword && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={[styles.socialButton, state.isLoading && styles.buttonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={state.isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-google" size={20} color={COLORS.textPrimary} />
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Switch screen link */}
              <View style={styles.switchLink}>
                {isForgotPassword ? (
                  <TouchableOpacity onPress={() => switchScreen('login')}>
                    <Text style={styles.switchLinkButton}>Back to Log In</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.switchLinkText}>
                      {isLogin ? "Don't have an account?   " : 'Already have an account?   '}
                    </Text>
                    <TouchableOpacity onPress={() => switchScreen(isLogin ? 'signup' : 'login')}>
                      <Text style={styles.switchLinkButton}>{isLogin ? 'Sign up' : 'Log in'}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Error helpers ───────────────────────────────────────────────────────────

function getLoginErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === 'auth/user-not-found') return 'No account found with this email';
  if (error.code === 'auth/wrong-password') return 'Incorrect password';
  if (error.code === 'auth/invalid-email') return 'Please enter a valid email address';
  if (error.code === 'auth/too-many-requests') return 'Too many failed attempts. Please try again later.';
  return error.message || 'An error occurred. Please try again.';
}

function getSignupErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === 'auth/email-already-in-use') return 'An account with this email already exists';
  if (error.code === 'auth/invalid-email') return 'Please enter a valid email address';
  if (error.code === 'auth/weak-password') return 'Password should be at least 6 characters';
  return error.message || 'An error occurred. Please try again.';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 36,
    width: '90%',
    maxWidth: 440,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
    // @ts-ignore
    cursor: 'pointer',
  },
  title: {
    ...TYPOGRAPHY.display,
    fontSize: 28,
    fontWeight: '500',
    marginBottom: SPACING.xxl,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#FF3B30',
  },
  inputWrapper: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceMedium,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
    // @ts-ignore
    outlineStyle: 'none',
  },
  eyeButton: {
    paddingRight: SPACING.xl,
    // @ts-ignore
    cursor: 'pointer',
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginTop: SPACING.sm,
    // @ts-ignore
    cursor: 'pointer',
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
    marginVertical: SPACING.xl,
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
    backgroundColor: COLORS.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: SPACING.md,
    // @ts-ignore
    cursor: 'pointer',
  },
  socialButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  successText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  forgotSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
    // @ts-ignore
    cursor: 'pointer',
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.accent,
    fontWeight: '600',
  },
  switchLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  switchLinkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
  },
  switchLinkButton: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.accent,
    // @ts-ignore
    cursor: 'pointer',
  },
});
