// src/components/feed/ActivityList.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { feedService } from '../../services/feedService';
import { ActivityRow } from './ActivityRow';
import type { ActivityEvent } from '../../services/activityService';
import { COLORS, TYPOGRAPHY, SPACING, LAYOUT } from '../../constants/theme';
import { useResponsive } from '../../hooks/useResponsive';
import type { RootStackParamList } from '../../navigation/AppNavigator';

const PAGE_SIZE = 30;

// Module-level cache: the list unmounts on every Activity/People toggle (and
// tab revisit), and reloading from zero showed a spinner for the full round
// trip each time. Returning mounts render this immediately and refresh in the
// background (stale-while-revalidate).
let cachedFeed: {
  events: ActivityEvent[];
  followingCursor: string | null;
  publicCursor: string | null;
} | null = null;

type LoadMode = 'initial' | 'refresh' | 'silent';

export function ActivityList({ onSwitchToPeople }: { onSwitchToPeople: () => void }) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDesktop } = useResponsive();
  const [events, setEvents] = useState<ActivityEvent[]>(() => cachedFeed?.events ?? []);

  const [isLoading, setIsLoading] = useState(cachedFeed === null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [followingCursor, setFollowingCursor] = useState<string | null>(cachedFeed?.followingCursor ?? null);
  const [publicCursor, setPublicCursor] = useState<string | null>(cachedFeed?.publicCursor ?? null);
  const [followingExhausted, setFollowingExhausted] = useState(false);
  const [publicExhausted, setPublicExhausted] = useState(false);

  const bothExhausted = followingExhausted && publicExhausted;

  const load = useCallback(async (mode: LoadMode) => {
    // 'silent' refreshes behind cached content — no spinner of either kind.
    if (mode === 'refresh') setIsRefreshing(true);
    else if (mode === 'initial') setIsLoading(true);
    try {
      const result = await feedService.getActivityFeed({
        followingCursor: null,
        publicCursor: null,
        includeFollowing: true,
        includePublic: true,
        pageSize: PAGE_SIZE,
      });
      setEvents(result.events);
      setFollowingCursor(result.nextFollowingCursor);
      setPublicCursor(result.nextPublicCursor);
      setFollowingExhausted(false); // fresh load resets exhaustion
      setPublicExhausted(false);
      cachedFeed = {
        events: result.events,
        followingCursor: result.nextFollowingCursor,
        publicCursor: result.nextPublicCursor,
      };
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || bothExhausted) return;
    setIsLoadingMore(true);
    try {
      const result = await feedService.getActivityFeed({
        followingCursor,
        publicCursor,
        includeFollowing: !followingExhausted,
        includePublic: !publicExhausted,
        pageSize: PAGE_SIZE,
      });
      if (result.events.length === 0) {
        // Both streams returned nothing — we're done.
        setFollowingExhausted(true);
        setPublicExhausted(true);
      } else {
        const nextFollowing = result.nextFollowingCursor ?? followingCursor;
        const nextPublic = result.nextPublicCursor ?? publicCursor;
        setEvents(prev => {
          const next = [...prev, ...result.events];
          cachedFeed = { events: next, followingCursor: nextFollowing, publicCursor: nextPublic };
          return next;
        });
        if (result.nextFollowingCursor) setFollowingCursor(result.nextFollowingCursor);
        if (result.nextPublicCursor) setPublicCursor(result.nextPublicCursor);
        if (result.followingExhausted) setFollowingExhausted(true);
        if (result.publicExhausted) setPublicExhausted(true);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, bothExhausted, followingCursor, publicCursor, followingExhausted, publicExhausted]);

  // Cached content renders instantly; the network refresh happens quietly.
  useEffect(() => { load(cachedFeed ? 'silent' : 'initial'); }, [load]);

  const handlePressActor = (event: ActivityEvent) => {
    navigation.navigate('PublicProfile', { username: event.actor_username });
  };

  const handlePressTarget = (event: ActivityEvent) => {
    if (event.target_type === 'show') {
      navigation.navigate('ShowDetail', { identifier: event.target_id });
    } else if (event.target_type === 'collection') {
      navigation.navigate('CollectionDetail', { collectionId: event.target_id });
    } else if (event.target_type === 'user') {
      const targetUsername = (event.metadata as any)?.username;
      if (targetUsername) navigation.navigate('PublicProfile', { username: targetUsername });
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>;
  }

  if (events.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Nothing here yet — follow some folks.</Text>
        <TouchableOpacity onPress={onSwitchToPeople} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Find people</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(e) => e.id}
      contentContainerStyle={[
        styles.listContent,
        isDesktop ? styles.listBottomDesktop : styles.listBottomMobile,
      ]}
      ItemSeparatorComponent={RowDivider}
      renderItem={({ item }) => (
        <ActivityRow
          event={item}
          actorDisplayName={item.actor_display_name}
          actorUsername={item.actor_username}
          actorAvatarUrl={item.actor_avatar_url}
          onPressActor={() => handlePressActor(item)}
          onPressTarget={() => handlePressTarget(item)}
        />
      )}
      onEndReachedThreshold={0.6}
      onEndReached={loadMore}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load('refresh')}
          tintColor={COLORS.accent}
        />
      }
      ListFooterComponent={isLoadingMore ? (
        <View style={styles.footer}><ActivityIndicator color={COLORS.accent} /></View>
      ) : null}
    />
  );
}

const RowDivider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  // Same centering and width cap as ActivityRow, so the line spans exactly
  // the rows it separates.
  divider: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 640,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  listContent: { paddingHorizontal: SPACING.xl },
  // Clear the overlaying mini player + tab bar on mobile; the desktop
  // PlayerBar is docked (not an overlay), so a normal inset suffices.
  listBottomMobile: { paddingBottom: LAYOUT.listBottomPadding },
  listBottomDesktop: { paddingBottom: SPACING.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.md },
  emptyBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.accent, borderRadius: 24 },
  emptyBtnText: { ...TYPOGRAPHY.label, color: COLORS.background },
  footer: { paddingVertical: SPACING.md },
});
