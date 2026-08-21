// Public/Private visibility for collections.
//
// `is_public` governs discovery (feed events, profile listing, Popular
// Collections). `is_shared` keeps meaning "the share link works". Creating a
// collection must NOT announce it to followers any more — the feed event
// fires when the owner flips it Public.

jest.mock('../authService', () => ({
  authService: { getClient: jest.fn() },
}));

jest.mock('../activityService', () => ({
  activityService: { emitEvent: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    api: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    create: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
  },
}));

import { collectionsService } from '../collectionsService';
import { authService } from '../authService';
import { activityService } from '../activityService';

const ROW = {
  id: 'c1',
  user_id: 'me',
  name: 'Road Trips',
  type: 'playlist',
  description: null,
  cover_image_url: null,
  slug: 'road-trips',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
  is_shared: false,
  is_public: false,
};

/** Minimal chainable Supabase stub: every call returns the same builder. */
function mockClient(
  result: { data: unknown; error: unknown },
  listResult: { data: unknown; error: unknown } = result,
) {
  const calls: Record<string, jest.Mock> = {};
  const builder: any = {};
  for (const m of ['insert', 'update', 'select', 'eq', 'order', 'single', 'maybeSingle', 'delete']) {
    calls[m] = jest.fn(() => builder);
    builder[m] = calls[m];
  }
  // Terminal calls resolve the result; awaiting the builder itself also works.
  calls.single.mockImplementation(() => Promise.resolve(result));
  calls.maybeSingle.mockImplementation(() => Promise.resolve(result));
  // Awaiting the builder without a terminal call is how list queries end
  // (`.select().eq()` / `.order()`), so that path gets the list result.
  builder.then = (resolve: (v: unknown) => void) => resolve(listResult);
  const client = { from: jest.fn(() => builder) };
  (authService.getClient as jest.Mock).mockReturnValue(client);
  return calls;
}

beforeEach(() => jest.clearAllMocks());

describe('createCollection', () => {
  it('does not emit a feed event — new collections are private', async () => {
    // First query is the slug-collision lookup (a list), then the insert.
    mockClient({ data: ROW, error: null }, { data: [], error: null });
    const created = await collectionsService.createCollection({
      userId: 'me',
      name: 'Road Trips',
      type: 'playlist',
    });
    expect(created.isPublic).toBe(false);
    expect(activityService.emitEvent).not.toHaveBeenCalled();
  });
});

describe('setCollectionPublic', () => {
  it('going Public also makes the link work and announces the collection', async () => {
    const calls = mockClient({ data: { ...ROW, is_public: true, is_shared: true }, error: null });
    const updated = await collectionsService.setCollectionPublic('c1', true);

    expect(calls.update).toHaveBeenCalledWith({ is_public: true, is_shared: true });
    expect(calls.eq).toHaveBeenCalledWith('id', 'c1');
    expect(updated.isPublic).toBe(true);
    expect(updated.isShared).toBe(true);
    expect(activityService.emitEvent).toHaveBeenCalledWith(
      'created_collection',
      'collection',
      'c1',
      { name: 'Road Trips', type: 'playlist' },
    );
  });

  it('going Private only clears is_public and stays quiet', async () => {
    const calls = mockClient({ data: { ...ROW, is_public: false, is_shared: true }, error: null });
    const updated = await collectionsService.setCollectionPublic('c1', false);

    expect(calls.update).toHaveBeenCalledWith({ is_public: false });
    expect(updated.isPublic).toBe(false);
    // A previously shared link keeps working — Private means unlisted.
    expect(updated.isShared).toBe(true);
    expect(activityService.emitEvent).not.toHaveBeenCalled();
  });

  it('throws on a database error and emits nothing', async () => {
    mockClient({ data: null, error: { message: 'boom' } });
    await expect(collectionsService.setCollectionPublic('c1', true)).rejects.toEqual({ message: 'boom' });
    expect(activityService.emitEvent).not.toHaveBeenCalled();
  });
});

describe('fetchPublicCollections', () => {
  it("lists only the user's public collections", async () => {
    const calls = mockClient({ data: [{ ...ROW, is_public: true, collection_items: [{ count: 3 }] }], error: null });
    const list = await collectionsService.fetchPublicCollections('someone');

    expect(calls.eq).toHaveBeenCalledWith('user_id', 'someone');
    expect(calls.eq).toHaveBeenCalledWith('is_public', true);
    expect(list).toHaveLength(1);
    expect(list[0].isPublic).toBe(true);
    expect(list[0].itemCount).toBe(3);
  });
});

describe('mapping', () => {
  it('treats a missing is_public column as private', async () => {
    const { is_public: _omit, ...legacyRow } = ROW;
    mockClient({ data: legacyRow, error: null });
    const c = await collectionsService.fetchCollectionById('c1');
    expect(c?.isPublic).toBe(false);
  });
});
