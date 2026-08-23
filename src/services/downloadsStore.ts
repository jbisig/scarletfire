/**
 * Module-level store for offline downloads: the persisted manifest (which
 * shows/tracks are on disk and their status) plus volatile per-track byte
 * progress. Deliberately NOT a React context so the download engine,
 * archiveApi and the player can read it synchronously; DownloadsContext
 * wraps it for React subscriptions (same split as sourcePrefsStore).
 *
 * Persistence lives here (not in the context) because the engine mutates
 * state from non-React code. Status changes persist immediately when they
 * are terminal (complete/failed) and are debounced otherwise; progress is
 * never persisted.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/registry';
import { logger } from '../utils/logger';
import type { ShowDetail } from '../types/show.types';
import type { DownloadedShow, DownloadedTrack, DownloadsManifest } from '../types/downloads.types';
import { relativePathFor } from './downloadPaths';

const log = logger.create('Downloads');
const PERSIST_DEBOUNCE_MS = 500;

function emptyManifest(): DownloadsManifest {
  return { version: 1, wifiOnly: true, shows: {} };
}

let manifest: DownloadsManifest = emptyManifest();
let version = 0;
let hydrated = false;
const listeners = new Set<() => void>();
/** identifier → trackId → bytes written so far. Volatile. */
let progress: Record<string, Record<string, number>> = {};
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function notify(): void {
  version++;
  listeners.forEach(l => l());
}

export function subscribeDownloads(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getDownloadsVersion(): number {
  return version;
}

export function getManifest(): DownloadsManifest {
  return manifest;
}

export function isDownloadsHydrated(): boolean {
  return hydrated;
}

// ---------------------------------------------------------------- persistence

export function normalizeManifest(raw: unknown): DownloadsManifest {
  if (!raw || typeof raw !== 'object') return emptyManifest();
  const m = raw as Partial<DownloadsManifest>;
  if (m.version !== 1 || !m.shows || typeof m.shows !== 'object') return emptyManifest();
  const shows: Record<string, DownloadedShow> = {};
  for (const [id, show] of Object.entries(m.shows as Record<string, Partial<DownloadedShow>>)) {
    if (
      show &&
      typeof show === 'object' &&
      show.identifier === id &&
      show.detail &&
      typeof show.detail === 'object' &&
      show.tracks &&
      typeof show.tracks === 'object' &&
      typeof show.requestedAt === 'number'
    ) {
      shows[id] = show as DownloadedShow;
    }
  }
  return { version: 1, wifiOnly: typeof m.wifiOnly === 'boolean' ? m.wifiOnly : true, shows };
}

export async function hydrateDownloads(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS);
    manifest = normalizeManifest(raw ? JSON.parse(raw) : null);
  } catch (error) {
    log.warn('Failed to read downloads manifest; starting empty', error);
    manifest = emptyManifest();
  }
  hydrated = true;
  notify();
}

async function persistNow(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(manifest));
  } catch (error) {
    log.error('Failed to persist downloads manifest', error);
  }
}

// Throttle-like batching, not debounce: the first call in a window schedules
// the write immediately; later calls within PERSIST_DEBOUNCE_MS coalesce
// onto that same pending write instead of each pushing it further out.
function schedulePersist(immediate = false): void {
  if (immediate) {
    void persistNow();
    return;
  }
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistNow();
  }, PERSIST_DEBOUNCE_MS);
}

export function flushDownloadsPersist(): Promise<void> {
  return persistNow();
}

// ---------------------------------------------------------------- factories

export function createDownloadedShow(
  detail: ShowDetail,
  opts: { allowCellular: boolean; now: number },
): DownloadedShow {
  const tracks: Record<string, DownloadedTrack> = {};
  let totalBytes = 0;
  for (const track of detail.tracks) {
    const bytes = track.size ?? 0;
    totalBytes += bytes;
    tracks[track.id] = { relativePath: relativePathFor(detail.identifier, track.id), bytes, status: 'queued' };
  }
  return {
    identifier: detail.identifier,
    date: detail.date,
    title: detail.title,
    venue: detail.venue,
    location: detail.location,
    status: 'queued',
    requestedAt: opts.now,
    totalBytes,
    allowCellular: opts.allowCellular,
    tracks,
    detail,
  };
}

// ---------------------------------------------------------------- reads

export function getDownloadedShow(identifier: string): DownloadedShow | undefined {
  return manifest.shows[identifier];
}

export function listDownloadedShows(): DownloadedShow[] {
  return Object.values(manifest.shows).sort((a, b) => b.requestedAt - a.requestedAt);
}

export function getDownloadedShowDetail(identifier: string): ShowDetail | null {
  return manifest.shows[identifier]?.detail ?? null;
}

/** The complete download for a date, if any — used as an implicit source pin. */
export function getDownloadedIdentifierForDate(date: string): string | null {
  const key = date.slice(0, 10);
  const match = listDownloadedShows().find(s => s.status === 'complete' && s.date.slice(0, 10) === key);
  return match?.identifier ?? null;
}

export function isTrackDownloaded(identifier: string, trackId: string): boolean {
  return manifest.shows[identifier]?.tracks[trackId]?.status === 'complete';
}

export function getWifiOnly(): boolean {
  return manifest.wifiOnly;
}

export function getDownloadedBytesTotal(): number {
  let total = 0;
  for (const show of Object.values(manifest.shows)) {
    for (const track of Object.values(show.tracks)) {
      if (track.status === 'complete') total += track.bytes;
    }
  }
  return total;
}

export interface ShowProgress {
  bytesDownloaded: number;
  totalBytes: number;
  /** 0..1; exactly 1 once the show is complete. */
  fraction: number;
}

export function getShowProgress(identifier: string): ShowProgress {
  const show = manifest.shows[identifier];
  if (!show) return { bytesDownloaded: 0, totalBytes: 0, fraction: 0 };
  let done = 0;
  for (const [trackId, track] of Object.entries(show.tracks)) {
    done += track.status === 'complete' ? track.bytes : (progress[identifier]?.[trackId] ?? 0);
  }
  const totalBytes = show.totalBytes;
  const fraction = show.status === 'complete' ? 1 : totalBytes > 0 ? Math.min(1, done / totalBytes) : 0;
  return { bytesDownloaded: done, totalBytes, fraction };
}

// ---------------------------------------------------------------- writes

export function upsertDownloadedShow(show: DownloadedShow): void {
  manifest = { ...manifest, shows: { ...manifest.shows, [show.identifier]: show } };
  schedulePersist(true);
  notify();
}

export function updateDownloadedShow(
  identifier: string,
  patch: Partial<Omit<DownloadedShow, 'identifier' | 'tracks' | 'detail'>>,
): void {
  const existing = manifest.shows[identifier];
  if (!existing) return;
  manifest = { ...manifest, shows: { ...manifest.shows, [identifier]: { ...existing, ...patch } } };
  schedulePersist(patch.status === 'complete' || patch.status === 'failed');
  notify();
}

export function updateDownloadedTrack(
  identifier: string,
  trackId: string,
  patch: Partial<DownloadedTrack>,
): void {
  const existing = manifest.shows[identifier];
  const track = existing?.tracks[trackId];
  if (!existing || !track) return;
  manifest = {
    ...manifest,
    shows: {
      ...manifest.shows,
      [identifier]: { ...existing, tracks: { ...existing.tracks, [trackId]: { ...track, ...patch } } },
    },
  };
  if ((patch.status === 'complete' || patch.status === 'failed') && progress[identifier]) delete progress[identifier][trackId];
  schedulePersist(patch.status === 'complete' || patch.status === 'failed');
  notify();
}

export function removeDownloadedShow(identifier: string): void {
  if (!manifest.shows[identifier]) return;
  const shows = { ...manifest.shows };
  delete shows[identifier];
  manifest = { ...manifest, shows };
  delete progress[identifier];
  schedulePersist(true);
  notify();
}

export function clearDownloadedShows(): void {
  manifest = { ...manifest, shows: {} };
  progress = {};
  schedulePersist(true);
  notify();
}

export function setWifiOnly(wifiOnly: boolean): void {
  if (manifest.wifiOnly === wifiOnly) return;
  manifest = { ...manifest, wifiOnly };
  schedulePersist(true);
  notify();
}

export function setTrackProgress(identifier: string, trackId: string, bytes: number): void {
  if (!manifest.shows[identifier]) return;
  (progress[identifier] ??= {})[trackId] = bytes;
  notify();
}

/**
 * A downloaded file failed at play time (missing or corrupt). Marks the track
 * and show failed so Retry re-fetches it. Returns false if the track was not
 * a complete download (nothing to do).
 */
export function markTrackFailed(identifier: string, trackId: string): boolean {
  const show = manifest.shows[identifier];
  if (!show || show.tracks[trackId]?.status !== 'complete') return false;
  updateDownloadedTrack(identifier, trackId, { status: 'failed' });
  updateDownloadedShow(identifier, { status: 'failed', error: 'unknown', completedAt: undefined });
  return true;
}

export function resetDownloadsStoreForTests(): void {
  manifest = emptyManifest();
  progress = {};
  version = 0;
  hydrated = false;
  listeners.clear();
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}
