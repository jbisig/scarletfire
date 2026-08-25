import React from 'react';
import { ActionSheet, ActionSheetAction } from './ActionSheet';
import { ProfileDropdownState } from '../hooks/useProfileDropdown';

interface ProfileDropdownProps {
  state: ProfileDropdownState;
  isAuthenticated: boolean;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onSettings: () => void;
  onSupport: () => void;
  onViewProfile?: (() => void) | null;
}

/**
 * Avatar menu as a bottom tray (the positioned dropdown became an
 * ActionSheet along with the app's other menus). The prop surface is
 * unchanged so call sites didn't move; `state.position` is simply unused
 * now — the tray anchors to the bottom, not the avatar.
 */
export const ProfileDropdown = React.memo<ProfileDropdownProps>(function ProfileDropdown({
  state,
  isAuthenticated,
  onClose,
  onLogin,
  onLogout,
  onSettings,
  onSupport,
  onViewProfile,
}) {
  const actions: ActionSheetAction[] = isAuthenticated
    ? [
        ...(onViewProfile
          ? [
              {
                label: 'View Profile',
                icon: 'person-circle-outline' as const,
                onPress: onViewProfile,
              },
            ]
          : []),
        { label: 'Settings', icon: 'settings-outline' as const, onPress: onSettings },
        { label: 'Support', icon: 'help-circle-outline' as const, onPress: onSupport },
        {
          label: 'Log Out',
          icon: 'log-out-outline' as const,
          destructive: true,
          onPress: onLogout,
        },
      ]
    : [
        { label: 'Log In', icon: 'log-in-outline' as const, onPress: onLogin },
        { label: 'Support', icon: 'help-circle-outline' as const, onPress: onSupport },
      ];

  return <ActionSheet visible={state.isVisible} onClose={onClose} actions={actions} />;
});
