import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { ShowDetailScreen } from '../screens/ShowDetailScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { DiscoverLandingScreen } from '../screens/DiscoverLandingScreen';
import { SongListScreen } from '../screens/SongListScreen';
import { SongPerformancesScreen } from '../screens/SongPerformancesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { FullPlayer } from '../components/FullPlayer';
import { CustomTabBar } from '../components/CustomTabBar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { AuthNavigator } from './AuthNavigator';
import { COLORS, FONTS } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

// Desktop layout (web only) - lazy import to avoid bundling on native
const DesktopLayout = Platform.OS === 'web'
  ? require('./DesktopLayout').DesktopLayout
  : null;

// Web linking configs for URL routing (separate for desktop flat stack vs mobile tabs)
const desktopWebLinking = Platform.OS === 'web'
  ? require('./webLinking').desktopWebLinking
  : undefined;
const mobileWebLinking = Platform.OS === 'web'
  ? require('./webLinking').mobileWebLinking
  : undefined;

// Native linking config for universal links (iOS) and deep links
const nativeLinking = Platform.OS !== 'web'
  ? {
      prefixes: [
        'scarletfire://',
        'https://www.scarletfire.app',
        'https://scarletfire.app',
      ],
      config: {
        initialRouteName: 'MainTabs' as const,
        screens: {
          ShowDetail: {
            path: 'show/:identifier/:trackTitle?',
            parse: {
              identifier: (id: string) => decodeURIComponent(id).replace(/[^a-zA-Z0-9._-]/g, ''),
              trackTitle: (slug: string) => decodeURIComponent(slug).replace(/-/g, ' '),
            },
          },
          MainTabs: {
            path: '',
            screens: {
              DiscoverTab: {
                screens: {
                  DiscoverLanding: 'discover',
                },
              },
              ShowsTab: {
                path: 'shows',
                screens: {
                  Home: '',
                },
              },
              FavoritesTab: {
                path: 'favorites',
                screens: {
                  Favorites: '',
                },
              },
            },
          },
        },
      },
    }
  : undefined;

export type RootStackParamList = {
  Home: { sort?: string; years?: string; series?: string } | undefined;
  ShowDetail: { identifier: string; trackTitle?: string; venue?: string; date?: string; location?: string; classicTier?: 1 | 2 | 3 };
  Favorites: undefined;
  DiscoverLanding: undefined;
  SongList: undefined;
  SongPerformances: {
    songTitle: string;
    performanceDate?: string;
  };
  Settings: undefined;
  PrivacyPolicy: undefined;
  ResetPassword: undefined;
  MainTabs: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// On web, @react-navigation/stack's CardContent switches to "page" mode
// (minHeight: '100%') when the card fills the viewport, letting the browser body
// handle scrolling. This breaks our app's internal ScrollView/FlatList/SectionList
// scrolling because they lose their height constraint. Override with flex: 1 so
// each screen is constrained and handles its own scrolling.
const webCardStyle = Platform.OS === 'web'
  ? { flex: 1, minHeight: 0 } as const
  : undefined;

// Custom browser tab title formatter for web
const SCREEN_TITLES: Record<string, string> = {
  DiscoverLanding: 'Discover',
  Home: 'Shows',
  SongList: 'Songs',
  Favorites: 'Favorites',
  Settings: 'Settings',
  PrivacyPolicy: 'Privacy Policy',
  ResetPassword: 'Reset Password',
};

const documentTitle = Platform.OS === 'web'
  ? {
      formatter: (options: Record<string, any> | undefined, route: { name: string } | undefined) => {
        const screenTitle = options?.title || (route ? SCREEN_TITLES[route.name] : undefined);
        return screenTitle ? `Scarlet>Fire - ${screenTitle}` : 'Scarlet>Fire';
      },
    }
  : undefined;

// Stack navigator for Shows tab
function ShowsStack() {
  const { logout, showLogin, state: authState } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: FONTS.primary,
          fontSize: 18,
        },
        cardStyle: webCardStyle,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          headerBackTitle: ' ',
        }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{
          title: '',
          headerShown: Platform.OS !== 'web',
          headerBackTitle: ' ',
        }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Songs tab
function SongsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: FONTS.primary,
          fontSize: 18,
        },
        cardStyle: webCardStyle,
      }}
    >
      <Stack.Screen
        name="SongList"
        component={SongListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SongPerformances"
        component={SongPerformancesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{
          title: '',
          headerShown: Platform.OS !== 'web',
          headerBackTitle: ' ',
        }}
      />
    </Stack.Navigator>
  );
}


// Stack navigator for Favorites tab
function FavoritesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: FONTS.primary,
          fontSize: 18,
        },
        cardStyle: webCardStyle,
      }}
    >
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{
          title: '',
          headerShown: Platform.OS !== 'web',
          headerBackTitle: ' ',
        }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Discover tab
function DiscoverStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: FONTS.primary,
          fontSize: 18,
        },
        cardStyle: webCardStyle,
      }}
    >
      <Stack.Screen
        name="DiscoverLanding"
        component={DiscoverLandingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{
          title: '',
          headerShown: Platform.OS !== 'web',
          headerBackTitle: ' ',
        }}
      />
    </Stack.Navigator>
  );
}

// Main content with tabs and player (mobile layout)
function MainTabsWithPlayer() {
  const { isFullPlayerVisible, setFullPlayerVisible } = usePlayer();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="DiscoverTab"
          component={DiscoverStack}
          options={{ tabBarLabel: 'Discover' }}
        />
        <Tab.Screen
          name="ShowsTab"
          component={ShowsStack}
          options={{ tabBarLabel: 'Shows' }}
        />
        <Tab.Screen
          name="SongsTab"
          component={SongsStack}
          options={{ tabBarLabel: 'Songs' }}
        />
        <Tab.Screen
          name="FavoritesTab"
          component={FavoritesStack}
          options={{ tabBarLabel: 'Favorites' }}
        />
      </Tab.Navigator>
      <View style={styles.miniPlayerContainer}>
        <MiniPlayer onPress={() => setFullPlayerVisible(true)} />
      </View>
      {isFullPlayerVisible && (
        <FullPlayer
          visible={isFullPlayerVisible}
          onClose={() => setFullPlayerVisible(false)}
        />
      )}
    </View>
  );
}

export function AppNavigator() {
  const { state: authState } = useAuth();
  const { isDesktop } = useResponsive();

  // Lock layout mode to initial value on web — switching between desktop/mobile
  // layouts unmounts the entire navigation tree, restarting audio and losing state.
  // Components still use live isDesktop for responsive styling.
  const initialLayoutRef = useRef(isDesktop);

  const useDesktopLayout = Platform.OS === 'web' && initialLayoutRef.current && DesktopLayout;
  const linking = Platform.OS !== 'web'
    ? nativeLinking
    : initialLayoutRef.current ? desktopWebLinking : mobileWebLinking;

  // Show loading while checking auth
  if (authState.isLoading) {
    return (
      <NavigationContainer ref={navigationRef} linking={linking} documentTitle={documentTitle}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </NavigationContainer>
    );
  }

  // On web, skip auth by default (auto-skip login)
  // Show auth flow only on native when not authenticated and hasn't skipped
  const showAuthFlow = Platform.OS !== 'web' && !authState.isAuthenticated && !authState.hasSkippedLogin;

  // Desktop web: use desktop layout
  if (useDesktopLayout) {
    return (
      <ErrorBoundary>
        <NavigationContainer ref={navigationRef} linking={linking} documentTitle={documentTitle}>
          <DesktopLayout />
        </NavigationContainer>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer ref={navigationRef} linking={linking} documentTitle={documentTitle}>
        {showAuthFlow ? (
          <AuthNavigator />
        ) : (
          <RootStack.Navigator screenOptions={{ headerShown: false, cardStyle: webCardStyle }}>
            <RootStack.Screen name="MainTabs" component={MainTabsWithPlayer} />
            <RootStack.Screen
              name="ShowDetail"
              component={ShowDetailScreen}
              options={{
                headerShown: Platform.OS !== 'web',
                headerStyle: { backgroundColor: COLORS.background },
                headerTintColor: COLORS.textPrimary,
                headerTitle: '',
              }}
            />
            <RootStack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: true,
              }}
            />
            <RootStack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
            />
            {Platform.OS === 'web' && (
              <RootStack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
                options={{ headerShown: false }}
              />
            )}
          </RootStack.Navigator>
        )}
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 87 : Platform.OS === 'web' ? 69 : 77,
    left: 0,
    right: 0,
    zIndex: 998,
  },
});
