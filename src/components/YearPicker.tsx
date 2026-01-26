import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

interface YearPickerProps {
  years: string[];
  selectedYear: string | null;
  onYearChange: (year: string | null) => void;
  compact?: boolean;
}

export const YearPicker = React.memo<YearPickerProps>(function YearPicker({ years, selectedYear, onYearChange, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

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
        {compact ? (
          <>
            <Text style={styles.compactYearText}>{displayText}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.accent} />
          </>
        ) : (
          <View style={styles.selectorContent}>
            <Text style={styles.yearText}>{displayText}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.accent} />
          </View>
        )}
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
            <Text style={styles.modalTitle}>Select Year</Text>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Year List */}
          <ScrollView
            style={styles.optionsList}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* All Years Option */}
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelect(null)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.yearOption,
                selectedYear === null && styles.selectedText
              ]}>
                All Years
              </Text>
              {selectedYear === null && (
                <Ionicons name="checkmark" size={24} color={COLORS.accent} />
              )}
            </TouchableOpacity>

            {/* Individual Years */}
            {years.map((year) => {
              const isSelected = year === selectedYear;
              return (
                <TouchableOpacity
                  key={year}
                  style={styles.option}
                  onPress={() => handleSelect(year)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.yearOption,
                    isSelected && styles.selectedText
                  ]}>
                    {year}
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
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
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
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
  yearOption: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  selectedText: {
    color: COLORS.accent,
  },
  // Compact styles (for inline use)
  compactContainer: {
    // No padding for compact mode
  },
  compactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#2a2a2a',
    borderRadius: 50,
    gap: 6,
  },
  compactYearText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: 'rgba(255,255,255,0.66)',
  },
});
