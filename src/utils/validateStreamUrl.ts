/**
 * Cross-user content guard: favorites and collections can be synced from
 * OTHER users (public profiles, shared/followed collections), and their
 * stored `streamUrl` fields are not server-validated. Before any such URL is
 * handed to the native audio player, it must be confirmed to actually point
 * at archive.org — otherwise a malicious user could get another user's app
 * to fetch/play (or leak a request to) an arbitrary host.
 *
 * Deliberately avoids the global `URL` constructor: React Native's Hermes
 * engine does not ship one, and this project has no URL polyfill dependency
 * (and Task 13 disallows adding new deps). Manual parsing below is written
 * to be conservative — anything ambiguous is rejected rather than allowed.
 */

/**
 * Returns true only for `https:` URLs whose hostname is exactly `archive.org`
 * or a subdomain of it (e.g. `ia800000.us.archive.org`).
 *
 * Rejects: non-https schemes, other hosts, look-alike hosts
 * (`evil-archive.org`, `archive.org.evil.com`), userinfo tricks
 * (`https://archive.org@evil.com/`), and malformed input.
 */
export function isAllowedStreamUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;

  // Scheme must be exactly "https" followed by "://".
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//.exec(url);
  if (!schemeMatch) return false;
  if (schemeMatch[1].toLowerCase() !== 'https') return false;

  const afterScheme = url.slice(schemeMatch[0].length);

  // The authority component runs up to the first '/', '?', or '#'.
  const authorityEnd = afterScheme.search(/[/?#]/);
  const authority = authorityEnd === -1 ? afterScheme : afterScheme.slice(0, authorityEnd);
  if (authority.length === 0) return false;

  // Reject userinfo (`user@host`) outright rather than trying to resolve
  // which side of the last '@' is the real host — e.g.
  // "https://archive.org@evil.com/" must never be treated as archive.org.
  if (authority.includes('@')) return false;

  // Strip an optional trailing ":<port>".
  let host = authority;
  const portIdx = host.lastIndexOf(':');
  if (portIdx !== -1 && /^\d+$/.test(host.slice(portIdx + 1))) {
    host = host.slice(0, portIdx);
  }

  host = host.toLowerCase();
  // Tolerate a trailing "." (FQDN notation) before comparing.
  if (host.endsWith('.')) host = host.slice(0, -1);
  if (host.length === 0) return false;

  return host === 'archive.org' || host.endsWith('.archive.org');
}
