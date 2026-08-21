import { createEmptyFilterState, hasActiveFilters, countSelectedInCategory } from '../types';

it('empty state has no active filters', () => {
  const s = createEmptyFilterState();
  expect(s).toEqual({ selectedYears: [], selectedTags: [] });
  expect(hasActiveFilters(s)).toBe(false);
});
it('years or tags make it active; per-category counts only count that category', () => {
  expect(hasActiveFilters({ selectedYears: ['1977'], selectedTags: [] })).toBe(true);
  const s = { selectedYears: [], selectedTags: ['arena', 'stadium', 'betty'] as const };
  expect(hasActiveFilters({ ...s, selectedTags: [...s.selectedTags] })).toBe(true);
  expect(countSelectedInCategory({ ...s, selectedTags: [...s.selectedTags] }, 'venueType')).toBe(2);
  expect(countSelectedInCategory({ ...s, selectedTags: [...s.selectedTags] }, 'source')).toBe(1);
  expect(countSelectedInCategory({ ...s, selectedTags: [...s.selectedTags] }, 'era')).toBe(0);
});
