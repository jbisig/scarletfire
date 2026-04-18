// src/contexts/__tests__/PlayCountsContext.activityEmit.test.ts

// Mock native modules before importing anything that touches them
jest.mock('../../services/authService', () => ({
  authService: { getClient: jest.fn() },
}));
jest.mock('../../services/playCountsCloudService', () => ({
  playCountsCloudService: {
    loadPlayCounts: jest.fn().mockResolvedValue([]),
    syncPlayCounts: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ state: { isAuthenticated: false, user: null } }),
}));
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

import { activityService } from '../../services/activityService';

jest.mock('../../services/activityService', () => ({
  activityService: { emitEvent: jest.fn().mockResolvedValue(undefined) },
}));

// Pure unit test of the increment-detection helper that PlayCountsContext
// will export (see Step 2 for the helper definition).
import { computeShowPlayCount, shouldEmitListenedShow } from '../PlayCountsContext';
import type { PlayCount } from '../PlayCountsContext';

describe('computeShowPlayCount', () => {
  it('returns 0 when no tracks have been played', () => {
    expect(computeShowPlayCount([], 30)).toBe(0);
  });

  it('returns 1 when ≥50% of tracks have been played at least once', () => {
    const counts: PlayCount[] = Array.from({ length: 16 }, (_, i) => ({
      trackTitle: `t${i}`,
      showIdentifier: 's',
      showDate: '1977-05-08',
      count: 1,
      lastPlayedAt: 0,
      firstPlayedAt: 0,
    }));
    expect(computeShowPlayCount(counts, 30)).toBe(1);
  });

  it('returns 0 when fewer than 50% of tracks have been played', () => {
    const counts: PlayCount[] = Array.from({ length: 5 }, (_, i) => ({
      trackTitle: `t${i}`,
      showIdentifier: 's',
      showDate: '1977-05-08',
      count: 5,
      lastPlayedAt: 0,
      firstPlayedAt: 0,
    }));
    expect(computeShowPlayCount(counts, 30)).toBe(0);
  });

  it('returns 2 when ≥50% of tracks have been played twice', () => {
    const counts: PlayCount[] = Array.from({ length: 16 }, (_, i) => ({
      trackTitle: `t${i}`,
      showIdentifier: 's',
      showDate: '1977-05-08',
      count: 2,
      lastPlayedAt: 0,
      firstPlayedAt: 0,
    }));
    expect(computeShowPlayCount(counts, 30)).toBe(2);
  });
});

describe('shouldEmitListenedShow', () => {
  it('emits when count goes 0 -> 1', () => {
    expect(shouldEmitListenedShow(0, 1)).toBe(true);
  });
  it('emits when count goes 1 -> 2', () => {
    expect(shouldEmitListenedShow(1, 2)).toBe(true);
  });
  it('does not emit when count stays the same', () => {
    expect(shouldEmitListenedShow(1, 1)).toBe(false);
  });
  it('does not emit when count decreases (never expected)', () => {
    expect(shouldEmitListenedShow(2, 1)).toBe(false);
  });
});

import { diffNewlyListenedShows } from '../PlayCountsContext';

describe('diffNewlyListenedShows', () => {
  it('returns empty when sets are identical', () => {
    expect(diffNewlyListenedShows(new Set(['s1']), new Set(['s1']))).toEqual([]);
  });

  it('returns only shows newly crossed (in next, not in prev)', () => {
    expect(diffNewlyListenedShows(new Set(['s1']), new Set(['s1', 's2']))).toEqual(['s2']);
  });

  it('returns [] when next is a subset of prev (count decreased — never expected)', () => {
    expect(diffNewlyListenedShows(new Set(['s1', 's2']), new Set(['s1']))).toEqual([]);
  });

  it('returns multiple new shows when several cross in one render', () => {
    const result = diffNewlyListenedShows(new Set(['s1']), new Set(['s1', 's2', 's3']));
    expect(result.sort()).toEqual(['s2', 's3']);
  });
});

describe('diffNewlyListenedShows seed semantics', () => {
  it('emits nothing when prev is seeded to current (first-mount semantics)', () => {
    const initial = new Set(['s1', 's2', 's3']);
    // Simulate seed: ref.current = initial; diff against same set
    expect(diffNewlyListenedShows(initial, initial)).toEqual([]);
  });

  it('emits only post-seed additions, not historical ids', () => {
    const seeded = new Set(['s1', 's2', 's3']);
    const later  = new Set(['s1', 's2', 's3', 's4']);
    expect(diffNewlyListenedShows(seeded, later)).toEqual(['s4']);
  });
});
