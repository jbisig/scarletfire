/**
 * The one way app code reads a show's recordings. Keyed by DATE rather than
 * by a show object on purpose: favorites persist whole show objects (with
 * whatever `versions` shape they had when saved), so looking the catalog up
 * fresh by date means old saved shows self-heal instead of carrying stale
 * recording data forever.
 */
import { findShowByDate } from '../utils/showLookup';
import { tagFixes } from '../data/recordingOverrides';
import type { RecordingVersion } from '../types/show.types';

export function applyTagFixes(version: RecordingVersion): RecordingVersion {
  const fix = tagFixes[version.identifier];
  return fix ? { ...version, ...fix } : version;
}

const cache = new Map<string, RecordingVersion[]>();

function normalizeDate(date: string): string {
  return date.slice(0, 10);
}

export function getCatalogVersions(date: string): RecordingVersion[] {
  const key = normalizeDate(date);
  const cached = cache.get(key);
  if (cached) return cached;
  const show = findShowByDate(key);
  const versions = show ? show.versions.map(applyTagFixes) : [];
  cache.set(key, versions);
  return versions;
}

export function resetCatalogCacheForTests(): void {
  cache.clear();
}
