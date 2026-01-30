/**
 * Tests for API error handling utilities
 */

import {
  ApiError,
  withErrorHandling,
  createErrorHandler,
  isApiError,
  getErrorMessage,
} from '../../utils/apiError';

describe('ApiError', () => {
  it('creates error with message, context, and original error', () => {
    const original = new Error('Network failed');
    const error = new ApiError('Failed to fetch', 'archiveApi.getShow', original);

    expect(error.message).toBe('Failed to fetch');
    expect(error.context).toBe('archiveApi.getShow');
    expect(error.originalError).toBe(original);
    expect(error.name).toBe('ApiError');
    expect(typeof error.timestamp).toBe('number');
  });

  it('toDetailedString includes context and original error', () => {
    const original = new Error('Network failed');
    const error = new ApiError('Failed to fetch', 'archiveApi.getShow', original);

    const detailed = error.toDetailedString();
    expect(detailed).toContain('[archiveApi.getShow]');
    expect(detailed).toContain('Failed to fetch');
    expect(detailed).toContain('Network failed');
  });

  it('toDetailedString handles non-Error original', () => {
    const error = new ApiError('Failed', 'test', 'string error');
    const detailed = error.toDetailedString();
    expect(detailed).toContain('string error');
  });
});

describe('withErrorHandling', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns result on success', async () => {
    const result = await withErrorHandling(
      () => Promise.resolve('success'),
      { context: 'test' }
    );
    expect(result).toBe('success');
  });

  it('rethrows by default', async () => {
    await expect(
      withErrorHandling(
        () => Promise.reject(new Error('failed')),
        { context: 'test' }
      )
    ).rejects.toThrow(ApiError);
  });

  it('returns defaultValue when rethrow is false', async () => {
    const result = await withErrorHandling(
      () => Promise.reject(new Error('failed')),
      { context: 'test', rethrow: false, defaultValue: null }
    );
    expect(result).toBe(null);
  });

  it('uses custom message when provided', async () => {
    try {
      await withErrorHandling(
        () => Promise.reject(new Error('original')),
        { context: 'test', message: 'custom message' }
      );
    } catch (error) {
      expect((error as ApiError).message).toBe('custom message');
    }
  });
});

describe('createErrorHandler', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates handler that throws ApiError with combined context', () => {
    const handler = createErrorHandler('archiveApi');

    expect(() => {
      handler(new Error('test'), 'getShow');
    }).toThrow(ApiError);

    try {
      handler(new Error('test'), 'getShow');
    } catch (error) {
      expect((error as ApiError).context).toBe('archiveApi.getShow');
    }
  });
});

describe('isApiError', () => {
  it('returns true for ApiError instances', () => {
    const error = new ApiError('test', 'test');
    expect(isApiError(error)).toBe(true);
  });

  it('returns false for regular errors', () => {
    const error = new Error('test');
    expect(isApiError(error)).toBe(false);
  });

  it('returns false for non-errors', () => {
    expect(isApiError('string')).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('extracts message from ApiError', () => {
    const error = new ApiError('api failed', 'test');
    expect(getErrorMessage(error)).toBe('api failed');
  });

  it('extracts message from regular Error', () => {
    const error = new Error('regular error');
    expect(getErrorMessage(error)).toBe('regular error');
  });

  it('returns default message for non-errors', () => {
    expect(getErrorMessage('string')).toBe('An unexpected error occurred');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });
});
