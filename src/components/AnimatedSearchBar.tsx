import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, LAYOUT } from '../constants/theme';

interface AnimatedSearchBarProps {
  /** Whether the search bar is currently expanded */
  isExpanded: boolean;
  /** Callback when the search button is pressed to expand */
  onExpand: () => void;
  /** Callback when the close button is pressed to collapse */
  onClose: () => void;
  /** Current search query value */
  value: string;
  /** Callback when the search text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** The full width when expanded */
  expandedWidth: number;
  /** Whether to auto-close when text is cleared (default: false) */
  closeOnClear?: boolean;
  /** Whether to close when navigating away (default: true) */
  closeOnBlur?: boolean;
}

/**
 * Animated search bar that expands from a circular icon button
 * to a full-width search input with animation.
 */
export const AnimatedSearchBar = React.memo<AnimatedSearchBarProps>(function AnimatedSearchBar({
  isExpanded,
  onExpand,
  onClose,
  value,
  onChangeText,
  placeholder = 'Search',
  expandedWidth,
  closeOnClear = false,
  closeOnBlur = true,
}) {
  const navigation = useNavigation();
  const { isDesktop } = useResponsive();
  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  // Animated interpolation for width
  const searchBarWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [LAYOUT.headerButtonSize, expandedWidth],
    extrapolate: 'clamp',
  });

  // Sync animation with isExpanded prop
  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isExpanded, searchAnim]);

  // Handle navigation blur to close search
  useEffect(() => {
    if (!closeOnBlur) return;

    const unsubscribe = navigation.addListener('blur', () => {
      if (isExpanded) {
        Keyboard.dismiss();
        onClose();
      }
    });
    return unsubscribe;
  }, [navigation, isExpanded, onClose, closeOnBlur]);

  // Handle text change with optional close-on-clear behavior
  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    if (text === '' && closeOnClear && isExpanded) {
      Keyboard.dismiss();
      onClose();
    }
  }, [onChangeText, closeOnClear, isExpanded, onClose]);

  // Handle close button press
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onChangeText('');
    onClose();
  }, [onChangeText, onClose]);

  // Desktop web: always-expanded static search bar
  if (isDesktop) {
    return (
      <View style={[styles.searchContainer, { width: 300 }]}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={COLORS.textHint} style={styles.searchIconCentered} />
          <View style={styles.searchExpandedContent}>
            <View style={styles.searchIconSpacer} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textHint}
              value={value}
              onChangeText={handleChangeText}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={COLORS.textPrimary}
            />
            {value.length > 0 && (
              <TouchableOpacity
                style={styles.closeSearchButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.textHint} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={isExpanded ? undefined : onExpand}
      disabled={isExpanded}
    >
      <Animated.View style={[styles.searchContainer, { width: searchBarWidth, maxWidth: '100%' }]}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={COLORS.textHint} style={styles.searchIconCentered} />
          {isExpanded && (
            <View style={styles.searchExpandedContent}>
              <View style={styles.searchIconSpacer} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textHint}
                value={value}
                onChangeText={handleChangeText}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                selectionColor={COLORS.textPrimary}
              />
              <TouchableOpacity
                style={styles.closeSearchButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.textHint} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    height: LAYOUT.headerButtonSize,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.full,
    height: LAYOUT.headerButtonSize,
    overflow: 'hidden',
  },
  searchIconCentered: {
    position: 'absolute',
    left: 10,
  },
  searchExpandedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xs,
    gap: 10,
  },
  searchIconSpacer: {
    width: 20,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    ...(Platform.OS === 'android' && {
      textAlignVertical: 'center',
      includeFontPadding: false,
    }),
    // @ts-ignore - web only: remove outline and prevent iOS Safari auto-zoom on focus
    ...(Platform.OS === 'web' && { outlineStyle: 'none', fontSize: 16 }),
  },
  closeSearchButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
