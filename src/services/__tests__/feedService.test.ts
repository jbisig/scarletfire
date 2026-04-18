// Mock authService with a factory so native modules never load
jest.mock('../authService', () => ({
  authService: {
    getClient: jest.fn(),
  },
}));

import { feedService } from '../feedService';
import { authService } from '../authService';

function setupRpc(rpcResponse: any) {
  const rpc = jest.fn().mockResolvedValue(rpcResponse);
  (authService.getClient as jest.Mock).mockReturnValue({
    rpc,
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'me' } } }) },
  });
  return rpc;
}

describe('feedService.getActivityFeed', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls RPC with per-stream cursors + include flags + returns events and derived next cursors', async () => {
    const rpc = setupRpc({
      data: [
        { id: 'e1', actor_id: 'a', event_type: 'followed_user', target_type: 'user',
          target_id: 't', metadata: {}, created_at: '2026-04-15T02:00:00Z', source: 'following',
          actor_username: 'alice', actor_display_name: 'Alice', actor_avatar_url: 'a.png' },
        { id: 'e2', actor_id: 'a', event_type: 'favorited_show', target_type: 'show',
          target_id: 's', metadata: {}, created_at: '2026-04-15T01:00:00Z', source: 'following',
          actor_username: 'alice', actor_display_name: 'Alice', actor_avatar_url: 'a.png' },
        { id: 'e3', actor_id: 'b', event_type: 'listened_show', target_type: 'show',
          target_id: 's2', metadata: {}, created_at: '2026-04-14T00:00:00Z', source: 'public',
          actor_username: 'bob', actor_display_name: null, actor_avatar_url: null },
      ],
      error: null,
    });

    const result = await feedService.getActivityFeed({
      followingCursor: null,
      publicCursor: null,
      includeFollowing: true,
      includePublic: true,
      pageSize: 30,
    });

    expect(rpc).toHaveBeenCalledWith('get_activity_feed', {
      viewer_id: 'me',
      following_cursor: null,
      public_cursor: null,
      include_following: true,
      include_public: true,
      page_size: 30,
    });
    expect(result.events).toHaveLength(3);
    expect(result.nextFollowingCursor).toBe('2026-04-15T01:00:00Z'); // oldest following
    expect(result.nextPublicCursor).toBe('2026-04-14T00:00:00Z');    // oldest public
    expect(result.followingExhausted).toBe(false);
    expect(result.publicExhausted).toBe(false);
  });

  it('marks a stream exhausted when it returns zero rows given a non-null cursor + include=true', async () => {
    // Client has paginated before; now asks for more public rows and gets none
    setupRpc({
      data: [
        { id: 'e4', actor_id: 'a', event_type: 'followed_user', target_type: 'user',
          target_id: 't', metadata: {}, created_at: '2026-04-13T00:00:00Z', source: 'following',
          actor_username: 'alice', actor_display_name: null, actor_avatar_url: null },
      ],
      error: null,
    });

    const result = await feedService.getActivityFeed({
      followingCursor: '2026-04-14T00:00:00Z',
      publicCursor: '2026-04-14T00:00:00Z',
      includeFollowing: true,
      includePublic: true,
      pageSize: 30,
    });
    expect(result.publicExhausted).toBe(true);
    expect(result.followingExhausted).toBe(false);
    expect(result.nextFollowingCursor).toBe('2026-04-13T00:00:00Z');
  });

  it('does not mark a stream exhausted when include flag was false', async () => {
    setupRpc({ data: [], error: null });
    const result = await feedService.getActivityFeed({
      followingCursor: '2026-04-14T00:00:00Z',
      publicCursor: null,
      includeFollowing: true,
      includePublic: false,
      pageSize: 30,
    });
    expect(result.publicExhausted).toBe(false);
    expect(result.followingExhausted).toBe(true); // asked, got nothing
  });

  it('returns empty + both-not-exhausted when not signed in', async () => {
    (authService.getClient as jest.Mock).mockReturnValue({
      rpc: jest.fn(),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const result = await feedService.getActivityFeed({
      followingCursor: null, publicCursor: null,
      includeFollowing: true, includePublic: true, pageSize: 30,
    });
    expect(result.events).toEqual([]);
    expect(result.followingExhausted).toBe(false);
    expect(result.publicExhausted).toBe(false);
  });
});

describe('feedService.searchProfiles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('empty query → returns sectioned rows with avatarUrl', async () => {
    const rpc = setupRpc({
      data: [
        { id: 'a', username: 'alice', display_name: 'Alice', avatar_url: 'a.png',
          followers_count: 5, following_count: 2, viewer_is_following: true, section: 'following' },
        { id: 'b', username: 'bob', display_name: null, avatar_url: null,
          followers_count: 100, following_count: 1, viewer_is_following: false, section: 'discover' },
      ],
      error: null,
    });

    const result = await feedService.searchProfiles({ query: '', cursor: 0, pageSize: 20 });

    expect(rpc).toHaveBeenCalledWith('search_profiles', {
      query_text: '',
      viewer_id: 'me',
      cursor_offset: 0,
      page_size: 20,
    });
    expect(result.following).toEqual([
      expect.objectContaining({ id: 'a', username: 'alice', avatarUrl: 'a.png', viewer_is_following: true }),
    ]);
    expect(result.discover).toEqual([
      expect.objectContaining({ id: 'b', username: 'bob', avatarUrl: null, viewer_is_following: false }),
    ]);
    expect(result.search).toEqual([]);
  });

  it('non-empty query → returns rows in `search` bucket with avatarUrl', async () => {
    setupRpc({
      data: [
        { id: 'a', username: 'alice', display_name: 'Alice', avatar_url: 'a.png',
          followers_count: 5, following_count: 2, viewer_is_following: false, section: 'search' },
      ],
      error: null,
    });

    const result = await feedService.searchProfiles({ query: 'al', cursor: 0, pageSize: 20 });
    expect(result.search).toHaveLength(1);
    expect(result.search[0].avatarUrl).toBe('a.png');
    expect(result.following).toEqual([]);
    expect(result.discover).toEqual([]);
  });
});
