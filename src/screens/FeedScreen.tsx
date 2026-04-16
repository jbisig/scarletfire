import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { ActivityList } from '../components/feed/ActivityList';
import { PeopleList } from '../components/feed/PeopleList';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

const HORIZONTAL_PADDING = SPACING.xl;

type Segment = 'activity' | 'people';

export function FeedScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { state: authState, showLogin } = useAuth();
  const user = authState.user;
  const { isDesktop } = useResponsive();

  const [segment, setSegment] = useState<Segment>('activity');
  const [myUsername, setMyUsername] = useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.id) { setMyUsername(null); return; }
    profileService.getProfileById(user.id).then(p => setMyUsername(p?.username ?? null));
  }, [user?.id]);

  const goToMyProfile = () => {
    if (!user) {
      showLogin();
      return;
    }
    if (myUsername) {
      navigation.navigate('PublicProfile', { username: myUsername });
    }
  };

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={[styles.headerSection, isDesktop && styles.headerSectionDesktop, { paddingTop: insets.top + 32 }]}>
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <Text style={styles.headerTitle}>Feed</Text>
          {!isDesktop && user && myUsername && (
            <TouchableOpacity onPress={goToMyProfile} style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>My Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
  headerTitle: { ...TYPOGRAPHY.heading2 },
  profileBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.textPrimary, fontWeight: '600' },
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
