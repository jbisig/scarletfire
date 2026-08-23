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
