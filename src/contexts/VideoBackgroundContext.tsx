import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { usePlayer } from './PlayerContext';
import { VIDEO_SOURCES } from '../constants/videoSources.generated';

// Get random video index, optionally excluding current
const getRandomVideoIndex = (excludeIndex?: number): number => {
  const availableIndices = VIDEO_SOURCES.map((_, i) => i).filter(i => i !== excludeIndex);
  return availableIndices[Math.floor(Math.random() * availableIndices.length)];
};

interface VideoBackgroundContextType {
  videoSource: number; // Asset ID from require()
}

const VideoBackgroundContext = createContext<VideoBackgroundContextType | null>(null);

export function VideoBackgroundProvider({ children }: { children: ReactNode }) {
  const { state } = usePlayer();

  const [videoIndex, setVideoIndex] = useState(() => getRandomVideoIndex());
  const lastTrackIdRef = useRef<string | null>(null);

  // Change video when song changes
  useEffect(() => {
    const currentTrackId = state.currentTrack?.id;
    if (currentTrackId && currentTrackId !== lastTrackIdRef.current) {
      lastTrackIdRef.current = currentTrackId;

      // Pick a new random video (different from current)
      const newIndex = getRandomVideoIndex(videoIndex);
      setVideoIndex(newIndex);
    }
  }, [state.currentTrack?.id, videoIndex]);

  return (
    <VideoBackgroundContext.Provider value={{ videoSource: VIDEO_SOURCES[videoIndex] }}>
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
