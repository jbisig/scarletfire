/**
 * The ONE seam app code uses to turn a show into the recording to play.
 * Reads the source-prefs store, the editorial pins, and the bundled catalog
 * synchronously, so it works from nav-param builders and PlayerContext
 * callbacks alike. Pure logic lives in recordingResolver.
 */
import type { GratefulDeadShow } from '../types/show.types';
import { getActivePin, getSourcePrefs } from './sourcePrefsStore';
import { resolveRecording, ResolvedRecording, SourceConstraint } from './recordingResolver';
import { getCatalogVersions } from './recordingCatalog';
import { editorialPins } from '../data/recordingOverrides';
import { findShowByDate } from '../utils/showLookup';

export interface SelectionOptions {
  sessionConstraint?: SourceConstraint;
  /** Returned (as 'popular') when the date has no catalog recordings. */
  fallbackIdentifier?: string;
  /** Resolve as if no pin existed — used to label the "Default" recording while a pin is active. */
  ignoreUserPin?: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveForDate(date: string, opts: SelectionOptions = {}): ResolvedRecording | null {
  const key = date.slice(0, 10);
  const versions = getCatalogVersions(key);
  if (versions.length === 0) {
    return opts.fallbackIdentifier ? { identifier: opts.fallbackIdentifier, via: 'popular' } : null;
  }
  return resolveRecording(versions, {
    preference: getSourcePrefs().preference,
    userPinIdentifier: opts.ignoreUserPin ? undefined : getActivePin(key)?.identifier,
    editorialPinIdentifier: editorialPins[key],
    sessionConstraint: opts.sessionConstraint,
  });
}

export function resolveShowIdentifier(show: GratefulDeadShow, sessionConstraint?: SourceConstraint): string {
  return resolveForDate(show.date, { sessionConstraint, fallbackIdentifier: show.primaryIdentifier })!.identifier;
}

/** Route ids may be a date (clean web URLs) or an Archive identifier. */
export function resolveRouteIdentifier(idOrDate: string, sessionConstraint?: SourceConstraint): string {
  if (!DATE_RE.test(idOrDate)) return idOrDate;
  const show = findShowByDate(idOrDate);
  if (!show) return idOrDate;
  return resolveShowIdentifier(show, sessionConstraint);
}

/**
 * The stable identity of a SHOW for user-state keys (favorites, collections,
 * play counts, feed targets): the catalog's primary recording for that date,
 * falling back to the given identifier when the date is off-catalog. The
 * loaded recording now varies per user (preference, pins), so anything keyed
 * per show must use this, never `show.identifier`.
 */
export function stableShowIdentifier(date: string | undefined, fallbackIdentifier: string): string {
  const show = date ? findShowByDate(date.slice(0, 10)) : undefined;
  return show?.primaryIdentifier ?? fallbackIdentifier;
}
