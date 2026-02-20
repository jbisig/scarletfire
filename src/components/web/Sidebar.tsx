import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, WEB_LAYOUT } from '../../constants/theme';

interface SidebarItem {
  key: string;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS: SidebarItem[] = [
  { key: 'DiscoverTab', label: 'Discover', iconActive: 'compass', iconInactive: 'compass-outline' },
  { key: 'ShowsTab', label: 'Shows', iconActive: 'albums', iconInactive: 'albums-outline' },
  { key: 'SongsTab', label: 'Songs', iconActive: 'musical-notes', iconInactive: 'musical-notes-outline' },
  { key: 'FavoritesTab', label: 'Favorites', iconActive: 'heart', iconInactive: 'heart-outline' },
];

const appIcon = require('../../../assets/images/sign-in-logo.png');

interface SidebarProps {
  activeTab: string;
  onNavigate: (tabKey: string) => void;
}

export const Sidebar = React.memo(function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={appIcon} style={styles.logoIcon} />
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              onPress={() => onNavigate(item.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={isActive ? item.iconActive : item.iconInactive}
                  size={21}
                  color={isActive ? COLORS.textPrimary : '#999'}
                />
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: WEB_LAYOUT.sidebarWidth,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: WEB_LAYOUT.sidebarRadius,
    paddingTop: 0,
  },
  logoContainer: {
    paddingLeft: 10,
    paddingTop: 7,
    paddingBottom: 50,
  },
  logoIcon: {
    width: 61,
    height: 61,
    borderRadius: 8,
  },
  nav: {
    gap: 23,
    paddingHorizontal: 13,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    paddingTop: 2,
  },
  navLabel: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '500',
    fontSize: 20,
    color: '#999',
  },
  navLabelActive: {
    color: COLORS.textPrimary,
  },
});
