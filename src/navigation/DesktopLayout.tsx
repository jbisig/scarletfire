import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { HomeScreen } from '../screens/HomeScreen';
import { ShowDetailScreen } from '../screens/ShowDetailScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { DiscoverLandingScreen } from '../screens/DiscoverLandingScreen';
import { SongListScreen } from '../screens/SongListScreen';
import { SongPerformancesScreen } from '../screens/SongPerformancesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Sidebar } from '../components/web/Sidebar';
import { PlayerBar } from '../components/web/PlayerBar';
import { COLORS, FONTS, WEB_LAYOUT } from '../constants/theme';

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.backgroundSecondary },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: {
    fontWeight: 'bold' as const,
    fontFamily: FONTS.primary,
    fontSize: 18,
  },
};

const TAB_ROOT_SCREENS: Record<string, string> = {
  DiscoverTab: 'DiscoverLanding',
  ShowsTab: 'Home',
  SongsTab: 'SongList',
  FavoritesTab: 'Favorites',
  Settings: 'Settings',
};

export function DesktopLayout() {
  const [activeTab, setActiveTab] = useState('DiscoverTab');

  const handleNavigate = useCallback((tabKey: string) => {
    setActiveTab(tabKey);
    const rootScreen = TAB_ROOT_SCREENS[tabKey];
    if (rootScreen && navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: rootScreen }],
        })
      );
    }
  }, []);

  return (
    <View style={styles.outerContainer}>
      {/* Main area: sidebar + content */}
      <View style={styles.mainArea}>
        <Sidebar activeTab={activeTab} onNavigate={handleNavigate} />

        <View style={styles.content}>
          <Stack.Navigator
            screenOptions={screenOptions}
            initialRouteName="DiscoverLanding"
          >
            <Stack.Screen name="DiscoverLanding" component={DiscoverLandingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SongList" component={SongListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SongPerformances" component={SongPerformancesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ShowDetail" component={ShowDetailScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </View>
      </View>

      {/* Persistent bottom player bar */}
      <PlayerBar />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: WEB_LAYOUT.outerPadding,
    gap: WEB_LAYOUT.panelGap,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    gap: WEB_LAYOUT.panelGap,
  },
  content: {
    flex: 1,
    borderRadius: WEB_LAYOUT.contentRadius,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
    // @ts-ignore - web only: fix anti-aliasing artifacts at rounded corners
    WebkitMaskImage: '-webkit-radial-gradient(white, black)',
  },
});
