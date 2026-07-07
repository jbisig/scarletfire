// Mock authService with a factory so native modules never load.
jest.mock('../authService', () => ({
  authService: {
    getClient: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    api: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    player: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    profile: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    // activityService (imported transitively) builds its logger at module scope
    create: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
  },
}));

import { collectionsService } from '../collectionsService';
import { authService } from '../authService';
import { logger } from '../../utils/logger';

function mockClient(overrides: {
  updateError?: { message: string; code?: string } | null;
  isShared?: boolean;
} = {}) {
  const { updateError = null, isShared } = overrides;

  const updateEq = jest.fn().mockResolvedValue({ error: updateError });
  const update = jest.fn(() => ({ eq: updateEq }));

  const selectSingle = jest.fn().mockResolvedValue({
    data: {
      id: 'c1',
      user_id: 'me',
      name: 'My Collection',
      type: 'show_collection',
      description: null,
      cover_image_url: null,
      slug: 'my-collection',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
      ...(isShared === undefined ? {} : { is_shared: isShared }),
    },
    error: null,
  });
  const selectEq = jest.fn(() => ({ maybeSingle: selectSingle }));
  const select = jest.fn(() => ({ eq: selectEq }));

  const client = {
    from: jest.fn(() => ({ update, select })),
  };

  (authService.getClient as jest.Mock).mockReturnValue(client);
  return { update, updateEq };
}

describe('collectionsService.markCollectionShared', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets is_shared = true for the given collection id', async () => {
    const { update, updateEq } = mockClient({ updateError: null });
    await collectionsService.markCollectionShared('c1');
    expect(update).toHaveBeenCalledWith({ is_shared: true });
    expect(updateEq).toHaveBeenCalledWith('id', 'c1');
  });

  it('throws when the update fails, so the caller can surface an error toast', async () => {
    mockClient({ updateError: { message: 'boom' } });
    await expect(collectionsService.markCollectionShared('c1')).rejects.toEqual({
      message: 'boom',
    });
  });

  it('silently no-ops on Postgres 42703 (is_shared column not yet migrated)', async () => {
    mockClient({ updateError: { message: 'column "is_shared" does not exist', code: '42703' } });
    await expect(collectionsService.markCollectionShared('c1')).resolves.toBeUndefined();
    expect(logger.api.warn).toHaveBeenCalledWith(
      expect.stringContaining('is_shared column not yet migrated'),
      expect.objectContaining({ code: '42703' }),
    );
  });
});

describe('collectionsService.fetchCollectionById — isShared mapping', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps is_shared: true from the row', async () => {
    mockClient({ isShared: true });
    const result = await collectionsService.fetchCollectionById('c1');
    expect(result?.isShared).toBe(true);
  });

  it('maps is_shared: false from the row', async () => {
    mockClient({ isShared: false });
    const result = await collectionsService.fetchCollectionById('c1');
    expect(result?.isShared).toBe(false);
  });

  it('defaults isShared to false when the column is absent (un-migrated DB)', async () => {
    mockClient({ isShared: undefined });
    const result = await collectionsService.fetchCollectionById('c1');
    expect(result?.isShared).toBe(false);
  });
});
