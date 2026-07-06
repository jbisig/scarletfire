import React from 'react';

interface WebVideoBackgroundProps {
  /** Resolved HTML5 video src URL (see src/utils/resolveVideoUri.ts). */
  uri: string;
  /** Identifies the current video source; used as the React key so the element remounts on change. */
  videoId: string;
  onError?: () => void;
  /** Defaults to 0.5 — all web video surfaces (header, SOTD card, player bar, full/mini player) play at half speed. */
  playbackRate?: number;
  style?: React.CSSProperties;
}

const DEFAULT_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

/**
 * HTML5 `<video>` background shared by every web-only video surface (desktop header,
 * show-of-the-day card, player bar, full player, mini player). Rendered via
 * `React.createElement` for React Native Web compatibility — call sites must guard
 * with `Platform.OS === 'web'` before rendering this.
 */
export function WebVideoBackground({ uri, videoId, onError, playbackRate = 0.5, style }: WebVideoBackgroundProps) {
  return React.createElement('video', {
    key: `video-${videoId}`,
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    ref: (el: HTMLVideoElement | null) => {
      if (!el) return;
      el.playbackRate = playbackRate;
      if (onError) {
        el.onerror = () => onError();
        const t = setTimeout(() => { if (el.readyState === 0) onError(); }, 5000);
        el.onloadeddata = () => clearTimeout(t);
      }
    },
    style: style ?? DEFAULT_STYLE,
  });
}
