jest.mock('../../utils/logger', () => ({
  logger: {
    api: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    player: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    profile: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  },
}));

import { archiveApi } from '../archiveApi';
import { logger } from '../../utils/logger';

describe('archiveApi.getShowVersions', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('logs and returns [] when the request fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const result = await archiveApi.getShowVersions('1977-05-08');

    expect(result).toEqual([]);
    expect(logger.api.error).toHaveBeenCalledWith(
      'getShowVersions failed',
      expect.any(Error),
    );
  });

  it('logs and returns [] on a non-OK HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const result = await archiveApi.getShowVersions('1977-05-08');

    expect(result).toEqual([]);
    expect(logger.api.error).toHaveBeenCalledWith(
      'getShowVersions failed',
      expect.any(Error),
    );
  });

  it('returns [] without logging for a malformed date (no request made)', async () => {
    global.fetch = jest.fn();

    const result = await archiveApi.getShowVersions('not-a-date');

    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(logger.api.error).not.toHaveBeenCalled();
  });
});
