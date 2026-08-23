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
