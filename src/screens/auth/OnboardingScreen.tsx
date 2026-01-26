import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS } from '../../constants/theme';

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
    paddingHorizontal: 40,
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
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 100,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.primary,
  },
  secondaryButton: {
    borderRadius: 100,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.33)',
  },
  secondaryButtonBlur: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.primary,
  },
  skipButton: {
    paddingVertical: 12,
    marginBottom: 50,
  },
  skipText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: FONTS.primary,
  },
  benefitsText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    fontFamily: FONTS.secondary,
  },
});
