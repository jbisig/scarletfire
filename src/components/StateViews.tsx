import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

// =============================================================================
// LoadingState
// =============================================================================

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  /**
   * Skip painting the container's own `COLORS.background` fill. Use this when
   * the parent wrapper already paints its own background (e.g. a desktop
   * `COLORS.backgroundSecondary` shell) and this view is cross-axis
   * shrink-wrapped inside it — otherwise the two backgrounds create a visible
   * two-tone seam around the shrunk content column.
   */
  transparentBackground?: boolean;
}

/**
 * Consistent loading state with spinner and optional message.
 */
export const LoadingState = React.memo<LoadingStateProps>(function LoadingState({
  message,
  size = 'large',
  transparentBackground,
}) {
  return (
    <View style={[styles.container, transparentBackground && styles.containerTransparent]}>
      <ActivityIndicator size={size} color={COLORS.accent} />
      {message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  );
});

// =============================================================================
// EmptyState
// =============================================================================

export interface EmptyStateProps {
  /** Pass `null` to render without an icon. Defaults to 'albums-outline'. */
  icon?: keyof typeof Ionicons.glyphMap | null;
  title?: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  /**
   * Skip painting the container's own `COLORS.background` fill. Use this when
   * the parent wrapper already paints its own background (e.g. a desktop
   * `COLORS.backgroundSecondary` shell) and this view is cross-axis
   * shrink-wrapped inside it — otherwise the two backgrounds create a visible
   * two-tone seam around the shrunk content column.
   */
  transparentBackground?: boolean;
}

/**
 * Consistent empty state with icon, title, message, and optional action button.
 */
export const EmptyState = React.memo<EmptyStateProps>(function EmptyState({
  icon = 'albums-outline',
  title,
  message,
  action,
  transparentBackground,
}) {
  return (
    <View style={[styles.container, transparentBackground && styles.containerTransparent]}>
      {icon && <Ionicons name={icon} size={48} color={COLORS.textMuted} />}
      {title && <Text style={styles.emptyTitle}>{title}</Text>}
      <Text style={styles.emptyMessage}>{message}</Text>
      {action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// =============================================================================
// ErrorState
// =============================================================================

export interface ErrorStateProps {
  /** Optional icon shown above the title/message (e.g. for "not found" states). */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional bold heading shown above the message. */
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * A second way out, shown as a quiet text button under Retry — e.g.
   * "Try a different recording" when the failing thing has alternatives.
   */
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * Consistent error state with message and optional retry button. Pass
 * `icon`/`title` for richer "not found" style states (e.g. a missing
 * profile) — without them it renders the plain single-line message used by
 * most load-failure screens.
 */
export const ErrorState = React.memo<ErrorStateProps>(function ErrorState({
  icon,
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  secondaryAction,
}) {
  const hasHeader = !!icon || !!title;
  return (
    <View style={styles.container}>
      {icon && <Ionicons name={icon} size={48} color={COLORS.textTertiary} />}
      {title && <Text style={styles.errorTitle}>{title}</Text>}
      <Text
        style={hasHeader ? styles.errorSubtitle : styles.errorText}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
      {secondaryAction && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={secondaryAction.onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={secondaryAction.label}
        >
          <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// =============================================================================
// NoResultsState
// =============================================================================

export interface NoResultsStateProps {
  query: string;
  entityName?: string;
}

/**
 * Specific state for when a search returns no results.
 */
export const NoResultsState = React.memo<NoResultsStateProps>(function NoResultsState({
  query,
  entityName = 'results',
}) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={48} color={COLORS.textMuted} />
      <Text style={styles.emptyMessage}>
        No {entityName} found for "{query}"
      </Text>
    </View>
  );
});

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xxxxl,
  },
  containerTransparent: {
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading3,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: SPACING.sm,
  },
  actionButton: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  actionButtonText: {
    ...TYPOGRAPHY.labelLarge,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  errorTitle: {
    ...TYPOGRAPHY.heading4,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  retryButtonText: {
    ...TYPOGRAPHY.labelLarge,
  },
  secondaryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.textSecondary,
  },
});
