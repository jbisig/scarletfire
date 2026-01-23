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
import { COLORS, FONTS } from '../../constants/theme';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithEmail, loginWithGoogle, skipLogin, state } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    try {
      await loginWithEmail(email, password);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message || 'An error occurred');
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
                    placeholderTextColor="rgba(255, 255, 255, 0.75)"
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
                    placeholderTextColor="rgba(255, 255, 255, 0.75)"
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
                      color="rgba(255, 255, 255, 0.75)"
                    />
                  </TouchableOpacity>
                </BlurView>
              </View>

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

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In Button */}
              <TouchableOpacity
                style={[styles.googleButton, state.isLoading && styles.buttonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={state.isLoading}
                activeOpacity={0.8}
              >
                <BlurView intensity={6} tint="light" style={styles.googleButtonBlur}>
                  <Ionicons name="logo-google" size={20} color="#fff" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </BlurView>
              </TouchableOpacity>

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

function getErrorMessage(error: any): string {
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
    minHeight: 40,
  },
  content: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '500',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: 40,
  },
  formContainer: {
    gap: 20,
  },
  inputWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.33)',
  },
  inputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 28,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    paddingRight: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: '#CCCCCC',
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: FONTS.primary,
  },
  googleButton: {
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.33)',
  },
  googleButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  googleButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.primary,
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupLinkText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: FONTS.primary,
  },
  signupLinkButton: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.primary,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  skipText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: FONTS.primary,
  },
});
