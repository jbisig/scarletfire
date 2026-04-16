import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProfileImage } from '../ProfileImage';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import type { PeopleRow as PeopleRowData } from '../../services/feedService';
import { followService } from '../../services/followService';

export interface PeopleRowProps {
  row: PeopleRowData;
  avatarUrl: string | null;
  onPressRow: () => void;
  onFollowChange: (nowFollowing: boolean) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}k`;
  }
  return String(n);
}

function PeopleRowImpl({ row, avatarUrl, onPressRow, onFollowChange }: PeopleRowProps) {
  const [following, setFollowing] = useState(row.viewer_is_following);
  const [busy, setBusy] = useState(false);

  const handleToggle = async (e: any) => {
    e?.stopPropagation?.();
    if (busy) return;
    const prev = following;
    setBusy(true);
    setFollowing(!prev);
    try {
      if (prev) await followService.unfollowUser(row.id);
      else await followService.followUser(row.id);
      onFollowChange(!prev);
    } catch {
      setFollowing(prev);
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableOpacity style={styles.row} onPress={onPressRow}>
      <ProfileImage uri={avatarUrl} style={styles.avatar} />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {row.display_name || row.username}
          </Text>
          <TouchableOpacity
            style={[styles.pill, following ? styles.pillActive : styles.pillIdle]}
            onPress={handleToggle}
            disabled={busy}
          >
            <Text style={[styles.pillText, following ? styles.pillTextActive : styles.pillTextIdle]}>
              {following ? 'Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subline} numberOfLines={1}>
          @{row.username} · {formatCount(row.followers_count)} followers · {formatCount(row.following_count)} following
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export const PeopleRow = memo(PeopleRowImpl);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  text: { flex: 1, marginLeft: SPACING.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  displayName: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, fontWeight: '600', flex: 1 },
  subline: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 20, marginLeft: SPACING.sm },
  pillIdle: { backgroundColor: COLORS.accent },
  pillActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  pillText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  pillTextIdle: { color: COLORS.background },
  pillTextActive: { color: COLORS.textPrimary },
});
