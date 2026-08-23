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
  let icon: keyof typeof Ionicons.glyphMap = 'download-outline';
  let label = 'Download show';
  let color: string = COLORS.textPrimary;
  let dimmed = !show;
  let showBar = false;

  if (streamOnly) {
    icon = 'cloud-offline-outline';
    label = 'Streaming only';
    dimmed = true;
  } else if (entry?.status === 'queued' || entry?.status === 'downloading') {
    icon = 'arrow-down-circle-outline';
    label = `Downloading, ${percent}%`;
    showBar = true;
  } else if (entry?.status === 'paused') {
    icon = 'cloud-download-outline';
    label = network.isConnected ? 'Waiting for Wi-Fi' : 'Waiting for a connection';
    showBar = true;
  } else if (entry?.status === 'complete') {
    icon = 'checkmark-circle';
    label = 'Downloaded';
    color = COLORS.accent;
  } else if (entry?.status === 'failed') {
    icon = 'alert-circle-outline';
    label = 'Download failed';
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
      <Ionicons name={icon} size={26} color={color} />
      {showBar ? (
        <View style={styles.barTrack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.barFill, { width: `${Math.max(4, percent)}%` }]} />
        </View>
      ) : null}
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
  barTrack: {
    position: 'absolute',
    bottom: 2,
    width: 28,
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
