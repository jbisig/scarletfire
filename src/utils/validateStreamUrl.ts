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
 * (`https://archive.org@evil.com/`), backslash-authority tricks
 * (`https://evil.com\.archive.org/`, which WHATWG parsers resolve to host
 * `evil.com`), IP-literal hosts, trailing-dot FQDN hosts, percent-encoded
 * authority characters, and malformed input.
 */
export function isAllowedStreamUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;

  // Scheme must be exactly "https" followed by "://".
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//.exec(url);
  if (!schemeMatch) return false;
  if (schemeMatch[1].toLowerCase() !== 'https') return false;

  const afterScheme = url.slice(schemeMatch[0].length);

  // The authority component runs up to the first '/', '?', '#', or '\'.
  // WHATWG URL parsing (what browsers and the web <audio> element actually
  // use) treats '\' as equivalent to '/' for special schemes like https, so
  // "https://evil.com\.archive.org/x" resolves to host evil.com even though
  // a naive parser that only splits on '/', '?', '#' would include the
  // backslash-prefixed suffix in the authority and see "archive.org".
  const authorityEnd = afterScheme.search(/[/?#\\]/);
  const authority = authorityEnd === -1 ? afterScheme : afterScheme.slice(0, authorityEnd);
  if (authority.length === 0) return false;

  // Defense-in-depth: reject any authority containing a backslash outright,
  // same as the '@' userinfo check below. The terminator-class fix above
  // should already prevent a backslash from ever reaching here, but this
  // guards against any future change to the boundary logic reintroducing
  // the bypass silently.
  if (authority.includes('\\')) return false;

  // Reject userinfo (`user@host`) outright rather than trying to resolve
  // which side of the last '@' is the real host — e.g.
  // "https://archive.org@evil.com/" must never be treated as archive.org.
  if (authority.includes('@')) return false;

  // Reject percent-encoded characters in the authority. A legitimate
  // archive.org host never needs escaping, and WHATWG parsers decode
  // percent-encoding in ways a manual parser can't safely replicate here
  // (e.g. encoded dots, slashes, or '@' could smuggle a different host past
  // this check while still comparing equal to "archive.org" as written).
  if (authority.includes('%')) return false;

  // Strip an optional trailing ":<port>".
  let host = authority;
  const portIdx = host.lastIndexOf(':');
  if (portIdx !== -1 && /^\d+$/.test(host.slice(portIdx + 1))) {
    host = host.slice(0, portIdx);
  }

  host = host.toLowerCase();
  // Reject a trailing "." (FQDN notation), rather than stripping it and
  // comparing as if it weren't there. Browsers/WHATWG URL parsers do
  // normalize "archive.org." to "archive.org", so treating it as equivalent
  // here isn't wrong per se — but it adds a second textual representation of
  // an allowed host that this guard would need to keep in lockstep with
  // browser behavior forever. Since nothing legitimate in this app ever
  // produces a trailing-dot streamUrl, the safer default is to reject it
  // outright rather than assume this parser's normalization matches
  // whatever engine ultimately resolves the URL.
  if (host.endsWith('.')) return false;
  if (host.length === 0) return false;

  return host === 'archive.org' || host.endsWith('.archive.org');
}
