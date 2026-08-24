// src/components/feed/ActivityRow.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ProfileImage } from '../ProfileImage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { formatDate } from '../../utils/formatters';
import { getCorrectVenue } from '../../utils/showLookup';
import type { ActivityEvent } from '../../services/activityService';

export interface ActivityRowProps {
  event: ActivityEvent;
  actorDisplayName: string | null;
  actorUsername: string;
  actorAvatarUrl: string | null;
  onPressActor: () => void;
  onPressTarget: () => void;
}

export function formatRelative(iso: string, now: number = Date.now()): string {
  const diffMs = now - new Date(iso).getTime();
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

/**
 * One sentence per event: a lowercase verb phrase followed by the thing it
 * happened to. `target` is what gets emphasized in the row and what the
 * sentence is "about" — a show is named by venue and dated, never by a raw
 * ISO string.
 */
export function describeActivity(event: ActivityEvent): { verb: string; target: string } {
  const m = (event.metadata ?? {}) as Record<string, unknown>;
  const date = typeof m.date === 'string' ? m.date : '';
  // listened_show events carry only the date; favorited_show also carries
  // the venue. The bundled catalog knows both, so prefer it and fall back
  // to whatever the event recorded.
  const showName = (date && getCorrectVenue(date)) || (typeof m.venue === 'string' ? m.venue : '');
  const showLabel = [showName, date ? formatDate(date) : ''].filter(Boolean).join(' · ');
  const collectionNoun = m.type === 'show_collection' ? 'collection' : 'playlist';
  const name = typeof m.name === 'string' ? m.name : 'Untitled';

  switch (event.event_type) {
    case 'listened_show':
      return { verb: 'listened to', target: showLabel || 'a show' };
    case 'favorited_show':
      return { verb: 'favorited', target: showLabel || 'a show' };
    case 'created_collection':
      return { verb: `created the ${collectionNoun}`, target: name };
    case 'saved_collection':
      return {
        verb: `saved ${m.creator_username ? `@${m.creator_username as string}'s` : 'a'} ${collectionNoun}`,
        target: name,
      };
    case 'followed_user':
      return {
        verb: 'followed',
        target: (typeof m.display_name === 'string' && m.display_name) ||
          (typeof m.username === 'string' ? `@${m.username}` : 'someone'),
      };
    default:
      return { verb: '', target: '' };
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
  const actor = actorDisplayName ?? `@${actorUsername}`;
  const { verb, target } = describeActivity(event);
  const when = formatRelative(event.created_at);
  const sentence = `${actor} ${verb} ${target}`;

  const handleActorPress = (e: any) => {
    e?.stopPropagation?.();
    onPressActor();
  };

  return (
    <View style={styles.row}>
      {/* Card-wide tap target beneath the content (see ShowCard for why a
          hit layer beats a wrapping button). Carries the whole sentence for
          assistive tech; the text block below is hidden from it. */}
      <Pressable
        style={({ pressed }) => [styles.hit, pressed && styles.hitPressed]}
        onPress={onPressTarget}
        accessibilityRole="button"
        accessibilityLabel={`${sentence}, ${when} ago`}
        accessibilityHint={
          event.target_type === 'show'
            ? 'Opens the show'
            : event.target_type === 'collection'
              ? 'Opens the collection'
              : 'Opens their profile'
        }
      />

      <View style={styles.content}>
        <Pressable
          onPress={handleActorPress}
          accessibilityRole="button"
          accessibilityLabel={`${actor}'s profile`}
          hitSlop={6}
        >
          <ProfileImage uri={actorAvatarUrl} style={styles.avatar} />
        </Pressable>

        <Text
          style={styles.sentence}
          onPress={onPressTarget}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={styles.emphasis} onPress={handleActorPress}>{actor}</Text>
          {` ${verb} `}
          <Text style={styles.emphasis}>{target}</Text>
        </Text>

        <Text style={styles.time} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {when}
        </Text>
      </View>
    </View>
  );
}

export const ActivityRow = memo(ActivityRowImpl);

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  row: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 640,
    marginVertical: SPACING.xs,
  },
  hit: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.md,
  },
  hitPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    pointerEvents: 'box-none',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  sentence: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 21,
    flex: 1,
    // Optically centre a single line against the avatar; wrapped lines
    // start from the same top edge.
    paddingTop: 1,
  },
  // Emphasis comes from the white-on-gray contrast; the weight step stays
  // small so the sentence reads as one line, not three chunks.
  emphasis: {
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  time: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    paddingTop: 3,
    pointerEvents: 'none',
  },
});
