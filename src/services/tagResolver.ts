/**
 * Read-time show tags. A show's tags are derived on demand — era from the
 * date, venue type from the curated map, source as the UNION of its catalog
 * recordings' format + lineage tags, instrumentation/notable from curated
 * date lists — and memoized per date in a `Map<date, TagId[]>`. Filtering
 * (`buildTagPredicate`/`makeShowTagFilter`) and faceted counts
 * (`getTagCounts`) are recomputed per selection over the caller's base
 * dates (≈2k shows × ≈8 tags; 2.4 ms warm, measured), and the tray
 * memoizes both with `useMemo`.
 *
 * buildTagPredicate is entity-agnostic (OR within a category, AND between)
 * so the later song-tags work reuses it unchanged.
 */
import { isTagId, tagCategory, tagsInCategory, TagCategoryId, TagId, TAG_DEFS, FORMAT_LABELS } from '../constants/tags';
import { eraForDate } from '../data/eras';
import { VENUE_TYPES, INTERNATIONAL_VENUES } from '../data/venueTypes';
import { FESTIVAL_DATES } from '../data/festivalDates';
import { PEDAL_STEEL_DATES, ACOUSTIC_SET_DATES } from '../data/instrumentation';
import { HISTORIC_EVENT_DATES, GUEST_SIT_IN_DATES, consensusClassicDates } from '../data/notableShows';
import { normalizeVenue } from '../utils/venueNormalization';
import { getAllShowsSorted, findShowByDate } from '../utils/showLookup';
import { getCatalogVersions } from './recordingCatalog';
import type { SourceConstraint } from './recordingResolver';
import type { LineageTag, RecordingFormat } from '../types/show.types';

const RESIDENCY_MIN_SHOWS = 4;
const RESIDENCY_MAX_GAP_DAYS = 10;

const dateOnly = (d: string) => d.slice(0, 10);
const dateSet = (entries: ReadonlyArray<{ date: string }>) => new Set(entries.map(e => e.date));

let curated: {
  festival: Set<string>; pedalSteel: Set<string>; acoustic: Set<string>;
  historic: Set<string>; guest: Set<string>; classic: Set<string>; residency: Set<string>;
} | null = null;

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Every night of any run of ≥4 shows at one venue with ≤10 days between consecutive nights. */
function computeResidencies(): Set<string> {
  const result = new Set<string>();
  let run: string[] = [];
  let runVenue = '';
  const flush = () => { if (run.length >= RESIDENCY_MIN_SHOWS) run.forEach(d => result.add(d)); run = []; };
  for (const show of getAllShowsSorted()) {
    const date = dateOnly(show.date);
    const venue = normalizeVenue(show.venue);
    const continues = run.length > 0 && venue === runVenue && venue !== '' && daysBetween(run[run.length - 1], date) <= RESIDENCY_MAX_GAP_DAYS;
    if (!continues) { flush(); runVenue = venue; }
    run.push(date);
  }
  flush();
  return result;
}

function getCurated() {
  if (curated) return curated;
  curated = {
    festival: dateSet(FESTIVAL_DATES),
    pedalSteel: dateSet(PEDAL_STEEL_DATES),
    acoustic: dateSet(ACOUSTIC_SET_DATES),
    historic: dateSet(HISTORIC_EVENT_DATES),
    guest: dateSet(GUEST_SIT_IN_DATES),
    classic: new Set(consensusClassicDates()),
    residency: computeResidencies(),
  };
  return curated;
}

const tagCache = new Map<string, TagId[]>();

export function getShowTags(date: string): TagId[] {
  const key = dateOnly(date);
  const cached = tagCache.get(key);
  if (cached) return cached;

  const show = findShowByDate(key);
  if (!show) { tagCache.set(key, []); return tagCache.get(key)!; }

  const c = getCurated();
  const tags = new Set<TagId>();
  tags.add(eraForDate(key));

  for (const version of getCatalogVersions(key)) {
    if (version.format !== 'unknown') tags.add(version.format as Exclude<RecordingFormat, 'unknown'>);
    version.lineage.forEach((l: LineageTag) => tags.add(l));
  }

  const venueKey = normalizeVenue(show.venue);
  const venueEntry = VENUE_TYPES[venueKey];
  // Low-confidence physical types are dataset-ruled unreliable and are not resolved.
  const physical = venueEntry && venueEntry.confidence !== 'low' ? venueEntry.type : undefined;
  if (physical) tags.add(physical);
  if (INTERNATIONAL_VENUES.has(venueKey)) tags.add('international');
  if (c.festival.has(key)) tags.add('festival');
  if (c.residency.has(key)) tags.add('residency');

  if (c.pedalSteel.has(key)) tags.add('pedalsteel');
  if (c.acoustic.has(key)) tags.add('acousticset');

  if (c.classic.has(key)) tags.add('classic');
  if (c.historic.has(key)) tags.add('historic');
  if (c.guest.has(key)) tags.add('guest');

  const list = [...tags];
  tagCache.set(key, list);
  return list;
}

function groupByCategory(selected: TagId[]): Map<TagCategoryId, TagId[]> {
  const groups = new Map<TagCategoryId, TagId[]>();
  for (const id of selected) {
    if (!isTagId(id)) continue;
    const cat = tagCategory(id);
    groups.set(cat, [...(groups.get(cat) ?? []), id]);
  }
  return groups;
}

/** OR within a category, AND between categories. Knows nothing about shows. */
export function buildTagPredicate<T>(selected: TagId[], getTags: (item: T) => TagId[]): (item: T) => boolean {
  const groups = [...groupByCategory(selected).values()];
  if (groups.length === 0) return () => true;
  return (item: T) => {
    const tags = new Set(getTags(item));
    return groups.every(group => group.some(id => tags.has(id)));
  };
}

export function makeShowTagFilter(selected: TagId[]): (date: string) => boolean {
  return buildTagPredicate<string>(selected, getShowTags);
}

export function applyTagFilter(dates: string[], selected: TagId[]): string[] {
  const keep = makeShowTagFilter(selected);
  return dates.filter(keep);
}

/**
 * Faceted counts over `baseDates`: for each tag, apply every OTHER category's
 * selection, ignore its own category's, then count dates carrying the tag.
 */
export function getTagCounts(selected: TagId[], baseDates: string[]): Record<TagId, number> {
  const groups = groupByCategory(selected);
  const tagsByDate = new Map<string, Set<TagId>>();
  for (const d of baseDates) tagsByDate.set(d, new Set(getShowTags(d)));

  const counts = {} as Record<TagId, number>;
  for (const def of TAG_DEFS) {
    const otherGroups = [...groups.entries()].filter(([cat]) => cat !== def.category).map(([, ids]) => ids);
    let n = 0;
    for (const [, tags] of tagsByDate) {
      if (!tags.has(def.id)) continue;
      if (otherGroups.every(group => group.some(id => tags.has(id)))) n++;
    }
    counts[def.id] = n;
  }
  return counts;
}

// Registry order (sbd, aud, matrix, fm, then the lineage tags) — split by
// whether the id names a RecordingFormat, so format precedence below
// follows TAG_DEFS order rather than the caller's selection order.
const SOURCE_TAG_DEFS = tagsInCategory('source');
const FORMAT_IDS: ReadonlySet<string> = new Set(SOURCE_TAG_DEFS.filter(t => t.id in FORMAT_LABELS).map(t => t.id));
const LINEAGE_IDS: ReadonlySet<string> = new Set(SOURCE_TAG_DEFS.filter(t => !(t.id in FORMAT_LABELS)).map(t => t.id));

/** The recording-resolver constraint implied by the selected Source tags (format is single-valued). */
export function sourceConstraintFromTags(selected: TagId[]): SourceConstraint | undefined {
  const c: SourceConstraint = {};
  const selectedSet = new Set(selected);
  // Pick the format by REGISTRY order, not tap order: the earliest
  // FORMAT_ID in TAG_DEFS that the user selected wins.
  const format = SOURCE_TAG_DEFS.find(t => FORMAT_IDS.has(t.id) && selectedSet.has(t.id));
  if (format) c.format = format.id as RecordingFormat;
  for (const id of selected) {
    if (LINEAGE_IDS.has(id)) (c.lineage ??= []).push(id as LineageTag);
  }
  return c.format || c.lineage ? c : undefined;
}

/** Informational: how many catalog shows carry each tag. */
export function getTagCoverage(): Array<{ id: TagId; shows: number; pct: number }> {
  const dates = getAllShowsSorted().map(s => dateOnly(s.date));
  const counts = getTagCounts([], dates);
  return TAG_DEFS.map(def => ({ id: def.id, shows: counts[def.id], pct: Math.round((counts[def.id] / dates.length) * 100) }));
}

export function resetTagIndexForTests(): void {
  tagCache.clear();
  curated = null;
}
