import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from 'react';
import { InteractionManager } from 'react-native';
import { usePlayer } from './PlayerContext';
import { BUNDLED_VIDEO, BUNDLED_VIDEO_ID } from '../constants/videoSources';

interface VideoBackgroundContextType {
  videoSource: number | { uri: string }; // Asset ID or URI object
  videoId: string; // Video identifier for key prop
}

const VideoBackgroundContext = createContext<VideoBackgroundContextType | null>(null);

// Get random video from available sources, optionally excluding current
// This function is only called after native modules are ready
const getRandomVideo = (
  excludeId?: string
): { id: string; source: number | { uri: string } } => {
  try {
    // Lazy import to avoid loading native modules too early
    const { getAvailableVideoSources } = require('../constants/videoSources');
    const available = getAvailableVideoSources().filter(
      (v: { id: string }) => v.id !== excludeId
    );
    if (available.length === 0) {
      return { id: BUNDLED_VIDEO_ID, source: BUNDLED_VIDEO };
    }
    return available[Math.floor(Math.random() * available.length)];
  } catch {
    // Fallback to bundled video if anything fails
    return { id: BUNDLED_VIDEO_ID, source: BUNDLED_VIDEO };
  }
};

export function VideoBackgroundProvider({ children }: { children: ReactNode }) {
  const { state } = usePlayer();

  // Start with bundled video - don't access downloaded videos during initial render
  const [currentVideo, setCurrentVideo] = useState<{
    id: string;
    source: number | { uri: string };
  }>({ id: BUNDLED_VIDEO_ID, source: BUNDLED_VIDEO });
  const lastTrackIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize with available videos after native modules are ready
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    InteractionManager.runAfterInteractions(() => {
      // Now it's safe to check for downloaded videos
      setCurrentVideo(getRandomVideo());
    });
  }, []);

  // Change video when song changes
  useEffect(() => {
    const currentTrackId = state.currentTrack?.id;
    if (currentTrackId && currentTrackId !== lastTrackIdRef.current) {
      lastTrackIdRef.current = currentTrackId;
      setCurrentVideo(getRandomVideo(currentVideo.id));
    }
  }, [state.currentTrack?.id, currentVideo.id]);

  const value = useMemo(
    () => ({
      videoSource: currentVideo.source,
      videoId: currentVideo.id,
    }),
    [currentVideo]
  );

  return (
    <VideoBackgroundContext.Provider value={value}>
      {children}
    </VideoBackgroundContext.Provider>
  );
}

export function useVideoBackground() {
  const context = useContext(VideoBackgroundContext);
  if (!context) {
    throw new Error('useVideoBackground must be used within a VideoBackgroundProvider');
  }
  return context;
}
