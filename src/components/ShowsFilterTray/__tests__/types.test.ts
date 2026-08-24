import {
  createEmptyFilterState,
  hasActiveFilters,
  countSelectedInCategory,
  FILTER_ERA_GROUPS,
} from '../types';

describe('FILTER_ERA_GROUPS', () => {
  it('is the five broad eras, in order', () => {
    expect(FILTER_ERA_GROUPS.map(g => g.name)).toEqual([
      'The Early Years',
      'Keith & Donna',
      'Post-Hiatus',
      'Brent Years',
      'Final Years',
    ]);
  });

  it('covers every catalog year 1965-1995 exactly once', () => {
    const all = FILTER_ERA_GROUPS.flatMap(g => g.years);
    const expected = Array.from({ length: 31 }, (_, i) => String(1965 + i));
    expect([...all].sort()).toEqual(expected);
    expect(new Set(all).size).toBe(all.length);
  });

  it('folds 1975 into Keith & Donna (the catalog has hiatus-year shows)', () => {
    const kd = FILTER_ERA_GROUPS.find(g => g.name === 'Keith & Donna');
    expect(kd?.years).toContain('1975');
  });
});

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
