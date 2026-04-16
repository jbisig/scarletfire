// src/components/feed/ActivityList.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { feedService } from '../../services/feedService';
import { profileService } from '../../services/profileService';
import { ActivityRow } from './ActivityRow';
import type { ActivityEvent } from '../../services/activityService';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';

const PAGE_SIZE = 30;

interface ActorInfo {
  username: string;
  display_name: string | null;
  avatarUrl: string | null;
}

export function ActivityList({ onSwitchToPeople }: { onSwitchToPeople: () => void }) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [actors, setActors] = useState<Record<string, ActorInfo>>({});
  const actorsRef = useRef<Record<string, ActorInfo>>({});
  useEffect(() => { actorsRef.current = actors; }, [actors]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  // Stable identity — reads `actorsRef` (not state) to avoid re-fetch loops.
  const fetchActors = useCallback(async (newEvents: ActivityEvent[]) => {
    const missingIds = Array.from(
      new Set(newEvents.map(e => e.actor_id).filter(id => !(id in actorsRef.current))),
    );
    if (missingIds.length === 0) return;

    const fetched = await Promise.all(
      missingIds.map(async (id) => {
        const profile = await profileService.getProfileById(id);
        return [id, profile] as const;
      }),
    );

    setActors(prev => {
      const next = { ...prev };
      fetched.forEach(([id, p]) => {
        if (p) {
          next[id] = {
            username: p.username,
            display_name: p.display_name ?? null,
            avatarUrl: p.avatarUrl ?? null,
          };
        }
      });
      return next;
    });
  }, []); // EMPTY dependency array — stable identity; uses actorsRef to avoid re-fetch loops

  const load = useCallback(async (refreshing: boolean) => {
    if (refreshing) setIsRefreshing(true); else setIsLoading(true);
    try {
      const fresh = await feedService.getActivityFeed({
        cursor: null,
        pageSize: PAGE_SIZE,
      });
      setEvents(fresh);
      setReachedEnd(fresh.length < PAGE_SIZE);
      setCursor(fresh.length > 0 ? fresh[fresh.length - 1].created_at : null);
      await fetchActors(fresh);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchActors]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || reachedEnd || !cursor) return;
    setIsLoadingMore(true);
    try {
      const more = await feedService.getActivityFeed({ cursor, pageSize: PAGE_SIZE });
      if (more.length === 0) setReachedEnd(true);
      else {
        setEvents(prev => [...prev, ...more]);
        setCursor(more[more.length - 1].created_at);
        if (more.length < PAGE_SIZE) setReachedEnd(true);
        await fetchActors(more);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, fetchActors, isLoadingMore, reachedEnd]);

  useEffect(() => { load(false); }, [load]);

  const handlePressActor = (event: ActivityEvent) => {
    const a = actors[event.actor_id];
    if (a) navigation.navigate('PublicProfile', { username: a.username });
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
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const actor = actors[item.actor_id];
        return (
          <ActivityRow
            event={item}
            actorDisplayName={actor?.display_name ?? null}
            actorUsername={actor?.username ?? '…'}
            actorAvatarUrl={actor?.avatarUrl ?? null}
            onPressActor={() => handlePressActor(item)}
            onPressTarget={() => handlePressTarget(item)}
          />
        );
      }}
      onEndReachedThreshold={0.6}
      onEndReached={loadMore}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load(true)}
          tintColor={COLORS.accent}
        />
      }
      ListFooterComponent={isLoadingMore ? (
        <View style={styles.footer}><ActivityIndicator color={COLORS.accent} /></View>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: SPACING.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.md },
  emptyBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.accent, borderRadius: 24 },
  emptyBtnText: { ...TYPOGRAPHY.label, color: COLORS.background },
  footer: { paddingVertical: SPACING.md },
});
