// Pure, dependency-free tag-list URL param helpers. Lives outside
// webLinking.ts so screens can import it without pulling the web-only
// linking config (and its catalog-derived identifier map) onto native.
import { isTagId, TagId } from '../constants/tags';

/**
 * Parse a `?tags=` query value into a sanitized, deduped TagId list. A
 * malformed percent-escape (e.g. a bare "%" from a hand-edited or truncated
 * URL) throws URIError — treated as "no tags" rather than crashing the
 * route parse (same shape as showDetailRoute's sourceConstraint parser).
 */
export function parseTagsParam(raw: string | undefined): TagId[] {
  if (!raw) return [];
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch (err) {
    if (err instanceof URIError) return [];
    throw err;
  }
  const out: TagId[] = [];
  for (const token of decoded.split(',').map(t => t.trim().toLowerCase())) {
    if (isTagId(token) && !out.includes(token)) out.push(token);
  }
  return out;
}

export function stringifyTagsParam(tags: TagId[]): string | undefined {
  return tags.length ? tags.join(',') : undefined;
}
