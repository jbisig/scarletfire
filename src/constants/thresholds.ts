/**
 * Application-wide thresholds and magic numbers
 * Centralized here for easy tuning and consistency
 */

/**
 * Gesture thresholds for swipe-to-dismiss interactions
 */
export const GESTURE_THRESHOLDS = {
  /** Distance in pixels to drag before modal dismisses on release */
  DISMISS_DISTANCE: 100,
  /** Velocity threshold that triggers immediate dismiss */
  DISMISS_VELOCITY: 0.5,
} as const;

/**
 * Fuzzy matching thresholds for string similarity comparisons
 */
export const SIMILARITY_THRESHOLDS = {
  /** Threshold for matching HeadyVersion titles to archive tracks (lower due to format differences) */
  RADIO_TRACK_MATCH: 0.6,
  /** Threshold for matching user search queries to song titles */
  SEARCH_MATCH: 0.85,
} as const;

/**
 * Play count thresholds for tracking listening progress
 */
export const PLAYCOUNT_THRESHOLDS = {
  /** Percentage of track that must be played to count as a "play" */
  TRACK_PLAY_PERCENT: 0.5,
  /** Percentage of show tracks that must have N plays for show to count as N plays */
  SHOW_PLAY_PERCENT: 0.5,
} as const;

/**
 * Prefetch and batch size thresholds
 */
export const PREFETCH_THRESHOLDS = {
  /** Number of radio tracks to prefetch ahead */
  RADIO_TRACKS: 20,
  /** Threshold of remaining tracks before triggering prefetch */
  RADIO_REPLENISH_AT: 15,
} as const;
