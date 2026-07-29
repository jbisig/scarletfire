import type { UserRatings } from '../userRatingsStore';

const mockGetSession = jest.fn();
const mockUpsert = jest.fn();
const mockSingle = jest.fn();

jest.mock('../authService', () => ({
  authService: {
    getClient: () => ({
      auth: { getSession: mockGetSession },
      from: (table: string) => ({
        upsert: mockUpsert,
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      }),
    }),
  },
}));

import { userRatingsCloudService } from '../userRatingsCloudService';

const RATINGS: UserRatings = {
  shows: { '1977-05-08': { stars: 3, ratedAt: 1 } },
  performances: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  mockUpsert.mockResolvedValue({ error: null });
});

describe('syncRatings', () => {
  it('upserts the full blob keyed on user_id', async () => {
    await userRatingsCloudService.syncRatings('u1', RATINGS);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        shows: RATINGS.shows,
        performances: RATINGS.performances,
      }),
      { onConflict: 'user_id' }
    );
  });

  it('no-ops without a session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await userRatingsCloudService.syncRatings('u1', RATINGS);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('throws on upsert error', async () => {
    mockUpsert.mockResolvedValue({ error: new Error('boom') });
    await expect(userRatingsCloudService.syncRatings('u1', RATINGS)).rejects.toThrow('boom');
  });
});

describe('loadRatings', () => {
  it('returns the stored blob', async () => {
    mockSingle.mockResolvedValue({ data: { shows: RATINGS.shows, performances: {} }, error: null });
    const result = await userRatingsCloudService.loadRatings('u1');
    expect(result.shows['1977-05-08'].stars).toBe(3);
  });

  it('returns empty ratings when no row exists (PGRST116)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const result = await userRatingsCloudService.loadRatings('u1');
    expect(result).toEqual({ shows: {}, performances: {} });
  });

  it('throws on other errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'x' } });
    await expect(userRatingsCloudService.loadRatings('u1')).rejects.toBeDefined();
  });
});
