import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Era } from '../constants/classicShows';

interface EraPickerProps {
  eras: Era[];
  selectedEra: Era | null;
  onEraChange: (era: Era | null) => void;
}

export function EraPicker({ eras, selectedEra, onEraChange }: EraPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (era: Era | null) => {
    onEraChange(era);
    setIsOpen(false);
  };

  const displayText = selectedEra ? selectedEra.name : 'All Eras';

  return (
    <View style={styles.container}>
      {/* Current Selection Button */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.eraText}>{displayText}</Text>
        <Ionicons name="chevron-down" size={18} color="#ff6b6b" />
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
              <Text style={styles.modalTitle}>Select Era</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {/* All Eras Option */}
              <TouchableOpacity
                style={[
                  styles.option,
                  selectedEra === null && styles.selectedOption,
                ]}
                onPress={() => handleSelect(null)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View>
                    <Text style={[styles.eraOption, selectedEra === null && styles.selectedText]}>
                      All Eras
                    </Text>
                    <Text style={styles.eraDescription}>1965-1995</Text>
                  </View>
                  {selectedEra === null && (
                    <Ionicons name="checkmark-circle" size={24} color="#ff6b6b" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Individual Eras */}
              {eras.map((era) => {
                const isSelected = era.name === selectedEra?.name;
                return (
                  <TouchableOpacity
                    key={era.name}
                    style={[
                      styles.option,
                      isSelected && styles.selectedOption,
                    ]}
                    onPress={() => handleSelect(era)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View>
                        <Text style={[styles.eraOption, isSelected && styles.selectedText]}>
                          {era.name}
                        </Text>
                        <Text style={styles.eraDescription}>{era.description}</Text>
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
    // No padding needed
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    gap: 6,
  },
  eraText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
    maxWidth: 400,
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
    maxHeight: 500,
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
    justifyContent: 'space-between',
    padding: 16,
  },
  eraOption: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  eraDescription: {
    fontSize: 14,
    color: '#999',
  },
  selectedText: {
    color: '#ff6b6b',
  },
});
