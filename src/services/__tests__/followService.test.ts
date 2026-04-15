// Mock authService with a factory so native modules never load
jest.mock('../authService', () => ({
  authService: {
    getClient: jest.fn(),
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

  it('getFollowCounts returns followers + following counts (public profiles only)', async () => {
    const supabase = {
      from: jest.fn(() => {
        let selectArg = '';
        const chain: any = {};
        chain.select = jest.fn((arg: string) => { selectArg = arg; return chain; });
        chain.eq = jest.fn().mockReturnThis();
        chain.then = (resolve: any) => resolve({
          count: selectArg.startsWith('follower:') ? 5 : 7,
          error: null,
        });
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

describe('followService lists', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getFollowers returns joined profile rows (public only)', async () => {
    const joinRows = [
      { follower: { id: 'a', username: 'alice', display_name: 'Alice', is_public: true } },
      { follower: { id: 'b', username: 'bob', display_name: null, is_public: true } },
    ];
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: joinRows, error: null }),
    };
    const storageList = jest.fn().mockResolvedValue({ data: [], error: null });
    const getPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: '' } });
    (authService.getClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(chain),
      storage: { from: jest.fn().mockReturnValue({ list: storageList, getPublicUrl }) },
      auth: { getUser: jest.fn() },
    });

    const result = await followService.getFollowers('target-1');
    expect(result).toEqual([
      { id: 'a', username: 'alice', display_name: 'Alice', avatarUrl: null },
      { id: 'b', username: 'bob', display_name: null, avatarUrl: null },
    ]);
    expect(chain.select).toHaveBeenCalledWith(expect.stringContaining('follower:profiles!user_follows_follower_id_fkey'));
  });
});
