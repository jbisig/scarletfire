import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Era } from '../constants/classicShows';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

interface EraPickerProps {
  eras: Era[];
  selectedEra: Era | null;
  onEraChange: (era: Era | null) => void;
}

export const EraPicker = React.memo(function EraPicker({ eras, selectedEra, onEraChange }: EraPickerProps) {
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
        accessibilityRole="button"
        accessibilityLabel={`Era filter: ${displayText}`}
        accessibilityHint="Double tap to select a different era"
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
  },
  eraText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '500',
    color: COLORS.textHint,
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
  eraOption: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '500',
  },
  selectedText: {
    color: COLORS.accent,
  },
});
