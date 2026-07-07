/**
 * Tests for the archive.org-only allowlist used to guard against cross-user
 * streamUrl injection (Task 13). Favorites/collections synced from other
 * users carry unvalidated streamUrl strings; this is the last line of
 * defense before one is handed to the native audio player.
 */
import { isAllowedStreamUrl } from '../validateStreamUrl';

describe('isAllowedStreamUrl', () => {
  describe('accepts', () => {
    it('accepts a bare archive.org https URL', () => {
      expect(isAllowedStreamUrl('https://archive.org/download/gd1977-05-08/track01.mp3')).toBe(true);
    });

    it('accepts an archive.org subdomain', () => {
      expect(isAllowedStreamUrl('https://ia800000.us.archive.org/download/gd1977-05-08/track01.mp3')).toBe(true);
    });

    it('accepts a nested subdomain', () => {
      expect(isAllowedStreamUrl('https://sub.archive.org/foo')).toBe(true);
    });

    it('accepts deep paths and query strings', () => {
      expect(
        isAllowedStreamUrl('https://archive.org/download/show/deep/nested/path/track.mp3?ext=mp3#t=10'),
      ).toBe(true);
    });

    it('accepts an explicit port on archive.org', () => {
      expect(isAllowedStreamUrl('https://archive.org:443/download/track.mp3')).toBe(true);
    });

    it('is case-insensitive for the hostname', () => {
      expect(isAllowedStreamUrl('https://ARCHIVE.ORG/download/track.mp3')).toBe(true);
    });
  });

  describe('rejects', () => {
    it('rejects http (non-https) archive.org URLs', () => {
      expect(isAllowedStreamUrl('http://archive.org/download/track.mp3')).toBe(false);
    });

    it('rejects other hosts entirely', () => {
      expect(isAllowedStreamUrl('https://evil.com/track.mp3')).toBe(false);
    });

    it('rejects look-alike hosts with a hyphen', () => {
      expect(isAllowedStreamUrl('https://evil-archive.org/track.mp3')).toBe(false);
    });

    it('rejects hosts that merely start with archive.org', () => {
      expect(isAllowedStreamUrl('https://archive.org.evil.com/track.mp3')).toBe(false);
    });

    it('rejects userinfo host-spoofing tricks', () => {
      expect(isAllowedStreamUrl('https://archive.org@evil.com/')).toBe(false);
    });

    it('rejects userinfo tricks even with credentials', () => {
      expect(isAllowedStreamUrl('https://user:archive.org@evil.com/track.mp3')).toBe(false);
    });

    it('rejects malformed URLs', () => {
      expect(isAllowedStreamUrl('not a url')).toBe(false);
      expect(isAllowedStreamUrl('')).toBe(false);
      expect(isAllowedStreamUrl('https://')).toBe(false);
      expect(isAllowedStreamUrl('https:///archive.org')).toBe(false);
    });

    it('rejects other schemes', () => {
      expect(isAllowedStreamUrl('ftp://archive.org/track.mp3')).toBe(false);
      expect(isAllowedStreamUrl('javascript://archive.org/%0aalert(1)')).toBe(false);
      expect(isAllowedStreamUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('rejects a scheme-relative or protocol-less string', () => {
      expect(isAllowedStreamUrl('archive.org/track.mp3')).toBe(false);
      expect(isAllowedStreamUrl('//archive.org/track.mp3')).toBe(false);
    });

    it('rejects the backslash authority-terminator bypass (WHATWG treats \\ as / for https)', () => {
      // Browsers (and the web <audio> element that ultimately consumes this
      // URL) parse this as host "evil.com" with path "\.archive.org/x.mp3"
      // normalized to "/.archive.org/x.mp3" — NOT as a subdomain of
      // archive.org. A parser that only terminates the authority on
      // '/', '?', '#' would incorrectly swallow the backslash-prefixed
      // suffix into the authority string and see "archive.org" in it.
      expect(isAllowedStreamUrl('https://evil.com\\.archive.org/x.mp3')).toBe(false);
    });

    it('rejects IP-literal hosts', () => {
      expect(isAllowedStreamUrl('https://93.184.216.34/x.mp3')).toBe(false);
    });

    it('rejects a trailing-dot FQDN host (browsers normalize it to archive.org, but this guard does not rely on that)', () => {
      expect(isAllowedStreamUrl('https://archive.org./x.mp3')).toBe(false);
    });

    it('rejects percent-encoded characters in the authority', () => {
      expect(isAllowedStreamUrl('https://archive%2Eorg/x.mp3')).toBe(false);
      expect(isAllowedStreamUrl('https://archive.org%2F@evil.com/x.mp3')).toBe(false);
    });
  });
});
