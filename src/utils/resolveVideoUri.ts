import { Image } from 'react-native';

/**
 * Resolve a video source (require() result, URI object, or string) to a URL string.
 * Used by web video components (PlayerBar, MiniPlayer) for HTML5 video elements.
 */
export function resolveVideoUri(source: number | { uri: string } | string): string {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') {
    try { return Image.resolveAssetSource(source)?.uri || ''; } catch { return ''; }
  }
  if (source && typeof source === 'object' && 'uri' in source) return source.uri;
  if (source && typeof source === 'object' && 'default' in (source as any)) return (source as any).default; // eslint-disable-line @typescript-eslint/no-explicit-any
  return '';
}
