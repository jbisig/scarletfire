import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { followService, FollowUser } from '../services/followService';
import { profileService } from '../services/profileService';
import { ProfileImage } from '../components/ProfileImage';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

type FollowListRouteParams = {
  FollowList: {
    userId?: string;
    username: string;
    mode: 'followers' | 'following';
  };
};

export function FollowListScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProp<FollowListRouteParams, 'FollowList'>>();
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  const user = state.user;

  const { username, mode } = route.params;
  const paramUserId = route.params.userId;

  const [userId, setUserId] = useState<string | null>(paramUserId ?? null);
  const [rows, setRows] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve userId from username on deep-link entry.
  useEffect(() => {
    if (userId) return;
    profileService
      .getProfileIdByUsername(username)
      .then((r) => setUserId(r?.id ?? null))
      .catch(() => setUserId(null));
  }, [username, userId]);

  const viewingOwn = !!user && user.id === userId;

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const result =
        mode === 'followers'
          ? await followService.getFollowers(userId)
          : await followService.getFollowing(userId);
      setRows(result);
    } finally {
      setIsLoading(false);
    }
  }, [mode, userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRowPress = (row: FollowUser) => {
    if (row.isPrivate || !row.username) return;
    navigation.push('PublicProfile', { username: row.username });
  };

  const handleAction = async (row: FollowUser) => {
    if (!viewingOwn) return;
    try {
      if (mode === 'followers') {
        await followService.removeFollower(row.id);
      } else {
        await followService.unfollowUser(row.id);
      }
      setRows(prev => prev.filter(r => r.id !== row.id));
    } catch {
      Alert.alert('Error', 'Could not complete that action.');
    }
  };

  const title = mode === 'followers' ? 'Followers' : 'Following';
  const emptyText = mode === 'followers' ? 'No followers yet' : 'Not following anyone yet';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>@{username}</Text>
        </View>
      </View>

      {isLoading || !userId ? (
        <View style={styles.empty}><ActivityIndicator color={COLORS.accent} /></View>
      ) : rows.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>{emptyText}</Text></View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rowMain}
                onPress={() => handleRowPress(item)}
                disabled={item.isPrivate}
                activeOpacity={item.isPrivate ? 1 : 0.7}
              >
                <ProfileImage uri={item.avatarUrl} style={styles.avatar} />
                <View style={styles.rowText}>
                  {item.isPrivate ? (
                    <>
                      <Text style={styles.displayName} numberOfLines={1}>Private User</Text>
                      <Text style={styles.username} numberOfLines={1}>Profile is not public</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.displayName} numberOfLines={1}>
                        {item.display_name || item.username}
                      </Text>
                      <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
              {viewingOwn && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(item)}>
                  <Text style={styles.actionText}>
                    {mode === 'followers' ? 'Remove' : 'Unfollow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  title: { ...TYPOGRAPHY.heading2 },
  subtitle: { ...TYPOGRAPHY.caption },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  rowText: { marginLeft: SPACING.sm, flex: 1 },
  displayName: { ...TYPOGRAPHY.body, fontWeight: '600' },
  username: { ...TYPOGRAPHY.caption },
  actionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: { ...TYPOGRAPHY.caption, color: COLORS.textPrimary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
});
