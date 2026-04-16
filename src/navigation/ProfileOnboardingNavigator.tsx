import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { AUTH_VIDEO_SOURCE } from '../screens/auth/authVideoSource';
import { ProfileOnboardingIntroScreen } from '../screens/onboarding/ProfileOnboardingIntroScreen';
import { ProfileOnboardingSetupScreen } from '../screens/onboarding/ProfileOnboardingSetupScreen';
import { COLORS } from '../constants/theme';

export type ProfileOnboardingStackParamList = {
  ProfileOnboardingIntro: undefined;
  ProfileOnboardingSetup: undefined;
};

const Stack = createStackNavigator<ProfileOnboardingStackParamList>();

export function ProfileOnboardingNavigator() {
  return (
    <View style={styles.container}>
      <Video
        source={AUTH_VIDEO_SOURCE}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      <LinearGradient
        colors={['transparent', 'rgba(18, 18, 18, 0.8)', COLORS.background]}
        locations={[0, 0.5, 0.75]}
        style={StyleSheet.absoluteFillObject}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen
          name="ProfileOnboardingIntro"
          component={ProfileOnboardingIntroScreen}
        />
        <Stack.Screen
          name="ProfileOnboardingSetup"
          component={ProfileOnboardingSetupScreen}
        />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
