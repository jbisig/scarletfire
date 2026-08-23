/**
 * The show screen's download affordance. One icon, six states, driven by the
 * downloads store for the recording currently selected in the VersionPicker.
 * Confirmations use Alert.alert like the rest of the native action menus.
 */
import React, { useCallback } from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ShowDetail } from '../types/show.types';
import { COLORS } from '../constants/theme';
import { useDownloadSettings, useOptionalDownloadActions, useShowDownload } from '../contexts/DownloadsContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { ProgressRing } from './ProgressRing';
import { formatBytes } from '../utils/formatters';
import { describeDownloadError } from '../utils/userFacingError';

interface DownloadButtonProps {
  /** The loaded detail for `identifier`, or null while it is loading. */
  show: ShowDetail | null;
  identifier: string;
}

const STREAM_ONLY_MESSAGE =
  'Soundboard recordings are streaming-only by arrangement with the band and the Internet Archive.';

function estimatedBytes(show: ShowDetail): number {
  return show.tracks.reduce((sum, t) => sum + (t.size ?? 0), 0);
}

export function DownloadButton({ show, identifier }: DownloadButtonProps) {
  const actions = useOptionalDownloadActions();
  const { entry, progress } = useShowDownload(identifier);
  const { wifiOnly } = useDownloadSettings();
  const network = useNetworkStatus();

  const startDownload = useCallback(() => {
    if (!show || !actions) return;
    // Only prompt when we're actually connected and on cellular — not while
    // fully offline. Offline, the enqueue proceeds normally and the engine
    // (Wi-Fi guard) pauses it until connectivity returns; there is nothing
    // useful to ask the user right now.
    if (wifiOnly && network.isConnected && !network.isWifi) {
      Alert.alert(
        'Download over cellular?',
        `This show is about ${formatBytes(estimatedBytes(show))}. "Download on Wi-Fi only" is on in Settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => { void actions.enqueueShow(show, { allowCellular: true }); } },
        ],
      );
      return;
    }
    // Every non-prompt path enqueues with allowCellular: false — only the
    // cellular prompt's explicit "Download" button opts a show into
    // cellular. The engine's Wi-Fi guard (not this flag) is what pauses an
    // enqueued show until Wi-Fi/connectivity comes back.
    void actions.enqueueShow(show, { allowCellular: false });
  }, [actions, network.isConnected, network.isWifi, show, wifiOnly]);

  const onPress = useCallback(() => {
    if (!actions) return;
    if (show && show.downloadable !== true) {
      Alert.alert('Streaming only', STREAM_ONLY_MESSAGE);
      return;
    }
    switch (entry?.status) {
      case undefined:
        startDownload();
        return;
      case 'queued':
      case 'downloading':
        Alert.alert('Cancel download?', 'Anything downloaded so far will be removed.', [
          { text: 'Keep downloading', style: 'cancel' },
          { text: 'Cancel download', style: 'destructive', onPress: () => { void actions.cancelShow(identifier); } },
        ]);
        return;
      case 'paused':
        Alert.alert(
          network.isConnected ? 'Waiting for Wi-Fi' : 'Waiting for a connection',
          network.isConnected
            ? `This show will download when you're back on Wi-Fi (${formatBytes(entry.totalBytes)}).`
            : 'This show will download when you\'re back online.',
          [
            { text: 'OK', style: 'cancel' },
            ...(network.isConnected
              ? [{ text: 'Download over cellular', onPress: () => actions.allowCellular(identifier) }]
              : []),
            { text: 'Cancel download', style: 'destructive' as const, onPress: () => { void actions.cancelShow(identifier); } },
          ],
        );
        return;
      case 'complete':
        Alert.alert('Remove download?', `Frees ${formatBytes(entry.totalBytes)}. You can download it again any time.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => { void actions.removeShow(identifier); } },
        ]);
        return;
      case 'failed':
        Alert.alert('Download failed', describeDownloadError(entry.error), [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => { void actions.removeShow(identifier); } },
          { text: 'Retry', onPress: () => { void actions.retryShow(identifier); } },
        ]);
        return;
    }
  }, [actions, entry, identifier, network.isConnected, show, startDownload]);

  if (Platform.OS === 'web' || !actions || !actions.isSupported) return null;

  const streamOnly = show ? show.downloadable !== true : false;
  const percent = Math.round(progress.fraction * 100);
  const inFlight = entry?.status === 'queued' || entry?.status === 'downloading';
  const paused = entry?.status === 'paused';

  let label = 'Download show';
  let dimmed = !show;
  let glyph: React.ReactNode = <Ionicons name="arrow-down-circle-outline" size={26} color={COLORS.textPrimary} />;

  if (streamOnly) {
    label = 'Streaming only';
    dimmed = true;
    glyph = <Ionicons name="cloud-offline-outline" size={26} color={COLORS.textPrimary} />;
  } else if (inFlight || paused) {
    label = inFlight
      ? `Downloading, ${percent}%`
      : network.isConnected ? 'Waiting for Wi-Fi' : 'Waiting for a connection';
    // The circle IS the progress bar: accent while downloading, muted while
    // the show waits for Wi-Fi/connectivity.
    glyph = (
      <ProgressRing
        size={26}
        thickness={2.5}
        progress={progress.fraction}
        color={inFlight ? COLORS.accent : COLORS.textSecondary}
        trackColor={COLORS.border}
      >
        <Ionicons name="arrow-down" size={13} color={COLORS.textPrimary} />
      </ProgressRing>
    );
  } else if (entry?.status === 'complete') {
    label = 'Downloaded';
    glyph = (
      <View style={styles.completeCircle}>
        <Ionicons name="arrow-down" size={15} color="#FFFFFF" />
      </View>
    );
  } else if (entry?.status === 'failed') {
    label = 'Download failed';
    glyph = <Ionicons name="alert-circle-outline" size={26} color={COLORS.textPrimary} />;
  }

  return (
    <TouchableOpacity
      style={[styles.button, dimmed ? styles.dimmed : null]}
      onPress={onPress}
      disabled={!show}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: entry?.status === 'complete', disabled: !show }}
    >
      {glyph}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.4,
  },
  completeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
