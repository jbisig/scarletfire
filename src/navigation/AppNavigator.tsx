import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { ShowDetailScreen } from '../screens/ShowDetailScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { View, StyleSheet } from 'react-native';

export type RootStackParamList = {
  Home: undefined;
  ShowDetail: { identifier: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
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
            options={{ title: 'Grateful Dead Archive' }}
          />
          <Stack.Screen
            name="ShowDetail"
            component={ShowDetailScreen}
            options={{ title: 'Show Details' }}
          />
        </Stack.Navigator>
        <MiniPlayer onPress={() => {}} />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
