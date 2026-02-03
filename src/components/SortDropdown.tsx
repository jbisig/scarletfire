import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  /** Whether the dropdown is visible */
  visible: boolean;
  /** Callback when the dropdown should close */
  onClose: () => void;
  /** Position for the dropdown (calculated from button ref) */
  position: { top: number; left: number };
  /** Available sort options */
  options: SortOption<T>[];
  /** Currently selected value */
  selectedValue: T;
  /** Callback when an option is selected */
  onSelect: (value: T) => void;
}

/**
 * Reusable sort dropdown modal that appears below a trigger button.
 * Shows a list of options with checkmark for the selected one.
 */
export function SortDropdown<T extends string>({
  visible,
  onClose,
  position,
  options,
  selectedValue,
  onSelect,
}: SortDropdownProps<T>) {
  const handleSelect = (value: T) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.container,
            { top: position.top, left: position.left }
          ]}
        >
          {options.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.itemText,
                    selectedValue === option.value && styles.itemTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    position: 'absolute',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    minWidth: 150,
    ...SHADOWS.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  itemText: {
    ...TYPOGRAPHY.body,
  },
  itemTextSelected: {
    color: COLORS.accent,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});
