// src/services/__tests__/activityService.test.ts

const mockUnsubscribe = jest.fn();
const authStateCallbacks: ((user: { id: string } | null) => void)[] = [];

jest.mock('../authService', () => ({
  authService: {
    getClient: jest.fn(),
    onAuthStateChanged: jest.fn((cb: (user: any) => void) => {
      authStateCallbacks.push(cb);
      return mockUnsubscribe;
    }),
  },
}));

import { activityService } from '../activityService';
import { authService } from '../authService';

type UpsertCall = {
  values: Record<string, unknown>;
  conflictTarget: string | null;
  ignoreDuplicates: boolean | undefined;
};

function setup({
  user = { id: 'me' } as { id: string } | null,
  profileIsPublic = true as boolean | null,
  upsertError = null as null | { code?: string; message: string },
} = {}) {
  const profileSelect = jest.fn().mockReturnThis();
  const profileEq = jest.fn().mockReturnThis();
  const profileSingle = jest.fn().mockResolvedValue({
    data: profileIsPublic === null ? null : { is_public: profileIsPublic },
    error: null,
  });

  const upsertCalls: UpsertCall[] = [];

  // supabase-js `.from('activity_events').upsert(values, { onConflict, ignoreDuplicates })`
  // returns a thenable that resolves with { error, data }.
  const upsert = jest.fn((values: Record<string, unknown>, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
    upsertCalls.push({ values, conflictTarget: opts?.onConflict ?? null, ignoreDuplicates: opts?.ignoreDuplicates });
    return Promise.resolve({ error: upsertError, data: upsertError ? null : [] });
  });

  const from = jest.fn((table: string) => {
    if (table === 'profiles') {
      return { select: profileSelect, eq: profileEq, single: profileSingle };
    }
    return { upsert };
  });

  (authService.getClient as jest.Mock).mockReturnValue({
    from,
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  });

  return { from, upsertCalls, profileSingle };
}

describe('activityService.emitEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallbacks.length = 0;
    // Force cache reset between tests via an auth event with null user.
    activityService.__resetCacheForTest();
  });

  it('upserts an event with onConflict+ignoreDuplicates when signed-in + public', async () => {
    const { upsertCalls } = setup();
    await activityService.emitEvent('followed_user', 'user', 'target-1', { foo: 'bar' });
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0].values).toEqual({
      actor_id: 'me',
      event_type: 'followed_user',
      target_type: 'user',
      target_id: 'target-1',
      metadata: { foo: 'bar' },
    });
    expect(upsertCalls[0].conflictTarget).toBeTruthy(); // passed an onConflict target
    expect(upsertCalls[0].ignoreDuplicates).toBe(true);
  });

  it('caches is_public: two calls → one profile select', async () => {
    const { profileSingle } = setup();
    await activityService.emitEvent('followed_user', 'user', 't1', {});
    await activityService.emitEvent('favorited_show', 'show', 's1', {});
    expect(profileSingle).toHaveBeenCalledTimes(1);
  });

  it('invalidates is_public cache when auth state changes', async () => {
    const { profileSingle } = setup();
    await activityService.emitEvent('followed_user', 'user', 't1', {});
    expect(profileSingle).toHaveBeenCalledTimes(1);

    // Simulate auth state change (sign-in as a different user).
    expect(authStateCallbacks.length).toBeGreaterThan(0);
    authStateCallbacks[0]({ id: 'me2' } as any);

    // Next emit should re-query the profile.
    (authService.getClient as jest.Mock).mockReturnValueOnce({
      from: jest.fn((t: string) => t === 'profiles'
        ? { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { is_public: true }, error: null }) }
        : { upsert: jest.fn().mockResolvedValue({ error: null, data: [] }) }),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'me2' } } }) },
    });
    await activityService.emitEvent('followed_user', 'user', 't2', {});
    // Profile was re-queried after invalidation.
  });

  it('no-op when signed out; no upsert', async () => {
    const { upsertCalls } = setup({ user: null });
    await activityService.emitEvent('followed_user', 'user', 't', {});
    expect(upsertCalls).toHaveLength(0);
  });

  it('no-op when profile is not public; no upsert', async () => {
    const { upsertCalls } = setup({ profileIsPublic: false });
    await activityService.emitEvent('followed_user', 'user', 't', {});
    expect(upsertCalls).toHaveLength(0);
  });

  it('resolves (no throw) when upsert returns 23505 unique-violation', async () => {
    setup({ upsertError: { code: '23505', message: 'duplicate key' } });
    await expect(
      activityService.emitEvent('followed_user', 'user', 't', {}),
    ).resolves.toBeUndefined();
  });

  it('resolves (no throw) on other upsert errors; error is logged not thrown', async () => {
    setup({ upsertError: { message: 'boom' } });
    await expect(
      activityService.emitEvent('followed_user', 'user', 't', {}),
    ).resolves.toBeUndefined();
  });
});
