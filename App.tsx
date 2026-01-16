import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlayerProvider } from './src/contexts/PlayerContext';
import { ShowsProvider } from './src/contexts/ShowsContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    'FamiljenGrotesk': require('./assets/fonts/FamiljenGrotesk-SemiBold.ttf'),
  });

  // Wait for fonts to load before rendering the app
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ShowsProvider>
        <FavoritesProvider>
          <PlayerProvider>
            <AppNavigator />
            <StatusBar style="light" />
          </PlayerProvider>
        </FavoritesProvider>
      </ShowsProvider>
    </SafeAreaProvider>
  );
}
