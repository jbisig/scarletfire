import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { ShowDetailScreen } from '../screens/ShowDetailScreen';
import { SOTDScreen } from '../screens/SOTDScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { DiscoverLandingScreen } from '../screens/DiscoverLandingScreen';
import { ClassicsScreen } from '../screens/ClassicsScreen';
import { GratefulDead101Screen } from '../screens/GratefulDead101Screen';
import { SongListScreen } from '../screens/SongListScreen';
import { SongPerformancesScreen } from '../screens/SongPerformancesScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { FullPlayer } from '../components/FullPlayer';
import { View, StyleSheet } from 'react-native';

export type RootStackParamList = {
  Home: undefined;
  ShowDetail: { identifier: string };
  SOTD: undefined;
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Scarlet>fire' }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{ title: 'Show Details' }}
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
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="SongList"
        component={SongListScreen}
        options={{ title: 'Songs' }}
      />
      <Stack.Screen
        name="SongPerformances"
        component={SongPerformancesScreen}
        options={{ title: 'Performances' }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{ title: 'Show Details' }}
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
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favorites' }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{ title: 'Show Details' }}
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
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="DiscoverLanding"
        component={DiscoverLandingScreen}
        options={{ title: 'Discover' }}
      />
      <Stack.Screen
        name="SOTD"
        component={SOTDScreen}
        options={{ title: 'Show of the Day' }}
      />
      <Stack.Screen
        name="Classics"
        component={ClassicsScreen}
        options={{ title: 'Classic Shows' }}
      />
      <Stack.Screen
        name="GratefulDead101"
        component={GratefulDead101Screen}
        options={{ title: 'Grateful Dead 101' }}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={{ title: 'Show Details' }}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'ShowsTab') {
                iconName = focused ? 'albums' : 'albums-outline';
              } else if (route.name === 'SongsTab') {
                iconName = focused ? 'musical-notes' : 'musical-notes-outline';
              } else if (route.name === 'DiscoverTab') {
                iconName = focused ? 'compass' : 'compass-outline';
              } else if (route.name === 'FavoritesTab') {
                iconName = focused ? 'heart' : 'heart-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#ff6b6b',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              backgroundColor: '#1a1a1a',
              borderTopColor: '#333',
              paddingTop: 8,
              paddingBottom: 32,
              height: 89,
            },
            tabBarItemStyle: {
              justifyContent: 'center',
              alignItems: 'center',
            },
            tabBarLabelStyle: {
              marginTop: 4,
              marginBottom: 0,
            },
          })}
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
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 89,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
