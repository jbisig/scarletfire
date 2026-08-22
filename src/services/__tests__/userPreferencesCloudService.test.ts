import type { SourcePrefs } from '../sourcePrefsStore';

const mockGetSession = jest.fn();
const mockUpsert = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

jest.mock('../authService', () => ({
  authService: {
    getClient: () => ({
      auth: { getSession: mockGetSession },
      from: (table: string) => {
        mockFrom(table);
        return {
          upsert: mockUpsert,
          select: () => ({ eq: () => ({ single: mockSingle }) }),
        };
      },
    }),
  },
}));

import { userPreferencesCloudService } from '../userPreferencesCloudService';

const PREFS: SourcePrefs = {
  preference: 'matrix',
  preferenceSetAt: 5,
  pins: { '1977-05-08': { identifier: 'mtx', format: 'matrix', pinnedAt: 1 } },
  nudgeAnswers: { matrix: 'yes' },
  skipTuning: true,
  skipTuningSetAt: 7,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  mockUpsert.mockResolvedValue({ error: null });
});

describe('syncPrefs', () => {
  it('upserts prefs and pins as two JSONB columns keyed on user_id', async () => {
    await userPreferencesCloudService.syncPrefs('u1', PREFS);
    expect(mockFrom).toHaveBeenCalledWith('user_preferences');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: 'u1',
        prefs: {
          preference: 'matrix', preferenceSetAt: 5, nudgeAnswers: { matrix: 'yes' },
          skipTuning: true, skipTuningSetAt: 7,
        },
        pins: PREFS.pins,
        updated_at: expect.any(String),
      },
      { onConflict: 'user_id' },
    );
  });

  it('no-ops without a session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await userPreferencesCloudService.syncPrefs('u1', PREFS);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('throws on upsert error', async () => {
    mockUpsert.mockResolvedValue({ error: new Error('boom') });
    await expect(userPreferencesCloudService.syncPrefs('u1', PREFS)).rejects.toThrow('boom');
  });
});

describe('loadPrefs', () => {
  it('recomposes the stored row into SourcePrefs, normalizing junk', async () => {
    mockSingle.mockResolvedValue({
      data: {
        prefs: {
          preference: 'matrix', preferenceSetAt: 5, nudgeAnswers: { matrix: 'yes', sbd: 'maybe' },
          skipTuning: true, skipTuningSetAt: 7,
        },
        pins: PREFS.pins,
      },
      error: null,
    });
    expect(await userPreferencesCloudService.loadPrefs('u1')).toEqual(PREFS);
  });

  it('returns empty prefs when no row exists (PGRST116)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    expect(await userPreferencesCloudService.loadPrefs('u1')).toEqual({
      preference: 'popular', preferenceSetAt: 0, pins: {}, nudgeAnswers: {},
      skipTuning: false, skipTuningSetAt: 0,
    });
  });

  it('throws on other errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'XX', message: 'nope' } });
    await expect(userPreferencesCloudService.loadPrefs('u1')).rejects.toEqual({ code: 'XX', message: 'nope' });
  });
});
