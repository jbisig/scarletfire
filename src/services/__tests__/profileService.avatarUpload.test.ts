/**
 * Task 13: avatar upload type allowlist.
 *
 * Originally this validated the picked file's URI *extension* and fed it
 * straight into `contentType: image/${ext}`. That breaks on web:
 * expo-image-picker there returns `uri: "blob:https://host/uuid"` with no
 * file extension at all, so `.split('.').pop()` yields garbage and every
 * web upload threw `UnsupportedAvatarImageTypeError`. The fix threads
 * `asset.mimeType` (present on both web and native) through as the PRIMARY
 * type source, validated against an allowlist; URI-extension parsing is
 * used ONLY as a fallback when no mimeType is supplied (older native-only
 * callers).
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
  ])('accepts ".%s" and uploads with contentType %s (no mimeType supplied — fallback path)', async (ext, expectedContentType) => {
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

  it('recovers the correct fallback extension from a URI with a query/fragment suffix', async () => {
    const { upload } = makeSupabaseStorageMock();
    global.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['fake-image-bytes'])),
    });

    // Without stripping ?/# before the extension parse, this would wrongly
    // parse as extension "jpg?ts=123#frag" (rejected) instead of the
    // intended, valid "jpg" — asserting the upload succeeds demonstrates the
    // query/fragment suffix no longer poisons the parse.
    const url = await profileService.uploadAvatar('user-1', 'file:///tmp/photo.jpg?ts=123#frag');
    expect(url).toBe('https://example.com/avatar.jpg');
    expect(upload).toHaveBeenCalledTimes(1);
    const [, , options] = upload.mock.calls[0];
    expect(options).toMatchObject({ contentType: 'image/jpeg' });
  });
});

describe('profileService.uploadAvatar — mimeType allowlist (primary path, web + native)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = jest.fn();
  });

  it.each(['image/gif', 'image/bmp', 'image/svg+xml', 'application/octet-stream', ''])(
    'rejects unsupported mimeType "%s" without making a network call',
    async (mimeType) => {
      const { upload } = makeSupabaseStorageMock();
      global.fetch = jest.fn();

      await expect(
        profileService.uploadAvatar('user-1', 'blob:https://gratefuldead.app/00000000-0000-0000-0000-000000000000', mimeType),
      ).rejects.toThrow(UnsupportedAvatarImageTypeError);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['image/jpeg', 'image/jpeg'],
    ['image/png', 'image/png'],
    ['image/webp', 'image/webp'],
    ['image/heic', 'image/heic'],
    ['IMAGE/JPEG', 'image/jpeg'],
    ['image/jpeg;charset=binary', 'image/jpeg'],
  ])(
    'accepts a web blob: URI (no file extension) with mimeType "%s" and uploads with contentType %s',
    async (mimeType, expectedContentType) => {
      // This is the web regression case: expo-image-picker on web returns
      // `uri: "blob:https://host/uuid"` — no extension for `.split('.').pop()`
      // to find. Before the fix this always threw
      // UnsupportedAvatarImageTypeError; passing mimeType must make it work.
      const { upload } = makeSupabaseStorageMock();
      global.fetch = jest.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['fake-image-bytes'])),
      });

      const blobUri = 'blob:https://gratefuldead.app/6b1f3c2a-0000-4000-8000-abcdefabcdef';
      const url = await profileService.uploadAvatar('user-1', blobUri, mimeType);

      expect(url).toBe('https://example.com/avatar.jpg');
      expect(global.fetch).toHaveBeenCalledWith(blobUri);
      expect(upload).toHaveBeenCalledTimes(1);
      const [path, , options] = upload.mock.calls[0];
      expect(options).toMatchObject({ contentType: expectedContentType });
      // Storage path extension must come from the validated MIME type, not
      // the (extension-less) blob: URI.
      expect(path).toMatch(/\.(jpg|png|webp|heic)$/);
    },
  );

  it('prefers mimeType over a misleading URI extension', async () => {
    const { upload } = makeSupabaseStorageMock();
    global.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['fake-image-bytes'])),
    });

    // URI extension says .png, but mimeType (the source of truth) says jpeg.
    const url = await profileService.uploadAvatar('user-1', 'file:///tmp/photo.png', 'image/jpeg');

    expect(url).toBe('https://example.com/avatar.jpg');
    const [path, , options] = upload.mock.calls[0];
    expect(options).toMatchObject({ contentType: 'image/jpeg' });
    expect(path).toMatch(/\.jpg$/);
  });
});
