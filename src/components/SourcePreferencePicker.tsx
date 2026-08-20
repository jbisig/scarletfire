import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SOURCE_PREFERENCE_OPTIONS, SourcePreference } from '../constants/sourcePreferences';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface SourcePreferencePickerProps {
  value: SourcePreference;
  onChange: (value: SourcePreference) => void;
}

export function SourcePreferencePicker({ value, onChange }: SourcePreferencePickerProps) {
  return (
    <View accessibilityRole="radiogroup">
      {SOURCE_PREFERENCE_OPTIONS.map(option => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            testID={`source-pref-${option.value}`}
            style={styles.row}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            accessibilityHint={option.description}
          >
            <View style={styles.info}>
              <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
              <Text style={styles.hint}>{option.description}</Text>
            </View>
            <Ionicons
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={selected ? COLORS.accent : COLORS.textTertiary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  info: { flex: 1, marginRight: SPACING.lg },
  label: { ...TYPOGRAPHY.body, fontWeight: '600' },
  labelSelected: { color: COLORS.accent },
  hint: { ...TYPOGRAPHY.captionSmall, color: COLORS.textSecondary, marginTop: 2 },
});
