// Mock authService with a factory so native modules never load
jest.mock('../authService', () => ({
  authService: {
    getClient: jest.fn(),
  },
}));

// Mock activityService so the emit tests can spy on it
jest.mock('../activityService', () => ({
  activityService: {
    emitEvent: jest.fn(),
  },
}));

import { followService } from '../followService';
import { authService } from '../authService';

function makeSupabaseMock(overrides: Partial<Record<string, any>> = {}) {
  const chain = {
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    in: jest.fn().mockReturnThis(),
    then: undefined,
    ...overrides,
  };
  const from = jest.fn().mockReturnValue(chain);
  (authService.getClient as jest.Mock).mockReturnValue({
    from,
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'me' } }, error: null }) },
    storage: { from: jest.fn() },
  });
  return { from, chain };
}

describe('followService mutations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('followUser inserts (follower=me, following=target)', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.insert.mockReturnValue({ error: null });
    await followService.followUser('target-1');
    expect(from).toHaveBeenCalledWith('user_follows');
    expect(chain.insert).toHaveBeenCalledWith({ follower_id: 'me', following_id: 'target-1' });
  });

  it('unfollowUser deletes where follower=me, following=target', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.match.mockReturnValue({ error: null });
    await followService.unfollowUser('target-1');
    expect(from).toHaveBeenCalledWith('user_follows');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.match).toHaveBeenCalledWith({ follower_id: 'me', following_id: 'target-1' });
  });

  it('removeFollower deletes where follower=target, following=me', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.match.mockReturnValue({ error: null });
    await followService.removeFollower('other-user');
    expect(chain.match).toHaveBeenCalledWith({ follower_id: 'other-user', following_id: 'me' });
  });

  it('followUser throws when signed out', async () => {
    makeSupabaseMock();
    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn(),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });
    await expect(followService.followUser('x')).rejects.toThrow(/signed in/i);
  });
});

describe('followService reads', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getFollowCounts returns followers + following counts', async () => {
    const supabase = {
      from: jest.fn(() => {
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn((col: string) => Promise.resolve({
            count: col === 'following_id' ? 5 : 7,
            error: null,
          })),
        };
        return chain;
      }),
      auth: { getUser: jest.fn() },
    };
    (authService.getClient as jest.Mock).mockReturnValue(supabase);

    const result = await followService.getFollowCounts('user-1');
    expect(result).toEqual({ followers: 5, following: 7 });
  });

  it('isFollowing returns true when row exists', async () => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { follower_id: 'me' }, error: null }),
    };
    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(chain),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'me' } }, error: null }) },
    });
    await expect(followService.isFollowing('target-1')).resolves.toBe(true);
  });

  it('isFollowing returns false when not signed in', async () => {
    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn(),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });
    await expect(followService.isFollowing('target-1')).resolves.toBe(false);
  });
});

describe('followService emits activity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('followUser calls activityService.emitEvent for followed_user when target is public', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.insert.mockReturnValue({ error: null });

    // Mock target profile lookup
    const profileChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { is_public: true, username: 'target', display_name: 'Target User' },
        error: null,
      }),
    };
    from.mockImplementation((table: string) => table === 'profiles' ? profileChain : chain);

    const emitSpy = jest.spyOn(require('../activityService').activityService, 'emitEvent')
      .mockResolvedValue(undefined);

    await followService.followUser('target-1');

    expect(emitSpy).toHaveBeenCalledWith(
      'followed_user',
      'user',
      'target-1',
      expect.objectContaining({ username: 'target', display_name: 'Target User' }),
    );
  });

  it('followUser does NOT emit when target is private', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.insert.mockReturnValue({ error: null });

    const profileChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { is_public: false, username: 'priv', display_name: null },
        error: null,
      }),
    };
    from.mockImplementation((table: string) => table === 'profiles' ? profileChain : chain);

    const emitSpy = jest.spyOn(require('../activityService').activityService, 'emitEvent')
      .mockResolvedValue(undefined);

    await followService.followUser('target-1');
    expect(emitSpy).not.toHaveBeenCalled();
  });
});

describe('followService lists', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getFollowers returns public followers and placeholder rows for private ones', async () => {
    const followRows = [
      { follower_id: 'a', created_at: '2026-01-02' },
      { follower_id: 'b', created_at: '2026-01-01' },
      { follower_id: 'c', created_at: '2026-01-03' },
    ];
    // Private follower 'c' isn't returned by the profiles query (RLS hides it).
    const publicProfiles = [
      { id: 'a', username: 'alice', display_name: 'Alice' },
      { id: 'b', username: 'bob', display_name: null },
    ];

    const followChain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: followRows, error: null }),
    };
    const profilesChain: any = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: publicProfiles, error: null }),
    };

    const storageList = jest.fn().mockResolvedValue({ data: [], error: null });
    const getPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: '' } });

    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn((table: string) =>
        table === 'user_follows' ? followChain : profilesChain,
      ),
      storage: { from: jest.fn().mockReturnValue({ list: storageList, getPublicUrl }) },
      auth: { getUser: jest.fn() },
    });

    const result = await followService.getFollowers('target-1');
    expect(result).toEqual([
      { id: 'a', username: 'alice', display_name: 'Alice', avatarUrl: null, isPrivate: false },
      { id: 'b', username: 'bob', display_name: null, avatarUrl: null, isPrivate: false },
      { id: 'c', username: null, display_name: null, avatarUrl: null, isPrivate: true },
    ]);
  });
});
