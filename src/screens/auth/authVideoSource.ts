import { VIDEO_SOURCES } from '../../constants/videoSources.generated';

// Shared video source for auth screens to maintain continuity
export const AUTH_VIDEO_SOURCE = VIDEO_SOURCES[Math.floor(Math.random() * VIDEO_SOURCES.length)];
