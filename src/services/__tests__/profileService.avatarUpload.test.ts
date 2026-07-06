/**
 * Task 13: avatar upload extension allowlist. The picked file's extension
 * feeds `contentType: image/${ext}` directly — before this fix, an
 * unexpected extension would flow straight into the Supabase upload call.
 * expo-image-picker (with allowsEditing: true) can hand back jpg on both
 * platforms, or png/webp/heic if editing is skipped; anything else must be
 * rejected before any network call is made.
 */

jest.mock('../authService', () => ({
  authService: { getClient: jest.fn() },
}));

import { profileService, UnsupportedAvatarImageTypeError } from '../profileService';
import { authService } from '../authService';

function makeSupabaseStorageMock() {
  const upload = jest.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
  const getPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/avatar.jpg' } });
  const storageFrom = jest.fn().mockReturnValue({ upload, getPublicUrl });

  const eq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ update });

  (authService.getClient as jest.Mock).mockReturnValue({
    storage: { from: storageFrom },
    from,
  });

  return { upload, getPublicUrl, storageFrom, from, update, eq };
}

describe('profileService.uploadAvatar — extension allowlist', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it.each(['exe', 'svg', 'gif', 'bmp', 'tiff', ''])(
    'rejects unsupported extension ".%s" without making a network call',
    async (ext) => {
      const { upload } = makeSupabaseStorageMock();
      global.fetch = jest.fn();
      const uri = ext ? `file:///tmp/photo.${ext}` : 'file:///tmp/photo';

      await expect(profileService.uploadAvatar('user-1', uri)).rejects.toThrow(
        UnsupportedAvatarImageTypeError,
      );
      expect(global.fetch).not.toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
    ['JPG', 'image/jpeg'],
    ['png', 'image/png'],
    ['webp', 'image/webp'],
    ['heic', 'image/heic'],
  ])('accepts ".%s" and uploads with contentType %s', async (ext, expectedContentType) => {
    const { upload } = makeSupabaseStorageMock();
    global.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['fake-image-bytes'])),
    });

    const url = await profileService.uploadAvatar('user-1', `file:///tmp/photo.${ext}`);

    expect(url).toBe('https://example.com/avatar.jpg');
    expect(upload).toHaveBeenCalledTimes(1);
    const [, , options] = upload.mock.calls[0];
    expect(options).toMatchObject({ contentType: expectedContentType });
  });
});
