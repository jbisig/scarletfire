/**
 * Jest Test Setup
 *
 * Global mocks and configuration for all tests.
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setPositionAsync: jest.fn(),
          getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true }),
        },
        status: { isLoaded: true },
      }),
    },
    setAudioModeAsync: jest.fn(),
  },
  Video: jest.fn(),
  ResizeMode: { COVER: 'cover', CONTAIN: 'contain' },
}));

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
  })),
}));

// Mock @gorhom/bottom-sheet — the real library calls getBoundingClientRect
// and other DOM/native APIs that aren't available in the Jest test renderer.
// This lightweight stand-in lets children pass through so we can still
// query/press the ShareButton descendants inside the tray.
// Note: uses React.createElement (not JSX) because this file is .ts, not .tsx.
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const BottomSheet = React.forwardRef(({ children }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ expand: jest.fn(), close: jest.fn() }));
    return React.createElement(View, null, children);
  });
  const BottomSheetView = ({ children, ...p }: any) =>
    React.createElement(View, p, children);
  const BottomSheetBackdrop = ({ children }: any) =>
    React.createElement(View, null, children);
  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView,
    BottomSheetBackdrop,
  };
});

// Silence console warnings during tests
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Animated: `useNativeDriver`')
  ) {
    return;
  }
  originalWarn(...args);
};
