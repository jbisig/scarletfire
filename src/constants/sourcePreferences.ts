/**
 * The user's global recording preference. 'popular' = run the ranker
 * unconstrained; the others constrain candidates to one format first and
 * fall back (with a notice) when a show has none.
 */
export type SourcePreference = 'popular' | 'sbd' | 'aud' | 'matrix' | 'fm';

export const DEFAULT_SOURCE_PREFERENCE: SourcePreference = 'popular';

export const SOURCE_PREFERENCE_OPTIONS: ReadonlyArray<{
  value: SourcePreference;
  label: string;
  description: string;
}> = [
  { value: 'popular', label: 'Most Popular', description: 'The best-rated, most-played recording of each show' },
  { value: 'sbd', label: 'Soundboard', description: 'Straight from the board whenever one exists' },
  { value: 'aud', label: 'Audience', description: 'Room sound from the taper section' },
  { value: 'matrix', label: 'Matrix', description: 'Soundboard and audience blended together' },
  { value: 'fm', label: 'FM Broadcast', description: 'Radio simulcasts when a show has one' },
];

export function sourcePreferenceLabel(preference: SourcePreference): string {
  return SOURCE_PREFERENCE_OPTIONS.find(o => o.value === preference)?.label ?? 'Most Popular';
}
