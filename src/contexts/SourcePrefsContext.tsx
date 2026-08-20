/**
 * React wrapper around sourcePrefsStore: AsyncStorage persistence, debounced
 * Supabase sync, merge-on-login, and subscription hooks. Mirrors
 * UserRatingsContext line for line where it can — read that file's comments
 * for the load/merge race rationale.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useDebouncedSync } from '../hooks/useDebouncedSync';
import { useSyncErrorToast } from '../hooks/useSyncErrorToast';
import { STORAGE_KEYS } from '../constants/registry';
import { logger } from '../utils/logger';
import type { RecordingFormat } from '../types/show.types';
import type { SourcePreference } from '../constants/sourcePreferences';
import {
  answerNudge as storeAnswerNudge,
  clearPin as storeClearPin,
  getActivePin,
  getPendingNudge,
  getSourcePrefs,
  getSourcePrefsVersion,
  mergeSourcePrefs,
  normalizeSourcePrefs,
  NudgeAnswer,
  pruneSourcePrefsTombstones,
  replaceSourcePrefs,
  setPin as storeSetPin,
  setSourcePreference,
  SourcePin,
  subscribeSourcePrefs,
} from '../services/sourcePrefsStore';
import { userPreferencesCloudService } from '../services/userPreferencesCloudService';

const prefsLogger = logger.create('SourcePrefs');

interface SourcePrefsContextValue {
  setPreference: (preference: SourcePreference) => void;
  pin: (date: string, identifier: string, format: RecordingFormat) => void;
  clearPin: (date: string) => void;
  answerNudge: (format: RecordingFormat, answer: NudgeAnswer) => void;
}

const SourcePrefsContext = createContext<SourcePrefsContextValue | undefined>(undefined);

export function useSourcePrefsVersion(): number {
  return useSyncExternalStore(subscribeSourcePrefs, getSourcePrefsVersion, getSourcePrefsVersion);
}

export function useSourcePreference(): SourcePreference {
  const version = useSourcePrefsVersion();
  return useMemo(() => getSourcePrefs().preference, [version]);
}

export function usePendingNudge(): RecordingFormat | null {
  const version = useSourcePrefsVersion();
  return useMemo(() => getPendingNudge(), [version]);
}

export function useActivePin(date: string | undefined): SourcePin | null {
  const version = useSourcePrefsVersion();
  return useMemo(() => (date ? getActivePin(date) : null), [date, version]);
}

export function SourcePrefsProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const showSyncErrorToast = useSyncErrorToast('Failed to sync playback settings to cloud. Changes saved locally.');
  const isLoadedRef = useRef(false);

  const authStateRef = useRef(authState);
  useEffect(() => { authStateRef.current = authState; }, [authState]);

  const performSync = useCallback((): Promise<void> | undefined => {
    const auth = authStateRef.current;
    if (!auth.isAuthenticated || !auth.user) return undefined;
    return userPreferencesCloudService
      .syncPrefs(auth.user.id, getSourcePrefs())
      .catch((error) => {
        prefsLogger.error('Failed to sync source prefs to cloud:', error);
        showSyncErrorToast();
      });
  }, [showSyncErrorToast]);

  const { schedule: scheduleSync, flush: flushSync } = useDebouncedSync(performSync);

  // See UserRatingsContext for why the merge-on-login effect awaits this.
  const loadCompleteRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    loadCompleteRef.current = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.SOURCE_PREFS);
        if (raw) replaceSourcePrefs(pruneSourcePrefsTombstones(normalizeSourcePrefs(JSON.parse(raw))));
      } catch (error) {
        prefsLogger.error('Failed to load source prefs:', error);
      } finally {
        isLoadedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    return subscribeSourcePrefs(() => {
      AsyncStorage.setItem(STORAGE_KEYS.SOURCE_PREFS, JSON.stringify(getSourcePrefs()))
        .catch(error => prefsLogger.error('Failed to save source prefs:', error));
      if (isLoadedRef.current) scheduleSync();
    });
  }, [scheduleSync]);

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) return;
    const userId = authState.user.id;
    (async () => {
      try {
        if (loadCompleteRef.current) await loadCompleteRef.current;
        const cloud = await userPreferencesCloudService.loadPrefs(userId);
        const merged = pruneSourcePrefsTombstones(mergeSourcePrefs(getSourcePrefs(), cloud));
        replaceSourcePrefs(merged);
        await userPreferencesCloudService.syncPrefs(userId, merged);
      } catch (error) {
        prefsLogger.error('Failed to sync source prefs from cloud:', error);
      }
    })();
  }, [authState.isAuthenticated, authState.user?.id]);

  const wasAuthenticatedRef = useRef(authState.isAuthenticated);
  useEffect(() => {
    if (wasAuthenticatedRef.current && !authState.isAuthenticated) flushSync();
    wasAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated, flushSync]);

  const value = useMemo<SourcePrefsContextValue>(() => ({
    setPreference: (preference) => setSourcePreference(preference),
    pin: (date, identifier, format) => storeSetPin(date, identifier, format),
    clearPin: (date) => storeClearPin(date),
    answerNudge: (format, answer) => storeAnswerNudge(format, answer),
  }), []);

  return <SourcePrefsContext.Provider value={value}>{children}</SourcePrefsContext.Provider>;
}

export function useSourcePrefs(): SourcePrefsContextValue {
  const ctx = useContext(SourcePrefsContext);
  if (!ctx) throw new Error('useSourcePrefs must be used inside a <SourcePrefsProvider>');
  return ctx;
}
