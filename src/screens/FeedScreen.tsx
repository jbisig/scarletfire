import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useProfileDropdown } from '../hooks/useProfileDropdown';
import { ProfileImage } from '../components/ProfileImage';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { ActivityList } from '../components/feed/ActivityList';
import { PeopleList } from '../components/feed/PeopleList';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

const HORIZONTAL_PADDING = SPACING.xl;

type Segment = 'activity' | 'people';

export function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();

  const {
    profileButtonRef,
    avatarUrl,
    isAuthenticated,
    dropdownState,
    handleProfilePress,
    handleLogout,
    handleLogin,
    handleSettings,
    handleViewProfile,
    closeDropdown,
  } = useProfileDropdown();

  const [segment, setSegment] = useState<Segment>('activity');

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop, { paddingTop: insets.top + 8.5 }]}>
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <View style={styles.headerLeft}>
            {!isDesktop && (
              <TouchableOpacity
                ref={profileButtonRef}
                onPress={handleProfilePress}
                activeOpacity={0.8}
              >
                <ProfileImage
                  uri={isAuthenticated ? avatarUrl : null}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Feed</Text>
          </View>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.myProfileButton}
              onPress={handleViewProfile}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="My Profile"
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={COLORS.textPrimary}
              />
              <Text style={styles.myProfileLabel}>My Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ProfileDropdown
        state={dropdownState}
        isAuthenticated={isAuthenticated}
        onClose={closeDropdown}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSettings={handleSettings}
        onViewProfile={handleViewProfile}
      />

      <View style={styles.tabContainer} accessibilityRole="tablist">
        {(['activity', 'people'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, segment === tab ? styles.activeTab : styles.inactiveTab]}
            onPress={() => setSegment(tab)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={`${tab === 'activity' ? 'Activity' : 'People'} tab`}
            accessibilityState={{ selected: segment === tab }}
            accessibilityHint={`Double tap to view ${tab}`}
          >
            <Text style={segment === tab ? styles.activeTabText : styles.inactiveTabText}>
              {tab === 'activity' ? 'Activity' : 'People'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {segment === 'activity'
          ? <ActivityList onSwitchToPeople={() => setSegment('people')} />
          : <PeopleList />
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  containerDesktop: { backgroundColor: COLORS.backgroundSecondary },
  headerSection: { zIndex: 10, backgroundColor: COLORS.background },
  headerSectionDesktop: { backgroundColor: COLORS.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: SPACING.lg,
  },
  headerDesktop: { paddingHorizontal: 32 },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBackground,
  },
  headerTitle: { ...TYPOGRAPHY.heading2 },
  myProfileButton: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMedium,
  },
  myProfileLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
  },
  activeTab: { backgroundColor: COLORS.accent },
  inactiveTab: { backgroundColor: COLORS.cardBackground },
  activeTabText: {
    fontSize: 16,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    color: COLORS.textPrimary,
    ...(Platform.OS === 'android' && { paddingTop: 2 }),
  },
  inactiveTabText: {
    fontSize: 16,
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    color: COLORS.textSecondary,
    ...(Platform.OS === 'android' && { paddingTop: 2 }),
  },
});
