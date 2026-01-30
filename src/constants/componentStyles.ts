/**
 * Shared Component Styles
 *
 * Common style patterns used across multiple components.
 * Use these as base styles and extend as needed.
 */
import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from './theme';

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
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '600',
  },
  /** Large track title (for FullPlayer) */
  trackTitleLarge: {
    ...TYPOGRAPHY.heading3,
  },
  /** Secondary show/venue info */
  showInfo: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  /** Smaller show info */
  showInfoSmall: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  /** Time display text */
  timeText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
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
    paddingHorizontal: SPACING.sm - 2,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  /** Small badge text */
  badgeText: {
    ...TYPOGRAPHY.captionSmall,
    fontWeight: '700',
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
