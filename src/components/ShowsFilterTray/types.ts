import { ShowsByYear } from '../../types/show.types';
import { TagCategoryId, tagCategory, TagId } from '../../constants/tags';

// Re-export for use in other components
export type { ShowsByYear };

/**
 * Filter state for the Shows filter tray. Tags: OR within a category, AND
 * between categories (see tagResolver.buildTagPredicate).
 */
export interface ShowsFilterState {
  selectedYears: string[];   // Year strings: "1972", "1977", etc.
  selectedTags: TagId[];
}

/**
 * Props for the ShowsFilterTray component
 */
export interface ShowsFilterTrayProps {
  isOpen: boolean;
  onClose: () => void;
  appliedFilters: ShowsFilterState;
  onApply: (filters: ShowsFilterState) => void;
  showsByYear: ShowsByYear | null;
}

/**
 * Check if filters have any active selections
 */
export function hasActiveFilters(filters: ShowsFilterState): boolean {
  return filters.selectedYears.length > 0 || filters.selectedTags.length > 0;
}

/**
 * Count how many of the pending/applied tags fall in a given category.
 */
export function countSelectedInCategory(filters: ShowsFilterState, category: TagCategoryId): number {
  return filters.selectedTags.filter(id => tagCategory(id) === category).length;
}

/**
 * Create an empty filter state
 */
export function createEmptyFilterState(): ShowsFilterState {
  return {
    selectedYears: [],
    selectedTags: [],
  };
}
