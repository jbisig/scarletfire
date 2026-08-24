/**
 * Full tag registry: display labels, type-safe id validation, and category
 * definitions for all filterable tags (era, source, venue, instrumentation,
 * notable). Keep all ids stable — they are URL-facing.
 */
import type { LineageTag, RecordingFormat } from '../types/show.types';

export const FORMAT_LABELS: Record<RecordingFormat, string> = {
  sbd: 'Soundboard',
  aud: 'Audience',
  matrix: 'Matrix',
  fm: 'FM Broadcast',
  unknown: 'Unknown',
};

export const LINEAGE_LABELS: Record<LineageTag, string> = {
  betty: 'Betty Board',
  miller: 'Charlie Miller',
  '16track': '16-Track',
  lowgen: 'Low Generation',
};

export function formatLabel(format: RecordingFormat | undefined): string {
  return FORMAT_LABELS[format ?? 'unknown'];
}

export function lineageLabel(tag: LineageTag): string {
  return LINEAGE_LABELS[tag];
}

/** A filterable/constrainable source tag: any real format or any lineage tag. */
export type SourceTagId = Exclude<RecordingFormat, 'unknown'> | LineageTag;

const SOURCE_TAG_IDS: ReadonlySet<string> = new Set<string>([
  'sbd', 'aud', 'matrix', 'fm', 'betty', 'miller', '16track', 'lowgen',
]);

export function isSourceTagId(value: string): value is SourceTagId {
  return SOURCE_TAG_IDS.has(value);
}

export function sourceTagLabel(id: SourceTagId): string {
  return id in FORMAT_LABELS
    ? FORMAT_LABELS[id as RecordingFormat]
    : LINEAGE_LABELS[id as LineageTag];
}

// ---- Tag registry (PR 3) ---------------------------------------------------

export type EraId =
  | 'primal' | 'livedead' | 'americana' | 'europe72' | 'wallofsound' | 'hiatus'
  | 'return' | 'peakkeith' | 'brent' | 'vincebruce' | 'finalyears';
export type VenuePhysicalType = 'theater' | 'arena' | 'stadium' | 'amphitheater';
export type VenueTypeTagId = VenuePhysicalType | 'festival' | 'international' | 'residency';
export type InstrumentationTagId = 'pedalsteel' | 'acousticset';
export type NotableTagId = 'classic' | 'historic' | 'guest';
// Song tags. 'americanagenre' (not 'americana') because the era registry
// already owns that id and ids share one URL-facing namespace; likewise the
// show side owns 'acousticset', so the song character tag is 'acoustic'.
export type SongTypeTagId = 'original' | 'cover' | 'traditional';
export type SongWritersTagId = 'huntergarcia' | 'barlowweir' | 'pigpen';
export type SongGenreTagId = 'blues' | 'gospel' | 'cowboy' | 'americanagenre' | 'funk';
export type SongCharacterTagId = 'jamvehicle' | 'ballad' | 'acoustic' | 'rare';
export type SongTagId = SongTypeTagId | SongWritersTagId | SongGenreTagId | SongCharacterTagId;
export type TagId = EraId | SourceTagId | VenueTypeTagId | InstrumentationTagId | NotableTagId | SongTagId;

export type SongTagCategoryId = 'songType' | 'songWriters' | 'songGenre' | 'songCharacter';
export type TagCategoryId = 'era' | 'source' | 'venueType' | 'instrumentation' | 'notable' | SongTagCategoryId;
/** What kind of thing a category describes. */
export type TagEntity = 'show' | 'recording' | 'song';

export interface TagCategory { id: TagCategoryId; label: string; appliesTo: TagEntity }
export interface TagDef { id: TagId; category: TagCategoryId; label: string; description?: string }

export const TAG_CATEGORIES: readonly TagCategory[] = [
  { id: 'era', label: 'Era', appliesTo: 'show' },
  { id: 'source', label: 'Source', appliesTo: 'recording' },
  { id: 'venueType', label: 'Venue', appliesTo: 'show' },
  { id: 'instrumentation', label: 'Instrumentation', appliesTo: 'show' },
  { id: 'notable', label: 'Notable', appliesTo: 'show' },
  { id: 'songType', label: 'Type', appliesTo: 'song' },
  { id: 'songWriters', label: 'Writers & Singers', appliesTo: 'song' },
  { id: 'songGenre', label: 'Genre', appliesTo: 'song' },
  { id: 'songCharacter', label: 'Character', appliesTo: 'song' },
];

export const SONG_TAG_CATEGORY_IDS: readonly SongTagCategoryId[] = [
  'songType', 'songWriters', 'songGenre', 'songCharacter',
];

const ERA_DEFS: TagDef[] = [
  { id: 'primal', category: 'era', label: 'Primal Dead' },
  { id: 'livedead', category: 'era', label: 'Live/Dead' },
  { id: 'americana', category: 'era', label: 'Americana' },
  { id: 'europe72', category: 'era', label: "Europe '72" },
  { id: 'wallofsound', category: 'era', label: 'Wall of Sound' },
  { id: 'hiatus', category: 'era', label: 'Hiatus' },
  { id: 'return', category: 'era', label: 'Return' },
  { id: 'peakkeith', category: 'era', label: 'Peak Keith' },
  { id: 'brent', category: 'era', label: 'Brent Era' },
  { id: 'vincebruce', category: 'era', label: 'Vince & Bruce' },
  { id: 'finalyears', category: 'era', label: 'Final Years' },
];

const SOURCE_DEFS: TagDef[] = [
  ...((['sbd', 'aud', 'matrix', 'fm'] as const)
    .map(id => ({ id, category: 'source' as const, label: FORMAT_LABELS[id] }))),
  ...((['betty', 'miller', '16track', 'lowgen'] as const)
    .map(id => ({ id, category: 'source' as const, label: LINEAGE_LABELS[id] }))),
];

const VENUE_DEFS: TagDef[] = [
  { id: 'theater', category: 'venueType', label: 'Small Theater' },
  { id: 'arena', category: 'venueType', label: 'Arena' },
  { id: 'stadium', category: 'venueType', label: 'Stadium' },
  { id: 'amphitheater', category: 'venueType', label: 'Amphitheater' },
  { id: 'festival', category: 'venueType', label: 'Festival' },
  { id: 'international', category: 'venueType', label: 'International' },
  { id: 'residency', category: 'venueType', label: 'Residency' },
];

const INSTRUMENTATION_DEFS: TagDef[] = [
  { id: 'pedalsteel', category: 'instrumentation', label: 'Pedal Steel', description: 'Jerry on pedal steel during a Grateful Dead show' },
  { id: 'acousticset', category: 'instrumentation', label: 'Acoustic Set' },
];

const SONG_TYPE_DEFS: TagDef[] = [
  { id: 'original', category: 'songType', label: 'Originals' },
  { id: 'cover', category: 'songType', label: 'Covers' },
  { id: 'traditional', category: 'songType', label: 'Traditionals' },
];

const SONG_WRITERS_DEFS: TagDef[] = [
  { id: 'huntergarcia', category: 'songWriters', label: 'Hunter-Garcia' },
  { id: 'barlowweir', category: 'songWriters', label: 'Barlow-Weir' },
  { id: 'pigpen', category: 'songWriters', label: 'Pigpen', description: 'Songs Pigpen wrote or fronted' },
];

const SONG_GENRE_DEFS: TagDef[] = [
  { id: 'blues', category: 'songGenre', label: 'Blues' },
  { id: 'gospel', category: 'songGenre', label: 'Gospel' },
  { id: 'cowboy', category: 'songGenre', label: 'Cowboy Songs' },
  { id: 'americanagenre', category: 'songGenre', label: 'Americana' },
  { id: 'funk', category: 'songGenre', label: 'Funk' },
];

const SONG_CHARACTER_DEFS: TagDef[] = [
  { id: 'jamvehicle', category: 'songCharacter', label: 'Jam Vehicle' },
  { id: 'ballad', category: 'songCharacter', label: 'Ballads' },
  { id: 'acoustic', category: 'songCharacter', label: 'Acoustic' },
  { id: 'rare', category: 'songCharacter', label: 'Rare', description: 'Performed 10 times or fewer' },
];

const NOTABLE_DEFS: TagDef[] = [
  { id: 'classic', category: 'notable', label: 'Consensus Classic' },
  { id: 'historic', category: 'notable', label: 'Historic Event' },
  { id: 'guest', category: 'notable', label: 'Guest Sit-In' },
];

export const TAG_DEFS: readonly TagDef[] = [
  ...ERA_DEFS, ...SOURCE_DEFS, ...VENUE_DEFS, ...INSTRUMENTATION_DEFS, ...NOTABLE_DEFS,
  ...SONG_TYPE_DEFS, ...SONG_WRITERS_DEFS, ...SONG_GENRE_DEFS, ...SONG_CHARACTER_DEFS,
];

const TAG_BY_ID: ReadonlyMap<string, TagDef> = new Map(TAG_DEFS.map(t => [t.id, t]));

export function isTagId(value: string): value is TagId {
  return TAG_BY_ID.has(value);
}

export function tagLabel(id: TagId): string {
  return TAG_BY_ID.get(id)!.label;
}

export function tagCategory(id: TagId): TagCategoryId {
  return TAG_BY_ID.get(id)!.category;
}

const SONG_CATEGORY_ID_SET: ReadonlySet<string> = new Set(SONG_TAG_CATEGORY_IDS);

/** True for ids in any song category. Guards URL-borne tags against landing on the wrong index. */
export function isSongTagId(value: string): value is SongTagId {
  return isTagId(value) && SONG_CATEGORY_ID_SET.has(tagCategory(value));
}

export function tagsInCategory(category: TagCategoryId): readonly TagDef[] {
  return TAG_DEFS.filter(t => t.category === category);
}
