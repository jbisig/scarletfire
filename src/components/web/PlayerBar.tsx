import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../navigation/navigationRef';
import { usePlayer } from '../../contexts/PlayerContext';
import { useVideoBackground } from '../../contexts/VideoBackgroundContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { formatDate, formatTime, getVenueFromShow } from '../../utils/formatters';
import { toFavoriteSong } from '../../utils/favoriteSong';
import { resolveVideoUri } from '../../utils/resolveVideoUri';
import { WebVideoBackground } from '../shared/WebVideoBackground';
import { usePlayerProgress } from '../../hooks/usePlayerProgress';
import { COLORS, RADIUS, WEB_LAYOUT } from '../../constants/theme';

/**
 * Self-contained progress row: time display + seekable progress bar.
 * Owns its own 1-second re-render interval so the parent PlayerBar doesn't re-render for time updates.
 */
const ProgressRow = React.memo(function ProgressRow({
  progressRef,
  progressAnim,
  seekTo,
  trackDurationSec,
  trackId,
}: {
  progressRef: React.MutableRefObject<{ position: number; duration: number }>;
  progressAnim: Animated.Value;
  seekTo: (positionMs: number) => void;
  trackDurationSec: number;
  trackId: string;
}) {
  const progressBarRef = useRef<View>(null);
  const [isProgressHovered, setIsProgressHovered] = useState(false);

  const trackDurationMs = trackDurationSec ? trackDurationSec * 1000 : 0;

  const {
    displayPosition,
    displayDuration,
    isDragging,
    progressWidth,
    thumbLeft,
    beginDrag,
    moveDrag,
    endDrag,
  } = usePlayerProgress({
    progressRef,
    progressAnim,
    seekTo,
    trackDurationMs,
    resetKey: trackId,
    freezeDurationForDrag: true,
  });

  const handleMouseDown = useCallback(
    (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const clientX = e.nativeEvent?.clientX ?? e.clientX;
      const barNode = progressBarRef.current as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!barNode) return;

      const domNode = barNode.getNode?.() || barNode;
      const rect = domNode.getBoundingClientRect?.();
      if (!rect) return;

      const barLeft = rect.left;
      const barWidth = rect.width;

      beginDrag(clientX, barLeft, barWidth);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveDrag(moveEvent.clientX, barLeft, barWidth);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        endDrag(upEvent.clientX, barLeft, barWidth, () => setIsProgressHovered(false));
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [beginDrag, moveDrag, endDrag]
  );

  return (
    <View style={styles.progressRow}>
      <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
      <View
        ref={progressBarRef}
        style={styles.progressBarWrapper}
        // @ts-ignore - web mouse events
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsProgressHovered(true)}
        onMouseLeave={() => { if (!isDragging) setIsProgressHovered(false); }}
      >
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: progressWidth },
            ]}
          />
        </View>
        {(isProgressHovered || isDragging) && (
          <Animated.View
            style={[
              styles.progressThumb,
              { left: thumbLeft },
              isDragging && styles.progressThumbActive,
            ]}
            pointerEvents="none"
          />
        )}
      </View>
      <Text style={styles.timeText}>{formatTime(displayDuration)}</Text>
    </View>
  );
});

export function PlayerBar() {
  const {
    state,
    play,
    pause,
    nextTrack,
    previousTrack,
    seekTo,
    isRadioMode,
    isShuffleMode,
    progressRef,
    progressAnim,
  } = usePlayer();

  const { videoSource, videoId, resetToFallback } = useVideoBackground();
  const videoUri = useMemo(() => resolveVideoUri(videoSource), [videoSource]);
  const { isSongFavorite, addFavoriteSong, removeFavoriteSong } = useFavorites();

  const isSaved = state.currentTrack && state.currentShow
    ? isSongFavorite(state.currentTrack.id, state.currentShow.identifier)
    : false;

  const handleToggleSave = useCallback(() => {
    if (!state.currentTrack || !state.currentShow) return;
    if (isSongFavorite(state.currentTrack.id, state.currentShow.identifier)) {
      removeFavoriteSong(state.currentTrack.id, state.currentShow.identifier);
    } else {
      addFavoriteSong(toFavoriteSong(state.currentTrack, state.currentShow));
    }
  }, [state.currentTrack, state.currentShow, isSongFavorite, removeFavoriteSong, addFavoriteSong]);

  // Hover state for track info and skip buttons
  const [isTrackInfoHovered, setIsTrackInfoHovered] = useState(false);
  const [isSkipBackHovered, setIsSkipBackHovered] = useState(false);
  const [isSkipForwardHovered, setIsSkipForwardHovered] = useState(false);

  if (!state.currentTrack) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Select a track to start playing</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video background */}
      {videoUri ? (
        <View style={styles.videoContainer}>
          <WebVideoBackground uri={videoUri} videoId={videoId} onError={resetToFallback} />
        </View>
      ) : null}

      {/* Blur overlay on top of video */}
      <View style={styles.blurOverlay} />

      <View style={styles.content}>
        {/* Left: Track info + save button */}
        <View style={styles.trackInfoRow}>
          <TouchableOpacity
            style={styles.trackInfo}
            activeOpacity={0.7}
            onPress={() => {
              if (state.currentShow?.identifier && navigationRef.isReady()) {
                navigationRef.dispatch(
                  CommonActions.navigate({ name: 'ShowDetail', params: { identifier: state.currentShow.identifier } })
                );
              }
            }}
            // @ts-ignore - web mouse events
            onMouseEnter={() => setIsTrackInfoHovered(true)}
            onMouseLeave={() => setIsTrackInfoHovered(false)}
          >
            <Text style={[styles.trackTitle, isTrackInfoHovered && { textDecorationLine: 'underline' }]} numberOfLines={1}>
              {state.currentTrack.title}
            </Text>
            {state.currentShow && (
              <Text style={[styles.showInfo, isTrackInfoHovered && { textDecorationLine: 'underline' }]} numberOfLines={1}>
                {getVenueFromShow(state.currentShow)} on {formatDate(state.currentShow.date)}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isSaved && styles.saveButtonActive]}
            onPress={handleToggleSave}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? 'checkmark-sharp' : 'add'}
              size={13}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Center: Controls + Progress — absolutely centered in the bar */}
        <View style={styles.centerSection}>
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={previousTrack}
              style={styles.controlButton}
              // @ts-ignore - web mouse events
              onMouseEnter={() => setIsSkipBackHovered(true)}
              onMouseLeave={() => setIsSkipBackHovered(false)}
            >
              <Ionicons name="play-skip-back" size={20} color={COLORS.textPrimary} style={{ opacity: isSkipBackHovered ? 1 : 0.6 }} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (state.isPlaying ? pause() : play())}
              style={styles.playButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name={state.isPlaying ? 'pause' : 'play'}
                size={32}
                color={COLORS.textPrimary}
                style={!state.isPlaying ? { marginLeft: 3 } : undefined}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={nextTrack}
              style={styles.controlButton}
              disabled={!isRadioMode && !isShuffleMode && (!state.playlist || state.playlist.length === 0)}
              // @ts-ignore - web mouse events
              onMouseEnter={() => setIsSkipForwardHovered(true)}
              onMouseLeave={() => setIsSkipForwardHovered(false)}
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={
                  isRadioMode || isShuffleMode || (state.playlist && state.playlist.length > 0)
                    ? COLORS.textPrimary
                    : COLORS.textMuted
                }
                style={{
                  opacity: isRadioMode || isShuffleMode || (state.playlist && state.playlist.length > 0)
                    ? (isSkipForwardHovered ? 1 : 0.6)
                    : 0.3,
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Progress bar with time — isolated to avoid re-rendering controls every second */}
          <ProgressRow
            progressRef={progressRef}
            progressAnim={progressAnim}
            seekTo={seekTo}
            trackDurationSec={state.currentTrack.duration || 0}
            trackId={state.currentTrack.id}
          />
        </View>

        {/* Right: Playback mode badge */}
        {(isRadioMode || isShuffleMode) && (
          <View style={styles.modeBadge}>
            <Ionicons
              name={
                isRadioMode
                  ? 'radio'
                  : state.shuffleType === 'playlist'
                    ? 'musical-notes'
                    : 'shuffle'
              }
              size={14}
              color={COLORS.textPrimary}
            />
            <Text style={styles.modeBadgeText}>
              {isRadioMode
                ? 'Radio'
                : state.shuffleType === 'playlist' || state.shuffleType === 'playlistShuffle'
                  ? 'Playlist'
                  : state.shuffleType === 'songs'
                    ? 'Song Shuffle'
                    : 'Show Shuffle'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WEB_LAYOUT.playerBarHeight,
    borderRadius: WEB_LAYOUT.playerBarRadius,
    overflow: 'hidden',
    position: 'relative',
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.68,
    overflow: 'hidden',
    borderRadius: WEB_LAYOUT.playerBarRadius,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    // @ts-ignore - web only
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    position: 'relative',
    zIndex: 2,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    zIndex: 2,
  },
  trackInfo: {
    maxWidth: 400,
    // @ts-ignore
    cursor: 'pointer',
  },
  saveButton: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  trackTitle: {
    fontFamily: 'FamiljenGrotesk',
    fontWeight: '600',
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  showInfo: {
    fontFamily: 'Inter',
    fontWeight: '300',
    fontSize: 14,
    color: COLORS.textPrimary,
    opacity: 0.66,
  },
  centerSection: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    // @ts-ignore - web transform
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    alignItems: 'center',
    width: 453,
    zIndex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    padding: 4,
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  timeText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: COLORS.textPrimary,
    opacity: 0.66,
    textAlign: 'center',
    width: 40,
    // @ts-ignore
    whiteSpace: 'nowrap',
  },
  progressBarWrapper: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    position: 'relative',
    // @ts-ignore
    cursor: 'pointer',
    // @ts-ignore - prevent text selection while dragging
    userSelect: 'none',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.33)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.textPrimary,
    borderRadius: 6,
  },
  progressThumb: {
    position: 'absolute',
    top: '50%',
    width: 10,
    height: 10,
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    marginLeft: -5,
    marginTop: -5,
  },
  progressThumbActive: {
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    // @ts-ignore - web transform
    transform: [{ scale: 1.1 }],
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    zIndex: 2,
  },
  modeBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: COLORS.textPrimary,
  },
});
