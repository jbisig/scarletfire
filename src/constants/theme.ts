/**
 * Theme constants for the Grateful Dead Player app
 *
 * Design System Foundation:
 * - COLORS: All color tokens including opacity variants
 * - FONTS: Font family definitions
 * - TYPOGRAPHY: Complete type scale with font sizes and weights
 * - SPACING: Consistent spacing scale (8px base)
 * - RADIUS: Border radius scale
 */

// =============================================================================
// COLORS
// =============================================================================

export const COLORS = {
  // Primary colors
  accent: '#E54C4F',
  accentLight: '#E54C4F',
  accentTransparent: 'rgba(229, 76, 79, 0.15)',

  // Background colors
  background: '#121212',
  backgroundSecondary: '#191919',
  cardBackground: '#2a2a2a',

  // Text colors - solid
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textTertiary: '#AEAEAE',
  textMuted: '#666666',

  // Text colors - with opacity (for overlays, hints, placeholders)
  textHint: 'rgba(255, 255, 255, 0.66)',
  textPlaceholder: 'rgba(255, 255, 255, 0.75)',
  textDisabled: 'rgba(255, 255, 255, 0.5)',

  // Border colors
  border: '#333333',
  borderLight: 'rgba(255, 255, 255, 0.33)',
  borderMedium: 'rgba(255, 255, 255, 0.5)',

  // Surface colors (for inputs, overlays)
  surfaceLight: 'rgba(255, 255, 255, 0.1)',
  surfaceMedium: 'rgba(255, 255, 255, 0.15)',
  surfaceFocused: 'rgba(255, 255, 255, 0.3)',

  // UI elements
  progressBackground: '#333333',
  searchBackground: '#2C2C2E',

  // Overlay/Backdrop
  backdrop: 'rgba(0, 0, 0, 0.5)',
  backdropDark: 'rgba(0, 0, 0, 0.7)',

  // Semantic colors
  error: '#FF4444',

  // Interactive element colors
  tabSliderActive: '#484848',
} as const;

// =============================================================================
// FONTS
// =============================================================================

export const FONTS = {
  primary: 'FamiljenGrotesk',
  secondary: 'Inter',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

/**
 * Typography scale following a modular scale
 * Base size: 16px
 * Scale: ~1.25 (Major Third)
 *
 * Usage:
 *   <Text style={TYPOGRAPHY.heading2}>Page Title</Text>
 *   <Text style={TYPOGRAPHY.body}>Body text</Text>
 */
export const TYPOGRAPHY = {
  // Display - Hero text, feature callouts
  displayLarge: {
    fontSize: 42,
    fontWeight: '700' as const,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  display: {
    fontSize: 36,
    fontWeight: '700' as const,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },

  // Headings
  heading1: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  heading2: {
    fontSize: 26,
    fontWeight: '700' as const,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  heading3: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },
  heading4: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
  },

  // Body text
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },

  // Labels - Used for buttons, form labels, emphasized text
  labelLarge: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
  },

  // Caption - Small text, timestamps, metadata
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  captionSmall: {
    fontSize: 10,
    fontWeight: '500' as const,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

/**
 * Spacing scale based on 4px increments
 * Use these values for margins, padding, and gaps
 *
 * Usage:
 *   padding: SPACING.md
 *   marginBottom: SPACING.lg
 *   gap: SPACING.sm
 */
export const SPACING = {
  /** 4px - Minimal spacing */
  xs: 4,
  /** 8px - Small spacing */
  sm: 8,
  /** 12px - Medium spacing */
  md: 12,
  /** 16px - Standard spacing */
  lg: 16,
  /** 20px - Large spacing (screen margins) */
  xl: 20,
  /** 24px - Extra large spacing */
  xxl: 24,
  /** 32px - Section spacing */
  xxxl: 32,
  /** 40px - Large section spacing */
  xxxxl: 40,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Border radius scale for consistent rounded corners
 *
 * Usage:
 *   borderRadius: RADIUS.md
 *   borderRadius: RADIUS.pill (for pill-shaped buttons)
 */
export const RADIUS = {
  /** 4px - Subtle rounding */
  xs: 4,
  /** 6px - Small elements */
  sm: 6,
  /** 12px - Cards, dropdowns */
  md: 12,
  /** 16px - Larger cards */
  lg: 16,
  /** 24px - Pills, search bars */
  xl: 24,
  /** 28px - Tab containers */
  xxl: 28,
  /** 9999px - Fully rounded (circles, pills) */
  full: 9999,
} as const;

// =============================================================================
// SHADOWS (for future use)
// =============================================================================

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

/**
 * Layout constants for common UI elements
 * Used for headers, buttons, animations, and list layouts
 */
export const LAYOUT = {
  /** Standard header button size (search, filter icons) */
  headerButtonSize: 40,
  /** Gap between header buttons */
  headerButtonGap: 10,
  /** Standard animation duration in ms */
  animationDuration: 300,
  /** Bottom padding for lists to account for mini player + tab bar */
  listBottomPadding: 180,
  /** Horizontal show card dimensions */
  horizontalCardWidth: 224,
  horizontalCardHeight: 112,
} as const;

// =============================================================================
// BRAND COLORS (External services, gradients)
// =============================================================================

/**
 * Brand colors for external services and decorative elements
 */
export const BRAND_COLORS = {
  // Streaming services
  spotify: '#1DB954',
  appleMusic: '#FC3C44',
  // Gradient card colors
  gradientBlue: '#0F5BA8',
  gradientBlueLight: '#2A7FD0',
  gradientRed: '#ED1F27',
  gradientRedLight: '#F54049',
  // Tab bar with blur
  tabBarBackground: 'rgba(18, 18, 18, 0.76)',
  // Text with opacity
  textSoft: 'rgba(255, 255, 255, 0.85)',
} as const;
