/**
 * Hand-edited corrections layered over the generated catalog at read time,
 * so a fix never requires regenerating shows.json.
 *
 * tagFixes — per-identifier corrections to the parsed format / lineage.
 *   Check scripts/output/recordings-raw.json for the raw strings when
 *   deciding a fix. Keep a short reason comment on each entry.
 *
 * editorialPins — per-show (YYYY-MM-DD) curated default recording. Read by
 *   the recording resolver (PR 2). Unused until then.
 */
import type { RecordingVersion } from '../types/show.types';

export const tagFixes: Record<string, Partial<Pick<RecordingVersion, 'format' | 'lineage'>>> = {};

export const editorialPins: Record<string, string> = {};
