/**
 * Shared Component Styles
 *
 * Common style patterns used across multiple components.
 * Use these as base styles and extend as needed.
 */
import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from './theme';

/**
 * Progress bar styles - used in MiniPlayer and FullPlayer
 */
export const ProgressBarStyles = StyleSheet.create({
  /** Outer container for the progress bar */
  container: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  /** Background track of the progress bar */
  background: {
    height: 4,
    backgroundColor: COLORS.progressBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  /** Filled portion of the progress bar */
  fill: {
    height: '100%',
    backgroundColor: COLORS.textPrimary,
  },
  /** Thumb for draggable progress bars */
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 6,
    marginLeft: -6,
  },
  /** Larger thumb when actively dragging */
  thumbActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
});

/**
 * Text styles for track/song titles
 */
export const TextStyles = StyleSheet.create({
  /** Primary track title */
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  /** Large track title (for FullPlayer) */
  trackTitleLarge: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  /** Secondary show/venue info */
  showInfo: {
    fontSize: 14,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  /** Smaller show info */
  showInfoSmall: {
    fontSize: 13,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  /** Time display text */
  timeText: {
    fontSize: 13,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
    minWidth: 45,
  },
});

/**
 * Badge styles (e.g., Radio badge, tier badges)
 */
export const BadgeStyles = StyleSheet.create({
  /** Accent colored badge */
  accentBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  /** Small badge text */
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
});

/**
 * Control button styles
 */
export const ButtonStyles = StyleSheet.create({
  /** Circular icon button */
  iconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Large play/pause button */
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Skip button container */
  skipButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Container styles
 */
export const ContainerStyles = StyleSheet.create({
  /** Full screen container with dark background */
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  /** Centered content container */
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Row with space between items */
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /** Row with centered items */
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
