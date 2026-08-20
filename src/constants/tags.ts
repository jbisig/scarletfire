/**
 * Display labels for recording format and lineage tags. PR 3 (tags & filter
 * tray) grows this file into the full tag registry; keep the ids stable —
 * they are URL-facing.
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
