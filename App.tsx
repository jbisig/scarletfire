import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayerProvider } from './src/contexts/PlayerContext';
import { ShowsProvider } from './src/contexts/ShowsContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ShowsProvider>
        <PlayerProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </PlayerProvider>
      </ShowsProvider>
    </SafeAreaProvider>
  );
}
