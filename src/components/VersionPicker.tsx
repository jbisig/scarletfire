import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RecordingVersion } from '../types/show.types';
import { formatDownloads } from '../utils/formatters';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface VersionPickerProps {
  versions: RecordingVersion[];
  selectedVersion: string;
  onVersionChange: (identifier: string) => void;
  /** Web only: use glass-morphism pill style */
  webGlassStyle?: boolean;
}

// Format taper/transferrer attribution line
const formatAttribution = (version: RecordingVersion): string | null => {
  const parts: string[] = [];
  if (version.taper) parts.push(`Taper: ${version.taper}`);
  if (version.transferrer) parts.push(`Transfer: ${version.transferrer}`);
  return parts.length > 0 ? parts.join(' · ') : null;
};

export const VersionPicker = React.memo<VersionPickerProps>(function VersionPicker({ versions, selectedVersion, onVersionChange, webGlassStyle }) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const currentVersion = versions.find(v => v.identifier === selectedVersion);

  const handleSelect = (identifier: string) => {
    onVersionChange(identifier);
    setIsOpen(false);
  };

  if (!currentVersion) return null;

  const currentAttribution = formatAttribution(currentVersion);

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
        accessibilityLabel={`Recording source: ${currentVersion.source}`}
        accessibilityHint="Double tap to select a different recording"
      >
        <View style={styles.selectorTopRow}>
          <Text style={webGlassStyle ? styles.sourceNameGlass : styles.sourceName}>
            {currentVersion.source}
          </Text>
          <View style={styles.viewsWrap}>
            <Text style={webGlassStyle ? styles.viewsGlass : styles.views} numberOfLines={1}>
              {formatDownloads(currentVersion.downloads)} views
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={webGlassStyle ? COLORS.textPrimary : COLORS.accent} />
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
                      >
                        <Ionicons name="close" size={28} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.optionsList}>
                      {versions.map((version) => {
                        const isSelected = version.identifier === selectedVersion;
                        const attribution = formatAttribution(version);
                        return (
                          <TouchableOpacity
                            key={version.identifier}
                            style={styles.option}
                            onPress={() => handleSelect(version.identifier)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.optionInfo}>
                              <Text style={[styles.optionSource, isSelected && styles.selectedText]}>
                                {version.source}
                              </Text>
                              <Text style={styles.optionDownloads}>
                                {formatDownloads(version.downloads)} views
                              </Text>
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
                      })}
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
              >
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
              {versions.map((version) => {
                const isSelected = version.identifier === selectedVersion;
                const attribution = formatAttribution(version);
                return (
                  <TouchableOpacity
                    key={version.identifier}
                    style={styles.option}
                    onPress={() => handleSelect(version.identifier)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionSource, isSelected && styles.selectedText]}>
                        {version.source}
                      </Text>
                      <Text style={styles.optionDownloads}>
                        {formatDownloads(version.downloads)} views
                      </Text>
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
              })}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  selector: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
  },
  selectorGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 342,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.33)',
    paddingVertical: 8,
    paddingHorizontal: SPACING.lg,
    // @ts-ignore - web only
    backdropFilter: 'blur(34px)',
    WebkitBackdropFilter: 'blur(34px)',
  },
  selectorWithAttribution: {
    paddingVertical: 12,
  },
  selectorTopRow: {
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
    flexShrink: 1,
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
    marginBottom: SPACING.xs,
  },
  selectedText: {
    color: COLORS.accent,
  },
  optionDownloads: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
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
