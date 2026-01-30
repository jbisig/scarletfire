/**
 * API Error Handling Utilities
 *
 * Provides standardized error handling for async operations,
 * especially API calls and service layer functions.
 */
import { logger } from './logger';

/**
 * Custom error class with additional context for debugging
 */
export class ApiError extends Error {
  public readonly context: string;
  public readonly originalError: Error | unknown;
  public readonly timestamp: number;

  constructor(message: string, context: string, originalError?: Error | unknown) {
    super(message);
    this.name = 'ApiError';
    this.context = context;
    this.originalError = originalError;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Get a detailed error message including context
   */
  toDetailedString(): string {
    const original = this.originalError instanceof Error
      ? this.originalError.message
      : String(this.originalError);
    return `[${this.context}] ${this.message}${original ? ` (Original: ${original})` : ''}`;
  }
}

/**
 * Options for withErrorHandling wrapper
 */
interface ErrorHandlingOptions {
  /** Context string for error logging (e.g., "archiveApi.getShowDetail") */
  context: string;
  /** Whether to rethrow the error after logging (default: true) */
  rethrow?: boolean;
  /** Custom error message to use instead of the original */
  message?: string;
  /** Default value to return on error (only used when rethrow is false) */
  defaultValue?: unknown;
}

/**
 * Wraps an async function with standardized error handling
 *
 * @example
 * const safeGetShow = withErrorHandling(
 *   () => archiveApi.getShowDetail(id),
 *   { context: 'archiveApi.getShowDetail', rethrow: false, defaultValue: null }
 * );
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions
): Promise<T | undefined> {
  const { context, rethrow = true, message, defaultValue } = options;

  try {
    return await fn();
  } catch (error) {
    const errorMessage = message ?? (error instanceof Error ? error.message : 'Unknown error');
    const apiError = new ApiError(errorMessage, context, error);

    // Log with context
    logger.api.error(apiError.toDetailedString());

    if (rethrow) {
      throw apiError;
    }

    return defaultValue as T | undefined;
  }
}

/**
 * Creates a reusable error handler for a specific context
 *
 * @example
 * const handleArchiveError = createErrorHandler('archiveApi');
 *
 * try {
 *   const show = await api.getShow(id);
 * } catch (error) {
 *   handleArchiveError(error, 'getShow');
 * }
 */
export function createErrorHandler(baseContext: string) {
  return function handleError(error: unknown, operation: string): never {
    const context = `${baseContext}.${operation}`;
    const message = error instanceof Error ? error.message : 'Unknown error';
    const apiError = new ApiError(message, context, error);

    logger.api.error(apiError.toDetailedString());
    throw apiError;
  };
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Extract a user-friendly message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
