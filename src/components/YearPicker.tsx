import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface YearPickerProps {
  years: string[];
  selectedYear: string | null;
  onYearChange: (year: string | null) => void;
  compact?: boolean;
}

export function YearPicker({ years, selectedYear, onYearChange, compact = false }: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (year: string | null) => {
    onYearChange(year);
    setIsOpen(false);
  };

  const displayText = selectedYear || 'All Years';

  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      {/* Current Selection Button */}
      <TouchableOpacity
        style={compact ? styles.compactSelector : styles.selector}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={compact ? styles.compactSelectorContent : styles.selectorContent}>
          <Text style={compact ? styles.compactYearText : styles.yearText}>{displayText}</Text>
          <Ionicons name="chevron-down" size={16} color="#ff6b6b" />
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
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {/* All Years Option */}
              <TouchableOpacity
                style={[
                  styles.option,
                  selectedYear === null && styles.selectedOption,
                ]}
                onPress={() => handleSelect(null)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.yearOption, selectedYear === null && styles.selectedText]}>
                    All Years
                  </Text>
                  {selectedYear === null && (
                    <Ionicons name="checkmark-circle" size={24} color="#ff6b6b" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Individual Years */}
              {years.map((year) => {
                const isSelected = year === selectedYear;
                return (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.option,
                      isSelected && styles.selectedOption,
                    ]}
                    onPress={() => handleSelect(year)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[styles.yearOption, isSelected && styles.selectedText]}>
                        {year}
                      </Text>
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  yearText: {
    fontSize: 16,
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
  yearOption: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedText: {
    color: '#ff6b6b',
  },
  compactContainer: {
    // No padding for compact mode
  },
  compactSelector: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
  },
  compactSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  compactYearText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
