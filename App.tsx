import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
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
import { ToastProvider } from './src/contexts/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { WebAuthModalProvider } from './src/components/web/WebAuthModal';
import { validateConfig } from './src/constants/config';

// Validate environment configuration at startup
// In dev: throws if required config missing; in prod: logs error and continues
validateConfig();

// Keep splash screen visible while loading (not applicable on web)
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

// Inject global styles on web (background, scrollbar)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      background-color: #121212 !important;
    }
    /* Enable native touch scrolling and disable double-tap zoom delay on mobile */
    html {
      touch-action: manipulation;
    }
    * {
      scrollbar-color: #444 #191919;
      scrollbar-width: thin;
      -webkit-tap-highlight-color: transparent;
    }
    *::-webkit-scrollbar {
      width: 8px;
      background-color: #191919;
    }
    *::-webkit-scrollbar-thumb {
      background-color: #444;
      border-radius: 4px;
    }
    *::-webkit-scrollbar-track {
      background-color: #191919;
    }
  `;
  document.head.appendChild(style);
}

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
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync();
      }
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  // Wait for fonts to load before rendering the app
  // If there's an error or timeout, proceed anyway (will use system fonts)
  if (!fontsLoaded && !fontError && !fontTimeout) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <WebAuthModalProvider>
              <ShowsProvider>
                <ShowOfTheDayProvider>
                  <FavoritesProvider>
                    <PlayCountsProvider>
                      <PlayerProvider>
                        <VideoBackgroundProvider>
                          <ErrorBoundary>
                            <AppNavigator />
                          </ErrorBoundary>
                          {Platform.OS !== 'web' && <StatusBar style="light" />}
                        </VideoBackgroundProvider>
                      </PlayerProvider>
                    </PlayCountsProvider>
                  </FavoritesProvider>
                </ShowOfTheDayProvider>
              </ShowsProvider>
            </WebAuthModalProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
