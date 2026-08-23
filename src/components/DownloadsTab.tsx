/**
 * The Saved tab's Downloads segment: every show in the manifest, newest
 * request first, with size and live status. Rows are plain Pressables so the
 * parent decides what tap and long-press do (navigate / action sheet).
 */
import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DownloadedShow } from '../types/downloads.types';
import { COLORS, LAYOUT, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useShowDownload } from '../contexts/DownloadsContext';
import { formatBytes, formatDateMMDDYYYY, getVenueFromShow } from '../utils/formatters';
import { EmptyState } from './StateViews';

interface DownloadsTabProps {
  shows: DownloadedShow[];
  isOffline: boolean;
  onPress: (show: DownloadedShow) => void;
  onLongPress: (show: DownloadedShow) => void;
}

function statusLine(show: DownloadedShow, percent: number): { text: string; tone: 'muted' | 'accent' | 'error' } | null {
  switch (show.status) {
    case 'queued':
      return { text: 'Queued', tone: 'muted' };
    case 'downloading':
      return { text: `Downloading · ${percent}%`, tone: 'accent' };
    case 'paused':
      return { text: 'Waiting for Wi-Fi', tone: 'muted' };
    case 'failed':
      return { text: 'Failed · Retry', tone: 'error' };
    default:
      return null;
  }
}

interface RowProps {
  show: DownloadedShow;
  onPress: (show: DownloadedShow) => void;
  onLongPress: (show: DownloadedShow) => void;
}

function DownloadRow({ show, onPress, onLongPress }: RowProps) {
  const { progress } = useShowDownload(show.identifier);
  const percent = Math.round(progress.fraction * 100);
  const status = statusLine(show, percent);
  const sizeLabel = formatBytes(show.status === 'complete' ? progress.bytesDownloaded || show.totalBytes : show.totalBytes);
  const title = `${formatDateMMDDYYYY(show.date)} · ${getVenueFromShow(show)}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      onPress={() => onPress(show)}
      onLongPress={() => onLongPress(show)}
      accessibilityRole="button"
      accessibilityLabel={`${title}${status ? `, ${status.text}` : ', downloaded'}`}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={show.status === 'complete' ? 'checkmark-circle' : show.status === 'failed' ? 'alert-circle-outline' : 'arrow-down-circle-outline'}
          size={22}
          color={show.status === 'complete' ? COLORS.accent : COLORS.textSecondary}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.rowSubtitleRow}>
          {show.location ? (
            <Text style={styles.rowSubtitle} numberOfLines={1}>{show.location} · </Text>
          ) : null}
          <Text style={styles.rowSubtitle} numberOfLines={1}>{sizeLabel}</Text>
        </View>
        {status ? (
          <Text style={[styles.rowStatus, status.tone === 'accent' ? styles.accent : null, status.tone === 'error' ? styles.error : null]}>
            {status.text}
          </Text>
        ) : null}
        {show.status === 'downloading' || show.status === 'paused' ? (
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.max(2, percent)}%` }]} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function DownloadsTab({ shows, isOffline, onPress, onLongPress }: DownloadsTabProps) {
  const renderItem = useCallback(
    ({ item }: { item: DownloadedShow }) => <DownloadRow show={item} onPress={onPress} onLongPress={onLongPress} />,
    [onPress, onLongPress],
  );

  if (shows.length === 0) {
    return (
      <EmptyState
        icon="download-outline"
        title="No downloads yet"
        message="Shows you download appear here. Tap the download icon on a show to save it for offline listening."
      />
    );
  }

  return (
    <FlatList
      data={shows}
      keyExtractor={item => item.identifier}
      renderItem={renderItem}
      ListHeaderComponent={isOffline ? (
        <View style={styles.offlineStrip}>
          <Ionicons name="cloud-offline-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.offlineText}>You're offline — showing your downloads.</Text>
        </View>
      ) : null}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingBottom: SPACING.xxl,
  },
  offlineStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  offlineText: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  rowSubtitleRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  rowSubtitle: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
  },
  rowStatus: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accent: {
    color: COLORS.accent,
  },
  error: {
    color: COLORS.error,
  },
  barTrack: {
    marginTop: SPACING.xs,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: 2,
    backgroundColor: COLORS.accent,
  },
});
