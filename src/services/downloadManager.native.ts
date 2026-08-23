/**
 * Offline download engine. One show at a time (FIFO), two tracks at a time
 * in track order, via expo-file-system/legacy resumable downloads (iOS uses a
 * background URLSession by default, so a show keeps downloading while the
 * app is backgrounded). State lives in downloadsStore; this class owns the
 * queue, the in-flight resumables, the Wi-Fi guard and launch reconciliation.
 */
import type { ShowDetail, Track } from '../types/show.types';
import type { DownloadedShow, DownloadError } from '../types/downloads.types';
import { logger } from '../utils/logger';
import nativeAudioPlayer from './nativeAudioPlayer';
import * as store from './downloadsStore';
import { downloadsRootUri, showDirUri, toAbsoluteUri } from './downloadPaths';
import { getNetworkStatus, startNetworkMonitoring, subscribeNetworkStatus } from './networkStatus';

const log = logger.create('Downloads');

const CONCURRENCY = 2;
const MAX_ATTEMPTS_PER_URL = 3;
// Ladder per URL: attempt, 1s, attempt, 2s, attempt, 4s -> fallback URL. The
// 4s step is the wait between exhausting one URL and starting the next.
const BACKOFF_MS = [1000, 2000, 4000];
const PROGRESS_THROTTLE_MS = 250;

type FS = typeof import('expo-file-system/legacy');
type DownloadResumable = ReturnType<FS['createDownloadResumable']>;
type TrackOutcome = 'complete' | 'failed' | 'cancelled' | 'paused';

// Lazy so the native module isn't touched at import time.
function getFS(): FS {
  return require('expo-file-system/legacy');
}

export class StreamOnlyError extends Error {
  constructor() {
    super('This recording is streaming-only');
    this.name = 'StreamOnlyError';
  }
}

export function classifyDownloadError(error: unknown): DownloadError {
  const msg = (error instanceof Error ? error.message : typeof error === 'string' ? error : '').toLowerCase();
  if (msg.includes('enospc') || msg.includes('no space') || msg.includes('not enough space') || msg.includes('disk full')) {
    return 'disk-full';
  }
  if (
    msg.includes('network') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('connection') ||
    msg.includes('offline') ||
    msg.includes('unreachable')
  ) {
    return 'network';
  }
  if (msg.includes('404') || msg.includes('not found')) return 'not-found';
  return 'unknown';
}

function isOk(status: number): boolean {
  return status >= 200 && status < 300;
}

class DownloadManager {
  readonly isSupported = true;

  private running = false;
  private activeIdentifier: string | null = null;
  /** `${identifier}/${trackId}` → resumable, for pause/cancel. */
  private inFlight = new Map<string, DownloadResumable>();
  private cancelled = new Set<string>();
  /** Shows halted mid-flight by a fatal error (disk full). */
  private halted = new Set<string>();
  private pausedByNetwork = false;
  private networkUnsubscribe: (() => void) | null = null;
  private sleep: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms));

  // ------------------------------------------------------------ public API

  async enqueueShow(detail: ShowDetail, opts: { allowCellular?: boolean } = {}): Promise<void> {
    if (detail.downloadable !== true) throw new StreamOnlyError();
    if (store.getDownloadedShow(detail.identifier)) return;
    store.upsertDownloadedShow(
      store.createDownloadedShow(detail, { allowCellular: opts.allowCellular === true, now: Date.now() }),
    );
    this.kick();
  }

  /** Remove a show (any status): stop its transfers, delete its files and manifest entry. */
  async removeShow(identifier: string): Promise<void> {
    this.cancelled.add(identifier);
    await this.pauseInFlight(identifier);
    store.removeDownloadedShow(identifier);
    await getFS().deleteAsync(showDirUri(identifier), { idempotent: true }).catch(() => {});
    // The worker clears the flag itself for the active show; nothing else will.
    if (this.activeIdentifier !== identifier) this.cancelled.delete(identifier);
  }

  cancelShow(identifier: string): Promise<void> {
    return this.removeShow(identifier);
  }

  async retryShow(identifier: string): Promise<void> {
    const show = store.getDownloadedShow(identifier);
    if (!show || show.status !== 'failed') return;
    for (const [trackId, track] of Object.entries(show.tracks)) {
      if (track.status === 'failed') store.updateDownloadedTrack(identifier, trackId, { status: 'queued' });
    }
    store.updateDownloadedShow(identifier, { status: 'queued', error: undefined });
    this.kick();
  }

  async removeAll(): Promise<void> {
    for (const show of store.listDownloadedShows()) {
      this.cancelled.add(show.identifier);
    }
    const pauses: Promise<unknown>[] = [];
    for (const resumable of this.inFlight.values()) pauses.push(resumable.pauseAsync().catch(() => undefined));
    await Promise.all(pauses);
    store.clearDownloadedShows();
    await getFS().deleteAsync(downloadsRootUri(), { idempotent: true }).catch(() => {});
    for (const id of [...this.cancelled]) {
      if (this.activeIdentifier !== id) this.cancelled.delete(id);
    }
  }

  allowCellular(identifier: string): void {
    const show = store.getDownloadedShow(identifier);
    if (!show) return;
    store.updateDownloadedShow(identifier, {
      allowCellular: true,
      ...(show.status === 'paused' ? { status: 'queued' as const } : {}),
    });
    this.kick();
  }

  setWifiOnly(wifiOnly: boolean): void {
    store.setWifiOnly(wifiOnly);
    if (!wifiOnly) this.resumePaused();
  }

  /**
   * Bring the manifest back in line with the disk after a cold start (the
   * OS may have killed a download mid-show). Then start the worker.
   */
  async reconcileOnLaunch(): Promise<void> {
    const FS = getFS();
    await FS.makeDirectoryAsync(downloadsRootUri(), { intermediates: true }).catch(() => {});
    await nativeAudioPlayer.setExcludedFromBackup(downloadsRootUri()).catch(() => {});

    for (const show of store.listDownloadedShows()) {
      const id = show.identifier;
      const present: string[] = [];
      const missing: string[] = [];
      for (const [trackId, track] of Object.entries(show.tracks)) {
        const info = await FS.getInfoAsync(toAbsoluteUri(track.relativePath));
        (info.exists ? present : missing).push(trackId);
      }
      if (show.status === 'complete' && present.length === 0 && missing.length > 0) {
        // Manifest survived but the files did not (e.g. restored from a
        // backup). Ask before re-downloading hundreds of megabytes.
        store.updateDownloadedShow(id, { status: 'failed', error: 'unknown', completedAt: undefined });
        continue;
      }
      for (const trackId of present) {
        if (show.tracks[trackId].status !== 'complete') store.updateDownloadedTrack(id, trackId, { status: 'complete' });
      }
      for (const trackId of missing) {
        if (show.tracks[trackId].status !== 'queued' && show.status !== 'failed') {
          store.updateDownloadedTrack(id, trackId, { status: 'queued' });
        }
      }
      if (missing.length === 0) {
        if (show.status !== 'complete') {
          store.updateDownloadedShow(id, { status: 'complete', completedAt: Date.now(), error: undefined });
        }
      } else if (show.status !== 'failed') {
        store.updateDownloadedShow(id, { status: 'queued' });
      }
    }

    const entries = await FS.readDirectoryAsync(downloadsRootUri()).catch(() => [] as string[]);
    for (const name of entries) {
      if (!store.getDownloadedShow(name)) {
        await FS.deleteAsync(`${downloadsRootUri()}${name}`, { idempotent: true }).catch(() => {});
      }
    }

    this.start();
  }

  /** Idempotent: start network monitoring and the worker. */
  start(): void {
    startNetworkMonitoring();
    if (!this.networkUnsubscribe) {
      this.networkUnsubscribe = subscribeNetworkStatus(() => this.onNetworkChange());
    }
    this.kick();
  }

  // ------------------------------------------------------------ worker

  private kick(): void {
    void this.runQueue();
  }

  private nextShow(): DownloadedShow | undefined {
    return store
      .listDownloadedShows()
      .filter(s => s.status === 'queued' || s.status === 'downloading')
      .sort((a, b) => a.requestedAt - b.requestedAt)[0];
  }

  /** Wi-Fi guard: connected, and either on Wi-Fi, guard off, or the user okayed cellular for this show. */
  private canProceed(show: DownloadedShow): boolean {
    const net = getNetworkStatus();
    if (!net.isConnected) return false;
    if (store.getWifiOnly() && !net.isWifi && !show.allowCellular) return false;
    return true;
  }

  private resumePaused(): void {
    let resumed = false;
    for (const show of store.listDownloadedShows()) {
      if (show.status === 'paused' && this.canProceed(show)) {
        store.updateDownloadedShow(show.identifier, { status: 'queued' });
        resumed = true;
      }
    }
    if (resumed) this.kick();
  }

  private onNetworkChange(): void {
    const active = this.activeIdentifier ? store.getDownloadedShow(this.activeIdentifier) : undefined;
    if (active && !this.canProceed(active)) {
      this.pausedByNetwork = true;
      void this.pauseInFlight(active.identifier);
      return;
    }
    this.resumePaused();
  }

  private async runQueue(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (;;) {
        const next = this.nextShow();
        if (!next) break;
        if (!this.canProceed(next)) {
          store.updateDownloadedShow(next.identifier, { status: 'paused' });
          continue;
        }
        await this.downloadShow(next);
      }
    } catch (error) {
      log.error('Download worker crashed', error);
    } finally {
      this.running = false;
      this.activeIdentifier = null;
    }
  }

  private async ensureDirectories(identifier: string): Promise<void> {
    const FS = getFS();
    await FS.makeDirectoryAsync(downloadsRootUri(), { intermediates: true }).catch(() => {});
    await nativeAudioPlayer.setExcludedFromBackup(downloadsRootUri()).catch(() => {});
    await FS.makeDirectoryAsync(showDirUri(identifier), { intermediates: true }).catch(() => {});
  }

  private async downloadShow(show: DownloadedShow): Promise<void> {
    const id = show.identifier;
    this.activeIdentifier = id;
    this.pausedByNetwork = false;
    this.halted.delete(id);
    store.updateDownloadedShow(id, { status: 'downloading', error: undefined });
    await this.ensureDirectories(id);

    const pending = show.detail.tracks.filter(t => show.tracks[t.id]?.status !== 'complete');
    const outcomes: TrackOutcome[] = [];
    const worker = async () => {
      for (;;) {
        if (this.cancelled.has(id) || this.halted.has(id) || this.pausedByNetwork) return;
        const track = pending.shift();
        if (!track) return;
        const entry = show.tracks[track.id];
        if (!entry) {
          // Manifest entry missing (e.g. a stale hydrated manifest that
          // disagrees with detail.tracks) — fail the track, never throw.
          this.failTrack(id, track.id, 'unknown');
          outcomes.push('failed');
          continue;
        }
        try {
          outcomes.push(await this.downloadTrack(id, track, entry.relativePath));
        } catch (error) {
          // A sync/async throw here (e.g. from createDownloadResumable)
          // must never escape Promise.all below — that would abandon the
          // show mid-"downloading" with no error and no way to recover it.
          this.failTrack(id, track.id, classifyDownloadError(error));
          outcomes.push('failed');
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    if (this.cancelled.has(id)) {
      this.cancelled.delete(id);
      return;
    }
    const current = store.getDownloadedShow(id);
    if (!current) return;
    if (this.pausedByNetwork || outcomes.includes('paused')) {
      store.updateDownloadedShow(id, { status: 'paused' });
      return;
    }
    const allComplete = !outcomes.includes('failed') && Object.values(current.tracks).every(t => t.status === 'complete');
    if (allComplete) {
      store.updateDownloadedShow(id, { status: 'complete', completedAt: Date.now(), error: undefined });
    } else {
      store.updateDownloadedShow(id, { status: 'failed', error: current.error ?? 'unknown' });
    }
  }

  private async downloadTrack(identifier: string, track: Track, relativePath: string): Promise<TrackOutcome> {
    const FS = getFS();
    const key = `${identifier}/${track.id}`;
    const finalUri = toAbsoluteUri(relativePath);
    const partUri = `${finalUri}.part`;
    const urls = [track.streamUrl];
    if (track.fallbackStreamUrl && track.fallbackStreamUrl !== track.streamUrl) urls.push(track.fallbackStreamUrl);

    let lastError: DownloadError = 'unknown';
    for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
      const url = urls[urlIndex];
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_URL; attempt++) {
        if (this.cancelled.has(identifier)) return 'cancelled';
        if (this.halted.has(identifier)) return 'failed';
        if (this.pausedByNetwork) return 'paused';

        let lastProgressAt = 0;
        try {
          const resumable = FS.createDownloadResumable(
            url,
            partUri,
            { sessionType: FS.FileSystemSessionType.BACKGROUND },
            ({ totalBytesWritten }) => {
              const now = Date.now();
              if (now - lastProgressAt < PROGRESS_THROTTLE_MS) return;
              lastProgressAt = now;
              store.setTrackProgress(identifier, track.id, totalBytesWritten);
            },
          );
          this.inFlight.set(key, resumable);
          const result = await resumable.downloadAsync();
          if (!result) {
            // pauseAsync() resolves downloadAsync with undefined.
            return this.cancelled.has(identifier) ? 'cancelled' : 'paused';
          }
          if (isOk(result.status)) {
            const info = await FS.getInfoAsync(partUri);
            await FS.moveAsync({ from: partUri, to: finalUri });
            const bytes = info.exists && typeof info.size === 'number' && info.size > 0 ? info.size : undefined;
            store.updateDownloadedTrack(identifier, track.id, { status: 'complete', ...(bytes ? { bytes } : {}) });
            return 'complete';
          }
          // archive.org writes the error body to the file; never keep it.
          await FS.deleteAsync(partUri, { idempotent: true }).catch(() => {});
          if (result.status === 404) {
            lastError = 'not-found';
            break; // next URL
          }
          lastError = result.status >= 500 ? 'network' : 'unknown';
        } catch (error) {
          await FS.deleteAsync(partUri, { idempotent: true }).catch(() => {});
          if (this.cancelled.has(identifier)) return 'cancelled';
          if (this.pausedByNetwork) return 'paused';
          lastError = classifyDownloadError(error);
          if (lastError === 'disk-full') {
            this.halted.add(identifier);
            this.failTrack(identifier, track.id, lastError);
            return 'failed';
          }
          log.warn(`Download attempt ${attempt + 1} failed for ${key}`, error);
        } finally {
          this.inFlight.delete(key);
        }
        if (attempt < MAX_ATTEMPTS_PER_URL - 1) await this.sleep(BACKOFF_MS[attempt]);
      }
      const hasMoreUrls = urlIndex < urls.length - 1;
      if (hasMoreUrls && !this.cancelled.has(identifier) && !this.halted.has(identifier) && !this.pausedByNetwork) {
        await this.sleep(BACKOFF_MS[MAX_ATTEMPTS_PER_URL - 1]);
      }
    }
    this.failTrack(identifier, track.id, lastError);
    return 'failed';
  }

  private failTrack(identifier: string, trackId: string, error: DownloadError): void {
    store.updateDownloadedTrack(identifier, trackId, { status: 'failed' });
    // Never let a later, less-severe error downgrade a disk-full show error.
    const current = store.getDownloadedShow(identifier);
    const nextError = current?.error === 'disk-full' ? 'disk-full' : error;
    store.updateDownloadedShow(identifier, { error: nextError });
  }

  private async pauseInFlight(identifier: string): Promise<void> {
    const prefix = `${identifier}/`;
    const pauses: Promise<unknown>[] = [];
    for (const [key, resumable] of this.inFlight) {
      if (key.startsWith(prefix)) pauses.push(resumable.pauseAsync().catch(() => undefined));
    }
    await Promise.all(pauses);
  }

  // ------------------------------------------------------------ test seams

  __setSleepForTests(sleep: (ms: number) => Promise<void>): void {
    this.sleep = sleep;
  }

  __resetForTests(): void {
    this.running = false;
    this.activeIdentifier = null;
    this.inFlight.clear();
    this.cancelled.clear();
    this.halted.clear();
    this.pausedByNetwork = false;
    this.networkUnsubscribe?.();
    this.networkUnsubscribe = null;
    this.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const downloadManager = new DownloadManager();
