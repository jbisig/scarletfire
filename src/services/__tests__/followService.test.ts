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

  it('getFollowCounts returns followers + following counts', async () => {
    const supabase = {
      from: jest.fn((table: string) => {
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn((col: string, val: string) => {
            return Promise.resolve({ count: col === 'following_id' ? 5 : 7, error: null });
          }),
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
