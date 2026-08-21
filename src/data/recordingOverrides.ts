/**
 * Hand-edited corrections layered over the generated catalog at read time,
 * so a fix never requires regenerating shows.json.
 *
 * tagFixes — per-identifier corrections to the parsed format / lineage.
 *   Check scripts/output/recordings-raw.json for the raw strings when
 *   deciding a fix. Keep a short reason comment on each entry.
 *
 * Known data artefact (not fixable here — overrides can't re-date a show):
 *   the catalog carries a misdated `1980-06-27` Anchorage item (its only
 *   recording is `gd1980-06-20.…`), which turns the three-night West High
 *   stand into a four-night residency in the tag resolver's Residency rule
 *   (`src/services/tagResolver.ts`). Logged for the PR 1 catalog follow-up.
 *
 * editorialPins — per-show (YYYY-MM-DD) curated default recording. Read by
 *   the recording resolver (PR 2). Unused until then.
 */
import type { RecordingVersion } from '../types/show.types';

export const tagFixes: Record<string, Partial<Pick<RecordingVersion, 'format' | 'lineage'>>> = {};

export const editorialPins: Record<string, string> = {};
