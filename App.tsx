import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PlayerProvider } from './src/contexts/PlayerContext';
import { ShowsProvider } from './src/contexts/ShowsContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { PlayCountsProvider } from './src/contexts/PlayCountsContext';
import { ShowOfTheDayProvider } from './src/contexts/ShowOfTheDayContext';
import { VideoBackgroundProvider } from './src/contexts/VideoBackgroundContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'FamiljenGrotesk': require('./assets/fonts/FamiljenGrotesk-SemiBold.ttf'),
    'Inter': require('./assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
  });
  const [fontTimeout, setFontTimeout] = useState(false);

  // Timeout for font loading - proceed after 5 seconds even if fonts haven't loaded
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFontTimeout(true);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || fontTimeout) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  // Wait for fonts to load before rendering the app
  // If there's an error or timeout, proceed anyway (will use system fonts)
  if (!fontsLoaded && !fontError && !fontTimeout) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ShowsProvider>
          <ShowOfTheDayProvider>
            <FavoritesProvider>
              <PlayCountsProvider>
                <PlayerProvider>
                  <VideoBackgroundProvider>
                    <AppNavigator />
                    <StatusBar style="light" />
                  </VideoBackgroundProvider>
                </PlayerProvider>
              </PlayCountsProvider>
            </FavoritesProvider>
          </ShowOfTheDayProvider>
        </ShowsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
