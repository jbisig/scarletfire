import { useRef, useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
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
      // On web, use DOM API directly — .measure() often fails silently
      const node = profileButtonRef.current as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const domNode = node?.getNode?.() || node;
      const rect = domNode?.getBoundingClientRect?.();
      if (rect) {
        setPosition({ top: rect.bottom + 8, left: rect.left });
        setIsVisible(true);
      }
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
