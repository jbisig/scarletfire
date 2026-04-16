import React, { useState, useCallback, useEffect } from 'react';
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
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import { FollowListScreen } from '../screens/FollowListScreen';
import { CollectionDetailScreen } from '../screens/CollectionDetailScreen';
import { FeedScreen } from '../screens/FeedScreen';
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
  FeedTab: 'Feed',
  Settings: 'Settings',
};

const SCREEN_TO_TAB: Record<string, string> = {
  DiscoverLanding: 'DiscoverTab',
  Home: 'ShowsTab',
  SongList: 'SongsTab',
  SongPerformances: 'SongsTab',
  Favorites: 'FavoritesTab',
  Feed: 'FeedTab',
  Settings: 'Settings',
  PublicProfile: 'ProfileTab',
};

const SCROLLBAR_STYLES = ``;

const IS_ELECTRON =
  typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);

export function DesktopLayout() {
  const [activeTab, setActiveTab] = useState('DiscoverTab');
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-desktop-scrollbars', '');
    styleEl.textContent = SCROLLBAR_STYLES;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, []);

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
      {/* Electron: draggable strip over the traffic-lights row */}
      <View style={styles.dragStrip} />

      {/* Main area: sidebar + content */}
      <View style={styles.mainArea}>
        <Sidebar activeTab={activeTab} onNavigate={handleNavigate} />

        <View style={styles.content}>
          <Stack.Navigator
            screenOptions={screenOptions}
            initialRouteName="DiscoverLanding"
            screenListeners={{
              state: (e) => {
                const state = e.data.state;
                if (state) {
                  const name = state.routes[state.index]?.name;
                  if (name) {
                    const tab = SCREEN_TO_TAB[name];
                    if (tab) setActiveTab(tab);
                  }
                }
              },
            }}
          >
            <Stack.Screen name="DiscoverLanding" component={DiscoverLandingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SongList" component={SongListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SongPerformances" component={SongPerformancesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ShowDetail" component={ShowDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="FollowList" component={FollowListScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="CollectionDetail"
              component={CollectionDetailScreen}
              options={{ headerShown: false, cardStyle: { backgroundColor: COLORS.backgroundSecondary } }}
            />
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
    paddingTop: IS_ELECTRON ? 40 : WEB_LAYOUT.outerPadding,
    paddingRight: WEB_LAYOUT.outerPadding,
    paddingBottom: WEB_LAYOUT.outerPadding,
    paddingLeft: WEB_LAYOUT.outerPadding,
    gap: WEB_LAYOUT.panelGap,
  },
  dragStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    // @ts-ignore - web only: make the strip a draggable window region in Electron
    WebkitAppRegion: 'drag',
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
