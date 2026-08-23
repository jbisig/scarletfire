/**
 * Where downloaded audio lives and how the manifest refers to it.
 *
 * The manifest stores RELATIVE paths because iOS moves the app container
 * (and therefore `documentDirectory`) on every app update; joining at read
 * time keeps old downloads reachable. File names are URI-encoded once so a
 * space or '#' in an archive file name cannot break the file:// URI.
 */

// Lazy require so the native module isn't touched at import time (same
// reason videoDownloadService does it).
function getFileSystem(): typeof import('expo-file-system/legacy') {
  return require('expo-file-system/legacy');
}

const ROOT = 'downloads';

export function downloadsRootUri(): string {
  return `${getFileSystem().documentDirectory}${ROOT}/`;
}

export function showDirUri(identifier: string): string {
  return `${downloadsRootUri()}${identifier}/`;
}

export function relativePathFor(identifier: string, fileName: string): string {
  return `${ROOT}/${identifier}/${encodeURIComponent(fileName)}`;
}

export function toAbsoluteUri(relativePath: string): string {
  return `${getFileSystem().documentDirectory}${relativePath}`;
}

export function isLocalDownloadUri(uri: string): boolean {
  return typeof uri === 'string' && uri.startsWith(downloadsRootUri());
}
