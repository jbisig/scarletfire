import { Platform } from 'react-native';

export function usePlatform() {
  return {
    isWeb: Platform.OS === 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isNative: Platform.OS !== 'web',
  };
}
