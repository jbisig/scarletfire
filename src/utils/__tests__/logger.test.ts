/**
 * Tests for the logging utility, in particular the production error-visibility
 * behavior added in Task 10: `.error` must emit (and forward to a pluggable
 * reporter) in production, while `warn`/`info`/`debug` stay dev-only.
 */

import logger, { setErrorReporter } from '../logger';

describe('logger', () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    setErrorReporter(null);
    jest.restoreAllMocks();
  });

  describe('in development (__DEV__ = true)', () => {
    beforeEach(() => {
      (global as { __DEV__?: boolean }).__DEV__ = true;
    });

    it('emits error logs with dev formatting', () => {
      logger.player.error('boom', { code: 1 });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Player] boom', { code: 1 });
    });

    it('still emits debug/info/warn', () => {
      logger.api.debug('debug message');
      logger.api.info('info message');
      logger.api.warn('warn message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[API] debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[API] info message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[API] warn message');
    });

    it('forwards errors to the reporter when set (testable in dev)', () => {
      const reporter = jest.fn();
      setErrorReporter(reporter);

      logger.auth.error('login failed', { userId: 'abc' });

      expect(reporter).toHaveBeenCalledTimes(1);
      expect(reporter).toHaveBeenCalledWith('[Auth] login failed', { userId: 'abc' });
    });
  });

  describe('in production (__DEV__ = false)', () => {
    beforeEach(() => {
      (global as { __DEV__?: boolean }).__DEV__ = false;
    });

    it('still emits error logs via console.error', () => {
      logger.api.error('request failed', { status: 500 });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[API] request failed', { status: 500 });
    });

    it('forwards errors to the reporter when set', () => {
      const reporter = jest.fn();
      setErrorReporter(reporter);

      logger.radio.error('stream dropped', 'reason: timeout');

      expect(reporter).toHaveBeenCalledTimes(1);
      expect(reporter).toHaveBeenCalledWith('[Radio] stream dropped', 'reason: timeout');
    });

    it('does not forward to the reporter when none is set', () => {
      // No reporter registered (afterEach resets it to null) - should not throw.
      expect(() => logger.video.error('render failed')).not.toThrow();
    });

    it('suppresses debug, info, and warn', () => {
      logger.config.debug('debug message');
      logger.config.info('info message');
      logger.config.warn('warn message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
