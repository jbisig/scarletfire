import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRatings, useUserRatingsVersion } from '../../contexts/UserRatingsContext';
import {
  getActiveShowRating,
  getActivePerformanceRating,
  UserRatingEntry,
  UserStars,
} from '../../services/userRatingsStore';
import {
  resolveSystemShowStars,
  resolveSystemPerformanceStars,
} from '../../services/ratingResolver';
import type { RatingItem } from '../../contexts/RatingOverlayContext';
import { haptics } from '../../services/hapticService';

export interface RatingTrayState {
  /**
   * Stars to DISPLAY as the user's rating (optimistic — reflects a tap
   * instantly, before the store commit lands), or null when none.
   */
  userStars: UserStars | null;
  /** Active user override committed in the store, or null. */
  userEntry: UserRatingEntry | null;
  /** System (community) rating in stars, or null when none exists. */
  systemStars: 1 | 2 | 3 | null;
  handleSelect: (stars: UserStars) => void;
  handleReset: () => void;
}

/**
 * Rating state + actions for the rating tray, shared between the
 * .native and .web tray implementations.
 *
 * Taps update OPTIMISTIC local state first — the tray's small subtree
 * re-renders and paints the gold star in the same frame — and the store
 * commit is deferred one tick (setTimeout 0). The store's synchronous
 * subscriber fanout (list re-sorts, player displays, persistence) then
 * runs after the paint instead of blocking it. useSyncExternalStore
 * updates are always sync-priority, so deferring the write is the only
 * way to get the star on screen ahead of the fanout.
 */
export function useRatingTrayState(item: RatingItem | null): RatingTrayState {
  const version = useUserRatingsVersion();
  const { setShowRating, setPerformanceRating, resetShowRating, resetPerformanceRating } =
    useUserRatings();

  // Optimistic value: a pending star count, an explicit pending reset, or
  // nothing pending. Cleared once the store notifies (the deferred commit
  // landed) or when the tray switches items.
  const [optimistic, setOptimistic] = useState<{ stars: UserStars } | 'reset' | null>(null);
  const pendingCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemKey = item ? (item.kind === 'show' ? item.date : `${item.songTitle}|${item.date}`) : null;
  useEffect(() => {
    setOptimistic(null);
  }, [itemKey]);

  // The store notified — any deferred commit has landed, so the committed
  // value now agrees with what we showed optimistically.
  useEffect(() => {
    setOptimistic(null);
  }, [version]);

  useEffect(() => {
    return () => {
      if (pendingCommitRef.current) clearTimeout(pendingCommitRef.current);
    };
  }, []);

  const userEntry = useMemo(() => {
    if (!item) return null;
    return item.kind === 'show'
      ? getActiveShowRating(item.date)
      : getActivePerformanceRating(item.songTitle, item.date);
  }, [item, version]);

  const systemStars = useMemo(() => {
    if (!item) return null;
    return item.kind === 'show'
      ? resolveSystemShowStars(item.date)
      : resolveSystemPerformanceStars(item.songTitle, item.date);
  }, [item]);

  const userStars: UserStars | null =
    optimistic === 'reset'
      ? null
      : optimistic !== null
        ? optimistic.stars
        : (userEntry ? userEntry.stars : null);

  const deferCommit = (commit: () => void) => {
    if (pendingCommitRef.current) clearTimeout(pendingCommitRef.current);
    // One tick is enough: the optimistic render commits and paints in the
    // current frame; the store fanout runs in the next task.
    pendingCommitRef.current = setTimeout(() => {
      pendingCommitRef.current = null;
      commit();
    }, 0);
  };

  const handleSelect = (stars: UserStars) => {
    if (!item) return;
    setOptimistic({ stars });
    deferCommit(() => {
      if (item.kind === 'show') {
        setShowRating(item.date, stars);
      } else {
        setPerformanceRating(item.songTitle, item.date, stars, item.showIdentifier);
      }
    });
  };

  const handleReset = () => {
    if (!item) return;
    haptics.light();
    setOptimistic('reset');
    deferCommit(() => {
      if (item.kind === 'show') {
        resetShowRating(item.date);
      } else {
        resetPerformanceRating(item.songTitle, item.date);
      }
    });
  };

  return { userStars, userEntry, systemStars, handleSelect, handleReset };
}
