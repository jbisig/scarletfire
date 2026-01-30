/**
 * Video Sources
 *
 * Provides video sources for background playback.
 * Bundled video is used as fallback; downloaded videos are preferred when available.
 */

// Bundled video (always available) - smallest video kept in app bundle
export const BUNDLED_VIDEO = require('../../assets/videos/background1.mp4');
export const BUNDLED_VIDEO_ID = 'background1';

// All video IDs in preferred order
export const ALL_VIDEO_IDS = [
  'background1',
  'background2',
  'background3',
  'background4',
  'background5',
  'background6',
  'background7',
  'background8',
];

// Remote video IDs (downloadable from Supabase)
export const REMOTE_VIDEO_IDS = ALL_VIDEO_IDS.filter((id) => id !== BUNDLED_VIDEO_ID);

// Type for the video download service methods we use
interface VideoDownloadServiceInterface {
  getVideoSource(videoId: string): { uri: string } | null;
  getAvailableVideoIds(): string[];
}

// Lazy import to avoid circular dependency - only load when needed
let _videoDownloadService: VideoDownloadServiceInterface | null = null;

function getVideoDownloadService(): VideoDownloadServiceInterface | null {
  if (!_videoDownloadService) {
    try {
      _videoDownloadService = require('../services/videoDownloadService').videoDownloadService;
    } catch {
      // Service not available - silent fallback to bundled video
      return null;
    }
  }
  return _videoDownloadService;
}

/**
 * Get video source for a given video ID
 * Returns bundled video for 'background1', downloaded video URI for others,
 * or null if not yet downloaded.
 */
export function getVideoSource(videoId: string): number | { uri: string } | null {
  if (videoId === BUNDLED_VIDEO_ID) {
    return BUNDLED_VIDEO;
  }
  const service = getVideoDownloadService();
  return service?.getVideoSource(videoId) ?? null;
}

/**
 * Get all available video sources (bundled + downloaded)
 * Returns array of { id, source } objects
 */
export function getAvailableVideoSources(): Array<{
  id: string;
  source: number | { uri: string };
}> {
  const sources: Array<{ id: string; source: number | { uri: string } }> = [
    { id: BUNDLED_VIDEO_ID, source: BUNDLED_VIDEO },
  ];

  const service = getVideoDownloadService();
  if (service) {
    for (const id of REMOTE_VIDEO_IDS) {
      const source = service.getVideoSource(id);
      if (source) {
        sources.push({ id, source });
      }
    }
  }

  return sources;
}

/**
 * Get count of available videos
 */
export function getAvailableVideoCount(): number {
  const service = getVideoDownloadService();
  return 1 + (service?.getAvailableVideoIds()?.length ?? 0);
}
