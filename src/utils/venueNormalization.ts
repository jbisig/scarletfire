/**
 * Key used to look a show's venue up in the curated venue-type map. MUST stay
 * byte-identical to the normalization used to build
 * scripts/data/venue-types.tsv (from `show.venue`): lowercase, non-word
 * characters to spaces, whitespace collapsed, leading "the " dropped.
 */
export function normalizeVenue(venue: string | undefined): string {
  if (!venue) return '';
  return venue
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the /, '');
}
