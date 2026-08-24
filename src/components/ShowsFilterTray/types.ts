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
 * The five broad era groups the Years section is organized by. Coarser than
 * the tagging taxonomy in data/eras.ts on purpose — as year buckets for the
 * filter, five headings scan better than eleven. 1975 (the hiatus year, which
 * still has a handful of shows) rides with Keith & Donna.
 */
export interface FilterEraGroup {
  name: string;
  years: readonly string[];
}

const yearRange = (from: number, to: number): string[] =>
  Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

export const FILTER_ERA_GROUPS: readonly FilterEraGroup[] = [
  { name: 'The Early Years', years: yearRange(1965, 1970) },
  { name: 'Keith & Donna', years: yearRange(1971, 1975) },
  { name: 'Post-Hiatus', years: yearRange(1976, 1978) },
  { name: 'Brent Years', years: yearRange(1979, 1990) },
  { name: 'Final Years', years: yearRange(1991, 1995) },
];

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
