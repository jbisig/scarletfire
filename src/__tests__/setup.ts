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

// Mock expo-file-system/legacy with an in-memory fake (see mocks/expoFileSystemLegacy.ts).
// Tests reach the fake via `require('expo-file-system/legacy')` and its `__*` helpers.
jest.mock('expo-file-system/legacy', () =>
  require('./mocks/expoFileSystemLegacy').createFakeFileSystem()
);

// Mock expo-network: Wi-Fi and connected by default. Tests change it with
// `require('expo-network').__setNetworkState({ type: 'CELLULAR' })`, which
// also fires registered listeners.
jest.mock('expo-network', () => {
  const listeners = new Set();
  let state = { type: 'WIFI', isConnected: true, isInternetReachable: true };
  return {
    NetworkStateType: {
      NONE: 'NONE', UNKNOWN: 'UNKNOWN', CELLULAR: 'CELLULAR', WIFI: 'WIFI',
      BLUETOOTH: 'BLUETOOTH', ETHERNET: 'ETHERNET', WIMAX: 'WIMAX', VPN: 'VPN', OTHER: 'OTHER',
    },
    getNetworkStateAsync: jest.fn(async () => state),
    addNetworkStateListener: jest.fn((listener: (s: unknown) => void) => {
      listeners.add(listener);
      return { remove: () => { listeners.delete(listener); } };
    }),
    __setNetworkState(next: Partial<typeof state>) {
      state = { ...state, ...next };
      listeners.forEach((l: any) => l(state));
    },
    __resetNetworkState() {
      state = { type: 'WIFI', isConnected: true, isInternetReachable: true };
      listeners.clear();
    },
  };
});

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
