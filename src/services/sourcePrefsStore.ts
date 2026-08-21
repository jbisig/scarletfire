/**
 * Module-level store for the user's recording-source preference, per-show
 * pins, and "prefer X everywhere?" answers. Deliberately NOT a React
 * context so non-React code (PlayerContext callbacks, nav-param builders)
 * can read it synchronously. SourcePrefsContext wraps it for persistence,
 * cloud sync, and React subscriptions (same split as userRatingsStore).
 */
import type { RecordingFormat } from '../types/show.types';
import { DEFAULT_SOURCE_PREFERENCE, SourcePreference } from '../constants/sourcePreferences';

export interface SourcePin {
  identifier: string;
  /** Format of the pinned recording at pin time — lets the nudge run without a catalog lookup. */
  format: RecordingFormat;
  pinnedAt: number;
  /** deletedAt >= pinnedAt marks a tombstone (cleared pin) kept for sync. */
  deletedAt?: number;
}

export type NudgeAnswer = 'yes' | 'no';

/** getPendingNudge never offers 'unknown' as a preference — see its guard below. */
export type NudgeFormat = Exclude<RecordingFormat, 'unknown'>;

export interface SourcePrefs {
  preference: SourcePreference;
  preferenceSetAt: number;
  /** Keyed by YYYY-MM-DD. */
  pins: Record<string, SourcePin>;
  nudgeAnswers: Partial<Record<RecordingFormat, NudgeAnswer>>;
}

export const EMPTY_SOURCE_PREFS: SourcePrefs = {
  preference: DEFAULT_SOURCE_PREFERENCE,
  preferenceSetAt: 0,
  pins: {},
  nudgeAnswers: {},
};

const TOMBSTONE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const NUDGE_WINDOW = 3;
const PREFERENCES: ReadonlySet<string> = new Set(['popular', 'sbd', 'aud', 'matrix', 'fm']);
const FORMATS: ReadonlySet<string> = new Set(['sbd', 'aud', 'matrix', 'fm', 'unknown']);

let prefs: SourcePrefs = { ...EMPTY_SOURCE_PREFS };
let version = 0;
const listeners = new Set<() => void>();

function dateOnly(date: string): string {
  return date.slice(0, 10);
}

function isPinActive(pin: SourcePin): boolean {
  return pin.deletedAt === undefined || pin.deletedAt < pin.pinnedAt;
}

function notify(): void {
  version++;
  listeners.forEach(l => l());
}

export function getSourcePrefs(): SourcePrefs {
  return prefs;
}

export function getSourcePrefsVersion(): number {
  return version;
}

export function replaceSourcePrefs(next: SourcePrefs): void {
  prefs = next;
  notify();
}

export function setSourcePreference(preference: SourcePreference, now: number = Date.now()): void {
  prefs = { ...prefs, preference, preferenceSetAt: now };
  notify();
}

export function getActivePin(date: string): SourcePin | null {
  const pin = prefs.pins[dateOnly(date)];
  return pin && isPinActive(pin) ? pin : null;
}

export function setPin(date: string, identifier: string, format: RecordingFormat, now: number = Date.now()): void {
  prefs = { ...prefs, pins: { ...prefs.pins, [dateOnly(date)]: { identifier, format, pinnedAt: now } } };
  notify();
}

export function clearPin(date: string, now: number = Date.now()): void {
  const key = dateOnly(date);
  const existing = prefs.pins[key];
  if (!existing || !isPinActive(existing)) return;
  prefs = { ...prefs, pins: { ...prefs.pins, [key]: { ...existing, deletedAt: now } } };
  notify();
}

export function answerNudge(format: RecordingFormat, answer: NudgeAnswer): void {
  prefs = { ...prefs, nudgeAnswers: { ...prefs.nudgeAnswers, [format]: answer } };
  notify();
}

/**
 * The format to offer as the new global preference, or null. Looks at the
 * three most recent ACTIVE pins only.
 */
export function getPendingNudge(input: SourcePrefs = prefs): NudgeFormat | null {
  const recent = Object.values(input.pins)
    .filter(isPinActive)
    .sort((a, b) => b.pinnedAt - a.pinnedAt)
    .slice(0, NUDGE_WINDOW);
  if (recent.length < NUDGE_WINDOW) return null;
  const format = recent[0].format;
  if (!recent.every(p => p.format === format)) return null;
  if (format === 'unknown') return null;
  if (format === input.preference) return null;
  if (input.nudgeAnswers[format] !== undefined) return null;
  return format;
}

export function subscribeSourcePrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function pinTimestamp(pin: SourcePin): number {
  return Math.max(pin.pinnedAt, pin.deletedAt ?? 0);
}

/** Latest-wins per field; see Global Constraints for the exact rules. */
export function mergeSourcePrefs(local: SourcePrefs, remote: SourcePrefs): SourcePrefs {
  const preferenceFrom = remote.preferenceSetAt > local.preferenceSetAt ? remote : local;

  const pins: Record<string, SourcePin> = { ...local.pins };
  for (const [date, pin] of Object.entries(remote.pins)) {
    const existing = pins[date];
    if (!existing || pinTimestamp(pin) > pinTimestamp(existing)) pins[date] = pin;
  }

  const nudgeAnswers: SourcePrefs['nudgeAnswers'] = { ...local.nudgeAnswers };
  for (const [format, answer] of Object.entries(remote.nudgeAnswers) as [RecordingFormat, NudgeAnswer][]) {
    if (nudgeAnswers[format] === 'yes' || answer === undefined) continue;
    nudgeAnswers[format] = answer === 'yes' ? 'yes' : (nudgeAnswers[format] ?? answer);
  }

  return {
    preference: preferenceFrom.preference,
    preferenceSetAt: preferenceFrom.preferenceSetAt,
    pins,
    nudgeAnswers,
  };
}

export function pruneSourcePrefsTombstones(input: SourcePrefs, now: number = Date.now()): SourcePrefs {
  const pins = Object.fromEntries(
    Object.entries(input.pins).filter(([, pin]) =>
      isPinActive(pin) || now - (pin.deletedAt ?? 0) < TOMBSTONE_RETENTION_MS
    )
  );
  return { ...input, pins };
}

/** Tolerant parse of a stored/cloud blob: unknown fields dropped, bad values defaulted. */
export function normalizeSourcePrefs(input: unknown): SourcePrefs {
  if (!input || typeof input !== 'object') return { ...EMPTY_SOURCE_PREFS };
  const raw = input as Record<string, unknown>;

  const preference = typeof raw.preference === 'string' && PREFERENCES.has(raw.preference)
    ? (raw.preference as SourcePreference)
    : DEFAULT_SOURCE_PREFERENCE;
  const preferenceSetAt = typeof raw.preferenceSetAt === 'number' ? raw.preferenceSetAt : 0;

  const pins: Record<string, SourcePin> = {};
  if (raw.pins && typeof raw.pins === 'object') {
    for (const [date, value] of Object.entries(raw.pins as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const p = value as Record<string, unknown>;
      if (typeof p.identifier !== 'string' || typeof p.pinnedAt !== 'number') continue;
      if (typeof p.format !== 'string' || !FORMATS.has(p.format)) continue;
      const pin: SourcePin = { identifier: p.identifier, format: p.format as RecordingFormat, pinnedAt: p.pinnedAt };
      if (typeof p.deletedAt === 'number') pin.deletedAt = p.deletedAt;
      pins[date] = pin;
    }
  }

  const nudgeAnswers: SourcePrefs['nudgeAnswers'] = {};
  if (raw.nudgeAnswers && typeof raw.nudgeAnswers === 'object') {
    for (const [format, answer] of Object.entries(raw.nudgeAnswers as Record<string, unknown>)) {
      if (FORMATS.has(format) && (answer === 'yes' || answer === 'no')) {
        nudgeAnswers[format as RecordingFormat] = answer;
      }
    }
  }

  return { preference, preferenceSetAt, pins, nudgeAnswers };
}

export function resetStoreForTests(): void {
  prefs = { ...EMPTY_SOURCE_PREFS };
  version = 0;
  listeners.clear();
}
