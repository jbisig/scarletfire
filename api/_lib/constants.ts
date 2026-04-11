/**
 * Shared constants for the Vercel Functions under api/.
 * Matches the WEB_ORIGIN in src/services/shareService.ts so URLs built
 * server-side for share links / OG images / HTML meta tags point at the
 * same production host.
 */
export const WEB_ORIGIN = 'https://www.scarletfire.app';
