import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { ActivityList } from '../components/feed/ActivityList';
import { PeopleList } from '../components/feed/PeopleList';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        {!isDesktop && user && myUsername && (
          <TouchableOpacity onPress={goToMyProfile} style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>My Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.segments}>
        <TouchableOpacity
          style={[styles.segment, segment === 'activity' && styles.segmentActive]}
          onPress={() => setSegment('activity')}
        >
          <Text style={[styles.segmentText, segment === 'activity' && styles.segmentTextActive]}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, segment === 'people' && styles.segmentActive]}
          onPress={() => setSegment('people')}
        >
          <Text style={[styles.segmentText, segment === 'people' && styles.segmentTextActive]}>
            People
          </Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: { ...TYPOGRAPHY.heading2, color: COLORS.textPrimary },
  profileBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.textPrimary, fontWeight: '600' },
  segments: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentActive: { borderBottomColor: COLORS.accent },
  segmentText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: COLORS.textPrimary },
});
