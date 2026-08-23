/**
 * Settings → Downloads: the Wi-Fi-only guard, how much space downloads use,
 * and a confirmed "Remove all". Rendered in both Settings branches (signed
 * in and not) because downloads are device-local.
 */
import React, { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { useDownloadSettings, useOptionalDownloadActions } from '../contexts/DownloadsContext';
import { formatBytes, formatCount } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export function DownloadsSettingsSection() {
  const actions = useOptionalDownloadActions();
  const { wifiOnly, totalBytes, totalShows } = useDownloadSettings();
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (Platform.OS === 'web' || !actions || !actions.isSupported) return null;

  const summary = totalShows === 0 ? 'No downloads' : `${formatCount(totalShows, 'show')} · ${formatBytes(totalBytes)}`;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Downloads</Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Download on Wi-Fi only</Text>
          <Text style={styles.toggleHint}>
            Shows wait for Wi-Fi before downloading. You can still allow cellular for a single show when you start it.
          </Text>
        </View>
        <Switch
          value={wifiOnly}
          onValueChange={actions.setWifiOnly}
          trackColor={{ false: COLORS.border, true: COLORS.accent }}
          thumbColor="#FFFFFF"
          accessibilityRole="switch"
          accessibilityLabel="Download on Wi-Fi only"
        />
      </View>

      <View style={styles.usageRow}>
        <Text style={styles.usageLabel}>Storage used</Text>
        <Text style={styles.usageValue}>{summary}</Text>
      </View>

      <TouchableOpacity
        style={[styles.removeButton, totalShows === 0 ? styles.removeButtonDisabled : null]}
        onPress={() => setConfirmVisible(true)}
        disabled={totalShows === 0}
        accessibilityRole="button"
        accessibilityLabel="Remove all downloads"
        accessibilityState={{ disabled: totalShows === 0 }}
      >
        <Text style={styles.removeButtonText}>Remove all downloads</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={confirmVisible}
        title="Remove all downloads?"
        message={`Frees ${formatBytes(totalBytes)}. Shows stay in your library and can be downloaded again.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          setConfirmVisible(false);
          void actions.removeAll();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  toggleHint: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  usageLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  usageValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  removeButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
  },
  removeButtonDisabled: {
    opacity: 0.4,
  },
  removeButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
});
