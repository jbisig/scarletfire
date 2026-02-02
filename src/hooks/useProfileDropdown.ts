import { useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
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
  const profileButtonRef = useRef<View>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const avatarUrl = profileService.getAvatarUrl(authState.user);

  const handleProfilePress = useCallback(() => {
    profileButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setPosition({ top: pageY + height + 8, left: pageX });
      setIsVisible(true);
    });
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
    await showLogin();
  }, [showLogin]);

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
