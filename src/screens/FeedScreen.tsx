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
import { SegmentedTabs, SegmentedTabItem } from '../components/SegmentedTabs';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT, FONTS } from '../constants/theme';

type Segment = 'activity' | 'people';

const FEED_TABS: SegmentedTabItem<Segment>[] = [
  { key: 'activity', label: 'Activity' },
  { key: 'people', label: 'People' },
];

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
    handleSupport,
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
                accessibilityRole="button"
                accessibilityLabel={isAuthenticated ? 'Your account' : 'Sign in'}
                accessibilityHint="Opens profile, settings, and support"
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
              onPress={handleViewProfile ?? undefined}
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
        onSupport={handleSupport}
        onViewProfile={handleViewProfile}
      />

      <SegmentedTabs
        tabs={FEED_TABS}
        activeTab={segment}
        onTabChange={setSegment}
        containerStyle={styles.tabContainer}
        getAccessibilityHint={(tab) => `Double tap to view ${tab}`}
      />

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
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
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
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
});
