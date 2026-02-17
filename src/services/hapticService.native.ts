/**
 * Centralized haptic feedback service.
 * Provides consistent haptic patterns across the app.
 * Automatically handles platform differences.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const haptics = {
  /** Light tap - for selections, toggles, small interactions */
  light: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /** Medium tap - for button presses, confirmations */
  medium: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /** Heavy tap - for important actions like play/pause */
  heavy: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /** Selection changed - for picker scrolling, tab switches */
  selection: () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  },

  /** Success notification - for completed actions like saving favorites */
  success: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /** Warning notification - for alerts */
  warning: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /** Error notification - for failures */
  error: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
