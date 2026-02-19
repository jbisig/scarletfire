import React from 'react';
import { View, StyleSheet, Easing, Dimensions } from 'react-native';
import { createStackNavigator, StackCardStyleInterpolator } from '@react-navigation/stack';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { AUTH_VIDEO_SOURCE } from '../screens/auth/authVideoSource';
import { COLORS } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// Faster transition timing
const fastTransitionSpec = {
  open: {
    animation: 'timing' as const,
    config: {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    },
  },
  close: {
    animation: 'timing' as const,
    config: {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    },
  },
};

// Custom interpolator where screens slide together without overlap
const forSlideFromRight: StackCardStyleInterpolator = ({ current, next, layouts }) => {
  return {
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
        {
          translateX: next
            ? next.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -layouts.screen.width],
              })
            : 0,
        },
      ],
    },
  };
};

const Stack = createStackNavigator();

export function AuthNavigator() {
  return (
    <View style={styles.container}>
      {/* Static Video Background */}
      <Video
        source={AUTH_VIDEO_SOURCE}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(18, 18, 18, 0.8)', COLORS.background]}
        locations={[0, 0.5, 0.75]}
        style={styles.gradient}
      />

      {/* Navigation Stack with transparent cards and horizontal slide */}
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
          cardStyleInterpolator: forSlideFromRight,
          transitionSpec: fastTransitionSpec,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});
