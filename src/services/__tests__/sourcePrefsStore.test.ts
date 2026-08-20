import {
  EMPTY_SOURCE_PREFS,
  getSourcePrefs,
  getSourcePrefsVersion,
  replaceSourcePrefs,
  setSourcePreference,
  getActivePin,
  setPin,
  clearPin,
  answerNudge,
  getPendingNudge,
  subscribeSourcePrefs,
  mergeSourcePrefs,
  pruneSourcePrefsTombstones,
  normalizeSourcePrefs,
  resetStoreForTests,
  SourcePrefs,
} from '../sourcePrefsStore';

beforeEach(() => resetStoreForTests());

describe('preference', () => {
  it('defaults to popular and records when it was set', () => {
    expect(getSourcePrefs().preference).toBe('popular');
    setSourcePreference('matrix', 100);
    expect(getSourcePrefs().preference).toBe('matrix');
    expect(getSourcePrefs().preferenceSetAt).toBe(100);
  });
});

describe('pins', () => {
  it('stores an active pin keyed by date-only and reads it back with either date form', () => {
    setPin('1977-05-08T00:00:00Z', 'gd77.sbd.hicks', 'sbd', 10);
    expect(getActivePin('1977-05-08')).toEqual({ identifier: 'gd77.sbd.hicks', format: 'sbd', pinnedAt: 10 });
    expect(getActivePin('1977-05-08T00:00:00Z')?.identifier).toBe('gd77.sbd.hicks');
  });

  it('clearPin tombstones (inactive but kept for sync); re-pinning reactivates', () => {
    setPin('1977-05-08', 'a', 'sbd', 10);
    clearPin('1977-05-08', 20);
    expect(getActivePin('1977-05-08')).toBeNull();
    expect(getSourcePrefs().pins['1977-05-08']).toEqual({ identifier: 'a', format: 'sbd', pinnedAt: 10, deletedAt: 20 });
    setPin('1977-05-08', 'b', 'aud', 30);
    expect(getActivePin('1977-05-08')).toEqual({ identifier: 'b', format: 'aud', pinnedAt: 30 });
  });

  it('clearing a date with no pin is a no-op (no tombstone, no notify)', () => {
    const listener = jest.fn();
    subscribeSourcePrefs(listener);
    clearPin('1966-01-01', 5);
    expect(getSourcePrefs().pins).toEqual({});
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('subscribe/version', () => {
  it('notifies and bumps version on every mutation', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeSourcePrefs(listener);
    const v0 = getSourcePrefsVersion();
    setSourcePreference('aud', 1);
    setPin('1977-05-08', 'a', 'aud', 2);
    answerNudge('aud', 'no');
    expect(listener).toHaveBeenCalledTimes(3);
    expect(getSourcePrefsVersion()).toBe(v0 + 3);
    unsubscribe();
    clearPin('1977-05-08', 3);
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('nudge', () => {
  it('offers when the last three active pins share a format that differs from the preference', () => {
    setPin('1977-05-08', 'a', 'matrix', 1);
    setPin('1977-05-09', 'b', 'matrix', 2);
    expect(getPendingNudge()).toBeNull();
    setPin('1972-08-27', 'c', 'matrix', 3);
    expect(getPendingNudge()).toBe('matrix');
  });

  it('uses the three MOST RECENT pins, ignores tombstones, and never offers unknown or the current preference', () => {
    setPin('1977-05-08', 'a', 'sbd', 1);
    setPin('1977-05-09', 'b', 'matrix', 2);
    setPin('1972-08-27', 'c', 'matrix', 3);
    setPin('1973-02-09', 'd', 'matrix', 4);
    expect(getPendingNudge()).toBe('matrix');          // sbd pin is 4th most recent
    clearPin('1973-02-09', 5);
    expect(getPendingNudge()).toBeNull();              // now: matrix, matrix, sbd
    setPin('1973-02-09', 'e', 'unknown', 6);
    setPin('1974-06-28', 'f', 'unknown', 7);
    setPin('1974-06-26', 'g', 'unknown', 8);
    expect(getPendingNudge()).toBeNull();
    setSourcePreference('matrix', 9);
    setPin('1977-05-08', 'h', 'matrix', 10);
    setPin('1977-05-09', 'i', 'matrix', 11);
    setPin('1972-08-27', 'j', 'matrix', 12);
    expect(getPendingNudge()).toBeNull();              // already the preference
  });

  it('stops offering a format once answered, either way', () => {
    ['1977-05-08', '1977-05-09', '1972-08-27'].forEach((d, i) => setPin(d, `x${i}`, 'aud', i + 1));
    expect(getPendingNudge()).toBe('aud');
    answerNudge('aud', 'no');
    expect(getPendingNudge()).toBeNull();
    expect(getSourcePrefs().nudgeAnswers).toEqual({ aud: 'no' });
  });
});

describe('mergeSourcePrefs', () => {
  const base = (over: Partial<SourcePrefs>): SourcePrefs => ({ ...EMPTY_SOURCE_PREFS, ...over });

  it('newer preferenceSetAt wins; ties keep local', () => {
    expect(mergeSourcePrefs(base({ preference: 'sbd', preferenceSetAt: 5 }), base({ preference: 'aud', preferenceSetAt: 9 })).preference).toBe('aud');
    expect(mergeSourcePrefs(base({ preference: 'sbd', preferenceSetAt: 9 }), base({ preference: 'aud', preferenceSetAt: 5 })).preference).toBe('sbd');
    expect(mergeSourcePrefs(base({ preference: 'sbd', preferenceSetAt: 5 }), base({ preference: 'aud', preferenceSetAt: 5 })).preference).toBe('sbd');
  });

  it('pins merge latest-wins on max(pinnedAt, deletedAt) per date, unioning disjoint dates', () => {
    const local = base({ pins: { '1977-05-08': { identifier: 'a', format: 'sbd', pinnedAt: 10 }, '1972-08-27': { identifier: 'l', format: 'aud', pinnedAt: 1 } } });
    const remote = base({ pins: { '1977-05-08': { identifier: 'a', format: 'sbd', pinnedAt: 10, deletedAt: 12 }, '1977-05-09': { identifier: 'r', format: 'fm', pinnedAt: 3 } } });
    const merged = mergeSourcePrefs(local, remote);
    expect(merged.pins['1977-05-08'].deletedAt).toBe(12);
    expect(Object.keys(merged.pins).sort()).toEqual(['1972-08-27', '1977-05-08', '1977-05-09']);
  });

  it('nudge answers union and yes wins a conflict', () => {
    const merged = mergeSourcePrefs(base({ nudgeAnswers: { sbd: 'no', aud: 'yes' } }), base({ nudgeAnswers: { sbd: 'yes', matrix: 'no' } }));
    expect(merged.nudgeAnswers).toEqual({ sbd: 'yes', aud: 'yes', matrix: 'no' });
  });
});

describe('pruneSourcePrefsTombstones', () => {
  it('drops tombstones older than 30 days and keeps active pins', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const prefs = { ...EMPTY_SOURCE_PREFS, pins: {
      old: { identifier: 'a', format: 'sbd' as const, pinnedAt: 0, deletedAt: 1 },
      fresh: { identifier: 'b', format: 'sbd' as const, pinnedAt: 0, deletedAt: 40 * DAY },
      active: { identifier: 'c', format: 'sbd' as const, pinnedAt: 0 },
    } };
    expect(Object.keys(pruneSourcePrefsTombstones(prefs, 45 * DAY).pins).sort()).toEqual(['active', 'fresh']);
  });
});

describe('normalizeSourcePrefs', () => {
  it('fills defaults for missing/garbage fields and drops malformed pins', () => {
    expect(normalizeSourcePrefs(null)).toEqual(EMPTY_SOURCE_PREFS);
    expect(normalizeSourcePrefs({ preference: 'laser' })).toEqual(EMPTY_SOURCE_PREFS);
    expect(normalizeSourcePrefs({
      preference: 'aud', preferenceSetAt: 3,
      pins: { '1977-05-08': { identifier: 'a', format: 'aud', pinnedAt: 1 }, bad: { identifier: 1 } },
      nudgeAnswers: { aud: 'no', sbd: 'maybe' },
    })).toEqual({
      preference: 'aud', preferenceSetAt: 3,
      pins: { '1977-05-08': { identifier: 'a', format: 'aud', pinnedAt: 1 } },
      nudgeAnswers: { aud: 'no' },
    });
  });

  it('replaceSourcePrefs notifies subscribers', () => {
    const listener = jest.fn();
    subscribeSourcePrefs(listener);
    replaceSourcePrefs({ ...EMPTY_SOURCE_PREFS, preference: 'fm', preferenceSetAt: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getSourcePrefs().preference).toBe('fm');
  });
});
