import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RecordingVersion } from '../types/show.types';
import { formatDownloads } from '../utils/formatters';
import { COLORS, FONTS } from '../constants/theme';

interface VersionPickerProps {
  versions: RecordingVersion[];
  selectedVersion: string;
  onVersionChange: (identifier: string) => void;
}

export const VersionPicker = React.memo<VersionPickerProps>(function VersionPicker({ versions, selectedVersion, onVersionChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const currentVersion = versions.find(v => v.identifier === selectedVersion);

  const handleSelect = (identifier: string) => {
    onVersionChange(identifier);
    setIsOpen(false);
  };

  if (!currentVersion) return null;

  return (
    <View style={styles.container}>
      {/* Current Selection - Pill Style */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.sourceName}>{currentVersion.source}</Text>
        <Text style={styles.downloads}>
          {formatDownloads(currentVersion.downloads)} downloads
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.accent} />
      </TouchableOpacity>

      {/* Fullscreen Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Source</Text>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Version List */}
          <ScrollView
            style={styles.optionsList}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {versions.map((version, index) => {
              const isSelected = version.identifier === selectedVersion;
              return (
                <TouchableOpacity
                  key={version.identifier}
                  style={styles.option}
                  onPress={() => handleSelect(version.identifier)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionInfo}>
                    <Text style={[
                      styles.optionSource,
                      isSelected && styles.selectedText
                    ]}>
                      {version.source}
                    </Text>
                    <Text style={styles.optionDownloads}>
                      {formatDownloads(version.downloads)} downloads
                    </Text>
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
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  downloads: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionInfo: {
    flex: 1,
  },
  optionSource: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  selectedText: {
    color: COLORS.accent,
  },
  optionDownloads: {
    fontSize: 14,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
});
