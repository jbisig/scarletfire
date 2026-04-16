// Mock authService with a factory so native modules never load
jest.mock('../authService', () => ({
  authService: { getClient: jest.fn() },
}));

import { profileService } from '../profileService';
import { authService } from '../authService';

function makeSupabaseMock() {
  const chain = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'u1',
        username: 'jesse',
        display_name: 'Jesse B',
        is_public: true,
        profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
        created_at: '2026-04-15T00:00:00Z',
        updated_at: '2026-04-15T00:00:00Z',
      },
      error: null,
    }),
  };
  const from = jest.fn().mockReturnValue(chain);
  (authService.getClient as jest.Mock).mockReturnValue({ from });
  return { from, chain };
}

describe('completeProfileOnboarding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts username (lowercased), display name, is_public=true, and dismissal timestamp', async () => {
    const { from, chain } = makeSupabaseMock();
    const result = await profileService.completeProfileOnboarding('u1', {
      username: 'Jesse',
      displayName: 'Jesse B',
    });
    expect(from).toHaveBeenCalledWith('profiles');
    const insertArg = (chain.insert as jest.Mock).mock.calls[0][0];
    expect(insertArg).toMatchObject({
      id: 'u1',
      username: 'jesse',
      display_name: 'Jesse B',
      is_public: true,
    });
    expect(typeof insertArg.profile_setup_dismissed_at).toBe('string');
    expect(result.username).toBe('jesse');
  });

  it('stores display_name as null when blank', async () => {
    const { chain } = makeSupabaseMock();
    await profileService.completeProfileOnboarding('u1', { username: 'jesse', displayName: '' });
    expect((chain.insert as jest.Mock).mock.calls[0][0].display_name).toBeNull();
  });

  it('throws on unique-constraint violation so UI can surface a conflict', async () => {
    const { chain } = makeSupabaseMock();
    chain.single.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });
    await expect(
      profileService.completeProfileOnboarding('u1', { username: 'jesse' }),
    ).rejects.toMatchObject({ code: '23505' });
  });
});

describe('dismissProfileOnboarding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts a stub row with a generated username matching user_[a-f0-9]{8}', async () => {
    const { from, chain } = makeSupabaseMock();
    chain.single.mockResolvedValueOnce({
      data: {
        id: 'u1',
        username: 'user_abcdef01',
        display_name: null,
        is_public: false,
        profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
        created_at: '2026-04-15T00:00:00Z',
        updated_at: '2026-04-15T00:00:00Z',
      },
      error: null,
    });
    await profileService.dismissProfileOnboarding('u1');
    expect(from).toHaveBeenCalledWith('profiles');
    const insertArg = (chain.insert as jest.Mock).mock.calls[0][0];
    expect(insertArg.id).toBe('u1');
    expect(insertArg.username).toMatch(/^user_[a-f0-9]{8}$/);
    expect(insertArg.is_public).toBe(false);
    expect(typeof insertArg.profile_setup_dismissed_at).toBe('string');
  });

  it('retries once with a new username on unique-constraint collision', async () => {
    const { chain } = makeSupabaseMock();
    chain.single
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } })
      .mockResolvedValueOnce({
        data: {
          id: 'u1',
          username: 'user_11111111',
          display_name: null,
          is_public: false,
          profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
          created_at: '2026-04-15T00:00:00Z',
          updated_at: '2026-04-15T00:00:00Z',
        },
        error: null,
      });
    await profileService.dismissProfileOnboarding('u1');
    expect((chain.insert as jest.Mock).mock.calls.length).toBe(2);
    const first = (chain.insert as jest.Mock).mock.calls[0][0].username;
    const second = (chain.insert as jest.Mock).mock.calls[1][0].username;
    expect(first).not.toBe(second);
  });

  it('throws when retry also collides', async () => {
    const { chain } = makeSupabaseMock();
    chain.single
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } })
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } });
    await expect(profileService.dismissProfileOnboarding('u1')).rejects.toMatchObject({
      code: '23505',
    });
  });
});
