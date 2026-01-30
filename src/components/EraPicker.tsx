import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Era } from '../constants/classicShows';
import { COLORS, FONTS } from '../constants/theme';

interface EraPickerProps {
  eras: Era[];
  selectedEra: Era | null;
  onEraChange: (era: Era | null) => void;
}

export function EraPicker({ eras, selectedEra, onEraChange }: EraPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

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
        <Ionicons name="chevron-down" size={18} color={COLORS.accent} />
      </TouchableOpacity>

      {/* Fullscreen Dropdown Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Era</Text>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Era List */}
          <ScrollView
            style={styles.optionsList}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* All Eras Option */}
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelect(null)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.eraOption,
                selectedEra === null && styles.selectedText
              ]}>
                All Eras
              </Text>
              {selectedEra === null && (
                <Ionicons name="checkmark" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            {/* Individual Eras */}
            {eras.map((era) => {
              const isSelected = era.name === selectedEra?.name;
              return (
                <TouchableOpacity
                  key={era.name}
                  style={styles.option}
                  onPress={() => handleSelect(era)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.eraOption,
                    isSelected && styles.selectedText
                  ]}>
                    {era.name}
                  </Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  eraText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: 'rgba(255,255,255,0.66)',
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
    borderBottomColor: COLORS.border,
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
    borderBottomColor: COLORS.border,
  },
  eraOption: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  selectedText: {
    color: COLORS.accent,
  },
});
