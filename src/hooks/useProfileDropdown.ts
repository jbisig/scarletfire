import { useRef, useState, useCallback } from 'react';
import { View, Platform, findNodeHandle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { useWebAuthModal } from '../components/web/WebAuthModal';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export interface ProfileDropdownState {
  isVisible: boolean;
  position: { top: number; left: number };
}

export interface UseProfileDropdownReturn {
  profileButtonRef: React.RefObject<View | null>;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  dropdownState: ProfileDropdownState;
  handleProfilePress: () => void;
  handleLogout: () => Promise<void>;
  handleLogin: () => Promise<void>;
  handleSettings: () => void;
  closeDropdown: () => void;
}

export function useProfileDropdown(): UseProfileDropdownReturn {
  const navigation = useNavigation<NavigationProp>();
  const { state: authState, logout, showLogin } = useAuth();
  const { openAuthModal } = useWebAuthModal();
  const profileButtonRef = useRef<View>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const avatarUrl = profileService.getAvatarUrl(authState.user);

  const handleProfilePress = useCallback(() => {
    if (Platform.OS === 'web') {
      // On web, resolve the DOM node from the ref (TouchableOpacity may not expose it directly)
      let domNode: HTMLElement | null = null;
      const ref = profileButtonRef.current;
      if (ref) {
        // Try getBoundingClientRect directly (View refs on RNW are DOM nodes)
        if (typeof (ref as any).getBoundingClientRect === 'function') { // eslint-disable-line @typescript-eslint/no-explicit-any
          domNode = ref as unknown as HTMLElement;
        } else {
          // Fallback: findNodeHandle returns DOM node on web
          const handle = findNodeHandle(ref);
          if (handle && typeof (handle as any).getBoundingClientRect === 'function') { // eslint-disable-line @typescript-eslint/no-explicit-any
            domNode = handle as unknown as HTMLElement;
          }
        }
      }
      const rect = domNode?.getBoundingClientRect?.();
      // Always open the dropdown — use measured position or a sensible fallback
      setPosition(rect
        ? { top: rect.bottom + 8, left: rect.left }
        : { top: 56, left: 16 }
      );
      setIsVisible(true);
    } else {
      profileButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setPosition({ top: pageY + height + 8, left: pageX });
        setIsVisible(true);
      });
    }
  }, []);

  const closeDropdown = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setIsVisible(false);
    await logout();
  }, [logout]);

  const handleLogin = useCallback(async () => {
    setIsVisible(false);
    if (Platform.OS === 'web') {
      openAuthModal('login');
    } else {
      await showLogin();
    }
  }, [showLogin, openAuthModal]);

  const handleSettings = useCallback(() => {
    setIsVisible(false);
    navigation.navigate('Settings');
  }, [navigation]);

  return {
    profileButtonRef,
    avatarUrl,
    isAuthenticated: authState.isAuthenticated,
    dropdownState: { isVisible, position },
    handleProfilePress,
    handleLogout,
    handleLogin,
    handleSettings,
    closeDropdown,
  };
}
