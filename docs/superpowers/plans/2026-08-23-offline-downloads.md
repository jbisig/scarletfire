# Offline Downloads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let iOS/Android users download a whole show (one archive.org recording) to the device and play it back offline, with a Wi-Fi-only guard, a Downloads list in the Saved tab, and storage management in Settings.

**Architecture:** A module-level `downloadsStore` (persisted manifest in AsyncStorage + volatile progress, `useSyncExternalStore`-subscribable) is driven by a JS queue engine `downloadManager` built on `expo-file-system/legacy` resumable downloads (iOS background `URLSession` by default). Local files enter the player through exactly one seam, `playbackSource.resolvePlaybackSource`, called from `audioService.convertToNativeTrack`; `Track.streamUrl` is never rewritten and the `isAllowedStreamUrl` guard is untouched. `archiveApi.getShowDetail` falls back to the manifest's `ShowDetail` snapshot when offline, and a downloaded recording acts as an implicit pin in `sourceSelection`.

**Tech Stack:** React Native 0.81 / Expo SDK 54 (prebuild), TypeScript, `expo-file-system/legacy` (19.0.x, already installed), `expo-network` (new), AsyncStorage, Jest (`jest-expo`) + `@testing-library/react-native`, custom native `AudioPlayerModule` (Swift/Kotlin) with an Expo config plugin.

**Spec:** `docs/superpowers/specs/2026-08-23-offline-downloads-design.md`

## Global Constraints

- Native only: every download affordance is gated by `usePlatform().isNative` (or `Platform.OS !== 'web'`); web/Electron get a stub `downloadManager.web.ts` with `isSupported = false`. No changes to `Sidebar`, `DesktopLayout`, `webLinking`.
- Unit of download is a whole show = every audio track of one exact `identifier`; the file downloaded is `track.streamUrl` (the MP3 the player streams), falling back to `track.fallbackStreamUrl`. Never FLAC/SHN.
- Stream-only recordings (`metadata.collection` contains `"stream_only"`) are blocked: `ShowDetail.downloadable !== true` → no download UI, and `enqueueShow` throws `StreamOnlyError`. A missing `downloadable` field never enables downloading.
- `Track.streamUrl` is never rewritten. `src/utils/validateStreamUrl.ts` is not modified. Local URIs come only from `downloadPaths` + manifest data.
- Manifest stores **relative** paths (`downloads/<identifier>/<encodedFileName>`); absolute URIs are joined at read time from `FileSystem.documentDirectory`.
- Persisted key: `STORAGE_KEYS.DOWNLOADS = '@downloads'`; manifest `version: 1`; `wifiOnly` defaults to `true`.
- Queue: one show at a time (FIFO by `requestedAt`), 2 tracks concurrently in track order; per URL up to 3 attempts with 1 s / 2 s / 4 s backoff, then the fallback URL, then `failed`.
- Error codes: `'network' | 'disk-full' | 'not-found' | 'unknown'`.
- All user-facing download copy lives in `src/utils/userFacingError.ts` (`describeDownloadError`) or the component that owns it; strings in this plan are final.
- Tests: colocated in `__tests__/`; run with `npx jest <path>` (never `-v`; use `--verbose`). `npm run typecheck` must stay clean after every task (the `typecheck:web` baseline of 50 errors is pre-existing).
- Commit after every task with a conventional message (`feat(downloads): …`, `test(downloads): …`, `chore(downloads): …`).
- Work on branch `feat/offline-downloads` in the main checkout (worktrees under `.worktrees/` cannot run Jest).

## File structure

| File | Responsibility |
|---|---|
| `src/types/downloads.types.ts` (new) | Manifest types |
| `src/types/show.types.ts` | `Track.size?`, `ShowDetail.downloadable?` |
| `src/types/archive.types.ts` | `ArchiveMetadata.collection` may be a string |
| `src/constants/registry.ts` | `STORAGE_KEYS.DOWNLOADS` |
| `src/utils/formatters.ts` | `formatBytes` |
| `src/utils/userFacingError.ts` | offline branch, `describeDownloadError` |
| `src/services/downloadPaths.ts` (new) | relative ↔ absolute path helpers |
| `src/services/downloadsStore.ts` (new) | manifest store + persistence + progress |
| `src/services/networkStatus.native.ts` / `.web.ts` (new) | sync-readable network state |
| `src/hooks/useNetworkStatus.ts` (new) | React subscription |
| `src/services/playbackSource.ts` (new) | local-vs-remote resolution, failure reporting |
| `src/services/audioService.ts` | export `convertToNativeTrack`, use `resolvePlaybackSource` |
| `src/services/downloadManager.native.ts` / `.web.ts` (new) | queue engine / stub |
| `src/services/archiveApi.ts` | `downloadable`, `size`, offline snapshot fallback |
| `src/services/sourceSelection.ts`, `src/services/recordingResolver.ts` | downloaded recording as implicit pin |
| `src/contexts/PlayerContext.tsx` | single conversion seam, local-failure branch |
| `src/contexts/DownloadsContext.tsx` (new) | provider + hooks |
| `src/components/DownloadButton.tsx` (new) | show-screen button |
| `src/components/DownloadsTab.tsx` (new) | Saved-tab list |
| `src/screens/ShowDetailScreen.tsx`, `src/screens/FavoritesScreen.tsx`, `src/screens/SettingsScreen.tsx` | wiring |
| `App.tsx` | `DownloadsProvider` |
| `src/services/nativeAudioPlayer.native.ts` / `.web.ts`, `src/services/audioPlayerTypes.ts` | `setExcludedFromBackup` |
| `native-modules/ios/AudioPlayerModule.swift` / `.m`, `plugins/audio-player/withAudioPlayerModule.js` | backup exclusion |
| `src/__tests__/setup.ts`, `src/__tests__/mocks/expoFileSystemLegacy.ts` (new) | global mocks |

---

### Task 1: Foundations — types, storage key, `expo-network`, `formatBytes`

**Files:**
- Create: `src/types/downloads.types.ts`
- Modify: `src/types/show.types.ts`, `src/types/archive.types.ts`, `src/constants/registry.ts`, `src/utils/formatters.ts`, `package.json` (via `expo install`)
- Test: `src/utils/__tests__/formatters.bytes.test.ts`

**Interfaces:**
- Produces: `DownloadedShow`, `DownloadedTrack`, `DownloadsManifest`, `ShowDownloadStatus`, `TrackDownloadStatus`, `DownloadError` types; `Track.size?: number`; `ShowDetail.downloadable?: boolean`; `STORAGE_KEYS.DOWNLOADS`; `formatBytes(bytes: number): string`.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/__tests__/formatters.bytes.test.ts
import { formatBytes } from '../formatters';

describe('formatBytes', () => {
  it('formats bytes, KB, MB and GB with one decimal above KB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('2 KB');
    expect(formatBytes(142 * 1024 * 1024)).toBe('142.0 MB');
    expect(formatBytes(1.25 * 1024 * 1024 * 1024)).toBe('1.3 GB');
  });

  it('treats negative or NaN input as zero', () => {
    expect(formatBytes(-5)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/utils/__tests__/formatters.bytes.test.ts`
Expected: FAIL — `formatBytes is not a function` / not exported.

- [ ] **Step 3: Add `formatBytes`, the types, and the storage key**

Append to `src/utils/formatters.ts`:

```ts
/**
 * Human-readable byte count for download sizes: whole KB, one decimal for
 * MB and GB. Used by the Downloads tab, the cellular prompt, and Settings.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes >= KB) return `${Math.round(bytes / KB)} KB`;
  return `${Math.round(bytes)} B`;
}
```

Create `src/types/downloads.types.ts`:

```ts
import type { ShowDetail } from './show.types';

export type ShowDownloadStatus = 'queued' | 'downloading' | 'paused' | 'complete' | 'failed';
export type TrackDownloadStatus = 'queued' | 'complete' | 'failed';
export type DownloadError = 'network' | 'disk-full' | 'not-found' | 'unknown';

export interface DownloadedTrack {
  /** 'downloads/<identifier>/<encodeURIComponent(fileName)>' — joined to documentDirectory at read time. */
  relativePath: string;
  /** Expected size from ArchiveFile.size (0 if unknown); replaced by the actual size on completion. */
  bytes: number;
  status: TrackDownloadStatus;
}

export interface DownloadedShow {
  /** Exact recording, pinned at download time. */
  identifier: string;
  date: string;
  title: string;
  venue?: string;
  location?: string;
  status: ShowDownloadStatus;
  requestedAt: number;
  completedAt?: number;
  /** Sum of track bytes; drives the cellular prompt and the Settings total. */
  totalBytes: number;
  /** The user accepted the cellular prompt for this show. */
  allowCellular: boolean;
  error?: DownloadError;
  /** Keyed by Track.id (the archive file name, unique within an identifier). */
  tracks: Record<string, DownloadedTrack>;
  /** Snapshot so the show screen renders offline. */
  detail: ShowDetail;
}

export interface DownloadsManifest {
  version: 1;
  /** Default true. */
  wifiOnly: boolean;
  shows: Record<string, DownloadedShow>;
}
```

In `src/types/show.types.ts`, add two optional fields:

```ts
export interface ShowDetail {
  identifier: string;
  title: string;
  date: string;
  year: string | number;
  venue?: string;
  location?: string;
  description?: string;
  tracks: Track[];
  allVersions?: RecordingVersion[]; // All available versions for this show
  /**
   * False (or absent) for archive.org "stream_only" items — soundboards and
   * most matrixes, which are streaming-only by arrangement with the band.
   * Only `true` enables the download UI; absent never does.
   */
  downloadable?: boolean;
}

export interface Track {
  id: string; // filename
  title: string;
  duration?: number; // seconds
  format: string;
  streamUrl: string;
  fallbackStreamUrl?: string;   // (keep the existing doc comment)
  trackNumber?: number;
  /** File size in bytes from archive.org metadata, when known. */
  size?: number;
}
```

In `src/types/archive.types.ts`, change `collection?: string[];` to:

```ts
  /** archive.org returns a bare string for single-collection items. */
  collection?: string | string[];
```

In `src/constants/registry.ts`, add to `STORAGE_KEYS` after `SOURCE_PREFS`:

```ts
  /** Offline downloads manifest (local only, never synced) */
  DOWNLOADS: '@downloads',
```

- [ ] **Step 4: Install `expo-network`**

Run: `npx expo install expo-network`
Expected: `package.json` gains `"expo-network": "~8.x"` (the SDK 54 range) and `package-lock.json` updates. No config plugin needed.

- [ ] **Step 5: Run the test and typecheck**

Run: `npx jest src/utils/__tests__/formatters.bytes.test.ts && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/types/downloads.types.ts src/types/show.types.ts src/types/archive.types.ts src/constants/registry.ts src/utils/formatters.ts src/utils/__tests__/formatters.bytes.test.ts package.json package-lock.json
git commit -m "feat(downloads): manifest types, storage key, formatBytes, expo-network"
```

---

### Task 2: `archiveApi.getShowDetail` — `downloadable` flag and `Track.size`

**Files:**
- Modify: `src/services/archiveApi.ts` (`getShowDetail`, ~lines 560–610)
- Test: `src/services/__tests__/archiveApi.getShowDetail.test.ts`

**Interfaces:**
- Produces: `ShowDetail.downloadable` set from `metadata.collection`; `Track.size` from `ArchiveFile.size`.

- [ ] **Step 1: Add failing tests to the existing suite**

Append inside the existing `describe('archiveApi.getShowDetail', …)` block (reuse its `metadataResponse` / `mockFetchOnce` helpers; note `metadataResponse().metadata` has no `collection` by default):

```ts
  it('marks a recording downloadable unless its collection contains stream_only', async () => {
    const aud = metadataResponse();
    aud.metadata = { ...aud.metadata, collection: ['GratefulDead', 'etree'] } as typeof aud.metadata;
    global.fetch = mockFetchOnce(aud) as unknown as typeof fetch;
    expect((await archiveApi.getShowDetail('aud-show')).downloadable).toBe(true);

    const sbd = metadataResponse();
    sbd.metadata = { ...sbd.metadata, collection: ['GratefulDead', 'etree', 'stream_only'] } as typeof sbd.metadata;
    global.fetch = mockFetchOnce(sbd) as unknown as typeof fetch;
    expect((await archiveApi.getShowDetail('sbd-show')).downloadable).toBe(false);
  });

  it('handles a bare-string collection and a missing collection', async () => {
    const single = metadataResponse();
    single.metadata = { ...single.metadata, collection: 'stream_only' } as typeof single.metadata;
    global.fetch = mockFetchOnce(single) as unknown as typeof fetch;
    expect((await archiveApi.getShowDetail('single-show')).downloadable).toBe(false);

    global.fetch = mockFetchOnce(metadataResponse()) as unknown as typeof fetch;
    expect((await archiveApi.getShowDetail('no-collection-show')).downloadable).toBe(true);
  });

  it('carries the archive file size onto each track', async () => {
    const body = metadataResponse();
    body.files[0].size = '5242880';
    global.fetch = mockFetchOnce(body) as unknown as typeof fetch;
    const detail = await archiveApi.getShowDetail('sized-show');
    expect(detail.tracks[0].size).toBe(5242880);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/services/__tests__/archiveApi.getShowDetail.test.ts`
Expected: the three new cases FAIL (`downloadable` is `undefined`, `size` is `undefined`).

- [ ] **Step 3: Implement**

In `getShowDetail`, inside the `map` that builds tracks, add `size` after `trackNumber`:

```ts
            trackNumber: parseInt(file.track || String(index + 1)),
            ...(Number.isFinite(parseInt(file.size, 10)) ? { size: parseInt(file.size, 10) } : {}),
```

After `const { metadata, files } = data;` add:

```ts
      // "stream_only" marks soundboards (and most matrixes) that the band
      // allows archive.org to stream but not to hand out as files. The app
      // enforces this itself — the server only blocks the lossless originals.
      const rawCollection = metadata.collection;
      const collections = Array.isArray(rawCollection)
        ? rawCollection
        : typeof rawCollection === 'string' ? [rawCollection] : [];
      const downloadable = !collections.includes('stream_only');
```

And add `downloadable,` to `baseShowDetail` after `tracks,`.

- [ ] **Step 4: Run tests + typecheck**

Run: `npx jest src/services/__tests__/archiveApi.getShowDetail.test.ts && npm run typecheck`
Expected: all PASS (existing cases unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/services/archiveApi.ts src/services/__tests__/archiveApi.getShowDetail.test.ts
git commit -m "feat(downloads): expose downloadable flag and track sizes from archive metadata"
```

---

### Task 3: `downloadPaths` + the global `expo-file-system/legacy` fake

**Files:**
- Create: `src/services/downloadPaths.ts`, `src/__tests__/mocks/expoFileSystemLegacy.ts`
- Modify: `src/__tests__/setup.ts`
- Test: `src/services/__tests__/downloadPaths.test.ts`

**Interfaces:**
- Produces: `downloadsRootUri(): string`, `showDirUri(identifier): string`, `relativePathFor(identifier, fileName): string`, `toAbsoluteUri(relativePath): string`, `isLocalDownloadUri(uri): boolean`.
- Produces (tests): the fake FS module with `__reset()`, `__files: Map<string,{size:number}>`, `__dirs: Set<string>`, `__tasks: FakeDownloadTask[]`; `documentDirectory = 'file:///mock-documents/'`.

- [ ] **Step 1: Create the fake file system used by every downloads test**

```ts
// src/__tests__/mocks/expoFileSystemLegacy.ts
/**
 * In-memory stand-in for `expo-file-system/legacy`. Registered globally in
 * setup.ts. Downloads do not complete on their own: tests drive each
 * FakeDownloadTask (creation order in `__tasks`) with complete()/fail(),
 * which mirrors how the real module resolves downloadAsync later.
 */
export interface FakeDownloadTask {
  url: string;
  fileUri: string;
  paused: boolean;
  settled: boolean;
  /** Resolve downloadAsync with an HTTP status; 2xx writes a file of `size` bytes, other statuses write a 1-byte error body (like archive.org does). */
  complete(opts?: { status?: number; size?: number }): void;
  /** Reject downloadAsync. */
  fail(error: Error): void;
  /** Emit a progress callback. */
  progress(totalBytesWritten: number, totalBytesExpectedToWrite?: number): void;
}

export function createFakeFileSystem() {
  const documentDirectory = 'file:///mock-documents/';
  const files = new Map<string, { size: number }>();
  const dirs = new Set<string>([documentDirectory]);
  const tasks: FakeDownloadTask[] = [];

  const withSlash = (uri: string) => (uri.endsWith('/') ? uri : `${uri}/`);

  const api = {
    documentDirectory,
    cacheDirectory: 'file:///mock-cache/',
    FileSystemSessionType: { BACKGROUND: 0, FOREGROUND: 1 },
    __files: files,
    __dirs: dirs,
    __tasks: tasks,
    __reset() {
      files.clear();
      dirs.clear();
      dirs.add(documentDirectory);
      tasks.length = 0;
    },
    getInfoAsync: jest.fn(async (uri: string) => {
      const file = files.get(uri);
      if (file) return { exists: true, uri, size: file.size, isDirectory: false, modificationTime: 0 };
      if (dirs.has(withSlash(uri))) return { exists: true, uri, isDirectory: true, modificationTime: 0 };
      return { exists: false, uri, isDirectory: false };
    }),
    makeDirectoryAsync: jest.fn(async (uri: string) => {
      dirs.add(withSlash(uri));
    }),
    deleteAsync: jest.fn(async (uri: string, _opts?: { idempotent?: boolean }) => {
      files.delete(uri);
      const prefix = withSlash(uri);
      for (const key of [...files.keys()]) if (key.startsWith(prefix)) files.delete(key);
      for (const dir of [...dirs]) if (dir === prefix || dir.startsWith(prefix)) dirs.delete(dir);
    }),
    moveAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
      const file = files.get(from);
      if (!file) throw new Error(`ENOENT: ${from}`);
      files.delete(from);
      files.set(to, file);
    }),
    readDirectoryAsync: jest.fn(async (uri: string) => {
      const prefix = withSlash(uri);
      const names = new Set<string>();
      for (const key of files.keys()) if (key.startsWith(prefix)) names.add(key.slice(prefix.length).split('/')[0]);
      for (const dir of dirs) if (dir !== prefix && dir.startsWith(prefix)) names.add(dir.slice(prefix.length).split('/')[0]);
      return [...names];
    }),
    createDownloadResumable: jest.fn(
      (url: string, fileUri: string, _options: unknown, callback?: (p: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void) => {
        let resolve: ((r: unknown) => void) | null = null;
        let reject: ((e: Error) => void) | null = null;
        const task: FakeDownloadTask = {
          url,
          fileUri,
          paused: false,
          settled: false,
          complete({ status = 200, size = 1000 } = {}) {
            files.set(fileUri, { size: status >= 200 && status < 300 ? size : 1 });
            task.settled = true;
            resolve?.({ status, uri: fileUri, headers: {}, mimeType: 'audio/mpeg' });
          },
          fail(error: Error) {
            task.settled = true;
            reject?.(error);
          },
          progress(totalBytesWritten: number, totalBytesExpectedToWrite = 0) {
            callback?.({ totalBytesWritten, totalBytesExpectedToWrite });
          },
        };
        tasks.push(task);
        return {
          downloadAsync: jest.fn(
            () => new Promise((res, rej) => { resolve = res; reject = rej; }),
          ),
          pauseAsync: jest.fn(async () => {
            task.paused = true;
            task.settled = true;
            resolve?.(undefined);
            return { url, fileUri, options: {}, resumeData: undefined };
          }),
          resumeAsync: jest.fn(
            () => new Promise((res, rej) => { task.paused = false; resolve = res; reject = rej; }),
          ),
          savable: jest.fn(() => ({ url, fileUri, options: {}, resumeData: undefined })),
        };
      },
    ),
  };
  return api;
}
```

Register it in `src/__tests__/setup.ts` (after the `expo-av` mock):

```ts
// Mock expo-file-system/legacy with an in-memory fake (see mocks/expoFileSystemLegacy.ts).
// Tests reach the fake via `require('expo-file-system/legacy')` and its `__*` helpers.
jest.mock('expo-file-system/legacy', () =>
  require('./mocks/expoFileSystemLegacy').createFakeFileSystem()
);
```

- [ ] **Step 2: Write the failing `downloadPaths` test**

```ts
// src/services/__tests__/downloadPaths.test.ts
import {
  downloadsRootUri,
  showDirUri,
  relativePathFor,
  toAbsoluteUri,
  isLocalDownloadUri,
} from '../downloadPaths';

describe('downloadPaths', () => {
  it('roots everything under documentDirectory/downloads/', () => {
    expect(downloadsRootUri()).toBe('file:///mock-documents/downloads/');
    expect(showDirUri('gd1977-05-08.aud')).toBe('file:///mock-documents/downloads/gd1977-05-08.aud/');
  });

  it('builds a relative path with the file name URI-encoded and joins it back', () => {
    const rel = relativePathFor('gd1977-05-08.aud', 'gd77-05-08 d1t01.mp3');
    expect(rel).toBe('downloads/gd1977-05-08.aud/gd77-05-08%20d1t01.mp3');
    expect(toAbsoluteUri(rel)).toBe('file:///mock-documents/downloads/gd1977-05-08.aud/gd77-05-08%20d1t01.mp3');
  });

  it('recognises only URIs under the downloads root as local', () => {
    expect(isLocalDownloadUri('file:///mock-documents/downloads/x/y.mp3')).toBe(true);
    expect(isLocalDownloadUri('file:///mock-documents/videos/bg.mp4')).toBe(false);
    expect(isLocalDownloadUri('https://archive.org/download/x/y.mp3')).toBe(false);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest src/services/__tests__/downloadPaths.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `downloadPaths.ts`**

```ts
// src/services/downloadPaths.ts
/**
 * Where downloaded audio lives and how the manifest refers to it.
 *
 * The manifest stores RELATIVE paths because iOS moves the app container
 * (and therefore `documentDirectory`) on every app update; joining at read
 * time keeps old downloads reachable. File names are URI-encoded once so a
 * space or '#' in an archive file name cannot break the file:// URI.
 */

// Lazy require so the native module isn't touched at import time (same
// reason videoDownloadService does it).
function getFileSystem(): typeof import('expo-file-system/legacy') {
  return require('expo-file-system/legacy');
}

const ROOT = 'downloads';

export function downloadsRootUri(): string {
  return `${getFileSystem().documentDirectory}${ROOT}/`;
}

export function showDirUri(identifier: string): string {
  return `${downloadsRootUri()}${identifier}/`;
}

export function relativePathFor(identifier: string, fileName: string): string {
  return `${ROOT}/${identifier}/${encodeURIComponent(fileName)}`;
}

export function toAbsoluteUri(relativePath: string): string {
  return `${getFileSystem().documentDirectory}${relativePath}`;
}

export function isLocalDownloadUri(uri: string): boolean {
  return typeof uri === 'string' && uri.startsWith(downloadsRootUri());
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/services/__tests__/downloadPaths.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/downloadPaths.ts src/services/__tests__/downloadPaths.test.ts src/__tests__/mocks/expoFileSystemLegacy.ts src/__tests__/setup.ts
git commit -m "feat(downloads): download path helpers and a fake expo-file-system for tests"
```

---

### Task 4: `downloadsStore` — manifest, persistence, progress

**Files:**
- Create: `src/services/downloadsStore.ts`
- Test: `src/services/__tests__/downloadsStore.test.ts`

**Interfaces:**
- Consumes: `STORAGE_KEYS.DOWNLOADS`, `relativePathFor` (Task 3), types (Task 1).
- Produces (all named exports):
  - `subscribeDownloads(l: () => void): () => void`, `getDownloadsVersion(): number`, `getManifest(): DownloadsManifest`, `isDownloadsHydrated(): boolean`
  - `hydrateDownloads(): Promise<void>`, `flushDownloadsPersist(): Promise<void>`, `normalizeManifest(raw: unknown): DownloadsManifest`
  - `createDownloadedShow(detail: ShowDetail, opts: { allowCellular: boolean; now: number }): DownloadedShow`
  - reads: `getDownloadedShow(id)`, `listDownloadedShows()` (newest `requestedAt` first), `getDownloadedShowDetail(id): ShowDetail | null`, `getDownloadedIdentifierForDate(date): string | null` (complete shows only), `isTrackDownloaded(id, trackId)`, `getWifiOnly()`, `getDownloadedBytesTotal()`, `getShowProgress(id): { bytesDownloaded; totalBytes; fraction }`
  - writes: `upsertDownloadedShow(show)`, `updateDownloadedShow(id, patch)`, `updateDownloadedTrack(id, trackId, patch)`, `removeDownloadedShow(id)`, `clearDownloadedShows()`, `setWifiOnly(bool)`, `setTrackProgress(id, trackId, bytes)`, `markTrackFailed(id, trackId): boolean`
  - `resetDownloadsStoreForTests()`

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/downloadsStore.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/registry';
import type { ShowDetail } from '../../types/show.types';
import {
  createDownloadedShow,
  clearDownloadedShows,
  flushDownloadsPersist,
  getDownloadedBytesTotal,
  getDownloadedIdentifierForDate,
  getDownloadedShow,
  getDownloadedShowDetail,
  getDownloadsVersion,
  getManifest,
  getShowProgress,
  hydrateDownloads,
  isTrackDownloaded,
  listDownloadedShows,
  markTrackFailed,
  normalizeManifest,
  removeDownloadedShow,
  resetDownloadsStoreForTests,
  setTrackProgress,
  setWifiOnly,
  subscribeDownloads,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../downloadsStore';

function detail(identifier: string, date = '1977-05-08'): ShowDetail {
  return {
    identifier,
    title: `Show ${identifier}`,
    date,
    year: date.slice(0, 4),
    venue: 'Barton Hall',
    location: 'Ithaca, NY',
    downloadable: true,
    tracks: [
      { id: 'd1t01.mp3', title: 'Minglewood', format: 'VBR MP3', streamUrl: 'https://archive.org/download/x/d1t01.mp3', size: 1000 },
      { id: 'd1t02.mp3', title: 'Loser', format: 'VBR MP3', streamUrl: 'https://archive.org/download/x/d1t02.mp3', size: 3000 },
    ],
  };
}

beforeEach(async () => {
  resetDownloadsStoreForTests();
  await AsyncStorage.clear();
});

describe('createDownloadedShow', () => {
  it('snapshots the detail, queues every track with a relative path, and sums sizes', () => {
    const show = createDownloadedShow(detail('aud'), { allowCellular: false, now: 123 });
    expect(show.identifier).toBe('aud');
    expect(show.status).toBe('queued');
    expect(show.requestedAt).toBe(123);
    expect(show.totalBytes).toBe(4000);
    expect(show.allowCellular).toBe(false);
    expect(show.tracks['d1t01.mp3']).toEqual({ relativePath: 'downloads/aud/d1t01.mp3', bytes: 1000, status: 'queued' });
    expect(show.detail.tracks).toHaveLength(2);
  });
});

describe('reads and writes', () => {
  it('upserts, lists newest first, and exposes snapshots', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a', '1977-05-08'), { allowCellular: false, now: 1 }));
    upsertDownloadedShow(createDownloadedShow(detail('b', '1972-08-27'), { allowCellular: true, now: 2 }));
    expect(listDownloadedShows().map(s => s.identifier)).toEqual(['b', 'a']);
    expect(getDownloadedShowDetail('a')?.title).toBe('Show a');
    expect(getDownloadedShowDetail('zzz')).toBeNull();
  });

  it('only treats complete shows as the downloaded recording for a date', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    expect(getDownloadedIdentifierForDate('1977-05-08')).toBeNull();
    updateDownloadedShow('a', { status: 'complete', completedAt: 5 });
    expect(getDownloadedIdentifierForDate('1977-05-08T00:00:00Z')).toBe('a');
    expect(isTrackDownloaded('a', 'd1t01.mp3')).toBe(false);
    updateDownloadedTrack('a', 'd1t01.mp3', { status: 'complete' });
    expect(isTrackDownloaded('a', 'd1t01.mp3')).toBe(true);
  });

  it('computes progress from complete bytes plus in-flight bytes', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    updateDownloadedTrack('a', 'd1t01.mp3', { status: 'complete' });
    setTrackProgress('a', 'd1t02.mp3', 1500);
    expect(getShowProgress('a')).toEqual({ bytesDownloaded: 2500, totalBytes: 4000, fraction: 0.625 });
    updateDownloadedShow('a', { status: 'complete' });
    expect(getShowProgress('a').fraction).toBe(1);
    expect(getShowProgress('nope')).toEqual({ bytesDownloaded: 0, totalBytes: 0, fraction: 0 });
  });

  it('totals only complete tracks, removes and clears', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    upsertDownloadedShow(createDownloadedShow(detail('b'), { allowCellular: false, now: 2 }));
    updateDownloadedTrack('a', 'd1t01.mp3', { status: 'complete', bytes: 1234 });
    expect(getDownloadedBytesTotal()).toBe(1234);
    removeDownloadedShow('a');
    expect(getDownloadedShow('a')).toBeUndefined();
    clearDownloadedShows();
    expect(listDownloadedShows()).toEqual([]);
  });

  it('marks a complete track failed (and the show) when the file is bad at play time', () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    expect(markTrackFailed('a', 'd1t01.mp3')).toBe(false);
    updateDownloadedTrack('a', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedShow('a', { status: 'complete', completedAt: 9 });
    expect(markTrackFailed('a', 'd1t01.mp3')).toBe(true);
    expect(getDownloadedShow('a')?.status).toBe('failed');
    expect(getDownloadedShow('a')?.tracks['d1t01.mp3'].status).toBe('failed');
  });

  it('bumps the version and notifies subscribers on every write', () => {
    const listener = jest.fn();
    subscribeDownloads(listener);
    const before = getDownloadsVersion();
    setWifiOnly(false);
    setWifiOnly(false); // no-op, no notify
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getDownloadsVersion()).toBe(before + 1);
  });
});

describe('persistence', () => {
  it('persists writes and hydrates them back', async () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    setWifiOnly(false);
    await flushDownloadsPersist();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS);
    expect(raw).toContain('"version":1');

    resetDownloadsStoreForTests();
    expect(getManifest().shows).toEqual({});
    await hydrateDownloads();
    expect(getDownloadedShow('a')?.title).toBe('Show a');
    expect(getManifest().wifiOnly).toBe(false);
  });

  it('never persists in-flight progress', async () => {
    upsertDownloadedShow(createDownloadedShow(detail('a'), { allowCellular: false, now: 1 }));
    setTrackProgress('a', 'd1t01.mp3', 500);
    await flushDownloadsPersist();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS);
    expect(raw).not.toContain('500');
  });

  it('treats corrupt or foreign JSON as an empty manifest', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, '{not json');
    await hydrateDownloads();
    expect(getManifest()).toEqual({ version: 1, wifiOnly: true, shows: {} });
    expect(normalizeManifest({ version: 2, shows: {} })).toEqual({ version: 1, wifiOnly: true, shows: {} });
    expect(normalizeManifest({ version: 1, wifiOnly: false, shows: { x: { identifier: 'y' } } }).shows).toEqual({});
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/services/__tests__/downloadsStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the store**

```ts
// src/services/downloadsStore.ts
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

export const EMPTY_MANIFEST: DownloadsManifest = { version: 1, wifiOnly: true, shows: {} };

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
  if (patch.status === 'complete' && progress[identifier]) delete progress[identifier][trackId];
  schedulePersist();
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
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npx jest src/services/__tests__/downloadsStore.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/downloadsStore.ts src/services/__tests__/downloadsStore.test.ts
git commit -m "feat(downloads): manifest store with persistence and progress"
```

---

### Task 5: `networkStatus` service + `useNetworkStatus` hook

**Files:**
- Create: `src/services/networkStatus.native.ts`, `src/services/networkStatus.web.ts`, `src/hooks/useNetworkStatus.ts`
- Modify: `src/__tests__/setup.ts` (expo-network mock)
- Test: `src/services/__tests__/networkStatus.test.ts`

**Interfaces:**
- Produces: `interface NetworkStatus { isConnected: boolean; isWifi: boolean }`; `getNetworkStatus(): NetworkStatus`; `subscribeNetworkStatus(l): () => void`; `startNetworkMonitoring(): void` (idempotent); `applyNetworkState(state: { type?: string; isConnected?: boolean }): void`; `resetNetworkStatusForTests(): void`; hook `useNetworkStatus(): NetworkStatus`.
- Produces (tests): `require('expo-network').__setNetworkState({ type, isConnected })`.

- [ ] **Step 1: Add the expo-network mock to `setup.ts`**

Append after the file-system mock:

```ts
// Mock expo-network: Wi-Fi and connected by default. Tests change it with
// `require('expo-network').__setNetworkState({ type: 'CELLULAR' })`, which
// also fires registered listeners.
jest.mock('expo-network', () => {
  const listeners = new Set<(s: unknown) => void>();
  let state = { type: 'WIFI', isConnected: true, isInternetReachable: true };
  return {
    NetworkStateType: {
      NONE: 'NONE', UNKNOWN: 'UNKNOWN', CELLULAR: 'CELLULAR', WIFI: 'WIFI',
      BLUETOOTH: 'BLUETOOTH', ETHERNET: 'ETHERNET', WIMAX: 'WIMAX', VPN: 'VPN', OTHER: 'OTHER',
    },
    getNetworkStateAsync: jest.fn(async () => state),
    addNetworkStateListener: jest.fn((listener: (s: unknown) => void) => {
      listeners.add(listener);
      return { remove: () => { listeners.delete(listener); } };
    }),
    __setNetworkState(next: Partial<typeof state>) {
      state = { ...state, ...next };
      listeners.forEach(l => l(state));
    },
    __resetNetworkState() {
      state = { type: 'WIFI', isConnected: true, isInternetReachable: true };
      listeners.clear();
    },
  };
});
```

- [ ] **Step 2: Write the failing test**

```ts
// src/services/__tests__/networkStatus.test.ts
import {
  applyNetworkState,
  getNetworkStatus,
  resetNetworkStatusForTests,
  startNetworkMonitoring,
  subscribeNetworkStatus,
} from '../networkStatus';

const ExpoNetwork = require('expo-network');
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  resetNetworkStatusForTests();
  ExpoNetwork.__resetNetworkState();
});

describe('networkStatus', () => {
  it('is optimistic before monitoring starts', () => {
    expect(getNetworkStatus()).toEqual({ isConnected: true, isWifi: true });
  });

  it('maps expo-network state: wifi/ethernet/unknown count as Wi-Fi, cellular does not', () => {
    applyNetworkState({ type: 'CELLULAR', isConnected: true });
    expect(getNetworkStatus()).toEqual({ isConnected: true, isWifi: false });
    applyNetworkState({ type: 'ETHERNET', isConnected: true });
    expect(getNetworkStatus().isWifi).toBe(true);
    applyNetworkState({ type: 'UNKNOWN', isConnected: true });
    expect(getNetworkStatus().isWifi).toBe(true);
    applyNetworkState({ type: 'NONE', isConnected: false });
    expect(getNetworkStatus()).toEqual({ isConnected: false, isWifi: false });
  });

  it('reads the initial state and follows listener events once monitoring starts', async () => {
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    const listener = jest.fn();
    subscribeNetworkStatus(listener);
    startNetworkMonitoring();
    startNetworkMonitoring(); // idempotent
    await flush();
    expect(getNetworkStatus().isWifi).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    ExpoNetwork.__setNetworkState({ type: 'WIFI' });
    expect(getNetworkStatus().isWifi).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(ExpoNetwork.addNetworkStateListener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when nothing changed', () => {
    const listener = jest.fn();
    subscribeNetworkStatus(listener);
    applyNetworkState({ type: 'WIFI', isConnected: true });
    expect(listener).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest src/services/__tests__/networkStatus.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

```ts
// src/services/networkStatus.native.ts
/**
 * Synchronously readable network state for non-React code (the download
 * engine's Wi-Fi guard, archiveApi's offline fallback). Optimistic until the
 * first expo-network read lands so nothing blocks on startup.
 */
import * as Network from 'expo-network';

export interface NetworkStatus {
  isConnected: boolean;
  isWifi: boolean;
}

let status: NetworkStatus = { isConnected: true, isWifi: true };
const listeners = new Set<() => void>();
let subscription: { remove: () => void } | null = null;

const WIFI_LIKE = new Set<string>([
  Network.NetworkStateType.WIFI,
  Network.NetworkStateType.ETHERNET,
  // Cannot prove cellular — don't hold downloads hostage to an unknown type.
  Network.NetworkStateType.UNKNOWN,
]);

export function getNetworkStatus(): NetworkStatus {
  return status;
}

export function subscribeNetworkStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function applyNetworkState(state: { type?: string; isConnected?: boolean }): void {
  const isConnected = state.isConnected !== false;
  const isWifi = isConnected && WIFI_LIKE.has(state.type ?? Network.NetworkStateType.UNKNOWN);
  if (status.isConnected === isConnected && status.isWifi === isWifi) return;
  status = { isConnected, isWifi };
  listeners.forEach(l => l());
}

/** Idempotent: first call reads the current state and subscribes to changes. */
export function startNetworkMonitoring(): void {
  if (subscription) return;
  subscription = Network.addNetworkStateListener(applyNetworkState);
  Network.getNetworkStateAsync().then(applyNetworkState).catch(() => {});
}

export function resetNetworkStatusForTests(): void {
  status = { isConnected: true, isWifi: true };
  listeners.clear();
  subscription?.remove();
  subscription = null;
}
```

```ts
// src/services/networkStatus.web.ts
/** Web/Electron: downloads are unsupported, so the app is always "online on Wi-Fi". */
export interface NetworkStatus {
  isConnected: boolean;
  isWifi: boolean;
}

const ALWAYS_ONLINE: NetworkStatus = { isConnected: true, isWifi: true };

export function getNetworkStatus(): NetworkStatus {
  return ALWAYS_ONLINE;
}

export function subscribeNetworkStatus(_listener: () => void): () => void {
  return () => {};
}

export function applyNetworkState(_state: { type?: string; isConnected?: boolean }): void {}

export function startNetworkMonitoring(): void {}

export function resetNetworkStatusForTests(): void {}
```

```ts
// src/hooks/useNetworkStatus.ts
import { useEffect, useSyncExternalStore } from 'react';
import {
  getNetworkStatus,
  NetworkStatus,
  startNetworkMonitoring,
  subscribeNetworkStatus,
} from '../services/networkStatus';

/** `{ isConnected, isWifi }`, live. Starts monitoring on first use. */
export function useNetworkStatus(): NetworkStatus {
  useEffect(() => { startNetworkMonitoring(); }, []);
  return useSyncExternalStore(subscribeNetworkStatus, getNetworkStatus, getNetworkStatus);
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/services/__tests__/networkStatus.test.ts && npm run typecheck`
Expected: PASS. (Jest resolves `../networkStatus` to the `.native.ts` variant via the jest-expo preset.)

- [ ] **Step 6: Commit**

```bash
git add src/services/networkStatus.native.ts src/services/networkStatus.web.ts src/hooks/useNetworkStatus.ts src/services/__tests__/networkStatus.test.ts src/__tests__/setup.ts
git commit -m "feat(downloads): network status service and hook"
```

---

### Task 6: `playbackSource` + single conversion seam in `audioService`

**Files:**
- Create: `src/services/playbackSource.ts`
- Modify: `src/services/audioService.ts`
- Test: `src/services/__tests__/playbackSource.test.ts`, `src/services/__tests__/audioService.convert.test.ts`

**Interfaces:**
- Consumes: `isTrackDownloaded`, `getDownloadedShow`, `markTrackFailed` (Task 4), `toAbsoluteUri` (Task 3).
- Produces: `interface PlaybackSource { url: string; fallbackUrl?: string; isLocal: boolean }`; `resolvePlaybackSource(identifier: string | undefined, track: Track): PlaybackSource`; `reportLocalPlaybackFailure(identifier: string, trackId: string): boolean`; `audioService.ts` now exports `convertToNativeTrack(track: Track, show?: ShowDetail): NativeTrack`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/playbackSource.test.ts
import type { Track } from '../../types/show.types';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../downloadsStore';
import { reportLocalPlaybackFailure, resolvePlaybackSource } from '../playbackSource';

const track: Track = {
  id: 'd1t01.mp3',
  title: 'Minglewood',
  format: 'VBR MP3',
  streamUrl: 'https://ia600106.us.archive.org/1/items/aud/d1t01.mp3',
  fallbackStreamUrl: 'https://archive.org/download/aud/d1t01.mp3',
};

beforeEach(() => {
  resetDownloadsStoreForTests();
  upsertDownloadedShow(createDownloadedShow(
    { identifier: 'aud', title: 't', date: '1977-05-08', year: '1977', downloadable: true, tracks: [track] },
    { allowCellular: false, now: 1 },
  ));
});

describe('resolvePlaybackSource', () => {
  it('streams when the track is not downloaded', () => {
    expect(resolvePlaybackSource('aud', track)).toEqual({
      url: track.streamUrl,
      fallbackUrl: track.fallbackStreamUrl,
      isLocal: false,
    });
    expect(resolvePlaybackSource(undefined, track).isLocal).toBe(false);
  });

  it('plays the local file with the remote stream as fallback once downloaded', () => {
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    expect(resolvePlaybackSource('aud', track)).toEqual({
      url: 'file:///mock-documents/downloads/aud/d1t01.mp3',
      fallbackUrl: track.streamUrl,
      isLocal: true,
    });
  });
});

describe('reportLocalPlaybackFailure', () => {
  it('marks a complete track failed and reports true; false otherwise', () => {
    expect(reportLocalPlaybackFailure('aud', 'd1t01.mp3')).toBe(false);
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedShow('aud', { status: 'complete' });
    expect(reportLocalPlaybackFailure('aud', 'd1t01.mp3')).toBe(true);
    expect(resolvePlaybackSource('aud', track).isLocal).toBe(false);
  });
});
```

```ts
// src/services/__tests__/audioService.convert.test.ts
jest.mock('../nativeAudioPlayer', () => {
  const actual = jest.requireActual('../audioPlayerTypes');
  return {
    __esModule: true,
    default: { setupPlayer: jest.fn(), setQueue: jest.fn(), addTrack: jest.fn() },
    State: actual.State,
    Event: actual.Event,
  };
});

import type { ShowDetail, Track } from '../../types/show.types';
import { convertToNativeTrack, appIconUri } from '../audioService';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../downloadsStore';

const track: Track = { id: 'd1t01.mp3', title: 'Minglewood', format: 'VBR MP3', duration: 300, streamUrl: 'https://archive.org/download/aud/d1t01.mp3' };
const show: ShowDetail = { identifier: 'aud', title: 't', date: '1977-05-08', year: '1977', venue: 'Barton Hall', downloadable: true, tracks: [track] };

beforeEach(() => resetDownloadsStoreForTests());

describe('convertToNativeTrack', () => {
  it('uses the stream URL and show venue by default', () => {
    expect(convertToNativeTrack(track, show)).toEqual({
      id: 'd1t01.mp3',
      url: track.streamUrl,
      title: 'Minglewood',
      artist: 'Barton Hall',
      duration: 300,
      artwork: appIconUri,
    });
    expect(convertToNativeTrack(track).artist).toBe('Grateful Dead');
  });

  it('swaps in the local file when the track is downloaded', () => {
    upsertDownloadedShow(createDownloadedShow(show, { allowCellular: false, now: 1 }));
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    expect(convertToNativeTrack(track, show).url).toBe('file:///mock-documents/downloads/aud/d1t01.mp3');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/services/__tests__/playbackSource.test.ts src/services/__tests__/audioService.convert.test.ts`
Expected: FAIL — `playbackSource` not found; `convertToNativeTrack` not exported.

- [ ] **Step 3: Implement `playbackSource.ts`**

```ts
// src/services/playbackSource.ts
/**
 * The ONE place a local file path enters the player. Everything else keeps
 * `Track.streamUrl` as the remote URL (favorites, collections, cloud sync,
 * and the cross-user `isAllowedStreamUrl` guard all rely on that).
 */
import type { Track } from '../types/show.types';
import { getDownloadedShow, isTrackDownloaded, markTrackFailed } from './downloadsStore';
import { toAbsoluteUri } from './downloadPaths';

export interface PlaybackSource {
  url: string;
  /** What to try if `url` fails: the remote stream for a local file, the durable /download URL otherwise. */
  fallbackUrl?: string;
  isLocal: boolean;
}

export function resolvePlaybackSource(identifier: string | undefined, track: Track): PlaybackSource {
  if (identifier && isTrackDownloaded(identifier, track.id)) {
    const entry = getDownloadedShow(identifier)?.tracks[track.id];
    if (entry) {
      return { url: toAbsoluteUri(entry.relativePath), fallbackUrl: track.streamUrl, isLocal: true };
    }
  }
  return { url: track.streamUrl, fallbackUrl: track.fallbackStreamUrl, isLocal: false };
}

/**
 * Called from the player's error path. If the failing track was playing from
 * a downloaded file, mark it failed (so Retry re-fetches it) and return true —
 * the caller then reloads, which now resolves to streaming.
 */
export function reportLocalPlaybackFailure(identifier: string, trackId: string): boolean {
  return markTrackFailed(identifier, trackId);
}
```

- [ ] **Step 4: Export and reroute `convertToNativeTrack` in `audioService.ts`**

Replace the private function with:

```ts
import { resolvePlaybackSource } from './playbackSource';

/**
 * Convert our Track format to the native player's Track format. Downloaded
 * tracks resolve to their local file here — the only seam where that happens.
 */
export function convertToNativeTrack(track: Track, show?: ShowDetail): NativeTrack {
  const source = resolvePlaybackSource(show?.identifier, track);
  return {
    id: track.id,
    url: source.url,
    title: track.title,
    artist: show?.venue || 'Grateful Dead',
    duration: track.duration,
    artwork: appIconUri,
  };
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/services/__tests__/playbackSource.test.ts src/services/__tests__/audioService.convert.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/playbackSource.ts src/services/audioService.ts src/services/__tests__/playbackSource.test.ts src/services/__tests__/audioService.convert.test.ts
git commit -m "feat(downloads): resolve local playback sources at the native-track seam"
```

---

### Task 7: `downloadManager` — queue engine core (enqueue, worker, retry ladder, cancel)

**Files:**
- Create: `src/services/downloadManager.native.ts`, `src/services/downloadManager.web.ts`
- Modify: `src/services/nativeAudioPlayer.native.ts`, `src/services/nativeAudioPlayer.web.ts`, `src/services/audioPlayerTypes.ts` (add `setExcludedFromBackup(uri: string): Promise<void>` — JS side only; native implementation comes in Task 16)
- Test: `src/services/__tests__/downloadManager.core.test.ts`

**Interfaces:**
- Consumes: store (Task 4), paths (Task 3), `getNetworkStatus`/`subscribeNetworkStatus`/`startNetworkMonitoring` (Task 5).
- Produces: `class StreamOnlyError extends Error`; `classifyDownloadError(error: unknown): DownloadError`; `downloadManager` singleton with `isSupported: boolean`, `enqueueShow(detail: ShowDetail, opts?: { allowCellular?: boolean }): Promise<void>`, `removeShow(identifier): Promise<void>`, `cancelShow(identifier): Promise<void>` (alias of `removeShow`), `retryShow(identifier): Promise<void>`, `removeAll(): Promise<void>`, `allowCellular(identifier): void`, `setWifiOnly(bool): void`, `reconcileOnLaunch(): Promise<void>`, `start(): void`, `__setSleepForTests(fn)`, `__resetForTests()`. (Wi-Fi gating, `reconcileOnLaunch`, `removeAll`, `allowCellular`, `setWifiOnly` are implemented in Task 8 — declare them here as stubs that throw `new Error('implemented in Task 8')` so the interface is stable.)

- [ ] **Step 1: Add `setExcludedFromBackup` to the player bridge (JS no-op for now)**

`src/services/audioPlayerTypes.ts` — add to `NativeAudioPlayerInterface` after `showCastDialog()`:

```ts
  /** iOS: mark a directory as excluded from iCloud backup. No-op elsewhere. */
  setExcludedFromBackup(uri: string): Promise<void>;
```

`src/services/nativeAudioPlayer.native.ts` — add to the class after `showCastDialog`:

```ts
  async setExcludedFromBackup(uri: string): Promise<void> {
    if (Platform.OS !== 'ios' || typeof AudioPlayerModule.setExcludedFromBackup !== 'function') {
      return;
    }
    return AudioPlayerModule.setExcludedFromBackup(uri);
  }
```

`src/services/nativeAudioPlayer.web.ts` — add to the class after `showCastDialog`:

```ts
  async setExcludedFromBackup(_uri: string): Promise<void> {}
```

- [ ] **Step 2: Write the failing core tests**

```ts
// src/services/__tests__/downloadManager.core.test.ts
jest.mock('../nativeAudioPlayer', () => ({
  __esModule: true,
  default: { setExcludedFromBackup: jest.fn().mockResolvedValue(undefined) },
}));

import type { ShowDetail } from '../../types/show.types';
import {
  getDownloadedShow,
  getShowProgress,
  resetDownloadsStoreForTests,
} from '../downloadsStore';
import { downloadManager, StreamOnlyError, classifyDownloadError } from '../downloadManager';
import { resetNetworkStatusForTests } from '../networkStatus';

const FS = require('expo-file-system/legacy');
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };

function detail(identifier = 'aud', trackCount = 3, downloadable = true): ShowDetail {
  return {
    identifier,
    title: 'Cornell',
    date: '1977-05-08',
    year: '1977',
    venue: 'Barton Hall',
    downloadable,
    tracks: Array.from({ length: trackCount }, (_, i) => ({
      id: `d1t0${i + 1}.mp3`,
      title: `Track ${i + 1}`,
      format: 'VBR MP3',
      streamUrl: `https://ia600106.us.archive.org/1/items/${identifier}/d1t0${i + 1}.mp3`,
      fallbackStreamUrl: `https://archive.org/download/${identifier}/d1t0${i + 1}.mp3`,
      size: 1000,
    })),
  };
}

beforeEach(() => {
  FS.__reset();
  resetDownloadsStoreForTests();
  resetNetworkStatusForTests();
  downloadManager.__resetForTests();
  downloadManager.__setSleepForTests(async () => {});
});

describe('enqueueShow', () => {
  it('rejects stream-only recordings', async () => {
    await expect(downloadManager.enqueueShow(detail('sbd', 2, false))).rejects.toBeInstanceOf(StreamOnlyError);
    expect(getDownloadedShow('sbd')).toBeUndefined();
  });

  it('downloads two tracks at a time in order, then completes the show', async () => {
    await downloadManager.enqueueShow(detail());
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
    expect(FS.__tasks.map((t: { url: string }) => t.url)).toEqual([
      'https://ia600106.us.archive.org/1/items/aud/d1t01.mp3',
      'https://ia600106.us.archive.org/1/items/aud/d1t02.mp3',
    ]);
    expect(FS.__tasks[0].fileUri).toBe('file:///mock-documents/downloads/aud/d1t01.mp3.part');

    FS.__tasks[0].progress(400);
    expect(getShowProgress('aud').bytesDownloaded).toBe(400);

    FS.__tasks[0].complete({ size: 1000 });
    await flush();
    expect(FS.__tasks).toHaveLength(3);
    expect(getDownloadedShow('aud')?.tracks['d1t01.mp3'].status).toBe('complete');
    expect(FS.__files.has('file:///mock-documents/downloads/aud/d1t01.mp3')).toBe(true);
    expect(FS.__files.has('file:///mock-documents/downloads/aud/d1t01.mp3.part')).toBe(false);

    FS.__tasks[1].complete();
    FS.__tasks[2].complete();
    await flush();
    const show = getDownloadedShow('aud')!;
    expect(show.status).toBe('complete');
    expect(show.completedAt).toEqual(expect.any(Number));
    expect(getShowProgress('aud').fraction).toBe(1);
  });

  it('ignores a second enqueue of the same identifier', async () => {
    await downloadManager.enqueueShow(detail('aud', 1));
    await downloadManager.enqueueShow(detail('aud', 1));
    await flush();
    expect(FS.__tasks).toHaveLength(1);
  });

  it('queues a second show behind the first', async () => {
    await downloadManager.enqueueShow(detail('first', 1));
    await downloadManager.enqueueShow(detail('second', 1));
    await flush();
    expect(FS.__tasks).toHaveLength(1);
    FS.__tasks[0].complete();
    await flush();
    expect(FS.__tasks[1].url).toContain('/second/');
  });
});

describe('failure ladder', () => {
  it('falls back to the /download URL on 404 and completes', async () => {
    await downloadManager.enqueueShow(detail('aud', 1));
    await flush();
    FS.__tasks[0].complete({ status: 404 });
    await flush();
    expect(FS.__tasks[1].url).toBe('https://archive.org/download/aud/d1t01.mp3');
    expect(FS.__files.has('file:///mock-documents/downloads/aud/d1t01.mp3.part')).toBe(false);
    FS.__tasks[1].complete();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('complete');
  });

  it('retries 3 times per URL then fails the track and the show', async () => {
    await downloadManager.enqueueShow(detail('aud', 1));
    for (let i = 0; i < 6; i++) {
      await flush();
      FS.__tasks[i].fail(new Error('Network request failed'));
    }
    await flush();
    expect(FS.__tasks).toHaveLength(6);
    const show = getDownloadedShow('aud')!;
    expect(show.status).toBe('failed');
    expect(show.error).toBe('network');
    expect(show.tracks['d1t01.mp3'].status).toBe('failed');
  });

  it('keeps completed tracks when a later one fails, and retryShow only refetches the failed one', async () => {
    await downloadManager.enqueueShow(detail('aud', 2));
    await flush();
    FS.__tasks[0].complete();
    await flush();
    for (let i = 0; i < 6; i++) {
      await flush();
      FS.__tasks[1 + i].complete({ status: 500 });
    }
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('failed');
    expect(getDownloadedShow('aud')?.tracks['d1t01.mp3'].status).toBe('complete');

    const before = FS.__tasks.length;
    await downloadManager.retryShow('aud');
    await flush();
    expect(FS.__tasks).toHaveLength(before + 1);
    expect(FS.__tasks[before].url).toContain('d1t02.mp3');
    FS.__tasks[before].complete();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('complete');
  });

  it('stops the show immediately on disk-full', async () => {
    await downloadManager.enqueueShow(detail('aud', 3));
    await flush();
    FS.__tasks[0].fail(new Error('No space left on device (ENOSPC)'));
    await flush();
    FS.__tasks[1].complete();
    await flush();
    const show = getDownloadedShow('aud')!;
    expect(show.status).toBe('failed');
    expect(show.error).toBe('disk-full');
    expect(FS.__tasks).toHaveLength(2); // third track never started
  });
});

describe('removeShow / cancelShow', () => {
  it('pauses in-flight tasks, deletes the directory and the manifest entry', async () => {
    await downloadManager.enqueueShow(detail('aud', 2));
    await flush();
    FS.__tasks[0].complete();
    await flush();
    await downloadManager.cancelShow('aud');
    await flush();
    expect(FS.__tasks[1].paused).toBe(true);
    expect(getDownloadedShow('aud')).toBeUndefined();
    expect([...FS.__files.keys()].some(k => k.includes('/downloads/aud/'))).toBe(false);
    expect(FS.__dirs.has('file:///mock-documents/downloads/aud/')).toBe(false);
  });
});

describe('classifyDownloadError', () => {
  it('maps messages to error codes', () => {
    expect(classifyDownloadError(new Error('No space left on device'))).toBe('disk-full');
    expect(classifyDownloadError(new Error('ENOSPC'))).toBe('disk-full');
    expect(classifyDownloadError(new Error('Network request failed'))).toBe('network');
    expect(classifyDownloadError(new Error('The request timed out'))).toBe('network');
    expect(classifyDownloadError(new Error('something else'))).toBe('unknown');
    expect(classifyDownloadError('nope')).toBe('unknown');
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest src/services/__tests__/downloadManager.core.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the engine core**

```ts
// src/services/downloadManager.native.ts
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
    throw new Error('implemented in Task 8');
  }

  allowCellular(_identifier: string): void {
    throw new Error('implemented in Task 8');
  }

  setWifiOnly(_wifiOnly: boolean): void {
    throw new Error('implemented in Task 8');
  }

  async reconcileOnLaunch(): Promise<void> {
    throw new Error('implemented in Task 8');
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

  /** Wi-Fi guard — replaced with the real rule in Task 8. */
  private canProceed(_show: DownloadedShow): boolean {
    return true;
  }

  private onNetworkChange(): void {
    // Implemented in Task 8.
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
        outcomes.push(await this.downloadTrack(id, track, show.tracks[track.id].relativePath));
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
    const allComplete = Object.values(current.tracks).every(t => t.status === 'complete');
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
    for (const url of urls) {
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_URL; attempt++) {
        if (this.cancelled.has(identifier)) return 'cancelled';
        if (this.halted.has(identifier)) return 'failed';
        if (this.pausedByNetwork) return 'paused';

        let lastProgressAt = 0;
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
        try {
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
    }
    this.failTrack(identifier, track.id, lastError);
    return 'failed';
  }

  private failTrack(identifier: string, trackId: string, error: DownloadError): void {
    store.updateDownloadedTrack(identifier, trackId, { status: 'failed' });
    store.updateDownloadedShow(identifier, { error });
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
```

```ts
// src/services/downloadManager.web.ts
/** Web/Electron: no filesystem downloads. Every method is a safe no-op. */
import type { ShowDetail } from '../types/show.types';
import type { DownloadError } from '../types/downloads.types';

export class StreamOnlyError extends Error {
  constructor() {
    super('This recording is streaming-only');
    this.name = 'StreamOnlyError';
  }
}

export function classifyDownloadError(_error: unknown): DownloadError {
  return 'unknown';
}

class DownloadManager {
  readonly isSupported = false;
  async enqueueShow(_detail: ShowDetail, _opts: { allowCellular?: boolean } = {}): Promise<void> {}
  async removeShow(_identifier: string): Promise<void> {}
  async cancelShow(_identifier: string): Promise<void> {}
  async retryShow(_identifier: string): Promise<void> {}
  async removeAll(): Promise<void> {}
  allowCellular(_identifier: string): void {}
  setWifiOnly(_wifiOnly: boolean): void {}
  async reconcileOnLaunch(): Promise<void> {}
  start(): void {}
  __setSleepForTests(_sleep: (ms: number) => Promise<void>): void {}
  __resetForTests(): void {}
}

export const downloadManager = new DownloadManager();
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/services/__tests__/downloadManager.core.test.ts && npm run typecheck`
Expected: PASS (all 10 cases). If the "retries 3 times" case hangs, confirm `__setSleepForTests` was applied in `beforeEach` — the real backoff would take 21 s.

- [ ] **Step 6: Commit**

```bash
git add src/services/downloadManager.native.ts src/services/downloadManager.web.ts src/services/nativeAudioPlayer.native.ts src/services/nativeAudioPlayer.web.ts src/services/audioPlayerTypes.ts src/services/__tests__/downloadManager.core.test.ts
git commit -m "feat(downloads): queue engine with retry ladder, cancel and retry"
```

---

### Task 8: `downloadManager` — Wi-Fi guard, reconcile on launch, remove-all

**Files:**
- Modify: `src/services/downloadManager.native.ts`
- Test: `src/services/__tests__/downloadManager.network.test.ts`

**Interfaces:**
- Produces: real implementations of `allowCellular`, `setWifiOnly`, `removeAll`, `reconcileOnLaunch` (declared in Task 7). `reconcileOnLaunch` ends by calling `start()`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/__tests__/downloadManager.network.test.ts
jest.mock('../nativeAudioPlayer', () => ({
  __esModule: true,
  default: { setExcludedFromBackup: jest.fn().mockResolvedValue(undefined) },
}));

import type { ShowDetail } from '../../types/show.types';
import {
  createDownloadedShow,
  getDownloadedShow,
  getManifest,
  listDownloadedShows,
  resetDownloadsStoreForTests,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../downloadsStore';
import { downloadManager } from '../downloadManager';
import { resetNetworkStatusForTests } from '../networkStatus';

const FS = require('expo-file-system/legacy');
const ExpoNetwork = require('expo-network');
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };

function detail(identifier = 'aud', trackCount = 2): ShowDetail {
  return {
    identifier,
    title: 'Cornell',
    date: '1977-05-08',
    year: '1977',
    downloadable: true,
    tracks: Array.from({ length: trackCount }, (_, i) => ({
      id: `d1t0${i + 1}.mp3`,
      title: `Track ${i + 1}`,
      format: 'VBR MP3',
      streamUrl: `https://archive.org/download/${identifier}/d1t0${i + 1}.mp3`,
      size: 1000,
    })),
  };
}

beforeEach(async () => {
  FS.__reset();
  ExpoNetwork.__resetNetworkState();
  resetDownloadsStoreForTests();
  resetNetworkStatusForTests();
  downloadManager.__resetForTests();
  downloadManager.__setSleepForTests(async () => {});
  downloadManager.start();
  await flush();
});

describe('Wi-Fi guard', () => {
  it('pauses a new show on cellular when wifiOnly is on, and resumes on Wi-Fi', async () => {
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await downloadManager.enqueueShow(detail());
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('paused');
    expect(FS.__tasks).toHaveLength(0);

    ExpoNetwork.__setNetworkState({ type: 'WIFI' });
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
    expect(FS.__tasks).toHaveLength(2);
  });

  it('lets a show with allowCellular through, and allowCellular() unblocks a paused one', async () => {
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await downloadManager.enqueueShow(detail('ok'), { allowCellular: true });
    await downloadManager.enqueueShow(detail('blocked'));
    await flush();
    expect(getDownloadedShow('ok')?.status).toBe('downloading');
    FS.__tasks[0].complete();
    FS.__tasks[1].complete();
    await flush();
    expect(getDownloadedShow('ok')?.status).toBe('complete');
    expect(getDownloadedShow('blocked')?.status).toBe('paused');

    downloadManager.allowCellular('blocked');
    await flush();
    expect(getDownloadedShow('blocked')?.allowCellular).toBe(true);
    expect(getDownloadedShow('blocked')?.status).toBe('downloading');
  });

  it('pauses the active show when the network drops to cellular and re-queues it on Wi-Fi', async () => {
    await downloadManager.enqueueShow(detail('aud', 3));
    await flush();
    FS.__tasks[0].complete();
    await flush();
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await flush();
    expect(FS.__tasks[1].paused).toBe(true);
    expect(getDownloadedShow('aud')?.status).toBe('paused');
    expect(getDownloadedShow('aud')?.tracks['d1t01.mp3'].status).toBe('complete');

    ExpoNetwork.__setNetworkState({ type: 'WIFI' });
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
    // Only the two unfinished tracks restart.
    expect(FS.__tasks.slice(3).map((t: { url: string }) => t.url)).toEqual([
      'https://archive.org/download/aud/d1t02.mp3',
      'https://archive.org/download/aud/d1t03.mp3',
    ]);
  });

  it('treats no connection like cellular-with-guard (paused until connected)', async () => {
    ExpoNetwork.__setNetworkState({ type: 'NONE', isConnected: false });
    await downloadManager.enqueueShow(detail('aud'), { allowCellular: true });
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('paused');
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR', isConnected: true });
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
  });

  it('setWifiOnly(false) resumes paused shows and persists the setting', async () => {
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    await downloadManager.enqueueShow(detail());
    await flush();
    downloadManager.setWifiOnly(false);
    await flush();
    expect(getManifest().wifiOnly).toBe(false);
    expect(getDownloadedShow('aud')?.status).toBe('downloading');
  });
});

describe('reconcileOnLaunch', () => {
  it('marks present files complete, re-queues missing ones, and restarts the worker', async () => {
    const show = createDownloadedShow(detail('aud', 2), { allowCellular: false, now: 1 });
    upsertDownloadedShow({ ...show, status: 'downloading' });
    FS.__files.set('file:///mock-documents/downloads/aud/d1t01.mp3', { size: 1000 });
    await downloadManager.reconcileOnLaunch();
    await flush();
    const after = getDownloadedShow('aud')!;
    expect(after.tracks['d1t01.mp3'].status).toBe('complete');
    expect(after.status).toBe('downloading');
    expect(FS.__tasks.map((t: { url: string }) => t.url)).toEqual(['https://archive.org/download/aud/d1t02.mp3']);
  });

  it('completes a show whose files are all present', async () => {
    const show = createDownloadedShow(detail('aud', 1), { allowCellular: false, now: 1 });
    upsertDownloadedShow({ ...show, status: 'queued' });
    FS.__files.set('file:///mock-documents/downloads/aud/d1t01.mp3', { size: 1000 });
    await downloadManager.reconcileOnLaunch();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('complete');
    expect(FS.__tasks).toHaveLength(0);
  });

  it('fails a complete show with no files on disk instead of silently re-downloading', async () => {
    const show = createDownloadedShow(detail('aud', 2), { allowCellular: false, now: 1 });
    upsertDownloadedShow(show);
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedTrack('aud', 'd1t02.mp3', { status: 'complete' });
    updateDownloadedShow('aud', { status: 'complete', completedAt: 2 });
    await downloadManager.reconcileOnLaunch();
    await flush();
    expect(getDownloadedShow('aud')?.status).toBe('failed');
    expect(FS.__tasks).toHaveLength(0);
  });

  it('deletes orphan directories and leaves failed shows alone', async () => {
    FS.__dirs.add('file:///mock-documents/downloads/orphan/');
    FS.__files.set('file:///mock-documents/downloads/orphan/x.mp3', { size: 1 });
    const show = createDownloadedShow(detail('bad', 1), { allowCellular: false, now: 1 });
    upsertDownloadedShow({ ...show, status: 'failed', error: 'network' });
    await downloadManager.reconcileOnLaunch();
    await flush();
    expect(FS.__dirs.has('file:///mock-documents/downloads/orphan/')).toBe(false);
    expect(FS.__files.has('file:///mock-documents/downloads/orphan/x.mp3')).toBe(false);
    expect(getDownloadedShow('bad')?.status).toBe('failed');
    expect(FS.__tasks).toHaveLength(0);
  });
});

describe('removeAll', () => {
  it('stops everything, clears the manifest and deletes the downloads directory', async () => {
    await downloadManager.enqueueShow(detail('a', 1));
    await downloadManager.enqueueShow(detail('b', 1));
    await flush();
    await downloadManager.removeAll();
    await flush();
    expect(listDownloadedShows()).toEqual([]);
    expect(FS.__tasks[0].paused).toBe(true);
    expect(FS.__dirs.has('file:///mock-documents/downloads/')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/services/__tests__/downloadManager.network.test.ts`
Expected: FAIL — `implemented in Task 8` errors and paused/downloading mismatches.

- [ ] **Step 3: Replace the Task 7 stubs**

In `downloadManager.native.ts`, replace the four stub methods and the two placeholder private methods:

```ts
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
```

```ts
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
```

- [ ] **Step 4: Run both engine suites + typecheck**

Run: `npx jest src/services/__tests__/downloadManager.core.test.ts src/services/__tests__/downloadManager.network.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/downloadManager.native.ts src/services/__tests__/downloadManager.network.test.ts
git commit -m "feat(downloads): Wi-Fi guard, launch reconciliation and remove-all"
```

---

### Task 9: Offline snapshot fallback in `archiveApi` + downloaded recording as implicit pin

**Files:**
- Modify: `src/services/archiveApi.ts` (`getShowDetail`), `src/services/sourceSelection.ts` (`resolveForDate`), `src/services/recordingResolver.ts` (`ResolvedVia` union)
- Test: `src/services/__tests__/archiveApi.getShowDetail.test.ts`, `src/services/__tests__/sourceSelection.test.ts`

**Interfaces:**
- Consumes: `getDownloadedShowDetail`, `getDownloadedIdentifierForDate` (Task 4); `getNetworkStatus` (Task 5).
- Produces: `ResolvedVia` gains `'downloaded'`; `resolveForDate` returns `{ identifier, via: 'downloaded' }` when a complete download exists for the date and no user pin does.

- [ ] **Step 1: Add failing tests**

Append to `archiveApi.getShowDetail.test.ts` (add the imports at the top of the file with the others):

```ts
import { createDownloadedShow, resetDownloadsStoreForTests, upsertDownloadedShow } from '../downloadsStore';
import { applyNetworkState, resetNetworkStatusForTests } from '../networkStatus';
```

and the cases (inside the main `describe`; also add `resetDownloadsStoreForTests(); resetNetworkStatusForTests();` to its `beforeEach`):

```ts
  it('serves the downloaded snapshot without a network call when offline', async () => {
    const snapshot = { identifier: 'offline-show', title: 'Snap', date: '1977-05-08', year: '1977', downloadable: true, tracks: [] };
    upsertDownloadedShow(createDownloadedShow(snapshot, { allowCellular: false, now: 1 }));
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    applyNetworkState({ type: 'NONE', isConnected: false });

    const detail = await archiveApi.getShowDetail('offline-show');
    expect(detail.title).toBe('Snap');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('falls back to the downloaded snapshot when the fetch fails online', async () => {
    const snapshot = { identifier: 'flaky-show', title: 'Snap', date: '1977-05-08', year: '1977', downloadable: true, tracks: [] };
    upsertDownloadedShow(createDownloadedShow(snapshot, { allowCellular: false, now: 1 }));
    // A 404 fails fast (fetchWithRetry only backs off on 5xx/network errors,
    // which would add 3 s of real sleeps to this test).
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }) as unknown as typeof fetch;

    const detail = await archiveApi.getShowDetail('flaky-show');
    expect(detail.title).toBe('Snap');
  });

  it('still throws for non-downloaded shows when the fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }) as unknown as typeof fetch;
    await expect(archiveApi.getShowDetail('nope-show')).rejects.toThrow('Failed to fetch show details: HTTP 404');
  });
```

Append to `sourceSelection.test.ts` (add the imports at the top):

```ts
import { createDownloadedShow, resetDownloadsStoreForTests, updateDownloadedShow, upsertDownloadedShow } from '../downloadsStore';
```

and inside `describe('resolveForDate', …)` (add `resetDownloadsStoreForTests()` to the file's `beforeEach`):

```ts
  it('treats a complete download for the date as a pin, below a real user pin', () => {
    upsertDownloadedShow(createDownloadedShow(
      { identifier: 'aud', title: 'Cornell', date: '1977-05-08', year: '1977', downloadable: true, tracks: [] },
      { allowCellular: false, now: 1 },
    ));
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'mtx', via: 'popular' }); // not complete yet
    updateDownloadedShow('aud', { status: 'complete', completedAt: 2 });
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'aud', via: 'downloaded' });
    expect(resolveForDate('1977-05-08', { ignoreUserPin: true })).toEqual({ identifier: 'mtx', via: 'popular' });
    setPin('1977-05-08', 'betty', 'sbd', 3);
    expect(resolveForDate('1977-05-08')).toEqual({ identifier: 'betty', via: 'user-pin' });
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/services/__tests__/archiveApi.getShowDetail.test.ts src/services/__tests__/sourceSelection.test.ts`
Expected: the new cases FAIL.

- [ ] **Step 3: Implement the archiveApi fallback**

Add imports to `archiveApi.ts`:

```ts
import { getDownloadedShowDetail } from './downloadsStore';
import { getNetworkStatus } from './networkStatus';
```

In `getShowDetail`, after the Tier 2 block (`if (persisted) {…}`) and before `// Cache miss - fetch fresh data`:

```ts
    // Tier 3: a downloaded show carries its own ShowDetail snapshot, so it
    // opens with no network at all — and survives a flaky fetch below.
    const snapshot = getDownloadedShowDetail(identifier);
    if (snapshot && !getNetworkStatus().isConnected) {
      return snapshot;
    }
```

And change the final `catch` to:

```ts
    } catch (error) {
      if (snapshot) {
        logger.api.warn('Show detail fetch failed; serving downloaded snapshot', error);
        return snapshot;
      }
      this.handleError(error, 'Failed to fetch show details');
    }
```

- [ ] **Step 4: Implement the implicit pin**

In `recordingResolver.ts`, find the `ResolvedVia` type (near line 30) and add `'downloaded'` to the union, e.g.:

```ts
export type ResolvedVia = 'user-pin' | 'downloaded' | 'editorial' | 'filter' | 'preference' | 'popular';
```

(Keep the existing members exactly; only insert `'downloaded'`. If the union is written differently, add the member in place.)

In `sourceSelection.ts`, import `getDownloadedIdentifierForDate` from `./downloadsStore` and change `resolveForDate`:

```ts
export function resolveForDate(date: string, opts: SelectionOptions = {}): ResolvedRecording | null {
  const key = date.slice(0, 10);
  const versions = getCatalogVersions(key);
  if (versions.length === 0) {
    return opts.fallbackIdentifier ? { identifier: opts.fallbackIdentifier, via: 'popular' } : null;
  }
  const userPin = opts.ignoreUserPin ? undefined : getActivePin(key)?.identifier;
  // A recording on disk is the one the user expects to hear (and the only
  // one that plays offline). It ranks just below an explicit pin.
  if (!userPin && !opts.ignoreUserPin) {
    const downloaded = getDownloadedIdentifierForDate(key);
    if (downloaded && versions.some(v => v.identifier === downloaded)) {
      return { identifier: downloaded, via: 'downloaded' };
    }
  }
  return resolveRecording(versions, {
    preference: getSourcePrefs().preference,
    userPinIdentifier: userPin,
    editorialPinIdentifier: editorialPins[key],
    sessionConstraint: opts.sessionConstraint,
  });
}
```

- [ ] **Step 5: Run tests + typecheck; fix any exhaustive `via` switches the typecheck flags**

Run: `npx jest src/services/__tests__/archiveApi.getShowDetail.test.ts src/services/__tests__/sourceSelection.test.ts src/services/__tests__/recordingResolver.test.ts && npm run typecheck`
Expected: PASS; typecheck clean. If `tsc` reports a `Record<ResolvedVia, …>` missing `'downloaded'`, add an entry with the same value as `'user-pin'`.

- [ ] **Step 6: Commit**

```bash
git add src/services/archiveApi.ts src/services/sourceSelection.ts src/services/recordingResolver.ts src/services/__tests__/archiveApi.getShowDetail.test.ts src/services/__tests__/sourceSelection.test.ts
git commit -m "feat(downloads): serve downloaded snapshots offline and prefer the downloaded recording"
```

---

### Task 10: PlayerContext — one conversion seam + local-file failure branch

**Files:**
- Modify: `src/contexts/PlayerContext.tsx` (radio replenish ~line 637, radio start ~line 997, shuffle song ~line 1055, shuffle show ~line 1108, PlaybackError handler ~lines 548–605)
- Test: `src/contexts/__tests__/PlayerContext.localPlayback.test.tsx`

**Interfaces:**
- Consumes: `convertToNativeTrack` (Task 6), `reportLocalPlaybackFailure` (Task 6).

- [ ] **Step 1: Write the failing test**

```tsx
// src/contexts/__tests__/PlayerContext.localPlayback.test.tsx
//
// A downloaded file that fails at play time must be reported to the downloads
// store and reloaded (which now resolves to streaming) WITHOUT burning the
// direct→/download fallback attempt or invalidating the cached show.

type Handler = (data: unknown) => void;
const mockEventHandlers = new Map<string, Handler[]>();

jest.mock('../../services/nativeAudioPlayer', () => {
  const actual = jest.requireActual('../../services/audioPlayerTypes');
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn((event: string, handler: Handler) => {
        const list = mockEventHandlers.get(event) ?? [];
        list.push(handler);
        mockEventHandlers.set(event, list);
        return { remove: jest.fn() };
      }),
      setupPlayer: jest.fn(),
      addTrack: jest.fn(),
      setQueue: jest.fn(),
      reset: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      seekTo: jest.fn(),
      skipToNext: jest.fn(),
      skipToPrevious: jest.fn(),
      setExcludedFromBackup: jest.fn(),
    },
    State: actual.State,
    Event: actual.Event,
  };
});

jest.mock('../PlayCountsContext', () => ({
  usePlayCounts: () => ({ recordTrackPlay: jest.fn() }),
}));

jest.mock('../../services/videoDownloadService', () => ({
  videoDownloadService: { startDeferredDownloads: jest.fn() },
}));

const mockLoadTrack = jest.fn().mockResolvedValue(undefined);
jest.mock('../../services/audioService', () => ({
  audioService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    loadTrack: (...args: unknown[]) => mockLoadTrack(...args),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
  },
  appIconUri: 'test://icon',
  convertToNativeTrack: (track: { id: string; streamUrl: string; title: string }) => ({
    id: track.id, url: track.streamUrl, title: track.title, artwork: 'test://icon',
  }),
}));

const mockInvalidate = jest.fn();
jest.mock('../../services/archiveApi', () => ({
  archiveApi: {
    invalidateShowDetail: (...args: unknown[]) => mockInvalidate(...args),
    getShowDetail: jest.fn(),
    getCachedShowDetail: jest.fn().mockReturnValue(null),
  },
}));

jest.mock('../../services/sourceSelection', () => ({
  resolveShowIdentifier: (show: { primaryIdentifier: string }) => show.primaryIdentifier,
}));

const mockReportLocalFailure = jest.fn();
jest.mock('../../services/playbackSource', () => ({
  reportLocalPlaybackFailure: (...args: unknown[]) => mockReportLocalFailure(...args),
}));

jest.mock('../ToastContext', () => ({
  useOptionalToast: () => ({ showToast: jest.fn() }),
}));

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { PlayerProvider, usePlayer } from '../PlayerContext';
import { Event } from '../../services/audioPlayerTypes';
import type { Track, ShowDetail } from '../../types/show.types';

const show: ShowDetail = { identifier: 'aud', title: 'aud', date: '1977-05-08', year: '1977', tracks: [] };
const track: Track = {
  id: 't1',
  title: 't1',
  format: 'VBR MP3',
  streamUrl: 'https://ia600106.us.archive.org/1/items/aud/t1.mp3',
  fallbackStreamUrl: 'https://archive.org/download/aud/t1.mp3',
};

let probeApi: ReturnType<typeof usePlayer> | null = null;
function Probe() {
  probeApi = usePlayer();
  return <Text testID="id">{probeApi.state.currentTrack?.id ?? 'none'}</Text>;
}

function emitPlaybackError() {
  (mockEventHandlers.get(Event.PlaybackError) ?? []).forEach(h => h({ error: 'decode failed' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEventHandlers.clear();
  probeApi = null;
});

it('reloads the same track after a local-file failure without using the stream fallback', async () => {
  mockReportLocalFailure.mockReturnValueOnce(true);
  const { getByTestId } = render(<PlayerProvider><Probe /></PlayerProvider>);
  await act(async () => { await probeApi!.loadTrack(track, show, [track]); });
  await waitFor(() => expect(getByTestId('id').props.children).toBe('t1'));
  const before = mockLoadTrack.mock.calls.length;

  await act(async () => { emitPlaybackError(); });

  await waitFor(() => expect(mockLoadTrack.mock.calls.length).toBeGreaterThan(before));
  expect(mockReportLocalFailure).toHaveBeenCalledWith('aud', 't1');
  expect(mockInvalidate).not.toHaveBeenCalled();
  const [reloaded] = mockLoadTrack.mock.calls[mockLoadTrack.mock.calls.length - 1];
  expect(reloaded.streamUrl).toBe(track.streamUrl); // unchanged — not the /download fallback
  expect(probeApi!.state.loadError).toBeNull();
});

it('falls through to the normal stream fallback when the track was not local', async () => {
  mockReportLocalFailure.mockReturnValue(false);
  render(<PlayerProvider><Probe /></PlayerProvider>);
  await act(async () => { await probeApi!.loadTrack(track, show, [track]); });
  await act(async () => { emitPlaybackError(); });
  await waitFor(() => expect(mockInvalidate).toHaveBeenCalledWith('aud'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/contexts/__tests__/PlayerContext.localPlayback.test.tsx`
Expected: first case FAILS (`mockReportLocalFailure` never called; `mockInvalidate` called).

- [ ] **Step 3: Route the inline conversions through `convertToNativeTrack`**

Update the import in `PlayerContext.tsx`:

```ts
import { audioService, convertToNativeTrack } from '../services/audioService';
import { reportLocalPlaybackFailure } from '../services/playbackSource';
```

Remove `appIconUri` from that import if nothing else in the file uses it after the edits below (search the file; `tsc` will tell you).

Radio replenish (~line 637) — replace the inline object:

```ts
            for (const radioTrack of newTracks) {
              await nativeAudioPlayer.addTrack(convertToNativeTrack(radioTrack.track, radioTrack.show));
            }
```

Radio start (~line 997):

```ts
      const nativeTracks = initialTracks.map(rt => convertToNativeTrack(rt.track, rt.show));
```

Shuffle song (~line 1055):

```ts
        const nativeTrack = convertToNativeTrack(track, showDetail);
```

Shuffle show (~line 1108):

```ts
        const nativeTracks = validTracks.map(t => convertToNativeTrack(t, showDetail));
```

- [ ] **Step 4: Add the local-failure branch to the PlaybackError handler**

In the `Event.PlaybackError` effect, directly after `if (!track || !show) return;` and **before** `const surfaceFailure = …`, insert:

```ts
      // A downloaded file that won't play (deleted, truncated, corrupt):
      // mark it so Retry re-fetches it, then reload — the conversion seam
      // now resolves this track to streaming. Not a stream failure, so the
      // direct→/download ladder below is left untouched.
      if (reportLocalPlaybackFailure(show.identifier, track.id)) {
        logger.player.warn('Downloaded file failed to play; falling back to streaming', data?.error);
        const playlist = playlistRef.current.length > 0 ? playlistRef.current : [track];
        loadTrackImplRef.current(track, show, playlist);
        return;
      }
```

Also in the radio early-return branch at the top of the same handler, before `dispatch({ type: 'SET_BUFFERING', isBuffering: false });`, add:

```ts
        const radioTrack = currentTrackRef.current;
        const radioShow = currentShowRef.current;
        if (radioTrack && radioShow) reportLocalPlaybackFailure(radioShow.identifier, radioTrack.id);
```

- [ ] **Step 5: Run the PlayerContext suites + typecheck**

Run: `npx jest src/contexts/__tests__/PlayerContext.localPlayback.test.tsx src/contexts/__tests__/PlayerContext.streamFallback.test.tsx src/contexts/__tests__/PlayerContext.renderTopology.test.tsx src/contexts/__tests__/PlayerContext.loadShuffleShow.test.tsx src/contexts/__tests__/PlayerContext.radioQueueOffset.test.tsx && npm run typecheck`
Expected: PASS. The pre-existing suites mock `audioService` without `convertToNativeTrack`; if one fails with `convertToNativeTrack is not a function`, add the same `convertToNativeTrack` stub shown in Step 1 to that suite's `jest.mock('../../services/audioService', …)` factory. (These suites are load-sensitive — re-run in isolation before treating a timeout as a regression.)

- [ ] **Step 6: Commit**

```bash
git add src/contexts/PlayerContext.tsx src/contexts/__tests__/
git commit -m "feat(downloads): play downloaded files through one conversion seam with local-failure fallback"
```

---

### Task 11: User-facing copy — offline load errors and download errors

**Files:**
- Modify: `src/utils/userFacingError.ts`, `src/screens/ShowDetailScreen.tsx` (catch in `loadShowDetail`, ~line 445), `src/contexts/PlayerContext.tsx` (`surfaceFailure` toast in the `PlaybackError` handler)
- Test: `src/utils/__tests__/userFacingError.downloads.test.ts`

**Interfaces:**
- Produces: `describeLoadError(err, subject?, opts?: { offline?: boolean }): string` (new optional third arg); `describeDownloadError(error?: DownloadError): string`.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/__tests__/userFacingError.downloads.test.ts
import { describeDownloadError, describeLoadError } from '../userFacingError';

describe('describeLoadError offline branch', () => {
  it('names the Downloads list when the device is offline', () => {
    expect(describeLoadError(new Error('Network request failed'), 'this show', { offline: true })).toBe(
      "You're offline. Downloaded shows are in Saved → Downloads.",
    );
  });

  it('keeps the existing copy when online', () => {
    expect(describeLoadError(new Error('Network request failed'))).toBe(
      "Couldn't reach archive.org. Check your connection and try again.",
    );
    expect(describeLoadError(new Error('HTTP 404'), 'this show', { offline: false })).toBe(
      "This recording isn't on archive.org anymore.",
    );
  });
});

describe('describeDownloadError', () => {
  it('maps each error code to copy', () => {
    expect(describeDownloadError('disk-full')).toBe('Not enough space on this device.');
    expect(describeDownloadError('not-found')).toBe("This recording isn't on archive.org anymore.");
    expect(describeDownloadError('network')).toBe("Couldn't reach archive.org. Check your connection and try again.");
    expect(describeDownloadError('unknown')).toBe("Couldn't download this show.");
    expect(describeDownloadError(undefined)).toBe("Couldn't download this show.");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/utils/__tests__/userFacingError.downloads.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Change the signature and add the branch at the top of `describeLoadError`:

```ts
import type { DownloadError } from '../types/downloads.types';

export function describeLoadError(
  err: unknown,
  subject: string = 'this show',
  opts: { offline?: boolean } = {},
): string {
  // Offline is a device state, not an archive.org state: say where the
  // music that *does* work lives.
  if (opts.offline) {
    return "You're offline. Downloaded shows are in Saved → Downloads.";
  }
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  // … (rest unchanged)
```

Append:

```ts
/** Copy for a failed offline download, keyed by the engine's error code. */
export function describeDownloadError(error?: DownloadError): string {
  switch (error) {
    case 'disk-full':
      return 'Not enough space on this device.';
    case 'not-found':
      return "This recording isn't on archive.org anymore.";
    case 'network':
      return "Couldn't reach archive.org. Check your connection and try again.";
    default:
      return "Couldn't download this show.";
  }
}
```

- [ ] **Step 4: Wire the offline flag at both callers**

`src/screens/ShowDetailScreen.tsx` — add `import { getNetworkStatus } from '../services/networkStatus';` and change the `loadShowDetail` catch (~line 445):

```ts
      setError(describeLoadError(err, 'this show', { offline: !getNetworkStatus().isConnected }));
```

`src/contexts/PlayerContext.tsx` — add `import { getNetworkStatus } from '../services/networkStatus';` and change the toast inside `surfaceFailure` in the `PlaybackError` handler:

```ts
        toastRef.current?.showToast(
          describeLoadError(data?.error, 'that track', { offline: !getNetworkStatus().isConnected }),
          'error',
        );
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/utils/__tests__/ src/contexts/__tests__/PlayerContext.streamFallback.test.tsx && npm run typecheck`
Expected: PASS (existing `userFacingError` cases unaffected; the stream-fallback suite still sees the online copy because the global expo-network mock reports connected).

- [ ] **Step 6: Commit**

```bash
git add src/utils/userFacingError.ts src/utils/__tests__/userFacingError.downloads.test.ts src/screens/ShowDetailScreen.tsx src/contexts/PlayerContext.tsx
git commit -m "feat(downloads): offline and download error copy"
```

---

### Task 12: `DownloadsContext` — provider, hooks, App wiring

**Files:**
- Create: `src/contexts/DownloadsContext.tsx`
- Modify: `App.tsx`
- Test: `src/contexts/__tests__/DownloadsContext.test.tsx`

**Interfaces:**
- Consumes: store (Task 4), `downloadManager` (Tasks 7–8), `startNetworkMonitoring` (Task 5).
- Produces:
  - `DownloadsProvider`
  - `useDownloadsVersion(): number`
  - `useShowDownload(identifier?: string): { entry: DownloadedShow | undefined; progress: ShowProgress }`
  - `useDownloads(): DownloadedShow[]`
  - `useDownloadSettings(): { wifiOnly: boolean; totalBytes: number; showCount: number }`
  - `useDownloadActions(): DownloadActions` (throws outside provider), `useOptionalDownloadActions(): DownloadActions | undefined`
  - `interface DownloadActions { isSupported: boolean; enqueueShow(detail: ShowDetail, opts?: { allowCellular?: boolean }): Promise<void>; cancelShow(id): Promise<void>; retryShow(id): Promise<void>; removeShow(id): Promise<void>; removeAll(): Promise<void>; allowCellular(id): void; setWifiOnly(v: boolean): void }`

- [ ] **Step 1: Write the failing test**

```tsx
// src/contexts/__tests__/DownloadsContext.test.tsx
const mockManager = {
  isSupported: true,
  enqueueShow: jest.fn().mockResolvedValue(undefined),
  cancelShow: jest.fn().mockResolvedValue(undefined),
  retryShow: jest.fn().mockResolvedValue(undefined),
  removeShow: jest.fn().mockResolvedValue(undefined),
  removeAll: jest.fn().mockResolvedValue(undefined),
  allowCellular: jest.fn(),
  setWifiOnly: jest.fn(),
  reconcileOnLaunch: jest.fn().mockResolvedValue(undefined),
  start: jest.fn(),
};
jest.mock('../../services/downloadManager', () => ({ downloadManager: mockManager }));

import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/registry';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../../services/downloadsStore';
import {
  DownloadsProvider,
  useDownloadActions,
  useDownloads,
  useDownloadSettings,
  useShowDownload,
} from '../DownloadsContext';

const detail = {
  identifier: 'aud', title: 'Cornell', date: '1977-05-08', year: '1977', downloadable: true,
  tracks: [{ id: 'd1t01.mp3', title: 'x', format: 'VBR MP3', streamUrl: 'https://archive.org/download/aud/d1t01.mp3', size: 100 }],
};

function Probe() {
  const { entry, progress } = useShowDownload('aud');
  const all = useDownloads();
  const settings = useDownloadSettings();
  const actions = useDownloadActions();
  return (
    <>
      <Text testID="status">{entry?.status ?? 'none'}</Text>
      <Text testID="fraction">{String(progress.fraction)}</Text>
      <Text testID="count">{String(all.length)}</Text>
      <Text testID="wifi">{String(settings.wifiOnly)}</Text>
      <Text testID="bytes">{String(settings.totalBytes)}</Text>
      <Text testID="supported">{String(actions.isSupported)}</Text>
    </>
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  resetDownloadsStoreForTests();
  await AsyncStorage.clear();
});

it('hydrates the manifest on mount, then reconciles', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify({ version: 1, wifiOnly: false, shows: {} }));
  const { getByTestId } = render(<DownloadsProvider><Probe /></DownloadsProvider>);
  await waitFor(() => expect(getByTestId('wifi').props.children).toBe('false'));
  await waitFor(() => expect(mockManager.reconcileOnLaunch).toHaveBeenCalledTimes(1));
});

it('re-renders subscribers as the store changes', async () => {
  const { getByTestId } = render(<DownloadsProvider><Probe /></DownloadsProvider>);
  await waitFor(() => expect(mockManager.reconcileOnLaunch).toHaveBeenCalled());
  expect(getByTestId('status').props.children).toBe('none');

  act(() => { upsertDownloadedShow(createDownloadedShow(detail, { allowCellular: false, now: 1 })); });
  expect(getByTestId('status').props.children).toBe('queued');
  expect(getByTestId('count').props.children).toBe('1');

  act(() => {
    updateDownloadedTrack('aud', 'd1t01.mp3', { status: 'complete' });
    updateDownloadedShow('aud', { status: 'complete' });
  });
  expect(getByTestId('fraction').props.children).toBe('1');
  expect(getByTestId('bytes').props.children).toBe('100');
  expect(getByTestId('supported').props.children).toBe('true');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/contexts/__tests__/DownloadsContext.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the context**

```tsx
// src/contexts/DownloadsContext.tsx
/**
 * React wrapper around downloadsStore + downloadManager: hydrates the
 * manifest on mount, runs launch reconciliation once interactions settle,
 * and exposes subscription hooks. Mirrors the SourcePrefsContext split —
 * all state lives in the store so non-React code can read it.
 */
import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { InteractionManager, Platform } from 'react-native';
import type { ShowDetail } from '../types/show.types';
import type { DownloadedShow } from '../types/downloads.types';
import { downloadManager } from '../services/downloadManager';
import {
  getDownloadedBytesTotal,
  getDownloadedShow,
  getDownloadsVersion,
  getShowProgress,
  getWifiOnly,
  hydrateDownloads,
  listDownloadedShows,
  ShowProgress,
  subscribeDownloads,
} from '../services/downloadsStore';
import { logger } from '../utils/logger';

const log = logger.create('Downloads');

export interface DownloadActions {
  isSupported: boolean;
  enqueueShow: (detail: ShowDetail, opts?: { allowCellular?: boolean }) => Promise<void>;
  cancelShow: (identifier: string) => Promise<void>;
  retryShow: (identifier: string) => Promise<void>;
  removeShow: (identifier: string) => Promise<void>;
  removeAll: () => Promise<void>;
  allowCellular: (identifier: string) => void;
  setWifiOnly: (wifiOnly: boolean) => void;
}

const DownloadsContext = createContext<DownloadActions | undefined>(undefined);

export function useDownloadsVersion(): number {
  return useSyncExternalStore(subscribeDownloads, getDownloadsVersion, getDownloadsVersion);
}

const NO_PROGRESS: ShowProgress = { bytesDownloaded: 0, totalBytes: 0, fraction: 0 };

export function useShowDownload(identifier?: string): { entry: DownloadedShow | undefined; progress: ShowProgress } {
  const version = useDownloadsVersion();
  return useMemo(
    () => ({
      entry: identifier ? getDownloadedShow(identifier) : undefined,
      progress: identifier ? getShowProgress(identifier) : NO_PROGRESS,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [identifier, version],
  );
}

export function useDownloads(): DownloadedShow[] {
  const version = useDownloadsVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => listDownloadedShows(), [version]);
}

export function useDownloadSettings(): { wifiOnly: boolean; totalBytes: number; showCount: number } {
  const version = useDownloadsVersion();
  return useMemo(
    () => ({
      wifiOnly: getWifiOnly(),
      totalBytes: getDownloadedBytesTotal(),
      showCount: listDownloadedShows().filter(s => s.status === 'complete').length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );
}

export function useDownloadActions(): DownloadActions {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error('useDownloadActions must be used within DownloadsProvider');
  return ctx;
}

/** For components that may render outside the provider (tests, web). */
export function useOptionalDownloadActions(): DownloadActions | undefined {
  return useContext(DownloadsContext);
}

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    hydrateDownloads()
      .then(() => {
        if (cancelled) return;
        // Off the critical path: first paint and audio setup come first.
        InteractionManager.runAfterInteractions(() => {
          if (cancelled) return;
          downloadManager.reconcileOnLaunch().catch(error => log.error('Reconcile failed', error));
        });
      })
      .catch(error => log.error('Hydrate failed', error));
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<DownloadActions>(
    () => ({
      isSupported: downloadManager.isSupported,
      enqueueShow: (detail, opts) => downloadManager.enqueueShow(detail, opts),
      cancelShow: identifier => downloadManager.cancelShow(identifier),
      retryShow: identifier => downloadManager.retryShow(identifier),
      removeShow: identifier => downloadManager.removeShow(identifier),
      removeAll: () => downloadManager.removeAll(),
      allowCellular: identifier => downloadManager.allowCellular(identifier),
      setWifiOnly: wifiOnly => downloadManager.setWifiOnly(wifiOnly),
    }),
    [],
  );

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
}
```

- [ ] **Step 4: Wire the provider into `App.tsx`**

Import `DownloadsProvider` from `./src/contexts/DownloadsContext` and wrap `PlayCountsProvider`'s children — i.e. nest it between `<CollectionsProvider>` and `<PlayCountsProvider>`:

```tsx
                      <CollectionsProvider>
                        <DownloadsProvider>
                        <PlayCountsProvider>
                        <PlayerProvider>
                          …
                        </PlayerProvider>
                        </PlayCountsProvider>
                        </DownloadsProvider>
                      </CollectionsProvider>
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/contexts/__tests__/DownloadsContext.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/contexts/DownloadsContext.tsx src/contexts/__tests__/DownloadsContext.test.tsx App.tsx
git commit -m "feat(downloads): DownloadsProvider with subscription hooks"
```

---

### Task 13: `DownloadButton` on the show screen

**Files:**
- Create: `src/components/DownloadButton.tsx`
- Modify: `src/screens/ShowDetailScreen.tsx` (action icons row, ~line 1130)
- Test: `src/components/__tests__/DownloadButton.test.tsx`

**Interfaces:**
- Consumes: `useShowDownload`, `useDownloadSettings`, `useOptionalDownloadActions` (Task 12); `useNetworkStatus` (Task 5); `formatBytes` (Task 1); `describeDownloadError` (Task 11).
- Produces: `<DownloadButton show={ShowDetail | null} identifier={string} />` — renders nothing on web or outside the provider.

Design note: the spec describes a progress *ring*; the project has no SVG dependency, so progress is a 2 px bar under the icon. Same information, no new package.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/DownloadButton.test.tsx
import { Alert } from 'react-native';

const mockActions = {
  isSupported: true,
  enqueueShow: jest.fn().mockResolvedValue(undefined),
  cancelShow: jest.fn().mockResolvedValue(undefined),
  retryShow: jest.fn().mockResolvedValue(undefined),
  removeShow: jest.fn().mockResolvedValue(undefined),
  removeAll: jest.fn().mockResolvedValue(undefined),
  allowCellular: jest.fn(),
  setWifiOnly: jest.fn(),
};
jest.mock('../../contexts/DownloadsContext', () => {
  const actual = jest.requireActual('../../contexts/DownloadsContext');
  return { ...actual, useOptionalDownloadActions: () => mockActions };
});

const mockNetwork = { isConnected: true, isWifi: true };
jest.mock('../../hooks/useNetworkStatus', () => ({ useNetworkStatus: () => mockNetwork }));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { ShowDetail } from '../../types/show.types';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  setWifiOnly,
  updateDownloadedShow,
  upsertDownloadedShow,
} from '../../services/downloadsStore';
import { DownloadButton } from '../DownloadButton';

const show: ShowDetail = {
  identifier: 'aud', title: 'Cornell', date: '1977-05-08', year: '1977', downloadable: true,
  tracks: [{ id: 'd1t01.mp3', title: 'x', format: 'VBR MP3', streamUrl: 'https://archive.org/download/aud/d1t01.mp3', size: 142 * 1024 * 1024 }],
};

beforeEach(() => {
  jest.clearAllMocks();
  resetDownloadsStoreForTests();
  mockNetwork.isConnected = true;
  mockNetwork.isWifi = true;
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('enqueues directly on Wi-Fi', () => {
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download show'));
  expect(mockActions.enqueueShow).toHaveBeenCalledWith(show, { allowCellular: false });
});

it('asks before downloading over cellular when the guard is on', () => {
  mockNetwork.isWifi = false;
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download show'));
  expect(mockActions.enqueueShow).not.toHaveBeenCalled();
  const [title, message, buttons] = (Alert.alert as jest.Mock).mock.calls[0];
  expect(title).toBe('Download over cellular?');
  expect(message).toContain('142.0 MB');
  (buttons as { text: string; onPress?: () => void }[]).find(b => b.text === 'Download')!.onPress!();
  expect(mockActions.enqueueShow).toHaveBeenCalledWith(show, { allowCellular: true });
});

it('skips the prompt when the guard is off', () => {
  mockNetwork.isWifi = false;
  setWifiOnly(false);
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download show'));
  expect(mockActions.enqueueShow).toHaveBeenCalledWith(show, { allowCellular: true });
});

it('shows the stream-only state for non-downloadable recordings', () => {
  const { getByLabelText } = render(<DownloadButton show={{ ...show, downloadable: false }} identifier="aud" />);
  fireEvent.press(getByLabelText('Streaming only'));
  expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe('Streaming only');
  expect(mockActions.enqueueShow).not.toHaveBeenCalled();
});

it('walks through downloading → complete → failed states', () => {
  upsertDownloadedShow(createDownloadedShow(show, { allowCellular: false, now: 1 }));
  updateDownloadedShow('aud', { status: 'downloading' });
  const { getByLabelText, rerender } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText(/Downloading/));
  expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe('Cancel download?');

  updateDownloadedShow('aud', { status: 'complete' });
  rerender(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Downloaded'));
  expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe('Remove download?');

  updateDownloadedShow('aud', { status: 'failed', error: 'disk-full' });
  rerender(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Download failed'));
  const [, message, buttons] = (Alert.alert as jest.Mock).mock.calls[2];
  expect(message).toBe('Not enough space on this device.');
  (buttons as { text: string; onPress?: () => void }[]).find(b => b.text === 'Retry')!.onPress!();
  expect(mockActions.retryShow).toHaveBeenCalledWith('aud');
});

it('offers cellular while waiting for Wi-Fi', () => {
  upsertDownloadedShow(createDownloadedShow(show, { allowCellular: false, now: 1 }));
  updateDownloadedShow('aud', { status: 'paused' });
  mockNetwork.isWifi = false;
  const { getByLabelText } = render(<DownloadButton show={show} identifier="aud" />);
  fireEvent.press(getByLabelText('Waiting for Wi-Fi'));
  const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
  (buttons as { text: string; onPress?: () => void }[]).find(b => b.text === 'Download over cellular')!.onPress!();
  expect(mockActions.allowCellular).toHaveBeenCalledWith('aud');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/components/__tests__/DownloadButton.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the button**

```tsx
// src/components/DownloadButton.tsx
/**
 * The show screen's download affordance. One icon, six states, driven by the
 * downloads store for the recording currently selected in the VersionPicker.
 * Confirmations use Alert.alert like the rest of the native action menus.
 */
import React, { useCallback } from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ShowDetail } from '../types/show.types';
import { COLORS } from '../constants/theme';
import { useDownloadSettings, useOptionalDownloadActions, useShowDownload } from '../contexts/DownloadsContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatBytes } from '../utils/formatters';
import { describeDownloadError } from '../utils/userFacingError';

interface DownloadButtonProps {
  /** The loaded detail for `identifier`, or null while it is loading. */
  show: ShowDetail | null;
  identifier: string;
}

const STREAM_ONLY_MESSAGE =
  'Soundboard recordings are streaming-only by arrangement with the band and the Internet Archive.';

function estimatedBytes(show: ShowDetail): number {
  return show.tracks.reduce((sum, t) => sum + (t.size ?? 0), 0);
}

export function DownloadButton({ show, identifier }: DownloadButtonProps) {
  const actions = useOptionalDownloadActions();
  const { entry, progress } = useShowDownload(identifier);
  const { wifiOnly } = useDownloadSettings();
  const network = useNetworkStatus();

  const startDownload = useCallback(() => {
    if (!show || !actions) return;
    const needsCellular = !network.isWifi;
    if (wifiOnly && needsCellular) {
      Alert.alert(
        'Download over cellular?',
        `This show is about ${formatBytes(estimatedBytes(show))}. "Download on Wi-Fi only" is on in Settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => { void actions.enqueueShow(show, { allowCellular: true }); } },
        ],
      );
      return;
    }
    void actions.enqueueShow(show, { allowCellular: needsCellular });
  }, [actions, network.isWifi, show, wifiOnly]);

  const onPress = useCallback(() => {
    if (!actions) return;
    if (show && show.downloadable !== true) {
      Alert.alert('Streaming only', STREAM_ONLY_MESSAGE);
      return;
    }
    switch (entry?.status) {
      case undefined:
        startDownload();
        return;
      case 'queued':
      case 'downloading':
        Alert.alert('Cancel download?', 'Anything downloaded so far will be removed.', [
          { text: 'Keep downloading', style: 'cancel' },
          { text: 'Cancel download', style: 'destructive', onPress: () => { void actions.cancelShow(identifier); } },
        ]);
        return;
      case 'paused':
        Alert.alert(
          network.isConnected ? 'Waiting for Wi-Fi' : 'Waiting for a connection',
          network.isConnected
            ? `This show will download when you're back on Wi-Fi (${formatBytes(entry.totalBytes)}).`
            : 'This show will download when you\'re back online.',
          [
            { text: 'OK', style: 'cancel' },
            ...(network.isConnected
              ? [{ text: 'Download over cellular', onPress: () => actions.allowCellular(identifier) }]
              : []),
            { text: 'Cancel download', style: 'destructive' as const, onPress: () => { void actions.cancelShow(identifier); } },
          ],
        );
        return;
      case 'complete':
        Alert.alert('Remove download?', `Frees ${formatBytes(entry.totalBytes)}. You can download it again any time.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => { void actions.removeShow(identifier); } },
        ]);
        return;
      case 'failed':
        Alert.alert('Download failed', describeDownloadError(entry.error), [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => { void actions.removeShow(identifier); } },
          { text: 'Retry', onPress: () => { void actions.retryShow(identifier); } },
        ]);
        return;
    }
  }, [actions, entry, identifier, network.isConnected, show, startDownload]);

  if (Platform.OS === 'web' || !actions || !actions.isSupported) return null;

  const streamOnly = show ? show.downloadable !== true : false;
  const percent = Math.round(progress.fraction * 100);
  let icon: keyof typeof Ionicons.glyphMap = 'download-outline';
  let label = 'Download show';
  let color: string = COLORS.textPrimary;
  let dimmed = !show;
  let showBar = false;

  if (streamOnly) {
    icon = 'cloud-offline-outline';
    label = 'Streaming only';
    dimmed = true;
  } else if (entry?.status === 'queued' || entry?.status === 'downloading') {
    icon = 'arrow-down-circle-outline';
    label = `Downloading, ${percent}%`;
    showBar = true;
  } else if (entry?.status === 'paused') {
    icon = 'cloud-download-outline';
    label = network.isConnected ? 'Waiting for Wi-Fi' : 'Waiting for a connection';
    showBar = true;
  } else if (entry?.status === 'complete') {
    icon = 'checkmark-circle';
    label = 'Downloaded';
    color = COLORS.accent;
  } else if (entry?.status === 'failed') {
    icon = 'alert-circle-outline';
    label = 'Download failed';
  }

  return (
    <TouchableOpacity
      style={[styles.button, dimmed ? styles.dimmed : null]}
      onPress={onPress}
      disabled={!show}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: entry?.status === 'complete', disabled: !show }}
    >
      <Ionicons name={icon} size={26} color={color} />
      {showBar ? (
        <View style={styles.barTrack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.barFill, { width: `${Math.max(4, percent)}%` }]} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.4,
  },
  barTrack: {
    position: 'absolute',
    bottom: 2,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: 2,
    backgroundColor: COLORS.accent,
  },
});
```

- [ ] **Step 4: Wire it into `ShowDetailScreen`**

Add the import `import { DownloadButton } from '../components/DownloadButton';` and, inside `<View style={styles.showActionsGroup}>`, after the heart `TouchableOpacity`:

```tsx
              <DownloadButton
                show={show && show.identifier === (selectedVersion || route.params.identifier) ? show : null}
                identifier={selectedVersion || route.params.identifier}
              />
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/components/__tests__/DownloadButton.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/DownloadButton.tsx src/components/__tests__/DownloadButton.test.tsx src/screens/ShowDetailScreen.tsx
git commit -m "feat(downloads): download button on the show screen"
```

---

### Task 14: `DownloadsTab` in the Saved tab

**Files:**
- Create: `src/components/DownloadsTab.tsx`
- Modify: `src/screens/FavoritesScreen.tsx` (`TabType`, `FAVORITES_TABS`, tab-content ternary ~line 686)
- Test: `src/components/__tests__/DownloadsTab.test.tsx`

**Interfaces:**
- Consumes: `DownloadedShow` (Task 1), `getShowProgress` via `useShowDownload` (Task 12), `formatBytes`, `formatDateMMDDYYYY`, `getVenueFromShow`, `EmptyState`.
- Produces: `<DownloadsTab shows isOffline onPress(show) onLongPress(show) />`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/DownloadsTab.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { DownloadedShow } from '../../types/downloads.types';
import { createDownloadedShow, resetDownloadsStoreForTests, upsertDownloadedShow } from '../../services/downloadsStore';
import { DownloadsTab } from '../DownloadsTab';

function make(identifier: string, status: DownloadedShow['status'], extra: Partial<DownloadedShow> = {}): DownloadedShow {
  const base = createDownloadedShow(
    {
      identifier, title: `Grateful Dead Live at Barton Hall on 1977-05-08`, date: '1977-05-08', year: '1977',
      venue: 'Barton Hall', location: 'Ithaca, NY', downloadable: true,
      tracks: [{ id: 'a.mp3', title: 'a', format: 'VBR MP3', streamUrl: 'https://archive.org/download/x/a.mp3', size: 2 * 1024 * 1024 }],
    },
    { allowCellular: false, now: 1 },
  );
  const show = { ...base, status, ...extra };
  upsertDownloadedShow(show);
  return show;
}

beforeEach(() => resetDownloadsStoreForTests());

it('renders the empty state', () => {
  const { getByText } = render(<DownloadsTab shows={[]} isOffline={false} onPress={jest.fn()} onLongPress={jest.fn()} />);
  getByText(/Shows you download appear here/);
});

it('renders rows with date, venue, size and status, and fires callbacks', () => {
  const complete = make('done', 'complete');
  const failed = make('bad', 'failed', { error: 'network' });
  const paused = make('wait', 'paused');
  const onPress = jest.fn();
  const onLongPress = jest.fn();
  const { getByText, getAllByText } = render(
    <DownloadsTab shows={[complete, failed, paused]} isOffline onPress={onPress} onLongPress={onLongPress} />,
  );
  getByText("You're offline — showing your downloads.");
  expect(getAllByText('05/08/1977 · Barton Hall')).toHaveLength(3);
  expect(getAllByText('2.0 MB')).toHaveLength(3);
  getByText('Failed · Retry');
  getByText('Waiting for Wi-Fi');
  fireEvent.press(getAllByText('05/08/1977 · Barton Hall')[0]);
  expect(onPress).toHaveBeenCalledWith(complete);
  fireEvent(getAllByText('05/08/1977 · Barton Hall')[1], 'longPress');
  expect(onLongPress).toHaveBeenCalledWith(failed);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/components/__tests__/DownloadsTab.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the tab**

```tsx
// src/components/DownloadsTab.tsx
/**
 * The Saved tab's Downloads segment: every show in the manifest, newest
 * request first, with size and live status. Rows are plain Pressables so the
 * parent decides what tap and long-press do (navigate / action sheet).
 */
import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DownloadedShow } from '../types/downloads.types';
import { COLORS, LAYOUT, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useShowDownload } from '../contexts/DownloadsContext';
import { formatBytes, formatDateMMDDYYYY, getVenueFromShow } from '../utils/formatters';
import { EmptyState } from './StateViews';

interface DownloadsTabProps {
  shows: DownloadedShow[];
  isOffline: boolean;
  onPress: (show: DownloadedShow) => void;
  onLongPress: (show: DownloadedShow) => void;
}

function statusLine(show: DownloadedShow, percent: number): { text: string; tone: 'muted' | 'accent' | 'error' } | null {
  switch (show.status) {
    case 'queued':
      return { text: 'Queued', tone: 'muted' };
    case 'downloading':
      return { text: `Downloading · ${percent}%`, tone: 'accent' };
    case 'paused':
      return { text: 'Waiting for Wi-Fi', tone: 'muted' };
    case 'failed':
      return { text: 'Failed · Retry', tone: 'error' };
    default:
      return null;
  }
}

interface RowProps {
  show: DownloadedShow;
  onPress: (show: DownloadedShow) => void;
  onLongPress: (show: DownloadedShow) => void;
}

function DownloadRow({ show, onPress, onLongPress }: RowProps) {
  const { progress } = useShowDownload(show.identifier);
  const percent = Math.round(progress.fraction * 100);
  const status = statusLine(show, percent);
  const sizeLabel = formatBytes(show.status === 'complete' ? progress.bytesDownloaded || show.totalBytes : show.totalBytes);
  const title = `${formatDateMMDDYYYY(show.date)} · ${getVenueFromShow(show)}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      onPress={() => onPress(show)}
      onLongPress={() => onLongPress(show)}
      accessibilityRole="button"
      accessibilityLabel={`${title}${status ? `, ${status.text}` : ', downloaded'}`}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={show.status === 'complete' ? 'checkmark-circle' : show.status === 'failed' ? 'alert-circle-outline' : 'arrow-down-circle-outline'}
          size={22}
          color={show.status === 'complete' ? COLORS.accent : COLORS.textSecondary}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {show.location ? `${show.location} · ${sizeLabel}` : sizeLabel}
        </Text>
        {status ? (
          <Text style={[styles.rowStatus, status.tone === 'accent' ? styles.accent : null, status.tone === 'error' ? styles.error : null]}>
            {status.text}
          </Text>
        ) : null}
        {show.status === 'downloading' || show.status === 'paused' ? (
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.max(2, percent)}%` }]} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function DownloadsTab({ shows, isOffline, onPress, onLongPress }: DownloadsTabProps) {
  const renderItem = useCallback(
    ({ item }: { item: DownloadedShow }) => <DownloadRow show={item} onPress={onPress} onLongPress={onLongPress} />,
    [onPress, onLongPress],
  );

  if (shows.length === 0) {
    return (
      <EmptyState
        icon="download-outline"
        title="No downloads yet"
        message="Shows you download appear here. Tap the download icon on a show to save it for offline listening."
      />
    );
  }

  return (
    <FlatList
      data={shows}
      keyExtractor={item => item.identifier}
      renderItem={renderItem}
      ListHeaderComponent={isOffline ? (
        <View style={styles.offlineStrip}>
          <Ionicons name="cloud-offline-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.offlineText}>You're offline — showing your downloads.</Text>
        </View>
      ) : null}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingBottom: SPACING.xxl,
  },
  offlineStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  offlineText: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  rowSubtitle: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rowStatus: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accent: {
    color: COLORS.accent,
  },
  error: {
    color: COLORS.accent,
  },
  barTrack: {
    marginTop: SPACING.xs,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: 2,
    backgroundColor: COLORS.accent,
  },
});
```

- [ ] **Step 4: Wire it into `FavoritesScreen`**

Imports to add:

```tsx
import { DownloadsTab } from '../components/DownloadsTab';
import { useDownloads, useOptionalDownloadActions } from '../contexts/DownloadsContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { DownloadedShow } from '../types/downloads.types';
```

Change the tab definitions:

```tsx
type TabType = 'shows' | 'songs' | 'collections' | 'downloads';
…
const BASE_FAVORITES_TABS: SegmentedTabItem<TabType>[] = [
  { key: 'shows', label: 'Shows' },
  { key: 'songs', label: 'Songs' },
  { key: 'collections', label: 'Collections' },
];
// Downloads are native-only; the web build never shows the segment.
const FAVORITES_TABS: SegmentedTabItem<TabType>[] =
  Platform.OS === 'web' ? BASE_FAVORITES_TABS : [...BASE_FAVORITES_TABS, { key: 'downloads', label: 'Downloads' }];
```

Inside `FavoritesScreen()`, next to the other hooks:

```tsx
  const downloadedShows = useDownloads();
  const downloadActions = useOptionalDownloadActions();
  const { isConnected } = useNetworkStatus();

  const handleDownloadPress = useCallback((s: DownloadedShow) => {
    navigation.navigate('ShowDetail', { identifier: s.identifier, date: s.date, venue: s.venue, location: s.location });
  }, [navigation]);

  const handleDownloadLongPress = useCallback((s: DownloadedShow) => {
    if (!downloadActions) return;
    const buttons = [
      ...(s.status === 'failed' ? [{ text: 'Retry', onPress: () => { void downloadActions.retryShow(s.identifier); } }] : []),
      { text: 'Remove download', style: 'destructive' as const, onPress: () => { void downloadActions.removeShow(s.identifier); } },
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert(`${s.date.slice(0, 10)} · ${s.venue ?? 'Unknown venue'}`, undefined, buttons);
  }, [downloadActions]);
```

Replace the tab-content ternary so the last branch is split:

```tsx
      {activeTab === 'shows' ? (
        renderShowsTab()
      ) : activeTab === 'songs' ? (
        renderSongsTab()
      ) : activeTab === 'downloads' ? (
        <DownloadsTab
          shows={downloadedShows}
          isOffline={!isConnected}
          onPress={handleDownloadPress}
          onLongPress={handleDownloadLongPress}
        />
      ) : (
        <>
          <CollectionsTab
          … (unchanged)
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/components/__tests__/DownloadsTab.test.tsx src/screens && npm run typecheck`
Expected: PASS (if `src/screens` has no tests, Jest reports "No tests found" for that path — that's fine).

- [ ] **Step 6: Commit**

```bash
git add src/components/DownloadsTab.tsx src/components/__tests__/DownloadsTab.test.tsx src/screens/FavoritesScreen.tsx
git commit -m "feat(downloads): Downloads segment in the Saved tab"
```

---

### Task 15: Settings — Wi-Fi-only toggle, usage, Remove all

**Files:**
- Create: `src/components/DownloadsSettingsSection.tsx`
- Modify: `src/screens/SettingsScreen.tsx` (after the Playback section in both branches, ~lines 290 and 518)
- Test: `src/components/__tests__/DownloadsSettingsSection.test.tsx`

**Interfaces:**
- Consumes: `useDownloadSettings`, `useOptionalDownloadActions` (Task 12); `formatBytes`; `ConfirmModal`.
- Produces: `<DownloadsSettingsSection />` — null on web / outside the provider.

Design note: the spec names `MiniSwitch`, but `MiniSwitch` is a purely visual glyph for pills; the Settings screen's existing toggle (`skipTuningToggle`) uses RN `Switch`. Use `Switch` so the two toggles match.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/DownloadsSettingsSection.test.tsx
const mockActions = {
  isSupported: true,
  enqueueShow: jest.fn(), cancelShow: jest.fn(), retryShow: jest.fn(), removeShow: jest.fn(),
  removeAll: jest.fn().mockResolvedValue(undefined),
  allowCellular: jest.fn(),
  setWifiOnly: jest.fn(),
};
jest.mock('../../contexts/DownloadsContext', () => {
  const actual = jest.requireActual('../../contexts/DownloadsContext');
  return { ...actual, useOptionalDownloadActions: () => mockActions };
});

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  createDownloadedShow,
  resetDownloadsStoreForTests,
  updateDownloadedShow,
  updateDownloadedTrack,
  upsertDownloadedShow,
} from '../../services/downloadsStore';
import { DownloadsSettingsSection } from '../DownloadsSettingsSection';

beforeEach(() => {
  jest.clearAllMocks();
  resetDownloadsStoreForTests();
});

it('shows usage, toggles Wi-Fi only, and confirms Remove all', () => {
  upsertDownloadedShow(createDownloadedShow(
    { identifier: 'a', title: 't', date: '1977-05-08', year: '1977', downloadable: true,
      tracks: [{ id: 'x.mp3', title: 'x', format: 'VBR MP3', streamUrl: 'https://archive.org/download/a/x.mp3', size: 3 * 1024 * 1024 }] },
    { allowCellular: false, now: 1 },
  ));
  updateDownloadedTrack('a', 'x.mp3', { status: 'complete' });
  updateDownloadedShow('a', { status: 'complete' });

  const { getByText, getByRole, getByLabelText } = render(<DownloadsSettingsSection />);
  getByText('1 show · 3.0 MB');

  fireEvent(getByRole('switch'), 'valueChange', false);
  expect(mockActions.setWifiOnly).toHaveBeenCalledWith(false);

  fireEvent.press(getByLabelText('Remove all downloads'));
  getByText('Remove all downloads?');
  fireEvent.press(getByText('Remove'));
  expect(mockActions.removeAll).toHaveBeenCalledTimes(1);
});

it('disables Remove all when nothing is downloaded', () => {
  const { getByLabelText, getByText } = render(<DownloadsSettingsSection />);
  getByText('No downloads');
  expect(getByLabelText('Remove all downloads').props.accessibilityState?.disabled).toBe(true);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/components/__tests__/DownloadsSettingsSection.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the section**

```tsx
// src/components/DownloadsSettingsSection.tsx
/**
 * Settings → Downloads: the Wi-Fi-only guard, how much space downloads use,
 * and a confirmed "Remove all". Rendered in both Settings branches (signed
 * in and not) because downloads are device-local.
 */
import React, { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { useDownloadSettings, useOptionalDownloadActions } from '../contexts/DownloadsContext';
import { formatBytes, formatCount } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export function DownloadsSettingsSection() {
  const actions = useOptionalDownloadActions();
  const { wifiOnly, totalBytes, showCount } = useDownloadSettings();
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (Platform.OS === 'web' || !actions || !actions.isSupported) return null;

  const summary = showCount === 0 ? 'No downloads' : `${formatCount(showCount, 'show')} · ${formatBytes(totalBytes)}`;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Downloads</Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Download on Wi-Fi only</Text>
          <Text style={styles.toggleHint}>
            Shows wait for Wi-Fi before downloading. You can still allow cellular for a single show when you start it.
          </Text>
        </View>
        <Switch
          value={wifiOnly}
          onValueChange={actions.setWifiOnly}
          trackColor={{ false: COLORS.border, true: COLORS.accent }}
          thumbColor="#FFFFFF"
          accessibilityRole="switch"
          accessibilityLabel="Download on Wi-Fi only"
        />
      </View>

      <View style={styles.usageRow}>
        <Text style={styles.usageLabel}>Storage used</Text>
        <Text style={styles.usageValue}>{summary}</Text>
      </View>

      <TouchableOpacity
        style={[styles.removeButton, showCount === 0 ? styles.removeButtonDisabled : null]}
        onPress={() => setConfirmVisible(true)}
        disabled={showCount === 0}
        accessibilityRole="button"
        accessibilityLabel="Remove all downloads"
        accessibilityState={{ disabled: showCount === 0 }}
      >
        <Text style={styles.removeButtonText}>Remove all downloads</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={confirmVisible}
        title="Remove all downloads?"
        message={`Frees ${formatBytes(totalBytes)}. Shows stay in your library and can be downloaded again.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          setConfirmVisible(false);
          void actions.removeAll();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  toggleHint: {
    ...TYPOGRAPHY.captionSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  usageLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  usageValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  removeButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
  },
  removeButtonDisabled: {
    opacity: 0.4,
  },
  removeButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
});
```

- [ ] **Step 4: Mount it in both Settings branches**

In `SettingsScreen.tsx`, import `{ DownloadsSettingsSection } from '../components/DownloadsSettingsSection'` and add `<DownloadsSettingsSection />` immediately after the `{/* Playback Section */}` `<View style={styles.section}>…</View>` block — once in the logged-out early return (~line 290) and once in the logged-in layout (~line 518).

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/components/__tests__/DownloadsSettingsSection.test.tsx && npm run typecheck`
Expected: PASS. (`ConfirmModal` renders through the project's `BottomSheet`; if its `visible` gating hides the buttons in the test renderer, assert on `getByText('Remove all downloads?')` after the press and call the modal's `onConfirm` via `UNSAFE_getByType(ConfirmModal).props.onConfirm()` instead.)

- [ ] **Step 6: Commit**

```bash
git add src/components/DownloadsSettingsSection.tsx src/components/__tests__/DownloadsSettingsSection.test.tsx src/screens/SettingsScreen.tsx
git commit -m "feat(downloads): Settings section with Wi-Fi-only toggle and remove-all"
```

---

### Task 16: Native — iOS backup exclusion + Android backup rules (one EAS rebuild)

**Files:**
- Modify: `native-modules/ios/AudioPlayerModule.swift`, `native-modules/ios/AudioPlayerModule.m`, `plugins/audio-player/withAudioPlayerModule.js`

**Interfaces:**
- Consumes: JS bridge method `setExcludedFromBackup(uri)` added in Task 7.
- Produces: native `setExcludedFromBackup` on iOS; Android manifest attributes `android:fullBackupContent="@xml/backup_rules"` and `android:dataExtractionRules="@xml/data_extraction_rules"` plus the two XML files.

- [ ] **Step 1: Add the Swift method**

In `native-modules/ios/AudioPlayerModule.swift`, after the `stop` method:

```swift
  // MARK: - Backup exclusion (offline downloads)

  /// Offline downloads live under Documents/downloads, which iCloud would
  /// otherwise back up. App Review rejects large re-downloadable content in
  /// backups (guideline 2.23), so the JS side calls this once per launch.
  @objc func setExcludedFromBackup(_ path: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard var url = URL(string: path), url.isFileURL else {
      reject("INVALID_PATH", "Expected a file:// URL", nil)
      return
    }
    do {
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try url.setResourceValues(values)
      resolve(nil)
    } catch {
      reject("BACKUP_EXCLUSION_FAILED", error.localizedDescription, error)
    }
  }
```

- [ ] **Step 2: Export it in the Objective-C bridge**

In `native-modules/ios/AudioPlayerModule.m`, before `@end`:

```objc
RCT_EXTERN_METHOD(setExcludedFromBackup:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
```

- [ ] **Step 3: Add the Android backup rules to the config plugin**

In `plugins/audio-player/withAudioPlayerModule.js`, add `withDangerousMod` to the `@expo/config-plugins` import, then add:

```js
const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Offline downloads are re-downloadable; keep them out of Auto Backup
     (which silently stops backing the app up past 25 MB otherwise). -->
<full-backup-content>
  <exclude domain="file" path="downloads" />
</full-backup-content>
`;

const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
    <exclude domain="file" path="downloads" />
  </cloud-backup>
  <device-transfer>
    <exclude domain="file" path="downloads" />
  </device-transfer>
</data-extraction-rules>
`;

/**
 * Write res/xml backup rules that exclude the offline-downloads directory,
 * and point the <application> at them.
 */
function withDownloadsBackupRules(config) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'backup_rules.xml'), BACKUP_RULES_XML);
      fs.writeFileSync(path.join(xmlDir, 'data_extraction_rules.xml'), DATA_EXTRACTION_RULES_XML);
      console.log('[AudioPlayerModule] Wrote downloads backup rules');
      return config;
    },
  ]);
  return withAndroidManifest(config, async (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:fullBackupContent'] = '@xml/backup_rules';
      application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
    }
    return config;
  });
}
```

and call it from `withAudioPlayerModule` after `withCastManifest`:

```js
  config = withDownloadsBackupRules(config);
```

- [ ] **Step 4: Verify with prebuild (the `ios/` and `android/` trees are gitignored)**

Run:

```bash
npx expo prebuild --platform android --no-install 2>&1 | tail -5
grep -n "fullBackupContent\|dataExtractionRules" android/app/src/main/AndroidManifest.xml
cat android/app/src/main/res/xml/backup_rules.xml
npx expo prebuild --platform ios --no-install 2>&1 | tail -5
grep -n "setExcludedFromBackup" ios/*/AudioPlayerModule.swift ios/*/AudioPlayerModule.m
```

Expected: both manifest attributes present; the XML file content as above; both greps find the new method in the copied iOS files. Then `git status` must show no tracked changes under `ios/` or `android/` (only the two hand-written files are tracked; if prebuild touched them, `git checkout -- ios android` to restore).

- [ ] **Step 5: Typecheck and the full downloads suite**

Run: `npm run typecheck && npx jest src/services/__tests__/download src/contexts/__tests__/DownloadsContext.test.tsx src/components/__tests__/Download`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add native-modules/ios/AudioPlayerModule.swift native-modules/ios/AudioPlayerModule.m plugins/audio-player/withAudioPlayerModule.js
git commit -m "feat(downloads): exclude the downloads directory from iOS and Android backups"
```

---

### Task 17: Full verification, device checklist, and hand-off

**Files:**
- Modify: `docs/superpowers/plans/2026-08-23-offline-downloads.md` (tick boxes), memory note for the EAS rebuild.

- [ ] **Step 1: Run the entire test suite and both typechecks**

Run: `npx jest 2>&1 | tail -30 && npm run typecheck && npm run typecheck:web 2>&1 | tail -3`
Expected: all suites PASS (re-run `PlayerContext.*` / `ProfileContext` alone if they time out under load); `typecheck` clean; `typecheck:web` at its 50-error baseline (new errors, if any, will name files from this plan — fix them).

- [ ] **Step 2: Web sanity**

Run: `nohup npx expo start --web --port 8099 --clear < /dev/null > /tmp/claude-web.log 2>&1 &` then open `http://localhost:8099` in a browser: the Saved tab shows three segments (no Downloads), the show screen action row shows `+` and the heart only, Settings has no Downloads section, and the console has no errors mentioning `downloadManager`/`expo-network`. Stop the server afterwards.

- [ ] **Step 3: Native build + device checklist (requires an EAS build; record results in the PR)**

Run: `npm run build:ios:preview` (and `build:android:preview`). On device:

1. Open an audience recording → tap download on Wi-Fi → Saved → Downloads shows progress → completes; airplane mode → show opens from Saved → Downloads and every track plays.
2. Open a soundboard → icon is dimmed; tapping explains streaming-only.
3. Turn on cellular only → tap download → prompt shows size → "Download" → downloads; with Wi-Fi only off no prompt.
4. Start a download, background the app for a minute → it progressed/finished.
5. Start a download, force-quit, relaunch → Saved → Downloads shows it resuming.
6. Settings → Downloads shows the total; "Remove all" clears the list and the show streams again.
7. iOS: Settings → General → iPhone Storage → app → documents size is small after "Remove all"; Xcode → Devices → download container → `downloads/` is present and (via `xattr -l`) carries `com.apple.MobileBackup`/`NSURLIsExcludedFromBackupKey`.
8. Radio/shuffle lands on a downloaded track offline and plays.

- [ ] **Step 4: Commit the ticked plan and write the memory note**

```bash
git add docs/superpowers/plans/2026-08-23-offline-downloads.md
git commit -m "docs(downloads): mark implementation plan complete"
```

Then add a `project` memory (`project_offline_downloads.md`) recording: shipped date, that a native EAS rebuild is required for `expo-network` + backup exclusion, the stream-only policy decision, and the deferred follow-ups (catalog `streamOnly`, picker badge, "download the AUD instead").
