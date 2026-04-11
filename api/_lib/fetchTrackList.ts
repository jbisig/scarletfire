/**
 * Fetch track metadata from the Internet Archive for a given show identifier.
 * Used by the song OG image and HTML injection endpoints to resolve a track
 * slug (e.g. "franklins-tower") to a real track title for display.
 *
 * Response is cached at the Vercel edge via Cache-Control headers on the
 * downstream endpoints — this function itself does no caching beyond
 * whatever fetch() does for the in-flight call. Returns null on any failure
 * (network error, non-200 status, JSON parse error) so the caller can fall
 * back to a slug-based display name.
 */
interface TrackListResponse {
  identifier: string;
  tracks: Array<{ title: string }>;
}

/**
 * Shape of the archive.org metadata response we care about. The full
 * response has many more fields; we narrow to what we use.
 */
interface ArchiveMetadataFile {
  name: string;
  title?: string;
  track?: string | number;
  format?: string;
}

interface ArchiveMetadataResponse {
  files?: ArchiveMetadataFile[];
}

export async function fetchTrackList(identifier: string): Promise<TrackListResponse | null> {
  const url = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ScarletFire/1.0 (https://www.scarletfire.app)' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ArchiveMetadataResponse;
    // Filter to audio files with track numbers. Matches the existing
    // src/services/archiveApi.ts filter shape for track extraction.
    const tracks = (data.files ?? [])
      .filter((f) => {
        if (!f.track) return false;
        if (!f.format) return false;
        return /^(Flac|VBR MP3|Ogg Vorbis)$/i.test(f.format);
      })
      .map((f) => ({ title: (f.title ?? f.name ?? '').replace(/\.(flac|mp3|ogg)$/i, '') }));
    return { identifier, tracks };
  } catch {
    return null;
  }
}
