// src/components/feed/ActivityRow.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileImage } from '../ProfileImage';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import type { ActivityEvent } from '../../services/activityService';

export interface ActivityRowProps {
  event: ActivityEvent;
  actorDisplayName: string | null;
  actorUsername: string;
  actorAvatarUrl: string | null;
  onPressActor: () => void;
  onPressTarget: () => void;
}

const ICONS: Record<ActivityEvent['event_type'], keyof typeof Ionicons.glyphMap> = {
  listened_show: 'headset',
  favorited_show: 'heart',
  created_collection: 'add-circle',
  saved_collection: 'bookmark',
  followed_user: 'person-add',
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w`;
  return new Date(iso).toLocaleDateString();
}

function buildHeadline(event: ActivityEvent): string {
  const m = (event.metadata ?? {}) as Record<string, unknown>;
  switch (event.event_type) {
    case 'listened_show': {
      const date = (m.date as string) ?? '';
      const venue = (m.venue as string) ?? '';
      return venue ? `Listened to ${date} — ${venue}` : `Listened to ${date}`;
    }
    case 'favorited_show': {
      const date = (m.date as string) ?? '';
      const venue = (m.venue as string) ?? '';
      return venue ? `Favorited ${date} — ${venue}` : `Favorited ${date}`;
    }
    case 'created_collection':
      return `Created the playlist "${(m.name as string) ?? 'Untitled'}"`;
    case 'saved_collection':
      return `Saved ${m.creator_username ? `@${m.creator_username as string}'s` : "someone's"} playlist "${(m.name as string) ?? 'Untitled'}"`;
    case 'followed_user':
      return `Followed ${(m.display_name as string) ?? (m.username ? `@${m.username as string}` : 'a user')}`;
    default:
      return '';
  }
}

function ActivityRowImpl({
  event,
  actorDisplayName,
  actorUsername,
  actorAvatarUrl,
  onPressActor,
  onPressTarget,
}: ActivityRowProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onPressActor} style={styles.actorRow}>
        <ProfileImage uri={actorAvatarUrl} style={styles.avatar} />
        <View style={styles.actorText}>
          <Text style={styles.displayName} numberOfLines={1}>
            {actorDisplayName ?? actorUsername}
          </Text>
          <Text style={styles.username} numberOfLines={1}>@{actorUsername}</Text>
        </View>
        <Text style={styles.time}>{formatRelative(event.created_at)}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressTarget} style={styles.headlineRow}>
        <Ionicons name={ICONS[event.event_type]} size={16} color={COLORS.textSecondary} />
        <Text style={styles.headline} numberOfLines={2}>{buildHeadline(event)}</Text>
      </TouchableOpacity>
    </View>
  );
}

export const ActivityRow = memo(ActivityRowImpl);

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  actorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  actorText: { flex: 1, marginLeft: SPACING.sm },
  displayName: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: '600' },
  username: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  time: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingLeft: AVATAR_SIZE + SPACING.sm,
  },
  headline: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
});
