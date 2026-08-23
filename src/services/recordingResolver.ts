/**
 * Pure answer to "which recording of this show should play?". Precedence:
 * user pin → session constraint (active source filter) → global preference
 * → unconstrained. An editorial pin beats the ranker whenever it survives
 * the active constraint. When a constraint yields nothing we relax it in a
 * fixed order and report what was relaxed so the UI can say so.
 */
import type { LineageTag, RecordingFormat, RecordingVersion } from '../types/show.types';
import type { SourcePreference } from '../constants/sourcePreferences';
import { FORMAT_LABELS, LINEAGE_LABELS, isSourceTagId, SourceTagId } from '../constants/tags';
import { rankRecordings } from './recordingRanker';

export interface SourceConstraint {
  format?: RecordingFormat;
  lineage?: LineageTag[];
}

export interface ResolveContext {
  preference: SourcePreference;
  userPinIdentifier?: string;
  editorialPinIdentifier?: string;
  sessionConstraint?: SourceConstraint;
}

export type ResolvedVia = 'user-pin' | 'downloaded' | 'editorial' | 'filter' | 'preference' | 'popular';

export interface FallbackInfo {
  requested: SourceTagId[];
  relaxed: SourceTagId[];
}

export interface ResolvedRecording {
  identifier: string;
  via: ResolvedVia;
  fallback?: FallbackInfo;
}

const QUALITY_MODIFIERS: ReadonlySet<LineageTag> = new Set(['16track', 'lowgen']);

function isEmptyConstraint(c: SourceConstraint | undefined): c is undefined {
  return !c || (!c.format && (!c.lineage || c.lineage.length === 0));
}

function constraintTags(c: SourceConstraint): SourceTagId[] {
  const tags: SourceTagId[] = [];
  if (c.format && c.format !== 'unknown') tags.push(c.format);
  (c.lineage ?? []).forEach(t => tags.push(t));
  return tags;
}

function matches(version: RecordingVersion, c: SourceConstraint): boolean {
  if (c.format && version.format !== c.format) return false;
  return (c.lineage ?? []).every(tag => version.lineage.includes(tag));
}

/** The relaxation rungs, each derived from the ORIGINAL constraint. */
function ladder(c: SourceConstraint): SourceConstraint[] {
  const lineage = c.lineage ?? [];
  return [
    c,
    { format: c.format, lineage: lineage.filter(t => !QUALITY_MODIFIERS.has(t)) },
    { format: c.format, lineage: [] },
    { lineage: [] },
  ];
}

function pick(candidates: RecordingVersion[], editorialPinIdentifier: string | undefined): { version: RecordingVersion; editorial: boolean } {
  const editorial = editorialPinIdentifier ? candidates.find(v => v.identifier === editorialPinIdentifier) : undefined;
  if (editorial) return { version: editorial, editorial: true };
  return { version: rankRecordings(candidates)[0], editorial: false };
}

function resolveConstrained(
  versions: RecordingVersion[],
  constraint: SourceConstraint,
  via: Exclude<ResolvedVia, 'user-pin' | 'editorial' | 'popular'>,
  editorialPinIdentifier: string | undefined,
): ResolvedRecording {
  const requested = constraintTags(constraint);
  for (const rung of ladder(constraint)) {
    const candidates = versions.filter(v => matches(v, rung));
    if (candidates.length === 0) continue;
    const { version, editorial } = pick(candidates, editorialPinIdentifier);
    const kept = new Set(constraintTags(rung));
    const relaxed = requested.filter(t => !kept.has(t));
    const result: ResolvedRecording = { identifier: version.identifier, via: editorial ? 'editorial' : via };
    if (relaxed.length > 0) result.fallback = { requested, relaxed };
    return result;
  }
  // Unreachable: the last rung is unconstrained and versions is non-empty.
  const { version, editorial } = pick(versions, editorialPinIdentifier);
  return { identifier: version.identifier, via: editorial ? 'editorial' : via, fallback: { requested, relaxed: requested } };
}

export function resolveRecording(versions: RecordingVersion[], ctx: ResolveContext): ResolvedRecording | null {
  if (versions.length === 0) return null;

  if (ctx.userPinIdentifier && versions.some(v => v.identifier === ctx.userPinIdentifier)) {
    return { identifier: ctx.userPinIdentifier, via: 'user-pin' };
  }

  if (!isEmptyConstraint(ctx.sessionConstraint)) {
    return resolveConstrained(versions, ctx.sessionConstraint, 'filter', ctx.editorialPinIdentifier);
  }

  if (ctx.preference !== 'popular') {
    return resolveConstrained(versions, { format: ctx.preference }, 'preference', ctx.editorialPinIdentifier);
  }

  const { version, editorial } = pick(versions, ctx.editorialPinIdentifier);
  return { identifier: version.identifier, via: editorial ? 'editorial' : 'popular' };
}

const FORMAT_NOUN: Record<RecordingFormat, string> = {
  sbd: 'soundboard',
  aud: 'audience recording',
  matrix: 'matrix',
  fm: 'FM broadcast',
  unknown: 'recording',
};

function describe(format: RecordingFormat | undefined, lineage: LineageTag[]): string {
  const parts = lineage.filter(t => !QUALITY_MODIFIERS.has(t)).map(t => LINEAGE_LABELS[t]);
  parts.push(FORMAT_NOUN[format ?? 'unknown']);
  return parts.join(' ');
}

export function describeFallback(fallback: FallbackInfo, chosen: RecordingVersion): string {
  const requestedFormat = fallback.requested.find((t): t is Exclude<RecordingFormat, 'unknown'> => t in FORMAT_LABELS);
  const requestedLineage = fallback.requested.filter((t): t is LineageTag => t in LINEAGE_LABELS);
  return `No ${describe(requestedFormat, requestedLineage)} from this night — playing the ${describe(chosen.format, chosen.lineage)} instead.`;
}

export function parseSourceConstraint(raw: string | undefined): SourceConstraint | undefined {
  if (!raw) return undefined;
  const c: SourceConstraint = {};
  for (const token of raw.split(',').map(t => t.trim()).filter(isSourceTagId)) {
    if (token in FORMAT_LABELS) {
      if (!c.format) c.format = token as RecordingFormat;
    } else {
      (c.lineage ??= []).push(token as LineageTag);
    }
  }
  return isEmptyConstraint(c) ? undefined : c;
}

export function stringifySourceConstraint(c: SourceConstraint | undefined): string | undefined {
  if (isEmptyConstraint(c)) return undefined;
  return constraintTags(c).join(',');
}
