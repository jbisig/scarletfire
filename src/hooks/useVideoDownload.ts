/**
 * useVideoDownload Hook
 *
 * Provides access to video download service with automatic cleanup.
 * Manages listener subscriptions and ensures proper cleanup on unmount.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  videoDownloadService,
  VideoState,
  VideoStatus,
} from '../services/videoDownloadService';

interface VideoDownloadState {
  /** Current state of all videos */
  videos: Record<string, VideoState>;
  /** Download progress for currently downloading video (0-1) */
  currentProgress: number;
  /** ID of currently downloading video */
  currentVideoId: string | null;
  /** Overall download progress */
  overallProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface UseVideoDownloadReturn extends VideoDownloadState {
  /** Start downloading all pending videos */
  startDownloads: () => Promise<void>;
  /** Start downloads after interactions complete */
  startDeferredDownloads: () => Promise<void>;
  /** Cancel ongoing downloads */
  cancelDownloads: () => void;
  /** Clear all downloaded videos */
  clearDownloads: () => Promise<void>;
  /** Check if a specific video is available */
  isVideoAvailable: (videoId: string) => boolean;
  /** Get video source for playback */
  getVideoSource: (videoId: string) => { uri: string } | null;
  /** Get list of available video IDs */
  getAvailableVideoIds: () => string[];
}

/**
 * Hook for managing video downloads with automatic cleanup
 *
 * @example
 * function VideoManager() {
 *   const {
 *     videos,
 *     overallProgress,
 *     startDeferredDownloads,
 *     isVideoAvailable,
 *   } = useVideoDownload();
 *
 *   useEffect(() => {
 *     startDeferredDownloads();
 *   }, []);
 *
 *   return <Text>Downloaded: {overallProgress.percentage}%</Text>;
 * }
 */
export function useVideoDownload(): UseVideoDownloadReturn {
  const [videos, setVideos] = useState<Record<string, VideoState>>({});
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Set up listeners with automatic cleanup
  useEffect(() => {
    isMountedRef.current = true;

    // Status listener
    const removeStatusListener = videoDownloadService.addStatusListener(
      (newVideos) => {
        if (isMountedRef.current) {
          setVideos({ ...newVideos });

          // Find currently downloading video
          const downloading = Object.entries(newVideos).find(
            ([_, v]) => v.status === 'downloading'
          );
          setCurrentVideoId(downloading ? downloading[0] : null);
        }
      }
    );

    // Progress listener
    const removeProgressListener = videoDownloadService.addProgressListener(
      (videoId, progress) => {
        if (isMountedRef.current) {
          setCurrentVideoId(videoId);
          setCurrentProgress(progress);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      removeStatusListener();
      removeProgressListener();
    };
  }, []);

  // Memoized actions
  const startDownloads = useCallback(async () => {
    await videoDownloadService.startDownloads();
  }, []);

  const startDeferredDownloads = useCallback(async () => {
    await videoDownloadService.startDeferredDownloads();
  }, []);

  const cancelDownloads = useCallback(() => {
    videoDownloadService.cancelDownloads();
  }, []);

  const clearDownloads = useCallback(async () => {
    await videoDownloadService.clearDownloads();
  }, []);

  const isVideoAvailable = useCallback((videoId: string) => {
    return videoDownloadService.isVideoAvailable(videoId);
  }, []);

  const getVideoSource = useCallback((videoId: string) => {
    return videoDownloadService.getVideoSource(videoId);
  }, []);

  const getAvailableVideoIds = useCallback(() => {
    return videoDownloadService.getAvailableVideoIds();
  }, []);

  // Calculate overall progress
  const overallProgress = videoDownloadService.getDownloadProgress();

  return {
    videos,
    currentProgress,
    currentVideoId,
    overallProgress,
    startDownloads,
    startDeferredDownloads,
    cancelDownloads,
    clearDownloads,
    isVideoAvailable,
    getVideoSource,
    getAvailableVideoIds,
  };
}

/**
 * Lightweight hook for components that only need to check video availability
 * Does not subscribe to status/progress updates
 */
export function useVideoAvailability() {
  const isVideoAvailable = useCallback((videoId: string) => {
    return videoDownloadService.isVideoAvailable(videoId);
  }, []);

  const getVideoSource = useCallback((videoId: string) => {
    return videoDownloadService.getVideoSource(videoId);
  }, []);

  const getAvailableVideoIds = useCallback(() => {
    return videoDownloadService.getAvailableVideoIds();
  }, []);

  return {
    isVideoAvailable,
    getVideoSource,
    getAvailableVideoIds,
  };
}
