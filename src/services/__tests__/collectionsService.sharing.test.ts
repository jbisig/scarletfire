// Mock authService with a factory so native modules never load.
jest.mock('../authService', () => ({
  authService: {
    getClient: jest.fn(),
  },
}));

import { collectionsService } from '../collectionsService';
import { authService } from '../authService';

function mockClient(overrides: {
  updateError?: { message: string } | null;
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
