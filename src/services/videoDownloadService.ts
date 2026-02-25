/**
 * Video Download Service
 *
 * Manages downloading background videos from Cloudflare R2.
 * Downloads are deferred until after app interactions complete to avoid
 * competing with initial render and audio playback.
 */
import { InteractionManager } from 'react-native';
import { logger } from '../utils/logger';

// Lazy import to avoid loading native modules before they're ready
let _FileSystem: typeof import('expo-file-system/legacy') | null = null;

function getFileSystem(): typeof import('expo-file-system/legacy') {
  if (!_FileSystem) {
    _FileSystem = require('expo-file-system/legacy');
  }
  return _FileSystem!;
}

// Video metadata
const REMOTE_VIDEOS: Record<string, { filename: string }> = {
  background2: { filename: 'background2.mp4' },
  background3: { filename: 'background3.mp4' },
  background4: { filename: 'background4.mp4' },
  background5: { filename: 'background5.mp4' },
  background6: { filename: 'background6.mp4' },
  background7: { filename: 'background7.mp4' },
  background8: { filename: 'background8.mp4' },
};

const R2_BASE_URL = 'https://pub-bfec3824567343e59b371aa3f6a155d2.r2.dev';
const MAX_RETRIES = 3;

export type VideoStatus = 'pending' | 'downloading' | 'completed' | 'failed';

export interface VideoState {
  status: VideoStatus;
  localPath: string | null;
  error: string | null;
  retryCount: number;
}

type DownloadProgressCallback = (videoId: string, progress: number) => void;
type StatusChangeCallback = (videos: Record<string, VideoState>) => void;

class VideoDownloadService {
  private videos: Record<string, VideoState> = {};
  private isDownloading = false;
  private shouldCancel = false;
  private initialized = false;
  private statusListeners: Set<StatusChangeCallback> = new Set();
  private progressListeners: Set<DownloadProgressCallback> = new Set();

  private getLocalDir(): string {
    return `${getFileSystem().documentDirectory}videos/`;
  }

  private getLocalPath(filename: string): string {
    return `${this.getLocalDir()}${filename}`;
  }

  private createInitialState(): Record<string, VideoState> {
    const videos: Record<string, VideoState> = {};
    for (const videoId of Object.keys(REMOTE_VIDEOS)) {
      videos[videoId] = {
        status: 'pending',
        localPath: null,
        error: null,
        retryCount: 0,
      };
    }
    return videos;
  }

  private notifyStatusListeners(): void {
    for (const listener of this.statusListeners) {
      listener(this.videos);
    }
  }

  private notifyProgressListeners(videoId: string, progress: number): void {
    for (const listener of this.progressListeners) {
      listener(videoId, progress);
    }
  }

  // Check which videos already exist locally
  private async checkExistingDownloads(): Promise<void> {
    for (const [videoId, meta] of Object.entries(REMOTE_VIDEOS)) {
      const localPath = this.getLocalPath(meta.filename);
      try {
        const fileInfo = await getFileSystem().getInfoAsync(localPath);
        if (fileInfo.exists) {
          this.videos[videoId] = {
            status: 'completed',
            localPath,
            error: null,
            retryCount: 0,
          };
        }
      } catch (e) {
        // File doesn't exist, leave as pending
      }
    }
  }

  // Public API

  addStatusListener(callback: StatusChangeCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  addProgressListener(callback: DownloadProgressCallback): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  getVideoSource(videoId: string): { uri: string } | null {
    const video = this.videos[videoId];
    if (video?.status === 'completed' && video.localPath) {
      return { uri: video.localPath };
    }
    return null;
  }

  isVideoAvailable(videoId: string): boolean {
    return this.videos[videoId]?.status === 'completed';
  }

  getAvailableVideoIds(): string[] {
    return Object.entries(this.videos)
      .filter(([_, v]) => v.status === 'completed')
      .map(([id]) => id);
  }

  getDownloadProgress(): { completed: number; total: number; percentage: number } {
    const completed = Object.values(this.videos).filter(
      (v) => v.status === 'completed'
    ).length;
    const total = Object.keys(REMOTE_VIDEOS).length;
    return { completed, total, percentage: (completed / total) * 100 };
  }

  async startDownloads(): Promise<void> {
    if (this.isDownloading) {
      return;
    }

    // Initialize state if not done yet
    if (!this.initialized) {
      this.videos = this.createInitialState();
      await this.checkExistingDownloads();
      this.initialized = true;
    }

    this.isDownloading = true;
    this.shouldCancel = false;

    try {
      // Download videos sequentially
      for (const videoId of Object.keys(REMOTE_VIDEOS)) {
        if (this.shouldCancel) {
          break;
        }

        const video = this.videos[videoId];
        if (video.status === 'completed') {
          continue;
        }
        if (video.status === 'failed' && video.retryCount >= MAX_RETRIES) {
          continue;
        }

        await this.downloadVideo(videoId);
      }
    } finally {
      this.isDownloading = false;
    }
  }

  cancelDownloads(): void {
    this.shouldCancel = true;
  }

  async startDeferredDownloads(): Promise<void> {
    InteractionManager.runAfterInteractions(() => {
      this.startDownloads();
    });
  }

  private async downloadVideo(videoId: string): Promise<void> {
    const meta = REMOTE_VIDEOS[videoId];
    if (!meta) return;

    // Update status
    this.videos[videoId].status = 'downloading';
    this.videos[videoId].error = null;
    this.notifyStatusListeners();

    const localDir = this.getLocalDir();
    const localPath = this.getLocalPath(meta.filename);

    try {
      // Ensure directory exists
      const dirInfo = await getFileSystem().getInfoAsync(localDir);
      if (!dirInfo.exists) {
        await getFileSystem().makeDirectoryAsync(localDir, { intermediates: true });
      }

      // Get public URL from Cloudflare R2
      const publicUrl = `${R2_BASE_URL}/${meta.filename}`;

      // Download with progress tracking
      const downloadResumable = getFileSystem().createDownloadResumable(
        publicUrl,
        localPath,
        {},
        (downloadProgress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          this.notifyProgressListeners(videoId, progress);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || !result.uri) {
        throw new Error('Download returned no result');
      }

      // Verify file exists
      const fileInfo = await getFileSystem().getInfoAsync(localPath);
      if (!fileInfo.exists) {
        throw new Error('Downloaded file does not exist');
      }

      // Success
      this.videos[videoId] = {
        status: 'completed',
        localPath,
        error: null,
        retryCount: 0,
      };
      this.notifyStatusListeners();
    } catch (error) {
      logger.video.error(`Failed to download ${videoId}:`, error);

      // Clean up partial file
      try {
        await getFileSystem().deleteAsync(localPath, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }

      this.videos[videoId].status = 'failed';
      this.videos[videoId].error =
        error instanceof Error ? error.message : 'Unknown error';
      this.videos[videoId].retryCount += 1;
      this.notifyStatusListeners();
    }
  }

  async clearDownloads(): Promise<void> {
    this.cancelDownloads();

    const localDir = this.getLocalDir();
    try {
      await getFileSystem().deleteAsync(localDir, { idempotent: true });
    } catch {
      // Ignore deletion errors
    }

    this.videos = this.createInitialState();
    this.notifyStatusListeners();
  }
}

export const videoDownloadService = new VideoDownloadService();
