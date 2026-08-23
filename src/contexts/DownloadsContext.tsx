/**
 * React wrapper around downloadsStore + downloadManager: hydrates the
 * manifest on mount, runs launch reconciliation once interactions settle,
 * and exposes subscription hooks. Mirrors the SourcePrefsContext split —
 * all state lives in the store so non-React code can read it.
 */
import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { InteractionManager, Platform } from 'react-native';
import type { ShowDetail } from '../types/show.types';
import type { DownloadedShow } from '../types/downloads.types';
import { downloadManager } from '../services/downloadManager';
import {
  getDownloadedBytesTotal,
  getDownloadedShow,
  getDownloadsVersion,
  getShowProgress,
  getWifiOnly,
  hydrateDownloads,
  listDownloadedShows,
  ShowProgress,
  subscribeDownloads,
} from '../services/downloadsStore';
import { logger } from '../utils/logger';

const log = logger.create('Downloads');

export interface DownloadActions {
  isSupported: boolean;
  enqueueShow: (detail: ShowDetail, opts?: { allowCellular?: boolean }) => Promise<void>;
  cancelShow: (identifier: string) => Promise<void>;
  retryShow: (identifier: string) => Promise<void>;
  removeShow: (identifier: string) => Promise<void>;
  removeAll: () => Promise<void>;
  allowCellular: (identifier: string) => void;
  setWifiOnly: (wifiOnly: boolean) => void;
}

const DownloadsContext = createContext<DownloadActions | undefined>(undefined);

export function useDownloadsVersion(): number {
  return useSyncExternalStore(subscribeDownloads, getDownloadsVersion, getDownloadsVersion);
}

const NO_PROGRESS: ShowProgress = { bytesDownloaded: 0, totalBytes: 0, fraction: 0 };

export function useShowDownload(identifier?: string): { entry: DownloadedShow | undefined; progress: ShowProgress } {
  const version = useDownloadsVersion();
  return useMemo(
    () => ({
      entry: identifier ? getDownloadedShow(identifier) : undefined,
      progress: identifier ? getShowProgress(identifier) : NO_PROGRESS,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [identifier, version],
  );
}

export function useDownloads(): DownloadedShow[] {
  const version = useDownloadsVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => listDownloadedShows(), [version]);
}

export function useDownloadSettings(): { wifiOnly: boolean; totalBytes: number; showCount: number } {
  const version = useDownloadsVersion();
  return useMemo(
    () => ({
      wifiOnly: getWifiOnly(),
      totalBytes: getDownloadedBytesTotal(),
      showCount: listDownloadedShows().filter(s => s.status === 'complete').length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );
}

export function useDownloadActions(): DownloadActions {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error('useDownloadActions must be used within DownloadsProvider');
  return ctx;
}

/** For components that may render outside the provider (tests, web). */
export function useOptionalDownloadActions(): DownloadActions | undefined {
  return useContext(DownloadsContext);
}

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    hydrateDownloads()
      .then(() => {
        if (cancelled) return;
        // Off the critical path: first paint and audio setup come first.
        InteractionManager.runAfterInteractions(() => {
          if (cancelled) return;
          downloadManager.reconcileOnLaunch().catch(error => log.error('Reconcile failed', error));
        });
      })
      .catch(error => log.error('Hydrate failed', error));
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<DownloadActions>(
    () => ({
      isSupported: downloadManager.isSupported,
      enqueueShow: (detail, opts) => downloadManager.enqueueShow(detail, opts),
      cancelShow: identifier => downloadManager.cancelShow(identifier),
      retryShow: identifier => downloadManager.retryShow(identifier),
      removeShow: identifier => downloadManager.removeShow(identifier),
      removeAll: () => downloadManager.removeAll(),
      allowCellular: identifier => downloadManager.allowCellular(identifier),
      setWifiOnly: wifiOnly => downloadManager.setWifiOnly(wifiOnly),
    }),
    [],
  );

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
}
