import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '../types/show.types';
import { formatDuration } from '../utils/formatters';
import { useResponsive } from '../hooks/useResponsive';
import { StarRating } from './StarRating';
import { NowPlayingBars, nowPlayingBarsWidth } from './NowPlayingBars';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import type { ResolvedRating } from '../services/ratingResolver';

interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPress: (track: Track) => void;
  rating?: ResolvedRating | null;
  /** Web only: whether this song is saved as a favorite */
  isSaved?: boolean;
  /** Web only: callback to toggle save state */
  onToggleSave?: (track: Track) => void;
  /** Web only: callback to open Add-to-Playlist picker for this track */
  onAddToPlaylist?: (track: Track) => void;
  /** Native only: callback for long-press — parent assembles the action menu */
  onLongPress?: (track: Track) => void;
  /** Web only: number of playlists this track is currently in (for pill badge) */
  playlistCount?: number;
  /**
   * True when this track was selected by URL-driven navigation (share link
   * or pasted URL). Renders a sustained highlight distinct from `isPlaying`.
   * When `isPlaying` becomes true on the same track, the playing state wins
   * and the selected highlight is hidden.
   */
  isSelected?: boolean;
  /**
   * True while this track is the one the player is loading from archive.org
   * (tapped, but audio hasn't started). Swaps the duration for a spinner so
   * the row the user just pressed visibly acknowledges it.
   */
  isLoading?: boolean;
  /** Current track, but playback is paused — the playing mark holds still. */
  isPaused?: boolean;
}

/**
 * Individual track item component
 * Memoized to prevent unnecessary re-renders
 */
export const TrackItem = React.memo<TrackItemProps>(({ track, isPlaying, onPress, rating, isSaved, onToggleSave, onAddToPlaylist, onLongPress, playlistCount = 0, isSelected, isLoading = false, isPaused = false }) => {
  const { isDesktop } = useResponsive();
  const [isHovered, setIsHovered] = useState(false);
  const duration = formatDuration(track.duration);
  const ratingText = rating
    ? rating.isUserRating
      ? `Your rating: ${rating.stars} ${rating.stars === 1 ? 'star' : 'stars'}`
      : `${rating.stars} star performance`
    : '';
  // The mark used to mount and unmount outright, so the title jumped sideways
  // the instant a track started. Growing the mark's width instead carries the
  // title across with it. Width is a layout prop, so this cannot run on the
  // native driver — it is one row at a time, which is well within budget.
  const markSize = isDesktop ? 12 : 14;
  const markGap = SPACING.sm + 2;
  const markWidth = nowPlayingBarsWidth(markSize) + markGap;
  const showMark = isPlaying && !isLoading;
  const reveal = useRef(new Animated.Value(showMark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: showMark ? 1 : 0,
      // Out slightly quicker than in: the row being left should get out of the
      // way before the row being started announces itself.
      duration: showMark ? 260 : 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [showMark, reveal]);

  const playingText = isLoading ? 'Loading. ' : isPlaying ? 'Now playing. ' : '';
  const selectedText = isSelected && !isPlaying ? 'Selected. ' : '';
  const accessibilityLabel = `${playingText}${selectedText}${track.title}, ${duration}${ratingText ? `. ${ratingText}` : ''}`;

  const isNative = Platform.OS !== 'web';
  const hasSave = !!onToggleSave;
  const showSaveButton = hasSave && (isNative ? isSaved : ((isDesktop && isHovered) || isSaved));
  const hasAdd = !!onAddToPlaylist;
  const showAddButton = hasAdd && !isNative && ((isDesktop && isHovered) || playlistCount > 0);
  // Desktop web reserves the slot (opacity 0) so hover-reveal doesn't shift
  // layout. Touch surfaces (native, and web under the desktop breakpoint)
  // have no hover: a mounted-but-invisible button is still a 28pt tap target
  // and still announced by assistive tech, so mount it only when it's
  // actually shown. On native the add/save actions live behind the visible
  // "more" button instead.
  const hoverCapable = !isNative && isDesktop;
  const mountAddButton = hasAdd && (hoverCapable || showAddButton);
  const mountSaveButton = hasSave && (hoverCapable || showSaveButton);
  const showMoreButton = isNative && !!onLongPress;

  return (
    <View
      style={[
        styles.container,
        isDesktop && styles.containerDesktop,
        isSelected && !isPlaying && styles.selected,
        isDesktop && isHovered && !isPlaying && !isSelected && styles.hovered,
      ]}
      // @ts-ignore - web only mouse events
      onMouseEnter={isDesktop ? () => setIsHovered(true) : undefined}
      onMouseLeave={isDesktop ? () => setIsHovered(false) : undefined}
    >
      {/* The row's tap target is a layer beneath the content, not a wrapper
          around it, so the rating / add / save / more buttons are siblings
          rather than buttons nested inside a button (invalid on web, merged
          away by VoiceOver on native). Text is `pointerEvents: none` so taps
          fall through to this layer. Same pattern as ShowCard. */}
      <Pressable
        style={({ pressed }) => [styles.rowHit, pressed && styles.rowHitPressed]}
        onPress={() => onPress(track)}
        onLongPress={isNative && onLongPress ? () => onLongPress(track) : undefined}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to play this track"
        accessibilityState={{ selected: isPlaying || isSelected }}
      />
      <View style={[styles.infoContainer, styles.passThrough]}>
        <View style={[styles.titleRow, styles.passThrough]}>
          {/* Now-playing mark sits flush with the title column, and the
              title indents past it — Spotify's treatment. Hidden while the
              stream is still loading; the spinner on the right covers that. */}
          <Animated.View
            style={[
              styles.playingMark,
              {
                width: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, markWidth] }),
                opacity: reveal,
              },
            ]}
          >
            {showMark && (
              <View style={{ paddingRight: markGap }}>
                <NowPlayingBars paused={isPaused} size={markSize} />
              </View>
            )}
          </Animated.View>
          <View
            style={styles.titleWrap}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {/* The stars sit inside the title's own text run, so a title that
                wraps carries them to the end of its last line rather than
                stranding them beside the first. As a flex sibling they aligned
                to the first baseline: "Scarlet Begonias > Fire on the ***" /
                "Mountain". They are decorative here — the row's own label
                announces the rating, and rating is done from the player.

                Sharing the run means the stars also share the line budget, so a
                rated title gets a third line to land in — at narrow widths a
                two-line title would otherwise clamp them away and the rating
                would silently disappear. The extra line is only ever used when
                the title needs it. */}
            <Text
              style={[styles.title, isPlaying && styles.playingText]}
              numberOfLines={rating ? 3 : 2}
            >
              {track.title}
              {rating ? (
                <Text>
                  {'  '}
                  <StarRating inline rating={rating} size={14} />
                </Text>
              ) : null}
            </Text>
          </View>
        </View>
      </View>
      {/* Add-to-playlist button (web only) — plus icon. */}
      {mountAddButton && (
        <TouchableOpacity
          style={[
            styles.iconButton,
            playlistCount > 0 && styles.iconButtonActive,
            !showAddButton && styles.iconButtonHidden,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onAddToPlaylist?.(track);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            playlistCount > 0
              ? `Track is in ${playlistCount} ${playlistCount === 1 ? 'playlist' : 'playlists'}. Add or remove.`
              : 'Add to playlist'
          }
        >
          <Ionicons name="add" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      )}
      {/* Save button — heart icon, red when saved. Reserves space to prevent layout shift. */}
      {mountSaveButton && (
        <TouchableOpacity
          style={[
            styles.iconButton,
            isSaved && styles.iconButtonSaved,
            !showSaveButton && styles.iconButtonHidden,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onToggleSave(track);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityState={{ selected: isSaved }}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={20}
            color={isSaved ? COLORS.accent : COLORS.textPrimary}
          />
        </TouchableOpacity>
      )}
      {isLoading ? (
        <View style={[styles.duration, styles.loadingSlot, hasSave && !isNative && styles.durationWeb, styles.passive]} testID="track-loading">
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      ) : (
        <View
          style={[styles.passive, styles.durationWrap]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={[styles.duration, hasSave && !isNative && styles.durationWeb]}>
            {duration}
          </Text>
        </View>
      )}
      {/* Native: the one visible way into add-to-playlist / save for this
          row — long-press still works, this just makes it discoverable. */}
      {showMoreButton && (
        <TouchableOpacity
          style={styles.moreButton}
          testID="track-more-button"
          onPress={(e: any) => {
            e?.stopPropagation?.();
            onLongPress?.(track);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${track.title}`}
          accessibilityHint="Add to a playlist or save to favorites"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
});

TrackItem.displayName = 'TrackItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // Both platforms land on a 48pt row, but they get there differently: native
    // rows carry a 28pt "more" button that sets their height, and web rows are
    // sized by the title text. Padding makes up the difference, so a single
    // value would leave the two lists visibly out of step.
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { paddingVertical: 14 } : {}),
    paddingHorizontal: SPACING.xxl,
    // Centre, not baseline: a View's "baseline" is its bottom edge, so rows
    // with a heart button and rows without one used to land differently.
    alignItems: 'center',
  },
  containerDesktop: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
  },
  playingMark: {
    alignSelf: 'center',
    // The gap to the title lives inside the animated width, so it grows with
    // the mark rather than appearing all at once.
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  hovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
  },
  rowHit: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  rowHitPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  passThrough: {
    pointerEvents: 'box-none',
  },
  passive: {
    pointerEvents: 'none',
  },
  infoContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleWrap: {
    flexShrink: 1,
    pointerEvents: 'none',
  },
  durationWrap: {
    alignSelf: 'center',
  },
  title: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '500',
    flexShrink: 1,
    ...(Platform.OS === 'web' ? { fontSize: 16, fontWeight: '400' as const } : {}),
  },
  duration: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
    ...(Platform.OS === 'web' ? {
      fontSize: 14,
      color: COLORS.textPrimary,
      opacity: 0.66,
    } : {}),
  },
  durationWeb: {
    width: 48,
    textAlign: 'right',
  },
  loadingSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    alignSelf: 'center',
    // Match the rendered duration text height so the spinner doesn't nudge
    // the row taller than its neighbours.
    height: 20,
  },
  moreButton: {
    // Native-only, and the tallest thing in the row — it, not the padding, sets
    // the row height there. 28pt + 8pt hitSlop still clears the 44pt target
    // while letting the row sit closer to the web list's density.
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: SPACING.xs,
    marginRight: -SPACING.sm,
  },
  playingText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  saveButton: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  saveButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  saveButtonHidden: {
    opacity: 0,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  iconButtonActive: {},
  iconButtonSaved: {},
  iconButtonHidden: {
    opacity: 0,
  },
  selected: {
    backgroundColor: `${COLORS.accent}12`,  // ~7% alpha — lighter than playing's 20
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    paddingLeft: SPACING.xxl - 3,  // compensate so content doesn't shift
  },
});
