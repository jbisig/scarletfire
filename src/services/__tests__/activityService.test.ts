// src/services/__tests__/activityService.test.ts
// Mock authService with a factory so native modules never load
jest.mock('../authService', () => ({
  authService: {
    getClient: jest.fn(),
  },
}));

import { activityService } from '../activityService';
import { authService } from '../authService';

function setup({
  user = { id: 'me' } as { id: string } | null,
  profileIsPublic = true as boolean | null,
  recentEventExists = false,
  insertError = null as null | { message: string },
} = {}) {
  const profileSelect = jest.fn().mockReturnThis();
  const profileEq = jest.fn().mockReturnThis();
  const profileSingle = jest.fn().mockResolvedValue({
    data: profileIsPublic === null ? null : { is_public: profileIsPublic },
    error: null,
  });

  const dedupeSelect = jest.fn().mockReturnThis();
  const dedupeEq = jest.fn().mockReturnThis();
  const dedupeGte = jest.fn().mockReturnThis();
  const dedupeLimit = jest.fn().mockResolvedValue({
    data: recentEventExists ? [{ id: 'existing' }] : [],
    error: null,
  });

  const insert = jest.fn().mockResolvedValue({ error: insertError });

  const from = jest.fn((table: string) => {
    if (table === 'profiles') {
      return { select: profileSelect, eq: profileEq, single: profileSingle };
    }
    // activity_events
    return {
      select: dedupeSelect,
      eq: dedupeEq,
      gte: dedupeGte,
      limit: dedupeLimit,
      insert,
    };
  });

  (authService.getClient as jest.Mock).mockReturnValue({
    from,
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  });

  return { from, insert };
}

describe('activityService.emitEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts an event when user is signed in, public, and no dedupe hit', async () => {
    const { from, insert } = setup();
    await activityService.emitEvent('followed_user', 'user', 'target-1', { foo: 'bar' });
    expect(from).toHaveBeenCalledWith('activity_events');
    expect(insert).toHaveBeenCalledWith({
      actor_id: 'me',
      event_type: 'followed_user',
      target_type: 'user',
      target_id: 'target-1',
      metadata: { foo: 'bar' },
    });
  });

  it('is a no-op when user is signed out', async () => {
    const { insert } = setup({ user: null });
    await activityService.emitEvent('followed_user', 'user', 'target-1', {});
    expect(insert).not.toHaveBeenCalled();
  });

  it('is a no-op when user profile is not public', async () => {
    const { insert } = setup({ profileIsPublic: false });
    await activityService.emitEvent('followed_user', 'user', 'target-1', {});
    expect(insert).not.toHaveBeenCalled();
  });

  it('is a no-op when a duplicate event exists in the dedupe window', async () => {
    const { insert } = setup({ recentEventExists: true });
    await activityService.emitEvent('favorited_show', 'show', 'show-1', {});
    expect(insert).not.toHaveBeenCalled();
  });

  it('swallows insert errors (non-blocking)', async () => {
    const { insert } = setup({ insertError: { message: 'boom' } });
    await expect(
      activityService.emitEvent('followed_user', 'user', 't', {}),
    ).resolves.toBeUndefined();
    expect(insert).toHaveBeenCalled();
  });
});
