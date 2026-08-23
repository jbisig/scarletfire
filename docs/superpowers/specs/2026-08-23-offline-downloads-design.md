# Offline Downloads — Design

**Date:** 2026-08-23
**Status:** Approved

## Overview

Users on iOS and Android can download a whole show (one specific
archive.org recording) to the device and play it back without a network
connection. Downloads continue while the app is backgrounded, are gated to
Wi-Fi by default, and are managed from three places: a download button on
the show screen, a **Downloads** segment in the Saved tab, and a
**Downloads** section in Settings. The rest of the app degrades gracefully
when offline; no attempt is made to make browse/search work without a
connection.

Downloads are local to the device. Nothing about them syncs to Supabase.

## Decisions (confirmed with user)

1. **Platforms:** iOS + Android only. Web and the Electron desktop build show
   no download affordances.
2. **Unit of download:** a whole show — every audio track of the currently
   selected recording. No per-track or per-collection downloads.
3. **Format:** exactly the file the player already streams (the MP3 that
   `selectAudioFiles()` picks). No quality setting, no lossless option.
4. **Offline UX:** the Downloads list and downloaded shows work fully
   offline; other screens show cached data or their existing error state
   with offline-aware copy. No catalog/ratings/notes sync.
5. **Background:** downloads continue while backgrounded via
   `expo-file-system/legacy`'s background `URLSession` (iOS) / native
   OkHttp threads (Android). If the OS kills the process, incomplete shows
   resume on the next launch (reconcile), rather than finishing unattended.
6. **Guards:** "Download on Wi-Fi only" toggle, default **on**. No storage
   cap; Settings shows total usage with "Remove all".
7. **Gating:** anyone can download; no sign-in required.
8. **Engine:** `expo-file-system/legacy` + a JS-managed queue + on-launch
   reconciliation (approach A). Not `react-native-background-downloader`
   (third-party native dep to vet on Expo 54 / New Arch) and not a custom
   native download manager.
9. **Stream-only recordings are blocked, with no alternative offered.**
   Soundboard (and most matrix) recordings are streaming-only by
   arrangement between the band and the Internet Archive. The app enforces
   this itself because archive.org only enforces it on lossless originals
   (the MP3 derivatives the app streams are served normally). The catalog is
   **not** regenerated in this round; a "download the AUD instead"
   affordance and a picker badge are deferred.

## Verified facts the design relies on

- `expo-file-system ~19.0.21` is installed. Its legacy API's
  `createDownloadResumable` defaults to `FileSystemSessionType.BACKGROUND`
  on iOS and ships the `handleEventsForBackgroundURLSession` app-delegate
  subscriber (`ios/Legacy/FileSystemBackgroundSessionHandler.swift`). The
  promise resolves when the app returns to the foreground if JS execution
  was stopped. Android downloads "always work in the background".
- The native players accept `file://` URIs: iOS builds `AVURLAsset(url:)`
  (`native-modules/ios/AudioPlayerModule.swift`), Android uses
  `MediaItem.Builder().setUri(Uri.parse(url))` on a default `ExoPlayer`
  (`native-modules/android/AudioPlayerModule.kt`).
- `isAllowedStreamUrl` (`src/utils/validateStreamUrl.ts`) accepts only
  `https://archive.org` / `*.archive.org` and is enforced at four call
  sites (`PlayerContext.tsx` loadTrack, shuffle song, shuffle show;
  `nativeAudioPlayer.web.ts`). It guards cross-user synced `streamUrl`s
  and stays **unchanged** — local paths never pass through it (see
  Playback substitution).
- Stream-only recordings carry `"stream_only"` in the metadata response's
  `metadata.collection` array (verified 2026-08-23 on 1977-05-08: the
  `mtx.seamons` item is `['GratefulDead','etree','stream_only']`; the
  `aud.moore.berger` item is `['GratefulDead','etree']`). On that date 4 of
  the first 6 recordings are stream-only, so the blocked state is common.
- Local persistence on `main` is AsyncStorage (MMKV was removed in
  `b074d39`). Keys live in `src/constants/registry.ts` `STORAGE_KEYS`.
- State convention for frequently-updating state is a module-level store
  + `useSyncExternalStore` wrapped by a thin Context
  (`sourcePrefsStore.ts` / `SourcePrefsContext.tsx`).
- `ArchiveFile.size` (bytes) is in the metadata response but is dropped
  when `archiveApi.getShowDetail` builds `Track`.
- iOS `documentDirectory` is iCloud-backed and its absolute path changes
  across app updates.
- There is no network-state dependency in the project today.

## Architecture

Four new units plus two helpers. Each has one job and can be tested alone.

| Unit | Job | Depends on |
|---|---|---|
| `src/services/downloadsStore.ts` | Module-level store holding the persisted **manifest** plus in-memory byte progress. Exposes `subscribe`/`getVersion` for `useSyncExternalStore`, and pure mutators. Persists to AsyncStorage under `STORAGE_KEYS.DOWNLOADS` (debounced). | AsyncStorage |
| `src/services/downloadManager.native.ts` / `.web.ts` | The queue engine: `enqueueShow(detail, opts)`, `cancelShow(id)`, `retryShow(id)`, `removeShow(id)`, `removeAll()`, `reconcileOnLaunch()`, `setWifiOnly(bool)`. Owns the network listener. The web variant is a stub with `isSupported = false` and no-op methods. | expo-file-system/legacy, expo-network, downloadsStore, downloadPaths |
| `src/services/playbackSource.ts` | `resolvePlaybackSource(identifier, track): { url, fallbackUrl? }` — the **only** place local URIs enter the player. | downloadsStore, downloadPaths |
| `src/contexts/DownloadsContext.tsx` | Thin provider: hydrates the store on mount, runs `reconcileOnLaunch`, exposes hooks `useShowDownload(identifier)`, `useDownloads()`, `useDownloadSettings()`. | the above |
| `src/services/downloadPaths.ts` | `downloadsRoot()`, `relativePathFor(identifier, fileName)`, `toAbsoluteUri(relativePath)`, `isLocalDownloadUri(uri)`. | expo-file-system/legacy |
| `src/services/networkStatus.native.ts` / `.web.ts` | Module-level store of `{ isConnected, isWifi }` fed by `expo-network`'s listener, readable synchronously from non-React code (`getNetworkStatus()`, `subscribeNetworkStatus()`). The web variant always reports `{ true, true }`. | expo-network |
| `src/hooks/useNetworkStatus.ts` | `useSyncExternalStore` wrapper over `networkStatus`. | networkStatus |

`DownloadsProvider` sits in `App.tsx` next to `FavoritesProvider`, above
`PlayerProvider` (the player reads the store synchronously through
`playbackSource`, not through React).

## Data model

```ts
// src/types/downloads.types.ts
export type ShowDownloadStatus = 'queued' | 'downloading' | 'paused' | 'complete' | 'failed';
export type TrackDownloadStatus = 'queued' | 'complete' | 'failed';

export interface DownloadedTrack {
  relativePath: string;        // 'downloads/<identifier>/<fileName>'
  bytes: number;               // expected size from ArchiveFile.size (0 if unknown)
  status: TrackDownloadStatus;
}

export interface DownloadedShow {
  identifier: string;          // exact recording, pinned at download time
  date: string;
  title: string;
  venue?: string;
  location?: string;
  status: ShowDownloadStatus;
  requestedAt: number;
  completedAt?: number;
  totalBytes: number;          // sum of track bytes; drives the cellular prompt and Settings total
  allowCellular: boolean;      // user accepted the cellular prompt for this show
  error?: 'network' | 'disk-full' | 'not-found' | 'unknown';
  tracks: Record<string /* Track.id */, DownloadedTrack>;
  detail: ShowDetail;          // snapshot so the show screen renders offline
}

export interface DownloadsManifest {
  version: 1;
  wifiOnly: boolean;           // default true
  shows: Record<string /* identifier */, DownloadedShow>;
}
```

Rules:

- **Relative paths only.** Files live at
  `${documentDirectory}downloads/<identifier>/<fileName>`; the manifest
  stores `relativePath` and `downloadPaths.toAbsoluteUri` re-joins at read
  time.
- **Keys.** Shows are keyed by `identifier`; tracks by `Track.id` (the
  archive file name), which is unique within an identifier.
- **`Track` gains `size?: number`**, populated from `ArchiveFile.size` in
  `archiveApi.getShowDetail`.
- **`ShowDetail` gains `downloadable: boolean`**, set in
  `archiveApi.getShowDetail` to
  `!metadata.collection.includes('stream_only')` (`ArchiveMetadata.collection`
  is typed `string[]`, but archive.org returns a bare string for
  single-collection items; normalize to an array first). Persisted
  show-detail cache entries written before this field exists are treated as
  `downloadable: false` until refetched — a missing field never enables
  downloading.
- **`Track.streamUrl` is never rewritten.** Favorites, collections, cloud
  sync, and `isAllowedStreamUrl` keep seeing the remote URL.
- **Progress is in-memory.** Per-track downloaded bytes live in the store's
  volatile section and are never persisted; only status transitions are
  written (debounced ~500 ms, flushed immediately on `complete`/`failed`).
- **`wifiOnly` lives in the manifest** rather than a separate key so one
  hydrate covers both.

## Engine behavior

### Enqueue

From the show screen, for the **selected** version:

1. Refuse if `detail.downloadable === false` (throw `StreamOnlyError`) or if
   the platform is unsupported. The UI never offers the action in these
   cases; the check is defense in depth.
2. Snapshot `detail` into a new `DownloadedShow` with every audio track as
   `queued`, `totalBytes` summed from `track.size`, and
   `allowCellular` from the prompt result.
3. Persist, then start the worker if idle.

All audio tracks are downloaded, including tuning tracks — `skipTuning` is
a playback filter the user can toggle later.

### Worker

- One show at a time (FIFO by `requestedAt`), **two tracks concurrently**
  within the show, in track order.
- Each track: `createDownloadResumable(streamUrl, absPath + '.part', { sessionType: BACKGROUND }, onProgress)`;
  on completion `moveAsync` the `.part` to the final name (atomic from the
  reader's point of view). The resumable's `savable()` state is kept in
  memory so `cancel` can `pauseAsync()` and a Wi-Fi pause can resume.
- Per-track failure ladder: retry up to 3× with exponential backoff
  (1 s, 2 s, 4 s) → retry once with `fallbackStreamUrl` → mark track
  `failed`. A show with any failed track becomes `failed` once the rest
  finish; completed tracks are kept so **Retry** only fetches the missing
  ones.
- Error classification (`DownloadedShow.error`): HTTP 404 → `not-found`;
  FS errors whose message contains "space"/"ENOSPC" → `disk-full`;
  network/timeout → `network`; else `unknown`.
- Show becomes `complete` when every track is `complete`; `completedAt` is
  set and persisted immediately.

### Wi-Fi guard

- The manager subscribes to `expo-network` state changes.
- Before starting or resuming a show: if `wifiOnly && !isWifi && !show.allowCellular`
  → set the show to `paused` and stop. When the state changes to Wi-Fi,
  any `paused` show resumes automatically.
- The show-screen button, when tapped on cellular with the guard on, shows
  a confirm sheet with the size ("Download 142 MB over cellular?").
  Accepting sets `allowCellular` on that show only.
- If `wifiOnly` is turned off in Settings, paused shows resume.

### Playback substitution

`audioService.convertToNativeTrack(track, show)` calls
`resolvePlaybackSource(show.identifier, track)`:

- If the manifest has the track as `complete` → `{ url: file://…, fallbackUrl: track.streamUrl }`.
  (Existence is trusted from the manifest at this point; the player's error
  path handles a missing file — see Error handling.)
- Otherwise → `{ url: track.streamUrl, fallbackUrl: track.fallbackStreamUrl }`.

The four inline `Track → native Track` conversions in `PlayerContext.tsx`
(~lines 637, 999, 1057, 1110) are routed through `convertToNativeTrack` so
there is exactly one substitution point; radio and shuffle therefore play
downloaded tracks offline with no extra work. The existing PlayerContext
fallback ladder (retry with the fallback URL on `PlaybackError`) is kept;
`fallbackStreamUrl` on the in-memory track is set to the resolved
`fallbackUrl` so a bad local file falls back to streaming.

`isAllowedStreamUrl` is still evaluated against `track.streamUrl` before
conversion, exactly as today. Local URIs are produced only by
`downloadPaths` from manifest data the app wrote itself, never from synced
input.

### Reconcile on launch

Runs once after hydrate, off the critical path (`InteractionManager.runAfterInteractions`):

1. Ensure `downloads/` exists; on iOS call the backup-exclusion native
   method (see Native & config).
2. For every show not `complete`: `getInfoAsync` each track's final path;
   present → `complete`, absent → `queued` (a `.part` is left in place so
   the resumable continues from it). Shows that end up fully present become
   `complete`; others are re-queued (or `paused` if the Wi-Fi rule applies).
3. For every `complete` show: if **no** track files exist at all (e.g.
   manifest restored from a backup without the files), mark the show
   `failed` with `error: 'unknown'` so the user gets an explicit Retry
   instead of a silent re-download.
4. Delete any directory under `downloads/` with no manifest entry.

### Remove

`removeShow` deletes the show directory (`deleteAsync` idempotent) and the
manifest entry, cancelling its in-flight resumables first. If the show is
currently playing from local files, the current track keeps playing (the
native player holds the open file handle); the next track load resolves to
streaming. `removeAll` does the same for every show and removes
`downloads/` itself.

## UI

Everything in this section is native-only (`usePlatform().isNative`). Web
and desktop (`Sidebar`, `DesktopLayout`, `webLinking`) are untouched.

### Show screen — `DownloadButton`

A third icon in the `showActionsGroup` row (`ShowDetailScreen.tsx`, after
the heart), driven by `useShowDownload(selectedVersion)` and
`show.downloadable`:

| State | Icon | Tap |
|---|---|---|
| not downloadable (stream-only) | `cloud-offline-outline`, dimmed | Info sheet: "Soundboard recordings are streaming-only by arrangement with the band and the Internet Archive." |
| not downloaded | `download-outline` | Enqueue (cellular confirm if required) |
| `queued` / `downloading` | icon inside a thin progress ring (show byte %) | Confirm "Cancel download?" |
| `paused` | ring + `wifi-outline` | Sheet: "Waiting for Wi-Fi" · "Download over cellular" |
| `complete` | `checkmark-circle` in accent | Confirm "Remove download?" |
| `failed` | `alert-circle-outline` | Sheet with the error message: Retry · Remove |

The button always reflects the version selected in the `VersionPicker`.
`accessibilityLabel` names the state; the ring is decorative.

### Saved tab — `Downloads` segment

A fourth entry in `FAVORITES_TABS` (`FavoritesScreen.tsx`), rendering a new
`DownloadsTab`:

- Rows: date · venue · location, source format badge, size
  (`formatBytes`), and status — progress bar while downloading, "Waiting
  for Wi-Fi", "Failed · Retry", or nothing when complete. Newest
  `requestedAt` first.
- Tap → `navigate('ShowDetail', { identifier })` with the **downloaded**
  identifier.
- Long-press → action sheet: Retry (if failed) · Remove.
- Empty state: "Shows you download appear here. Tap the download icon on a
  show to save it for offline listening."
- When `isConnected === false`, a strip at the top reads "You're offline —
  showing your downloads."

### Settings — `Downloads` section

After `Playback`, in **both** the logged-out and logged-in branches of
`SettingsScreen.tsx`:

- `MiniSwitch` "Download on Wi-Fi only" with hint text.
- Summary line: "3 shows · 412 MB".
- "Remove all downloads" → `ConfirmModal` → `removeAll()`.

`formatBytes(n)` is added to `src/utils/formatters.ts` (B/KB/MB/GB, one
decimal above KB).

## Offline degradation

- `useNetworkStatus()` exposes `{ isConnected, isWifi }`.
- **Downloaded shows open offline.** `archiveApi.getShowDetail` itself
  consults the manifest (it has several direct callers — `ShowsContext`,
  PlayerContext radio/shuffle, `usePlaySavedSong` — so the fallback lives
  there, not in a caller): if `getNetworkStatus().isConnected === false`
  and a snapshot exists, return the snapshot without a network call;
  otherwise fetch as today and, on failure, return the snapshot if one
  exists. The snapshot is read through a tiny `downloadsStore` accessor
  (`getDownloadedShowDetail(identifier)`), keeping the service free of
  React. Non-downloaded shows keep today's error state.
- **Downloaded identifier wins.** `resolveRouteIdentifier`
  (`src/services/sourceSelection.ts`, used by
  `ShowDetailScreen.resolveIdentifier`) returns the route identifier
  unchanged when the manifest has a `complete` entry for it — the same
  precedence as a user pin — so the resolver's preferred recording never
  replaces the one on disk.
- `describeLoadError` gets an offline branch (caller passes
  `{ offline: true }` when `isConnected === false`): "You're offline.
  Downloaded shows are in Saved → Downloads."
- Nothing else becomes offline-capable. Discover / Shows / Songs / Feed
  show their existing error states, with the offline copy above where they
  already use `describeLoadError`.

## Stream-only enforcement

- Source of truth: `ShowDetail.downloadable` from
  `metadata.collection` (see Data model).
- `DownloadButton` renders the stream-only state when
  `downloadable === false`; `enqueueShow` throws for such a detail.
- The engine only ever downloads the file the player streams (the selected
  MP3). It never touches FLAC/SHN.
- Deferred to a follow-up: adding `collection` to `scripts/buildCatalog.ts`
  so `RecordingVersion` carries `streamOnly`, a "Stream only" badge in
  `VersionPicker`, and a "Download the audience recording instead" action.

## Native & config changes (one EAS rebuild)

- Add **`expo-network`** (Expo-maintained; no config plugin).
- **iOS backup exclusion.** `documentDirectory` is included in iCloud
  backups; App Review guideline 2.23 rejects large re-downloadable content
  in backups. Add one method to the existing `AudioPlayerModule.swift`
  (and its `.m` bridge): `setExcludedFromBackup(path: String)` that sets
  `URLResourceValues.isExcludedFromBackup = true`. The manager calls it
  once for `downloads/` after creating the directory (and again from
  reconcile, since the flag is per-path and the directory may be
  recreated). Exposed on the JS side through `nativeAudioPlayer.native.ts`
  as an optional method; no-op on Android and web.
- **Android backup exclusion.** Extend `plugins/audio-player/withAudioPlayerModule.js`
  to write `res/xml/backup_rules.xml` and `res/xml/data_extraction_rules.xml`
  excluding `downloads/` and reference them from `<application>`
  (`android:fullBackupContent`, `android:dataExtractionRules`). Without
  this, Auto Backup silently stops backing the app up past 25 MB.
- No new permissions. The existing media foreground service keeps the
  process alive while music plays; downloads while idle rely on the
  background session / OS grace period plus reconcile.

## Error handling

| Situation | Behavior |
|---|---|
| Track HTTP 404 / 5xx | 3 retries w/ backoff → `fallbackStreamUrl` → track `failed`; show `failed` with Retry once the rest finish; completed tracks kept |
| Disk full | show `failed`, `error: 'disk-full'`, message "Not enough space on this device" |
| Process killed mid-download | `reconcileOnLaunch` re-queues incomplete tracks; `.part` files resume |
| Network drops to cellular with Wi-Fi-only on | show `paused`; auto-resume on Wi-Fi |
| Local file missing or corrupt at play time | existing PlayerContext ladder falls back to the stream URL; `playbackSource` reports the failure to the store, which marks the track `failed` and the show `failed` so Retry re-fetches it |
| User removes the currently playing show | current track finishes from the open handle; the next track streams |
| Manifest entry with no files on disk | show marked `failed` with Retry (no silent re-download) |
| Enqueue called for a stream-only show | throws `StreamOnlyError`; UI never offers it |
| Manifest JSON unparsable / wrong version | treated as empty; directory orphans cleaned by reconcile |

User-facing strings for download errors live alongside `describeLoadError`
in `src/utils/userFacingError.ts` (`describeDownloadError(error)`).

## Testing

- `src/__tests__/setup.ts`: add mocks for `expo-file-system/legacy` (an
  in-memory fake exposing `documentDirectory`, `getInfoAsync`,
  `makeDirectoryAsync`, `deleteAsync`, `moveAsync`, `readDirectoryAsync`,
  and `createDownloadResumable` whose `downloadAsync`/`pauseAsync` are
  controllable from tests) and for `expo-network`
  (`getNetworkStateAsync`, `addNetworkStateListener`).
- Unit (TDD, colocated `__tests__`):
  - `downloadsStore`: hydrate (missing / v1 / corrupt), persist debounce and
    flush, mutators, version counter, volatile progress not persisted.
  - `downloadManager`: FIFO show order, 2-track concurrency, track order,
    retry → fallback → failed, error classification, cancel, remove while
    in flight, Wi-Fi pause and auto-resume, `allowCellular`, reconcile
    (present / partial / none / orphan dir), stream-only rejection.
  - `downloadPaths`: relative ↔ absolute, `isLocalDownloadUri`.
  - `playbackSource`: local vs remote resolution, fallback pairing.
  - `archiveApi.getShowDetail`: `downloadable` for string / array /
    missing `collection`; `Track.size` populated.
  - `archiveApi.getShowDetail`: snapshot when offline, snapshot on
    failure, network when online (extends
    `archiveApi.getShowDetail.test.ts`).
  - `networkStatus`: listener → store → `useNetworkStatus`.
  - `resolveRouteIdentifier`: downloaded identifier preserved.
  - `describeLoadError` offline branch; `describeDownloadError`;
    `formatBytes`.
- Existing suites that must stay green: `validateStreamUrl.test.ts`
  (guard unchanged), `PlayerContext.streamFallback`,
  `PlayerContext.renderTopology` (the conversion refactor must not add
  renders).
- Component: `DownloadButton` state → icon / label / handler mapping;
  `DownloadsTab` empty and populated; Settings section toggle and
  remove-all confirm.
- Manual on device (before merge): background a download; force-quit
  mid-download and relaunch; airplane mode on a downloaded show, including
  radio/shuffle landing on a downloaded track; cellular prompt; stream-only
  show renders the blocked state; iOS Settings → Storage shows the app's
  documents are excluded from backup.

## Out of scope

- Web / Electron downloads.
- Per-track or per-collection downloads.
- Quality / lossless selection.
- Storage caps or automatic eviction.
- Catalog regeneration, `VersionPicker` stream-only badge, "download the
  AUD instead".
- Cloud sync of the download list.
- Full offline browsing (catalog, ratings, show notes).
