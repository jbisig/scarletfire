import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

type DiscoverLandingNavigationProp = StackNavigationProp<RootStackParamList, 'DiscoverLanding'>;

export function DiscoverLandingScreen() {
  const navigation = useNavigation<DiscoverLandingNavigationProp>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Navigation Cards */}
        <View style={styles.cardsContainer}>
          {/* Show of the Day Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('SOTD')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="star" size={32} color="#ff6b6b" />
            </View>
            <Text style={styles.cardTitle}>Show of the Day</Text>
            <Text style={styles.cardDescription}>
              Discover a randomly selected show from the top 365 most popular performances
            </Text>
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={24} color="#ff6b6b" />
            </View>
          </TouchableOpacity>

          {/* Classics Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Classics')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="trophy" size={32} color="#ff6b6b" />
            </View>
            <Text style={styles.cardTitle}>Classic Shows</Text>
            <Text style={styles.cardDescription}>
              Browse 47 legendary performances from different eras of the band's history
            </Text>
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={24} color="#ff6b6b" />
            </View>
          </TouchableOpacity>

          {/* Grateful Dead 101 Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('GratefulDead101')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="school" size={32} color="#ff6b6b" />
            </View>
            <Text style={styles.cardTitle}>Grateful Dead 101</Text>
            <Text style={styles.cardDescription}>
              10 essential shows perfect for first-time listeners and newcomers
            </Text>
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={24} color="#ff6b6b" />
            </View>
          </TouchableOpacity>

          {/* Song Versions Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('SongList')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="musical-notes" size={32} color="#ff6b6b" />
            </View>
            <Text style={styles.cardTitle}>Song Versions</Text>
            <Text style={styles.cardDescription}>
              Browse songs alphabetically and explore different performances across the years
            </Text>
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={24} color="#ff6b6b" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 180,
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
  },
  cardIconContainer: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#999',
    lineHeight: 22,
    marginBottom: 16,
  },
  cardArrow: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
});
