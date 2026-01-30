import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { haptics } from '../services/hapticService';

export interface DropdownOption<T extends string = string> {
  label: string;
  value: T;
}

export interface DropdownMenuProps<T extends string = string> {
  options: DropdownOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  /** Text to display on the trigger button. Defaults to selected option's label */
  triggerLabel?: string;
  /** Icon to show on the trigger button. Defaults to 'chevron-down' */
  triggerIcon?: 'chevron-down' | 'arrow-down' | 'arrow-up';
  /** Minimum width of the dropdown. Defaults to 140 */
  minWidth?: number;
  testID?: string;
}

/**
 * Reusable dropdown menu component.
 * Renders a pill-shaped trigger button that opens a positioned dropdown.
 */
function DropdownMenuInner<T extends string = string>({
  options,
  selectedValue,
  onSelect,
  triggerLabel,
  triggerIcon = 'chevron-down',
  minWidth = 140,
  testID,
}: DropdownMenuProps<T>) {
  const triggerRef = useRef<View>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayLabel = triggerLabel ?? selectedOption?.label ?? 'Select';

  const handleOpen = useCallback(() => {
    haptics.light();
    triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setPosition({ top: pageY + height + 8, right: 20 });
      setIsOpen(true);
    });
  }, []);

  const handleSelect = useCallback((value: T) => {
    haptics.light();
    onSelect(value);
    setIsOpen(false);
  }, [onSelect]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Trigger Button */}
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity
          style={styles.trigger}
          onPress={handleOpen}
          activeOpacity={0.7}
          testID={testID}
        >
          <Text style={styles.triggerText}>{displayLabel}</Text>
          <Ionicons name={triggerIcon} size={18} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <View
            style={[
              styles.dropdown,
              { top: position.top, right: position.right, minWidth },
            ]}
          >
            {options.map((option, index) => {
              const isSelected = option.value === selectedValue;
              return (
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
                        isSelected && styles.itemTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// Memoize for performance - generic component requires type assertion
export const DropdownMenu = React.memo(DropdownMenuInner) as typeof DropdownMenuInner;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 48,
    gap: SPACING.sm - 2,
  },
  triggerText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '500',
    color: COLORS.textHint,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
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
