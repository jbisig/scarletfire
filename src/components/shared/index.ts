/**
 * Shared UI Components
 *
 * Reusable components extracted from screen-specific implementations
 * to ensure consistency and reduce code duplication.
 */

export { SearchBar } from '../SearchBar';
export type { SearchBarProps } from '../SearchBar';

export { DropdownMenu } from '../DropdownMenu';
export type { DropdownMenuProps, DropdownOption } from '../DropdownMenu';

export { LoadingState, EmptyState, ErrorState, NoResultsState } from '../StateViews';
export type {
  LoadingStateProps,
  EmptyStateProps,
  ErrorStateProps,
  NoResultsStateProps,
} from '../StateViews';

export { SortPillButton } from '../SortPillButton';
export type { SortPillButtonProps } from '../SortPillButton';

export { PlayCountBadge } from '../PlayCountBadge';
export type { PlayCountBadgeProps } from '../PlayCountBadge';

export { BlurBackground } from './BlurBackground';
export { VideoBackground } from './VideoBackground';
