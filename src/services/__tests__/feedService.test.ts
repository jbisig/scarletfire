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

  it('calls get_activity_feed RPC with viewer + cursor + page size', async () => {
    const rpc = setupRpc({
      data: [
        { id: 'e1', actor_id: 'a', event_type: 'followed_user', target_type: 'user',
          target_id: 't', metadata: {}, created_at: '2026-04-15T00:00:00Z', source: 'following' },
      ],
      error: null,
    });

    const result = await feedService.getActivityFeed({
      cursor: '2026-04-15T01:00:00Z',
      pageSize: 30,
    });

    expect(rpc).toHaveBeenCalledWith('get_activity_feed', {
      viewer_id: 'me',
      cursor_time: '2026-04-15T01:00:00Z',
      page_size: 30,
    });
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('following');
  });

  it('returns [] when not signed in', async () => {
    (authService.getClient as jest.Mock).mockReturnValue({
      rpc: jest.fn(),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const result = await feedService.getActivityFeed({ cursor: null, pageSize: 30 });
    expect(result).toEqual([]);
  });
});

describe('feedService.searchProfiles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls search_profiles RPC with empty query → returns sectioned rows', async () => {
    const rpc = setupRpc({
      data: [
        { id: 'a', username: 'alice', display_name: 'Alice', followers_count: 5,
          following_count: 2, viewer_is_following: true, section: 'following' },
        { id: 'b', username: 'bob', display_name: null, followers_count: 100,
          following_count: 1, viewer_is_following: false, section: 'discover' },
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
    expect(result.following).toHaveLength(1);
    expect(result.discover).toHaveLength(1);
    expect(result.search).toEqual([]);
  });

  it('non-empty query → returns rows in `search` bucket', async () => {
    const rpc = setupRpc({
      data: [
        { id: 'a', username: 'alice', display_name: 'Alice', followers_count: 5,
          following_count: 2, viewer_is_following: false, section: 'search' },
      ],
      error: null,
    });

    const result = await feedService.searchProfiles({ query: 'al', cursor: 0, pageSize: 20 });
    expect(result.search).toHaveLength(1);
    expect(result.following).toEqual([]);
    expect(result.discover).toEqual([]);
  });
});
