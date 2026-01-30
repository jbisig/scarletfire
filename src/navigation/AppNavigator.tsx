import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { ShowDetailScreen } from '../screens/ShowDetailScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { DiscoverLandingScreen } from '../screens/DiscoverLandingScreen';
import { ClassicsScreen } from '../screens/ClassicsScreen';
import { GratefulDead101Screen } from '../screens/GratefulDead101Screen';
import { SongListScreen } from '../screens/SongListScreen';
import { SongPerformancesScreen } from '../screens/SongPerformancesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { FullPlayer } from '../components/FullPlayer';
import { CustomTabBar } from '../components/CustomTabBar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { AuthNavigator } from './AuthNavigator';
import { COLORS, FONTS, TYPOGRAPHY } from '../constants/theme';

export type RootStackParamList = {
  Home: undefined;
  ShowDetail: { identifier: string };
  Favorites: undefined;
  DiscoverLanding: undefined;
  Classics: undefined;
  GratefulDead101: undefined;
  SongList: undefined;
  SongPerformances: {
    songTitle: string;
    performances: Array<{ date: string; identifier: string; venue?: string; rating?: 1 | 2 | 3 | null }>;
  };
  Settings: undefined;
  MainTabs: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

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
      }}
    >
      <Stack.Screen
        name="DiscoverLanding"
        component={DiscoverLandingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Classics"
        component={ClassicsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GratefulDead101"
        component={GratefulDead101Screen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{
          title: '',
                    headerBackTitle: ' ',
        }}
      />
    </Stack.Navigator>
  );
}

// Main content with tabs and player
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
          name="DiscoverTab"
          component={DiscoverStack}
          options={{ tabBarLabel: 'Discover' }}
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
      <FullPlayer
        visible={isFullPlayerVisible}
        onClose={() => setFullPlayerVisible(false)}
      />
    </View>
  );
}

export function AppNavigator() {
  const { state: authState } = useAuth();

  // Show loading while checking auth
  if (authState.isLoading) {
    return (
      <NavigationContainer>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </NavigationContainer>
    );
  }

  // Show auth flow if not authenticated and hasn't skipped
  const showAuthFlow = !authState.isAuthenticated && !authState.hasSkippedLogin;

  return (
    <ErrorBoundary>
      <NavigationContainer>
        {showAuthFlow ? (
          <AuthNavigator />
        ) : (
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="MainTabs" component={MainTabsWithPlayer} />
            <RootStack.Screen
              name="ShowDetail"
              component={ShowDetailScreen}
              options={{
                headerShown: true,
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
    bottom: 87,
    left: 0,
    right: 0,
    zIndex: 998,
  },
});
