import React, { useState } from 'react';
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
import { MiniPlayer } from '../components/MiniPlayer';
import { FullPlayer } from '../components/FullPlayer';
import { CustomTabBar } from '../components/CustomTabBar';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';

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
    performances: Array<{ date: string; identifier: string; venue?: string }>;
  };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Stack navigator for Shows tab
function ShowsStack() {
  const { logout, showLogin, state: authState } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'FamiljenGrotesk',
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
          headerBackTitleVisible: false,
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
          backgroundColor: '#121212',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'FamiljenGrotesk',
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
        options={{ title: 'Performances', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{
          title: '',
          headerBackTitleVisible: false,
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
          backgroundColor: '#121212',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'FamiljenGrotesk',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favorites', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{
          title: '',
          headerBackTitleVisible: false,
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
          backgroundColor: '#121212',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'FamiljenGrotesk',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="DiscoverLanding"
        component={DiscoverLandingScreen}
        options={{ title: 'Discover', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="Classics"
        component={ClassicsScreen}
        options={{ title: 'Classic Shows', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="GratefulDead101"
        component={GratefulDead101Screen}
        options={{ title: 'Grateful Dead 101', headerBackTitle: ' ' }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{
          title: '',
          headerBackTitleVisible: false,
          headerBackTitle: ' ',
        }}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const { state: authState } = useAuth();

  // Show loading while checking auth
  if (authState.isLoading) {
    return (
      <NavigationContainer>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#E54C4F" />
        </View>
      </NavigationContainer>
    );
  }

  // Show auth flow if not authenticated and hasn't skipped
  const showAuthFlow = !authState.isAuthenticated && !authState.hasSkippedLogin;

  return (
    <NavigationContainer>
      {showAuthFlow ? (
        <AuthNavigator />
      ) : (
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
          <MiniPlayer onPress={() => setIsFullPlayerVisible(true)} />
        </View>
        <FullPlayer
          visible={isFullPlayerVisible}
          onClose={() => setIsFullPlayerVisible(false)}
        />
        </View>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    zIndex: 998,
  },
});
