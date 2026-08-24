import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurBackground } from './shared/BlurBackground';
import { webStyle } from '../utils/webStyle';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GLASS_PILL_BLUR } from '../constants/theme';

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
  const { width: windowWidth } = useWindowDimensions();
  const dropdownWidth = 260;

  const handleSelect = (value: T) => {
    onSelect(value);
    onClose();
  };

  // Clamp left so the dropdown doesn't overflow the right edge
  const clampedLeft = Math.min(position.left, windowWidth - dropdownWidth - SPACING.lg);

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
            { top: position.top, left: clampedLeft, width: dropdownWidth }
          ]}
          accessibilityRole="menu"
          accessibilityLabel="Sort options"
        >
          {/* Native blur under the glass wash; web blurs via the container's
              backdrop-filter instead (a nested BlurBackground would stack a
              second, weaker blur on top of it). */}
          {Platform.OS !== 'web' && <BlurBackground intensity={40} tint="dark" />}
          {options.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.7}
                accessibilityRole="menuitem"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: selectedValue === option.value }}
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
    // Darker than the buttons' white wash: a floating menu needs its options
    // to hold contrast over whatever scrolls beneath it.
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
    ...(Platform.OS === 'web' && webStyle(GLASS_PILL_BLUR)),
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    minWidth: 150,
    overflow: 'hidden',
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
