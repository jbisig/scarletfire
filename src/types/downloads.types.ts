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
