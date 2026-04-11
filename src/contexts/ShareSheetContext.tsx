import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ShareItem } from '../services/shareService';
import { ShareTray } from '../components/share/ShareTray';

interface ShareSheetContextValue {
  openShareTray: (item: ShareItem) => void;
  closeShareTray: () => void;
}

const ShareSheetContext = createContext<ShareSheetContextValue | null>(null);

/**
 * Provider for the global share sheet. Mount once near the app root so any
 * component (FullPlayer, ShowDetailScreen, etc.) can call openShareTray()
 * with a ShareItem and have the tray slide up — no need for each screen to
 * own its own sheet or manage open/close state.
 *
 * The provider itself holds the currently-open ShareItem and renders a single
 * <ShareTray> beneath its children. The ShareTray component is cross-platform
 * via Metro's .native.tsx / .web.tsx resolution (see Task 8 / Task 15).
 */
export function ShareSheetProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ShareItem | null>(null);

  const openShareTray = useCallback((item: ShareItem) => {
    setCurrent(item);
  }, []);

  const closeShareTray = useCallback(() => {
    setCurrent(null);
  }, []);

  const value = useMemo(
    () => ({ openShareTray, closeShareTray }),
    [openShareTray, closeShareTray]
  );

  return (
    <ShareSheetContext.Provider value={value}>
      {children}
      <ShareTray item={current} onClose={closeShareTray} />
    </ShareSheetContext.Provider>
  );
}

export function useShareSheet(): ShareSheetContextValue {
  const ctx = useContext(ShareSheetContext);
  if (!ctx) {
    throw new Error('useShareSheet must be used inside a <ShareSheetProvider>');
  }
  return ctx;
}
