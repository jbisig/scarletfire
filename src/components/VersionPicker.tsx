import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordingVersion } from '../types/show.types';
import { formatDownloads } from '../utils/formatters';

interface VersionPickerProps {
  versions: RecordingVersion[];
  selectedVersion: string;
  onVersionChange: (identifier: string) => void;
}

export function VersionPicker({ versions, selectedVersion, onVersionChange }: VersionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentVersion = versions.find(v => v.identifier === selectedVersion);

  const handleSelect = (identifier: string) => {
    onVersionChange(identifier);
    setIsOpen(false);
  };

  if (!currentVersion) return null;

  return (
    <View style={styles.container}>
      {/* Current Selection Button */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          <View style={styles.selectorInfo}>
            <Text style={styles.sourceName}>{currentVersion.source}</Text>
            <Text style={styles.downloads}>
              {formatDownloads(currentVersion.downloads)} downloads
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#ff6b6b" />
        </View>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Recording Version</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {versions.map((version, index) => {
                const isSelected = version.identifier === selectedVersion;
                return (
                  <TouchableOpacity
                    key={version.identifier}
                    style={[
                      styles.option,
                      isSelected && styles.selectedOption,
                    ]}
                    onPress={() => handleSelect(version.identifier)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                      <View style={styles.optionInfo}>
                        <Text style={[styles.optionSource, isSelected && styles.selectedText]}>
                          {version.source}
                        </Text>
                        <Text style={styles.optionDownloads}>
                          {formatDownloads(version.downloads)} downloads
                        </Text>
                        <Text style={styles.optionIdentifier} numberOfLines={1}>
                          {version.identifier}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="#ff6b6b" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  selector: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  selectorInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  downloads: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  selectedOption: {
    backgroundColor: '#2a2a2a',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  optionInfo: {
    flex: 1,
  },
  optionSource: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  selectedText: {
    color: '#ff6b6b',
  },
  optionDownloads: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  optionIdentifier: {
    fontSize: 12,
    color: '#666',
  },
});
