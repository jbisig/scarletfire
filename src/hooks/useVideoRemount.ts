import { useEffect, useRef, useState } from 'react';

/**
 * Forces the native `<Video>` element to remount when its source id changes,
 * by briefly unmounting it. Works around expo-av not always reloading a new
 * `source` in place — native only (web's `WebVideoBackground` remounts via
 * its own React `key` instead, so it doesn't need this hook).
 *
 * Shared by FullPlayer and MiniPlayer, which each had an identical
 * `videoMounted` state + `prevVideoIdRef` + 50ms unmount/remount effect.
 */
export function useVideoRemount(videoId: string): boolean {
  const [videoMounted, setVideoMounted] = useState(true);
  const prevVideoIdRef = useRef(videoId);

  useEffect(() => {
    if (videoId !== prevVideoIdRef.current) {
      prevVideoIdRef.current = videoId;
      // Briefly unmount video to force clean reload
      setVideoMounted(false);
      const timer = setTimeout(() => setVideoMounted(true), 50);
      return () => clearTimeout(timer);
    }
  }, [videoId]);

  return videoMounted;
}
