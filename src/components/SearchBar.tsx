import React, { useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  testID?: string;
}

/**
 * Reusable search bar component with consistent styling.
 * Features: search icon, text input, conditional clear button.
 */
export const SearchBar = React.memo<SearchBarProps>(function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onClear,
  onFocus,
  onBlur,
  autoFocus = false,
  testID,
}) {
  const inputRef = useRef<TextInput>(null);

  const handleClear = useCallback(() => {
    onChangeText('');
    onClear?.();
    inputRef.current?.blur();
  }, [onChangeText, onClear]);

  const handleContainerPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleContainerPress}
      activeOpacity={1}
      testID={testID}
      accessibilityRole="search"
      accessibilityLabel="Search field"
    >
      <Ionicons
        name="search"
        size={20}
        color={COLORS.textHint}
        style={styles.searchIcon}
      />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textHint}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        selectionColor={COLORS.textPrimary}
        accessibilityLabel={placeholder}
        accessibilityHint="Enter text to search"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          accessibilityHint="Double tap to clear search text"
        >
          <Ionicons name="close-circle" size={20} color={COLORS.textHint} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
