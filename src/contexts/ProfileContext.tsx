import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { profileService, UserProfile } from '../services/profileService';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  profile: UserProfile | null;
  needsProfileSetup: boolean;
  isProfileLoading: boolean;
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const userId = authState.user?.id ?? null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const load = useCallback(async (id: string) => {
    setIsProfileLoading(true);
    try {
      const p = await profileService.getUserProfile(id);
      setProfile(p);
      setNeedsProfileSetup(p === null);
    } catch {
      // Transient error — never block the app. Fall through to MainTabs.
      setProfile(null);
      setNeedsProfileSetup(false);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setNeedsProfileSetup(false);
      setIsProfileLoading(false);
      return;
    }
    load(userId);
  }, [userId, load]);

  const refresh = useCallback(async () => {
    if (userId) await load(userId);
  }, [userId, load]);

  const value = useMemo(
    () => ({ profile, needsProfileSetup, isProfileLoading, refresh }),
    [profile, needsProfileSetup, isProfileLoading, refresh],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
