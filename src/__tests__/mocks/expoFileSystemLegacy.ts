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
            () => new Promise((res, rej) => { task.settled = false; task.paused = false; resolve = res; reject = rej; }),
          ),
          savable: jest.fn(() => ({ url, fileUri, options: {}, resumeData: undefined })),
        };
      },
    ),
  };
  return api;
}
