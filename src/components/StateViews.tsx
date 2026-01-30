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
}

/**
 * Consistent loading state with spinner and optional message.
 */
export const LoadingState = React.memo<LoadingStateProps>(function LoadingState({
  message,
  size = 'large',
}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={COLORS.accent} />
      {message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  );
});

// =============================================================================
// EmptyState
// =============================================================================

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * Consistent empty state with icon, title, message, and optional action button.
 */
export const EmptyState = React.memo<EmptyStateProps>(function EmptyState({
  icon = 'albums-outline',
  title,
  message,
  action,
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={COLORS.textMuted} />
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
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Consistent error state with message and optional retry button.
 */
export const ErrorState = React.memo<ErrorStateProps>(function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try Again',
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
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
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  retryButtonText: {
    ...TYPOGRAPHY.labelLarge,
  },
});
