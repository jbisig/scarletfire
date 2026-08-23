/**
 * Tests for the fake expo-file-system/legacy module.
 * Verifies pause/resume behavior and settled flag state.
 */

describe('expoFileSystemLegacy (fake)', () => {
  beforeEach(() => {
    require('expo-file-system/legacy').__reset();
  });

  it('pauseAsync resolves the pending downloadAsync with undefined and sets paused/settled', async () => {
    const FileSystem = require('expo-file-system/legacy');
    const resumable = FileSystem.createDownloadResumable(
      'https://archive.org/download/gd77/gd77-05-08.mp3',
      'file:///mock-documents/downloads/gd1977-05-08.aud/gd77-05-08.mp3',
    );

    const downloadPromise = resumable.downloadAsync();

    const task = FileSystem.__tasks[0];
    expect(task.paused).toBe(false);
    expect(task.settled).toBe(false);

    const pauseResult = await resumable.pauseAsync();
    expect(pauseResult).toEqual({ url: expect.any(String), fileUri: expect.any(String), options: {}, resumeData: undefined });
    expect(task.paused).toBe(true);
    expect(task.settled).toBe(true);

    const downloadResult = await downloadPromise;
    expect(downloadResult).toBeUndefined();
  });

  it('after resumeAsync, settled is false and paused is false until complete() is called', async () => {
    const FileSystem = require('expo-file-system/legacy');
    const resumable = FileSystem.createDownloadResumable(
      'https://archive.org/download/gd77/gd77-05-08.mp3',
      'file:///mock-documents/downloads/gd1977-05-08.aud/gd77-05-08.mp3',
    );

    const downloadPromise = resumable.downloadAsync();
    const task = FileSystem.__tasks[0];

    // Pause the download
    await resumable.pauseAsync();
    expect(task.settled).toBe(true);
    expect(task.paused).toBe(true);

    // Resume the download
    const resumePromise = resumable.resumeAsync();
    expect(task.settled).toBe(false);
    expect(task.paused).toBe(false);

    // Complete the download
    task.complete({ status: 200, size: 1000 });
    const resumeResult = await resumePromise;
    expect(resumeResult).toEqual({
      status: 200,
      uri: 'file:///mock-documents/downloads/gd1977-05-08.aud/gd77-05-08.mp3',
      headers: {},
      mimeType: 'audio/mpeg',
    });
    expect(task.settled).toBe(true);
    expect(task.paused).toBe(false);

    // File should be written
    expect(FileSystem.__files.has('file:///mock-documents/downloads/gd1977-05-08.aud/gd77-05-08.mp3')).toBe(true);
    const fileInfo = await FileSystem.getInfoAsync('file:///mock-documents/downloads/gd1977-05-08.aud/gd77-05-08.mp3');
    expect(fileInfo.exists).toBe(true);
    expect(fileInfo.size).toBe(1000);
  });
});
