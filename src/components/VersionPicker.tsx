import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RecordingVersion } from '../types/show.types';
import { formatLabel, lineageLabel } from '../constants/tags';
import { formatDownloads } from '../utils/formatters';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, GLASS_PILL, GLASS_PILL_BLUR } from '../constants/theme';
import { webStyle } from '../utils/webStyle';
import type { NudgeFormat } from '../services/sourcePrefsStore';

interface VersionPickerProps {
  versions: RecordingVersion[];
  selectedVersion: string;
  onVersionChange: (identifier: string) => void;
  /** Web only: use glass-morphism pill style */
  webGlassStyle?: boolean;
  /** Resolver's pick for this show — marked "Default" in the list. */
  defaultIdentifier?: string;
  /** The user's pin for this show — marked "Pinned"; enables the "Use default" row. */
  pinnedIdentifier?: string;
  onUseDefault?: () => void;
  nudge?: { format: NudgeFormat; onAnswer: (accept: boolean) => void };
}

// Format taper/transferrer attribution line
const formatAttribution = (version: RecordingVersion): string | null => {
  const parts: string[] = [];
  if (version.taper) parts.push(`Taper: ${version.taper}`);
  if (version.transferrer) parts.push(`Transfer: ${version.transferrer}`);
  return parts.length > 0 ? parts.join(' · ') : null;
};

const formatRating = (version: RecordingVersion): string | null => {
  if (typeof version.avgRating !== 'number') return null;
  const reviews = version.numReviews ? ` (${version.numReviews})` : '';
  return `★ ${version.avgRating.toFixed(1)}${reviews}`;
};

export const VersionPicker = React.memo<VersionPickerProps>(function VersionPicker({ versions, selectedVersion, onVersionChange, webGlassStyle, defaultIdentifier, pinnedIdentifier, onUseDefault, nudge }) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const currentVersion = versions.find(v => v.identifier === selectedVersion);

  const handleSelect = (identifier: string) => {
    onVersionChange(identifier);
    setIsOpen(false);
  };

  if (!currentVersion) return null;

  const currentAttribution = formatAttribution(currentVersion);

  const renderVersionOptions = () =>
    versions.map((version) => {
      const isSelected = version.identifier === selectedVersion;
      const attribution = formatAttribution(version);
      const rating = formatRating(version);
      const markers = [
        version.identifier === defaultIdentifier ? 'default' : null,
        version.identifier === pinnedIdentifier ? 'pinned' : null,
      ].filter(Boolean);
      const rowLabel = [
        formatLabel(version.format),
        ...version.lineage.map(lineageLabel),
        ...markers,
        `${formatDownloads(version.downloads)} views`,
        attribution,
      ].filter(Boolean).join(', ');
      return (
        <TouchableOpacity
          key={version.identifier}
          testID={`version-row-${version.identifier}`}
          style={styles.option}
          onPress={() => handleSelect(version.identifier)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={rowLabel}
          accessibilityState={{ selected: isSelected }}
          accessibilityHint={isSelected ? undefined : 'Double tap to switch to this recording'}
        >
          <View style={styles.optionInfo}>
            <View style={styles.tagRow}>
              <Text style={[styles.optionSource, isSelected && styles.selectedText]}>
                {formatLabel(version.format)}
              </Text>
              {version.lineage.map(tag => (
                <View key={tag} style={styles.lineageChip}>
                  <Text style={styles.lineageChipText}>{lineageLabel(tag)}</Text>
                </View>
              ))}
              {version.identifier === defaultIdentifier && (
                <View style={[styles.lineageChip, styles.markerChip]}><Text style={styles.markerChipText}>Default</Text></View>
              )}
              {version.identifier === pinnedIdentifier && (
                <View style={[styles.lineageChip, styles.markerChip]}><Text style={styles.markerChipText}>Pinned</Text></View>
              )}
            </View>
            <Text style={styles.optionDownloads}>
              {rating ? `${rating} · ` : ''}{formatDownloads(version.downloads)} views
            </Text>
            {version.provenance && (
              <Text style={styles.optionProvenance} numberOfLines={1}>
                {version.provenance}
              </Text>
            )}
            {attribution && (
              <Text style={styles.optionAttribution} numberOfLines={2}>
                {attribution}
              </Text>
            )}
          </View>
          {isSelected && (
            <Ionicons name="checkmark" size={24} color={COLORS.accent} />
          )}
        </TouchableOpacity>
      );
    });

  const renderHeaderExtras = () => (
    <>
      {nudge && (
        <View style={styles.nudgeRow} testID="nudge-row">
          <Text style={styles.nudgeText}>Prefer {formatLabel(nudge.format)} everywhere?</Text>
          <View style={styles.nudgeButtons}>
            <TouchableOpacity testID="nudge-yes" style={styles.nudgeButtonPrimary} onPress={() => nudge.onAnswer(true)} accessibilityRole="button">
              <Text style={styles.nudgeButtonPrimaryText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="nudge-no" style={styles.nudgeButton} onPress={() => nudge.onAnswer(false)} accessibilityRole="button">
              <Text style={styles.nudgeButtonText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {pinnedIdentifier && onUseDefault && (
        <TouchableOpacity
          testID="version-use-default"
          style={styles.option}
          onPress={() => { onUseDefault(); setIsOpen(false); }}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <View style={styles.optionInfo}>
            <Text style={styles.optionSource}>Use default</Text>
            <Text style={styles.optionDownloads}>Forget the pin for this show and follow your playback setting</Text>
          </View>
          <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Current Selection - Pill Style */}
      <TouchableOpacity
        style={[
          webGlassStyle ? styles.selectorGlass : styles.selector,
          !webGlassStyle && currentAttribution && styles.selectorWithAttribution,
        ]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Recording source: ${formatLabel(currentVersion.format)}`}
        accessibilityHint="Double tap to select a different recording"
      >
        <View style={styles.selectorTopRow}>
          <Text style={webGlassStyle ? styles.sourceNameGlass : styles.sourceName}>
            {formatLabel(currentVersion.format)}
          </Text>
          <View style={styles.viewsWrap}>
            <Text style={webGlassStyle ? styles.viewsGlass : styles.views} numberOfLines={1}>
              {formatDownloads(currentVersion.downloads)} views
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={webGlassStyle ? COLORS.textPrimary : COLORS.textSecondary} />
        </View>
        {!webGlassStyle && currentAttribution && (
          <Text style={styles.attribution} numberOfLines={1}>
            {currentAttribution}
          </Text>
        )}
      </TouchableOpacity>

      {/* Modal */}
      {Platform.OS === 'web' ? (
        <Modal
          visible={isOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
            <View style={styles.webOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.webModal}>
                  <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Source</Text>
                      <TouchableOpacity
                        onPress={() => setIsOpen(false)}
                        style={styles.closeButton}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                      >
                        <Ionicons name="close" size={28} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.optionsList}>
                      {renderHeaderExtras()}
                      {renderVersionOptions()}
                    </ScrollView>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : (
        <Modal
          visible={isOpen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsOpen(false)}
        >
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Source</Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
              {renderHeaderExtras()}
              {renderVersionOptions()}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  selector: {
    // Sits on the show's artwork: translucent black, not a grey card.
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
  },
  selectorGlass: {
    flexDirection: 'row',
    ...GLASS_PILL,
    height: 35,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    // Keep the pill wide enough to show the source name, views, and chevron
    // without the chevron getting pushed past the right edge on narrow layouts.
    minWidth: 220,
    ...(Platform.OS === 'web' && webStyle(GLASS_PILL_BLUR)),
  },
  selectorWithAttribution: {
    paddingVertical: 12,
  },
  selectorTopRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  sourceName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
    fontSize: 15,
  },
  sourceNameGlass: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  viewsWrap: {
    flex: 1,
    minWidth: 0,
  },
  views: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  viewsGlass: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: COLORS.textPrimary,
    opacity: 0.5,
  },
  attribution: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Fullscreen modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading4,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionInfo: {
    flex: 1,
  },
  optionSource: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '500',
  },
  selectedText: {
    color: COLORS.accent,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  lineageChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lineageChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  markerChip: { borderColor: COLORS.accent },
  markerChipText: { ...TYPOGRAPHY.caption, color: COLORS.accent, fontWeight: '600' },
  nudgeRow: {
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  nudgeText: { ...TYPOGRAPHY.body, fontWeight: '600', marginBottom: SPACING.sm },
  nudgeButtons: { flexDirection: 'row', gap: SPACING.sm },
  nudgeButtonPrimary: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, backgroundColor: COLORS.accent },
  nudgeButtonPrimaryText: { ...TYPOGRAPHY.bodySmall, color: '#FFFFFF', fontWeight: '600' },
  nudgeButton: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  nudgeButtonText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  optionDownloads: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  optionProvenance: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  optionAttribution: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  webOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webModal: {
    maxWidth: 800,
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
