/**
 * Logging Utility
 *
 * Provides consistent logging that respects the development environment.
 * In production builds, logs are suppressed to avoid performance overhead
 * and prevent sensitive information exposure.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

function createLogger(context: string): Logger {
  const formatMessage = (level: LogLevel, message: string) =>
    `[${context}] ${message}`;

  return {
    debug: (message: string, ...args: unknown[]) => {
      if (__DEV__) {
        console.log(formatMessage('debug', message), ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (__DEV__) {
        console.log(formatMessage('info', message), ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (__DEV__) {
        console.warn(formatMessage('warn', message), ...args);
      }
    },
    error: (message: string, ...args: unknown[]) => {
      // Errors are always logged (could be sent to error tracking service)
      if (__DEV__) {
        console.error(formatMessage('error', message), ...args);
      }
      // In production, could send to Sentry/Crashlytics here
    },
  };
}

// Pre-created loggers for common modules
export const logger = {
  player: createLogger('Player'),
  radio: createLogger('Radio'),
  audio: createLogger('Audio'),
  auth: createLogger('Auth'),
  api: createLogger('API'),
  profile: createLogger('Profile'),
  video: createLogger('Video'),
  config: createLogger('Config'),
  create: createLogger,
};

export default logger;
