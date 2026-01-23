import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
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
            </View>

            <ScrollView style={styles.optionsList}>
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
              {eras.map((era, index) => {
                const isSelected = era.name === selectedEra?.name;
                const isLast = index === eras.length - 1;
                return (
                  <TouchableOpacity
                    key={era.name}
                    style={[styles.option, isLast && styles.optionLast]}
                    onPress={() => handleSelect(era)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.eraOption, isSelected && styles.selectedText]}>
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
        </TouchableOpacity>
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
    backgroundColor: COLORS.border,
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  eraText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  optionsList: {
    maxHeight: 500,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  eraOption: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  selectedText: {
    color: COLORS.accent,
  },
});
