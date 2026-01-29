import { ShowsByYear } from '../../types/show.types';

// Re-export for use in other components
export type { ShowsByYear };

/**
 * Filter state for the Shows filter tray
 */
export interface ShowsFilterState {
  selectedSeries: string[];  // Display series names: "Dave's Picks", "Others", etc.
  selectedYears: string[];   // Year strings: "1972", "1977", etc.
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
 * Era definition for grouping years in the filter
 */
export interface FilterEra {
  name: string;
  years: string[];
}

/**
 * Era definitions for the filter tray (matches Figma design)
 * Note: 1975 is intentionally missing (band was on hiatus)
 */
export const FILTER_ERAS: FilterEra[] = [
  { name: 'The Early Years', years: ['1965', '1966', '1967', '1968', '1969', '1970'] },
  { name: 'Keith & Donna', years: ['1971', '1972', '1973', '1974'] },
  { name: 'Post-Hiatus', years: ['1976', '1977', '1978'] },
  { name: 'Brent Years', years: ['1979', '1980', '1981', '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990'] },
  { name: 'Final Years', years: ['1991', '1992', '1993', '1994', '1995'] },
];

/**
 * Get all years from all eras
 */
export function getAllFilterYears(): string[] {
  return FILTER_ERAS.flatMap(era => era.years);
}

/**
 * Check if filters have any active selections
 */
export function hasActiveFilters(filters: ShowsFilterState): boolean {
  return filters.selectedSeries.length > 0 || filters.selectedYears.length > 0;
}

/**
 * Get the count of active filters
 */
export function getFilterCount(filters: ShowsFilterState): number {
  return filters.selectedSeries.length + filters.selectedYears.length;
}

/**
 * Create an empty filter state
 */
export function createEmptyFilterState(): ShowsFilterState {
  return {
    selectedSeries: [],
    selectedYears: [],
  };
}
