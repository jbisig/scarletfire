import { parseTagsParam, stringifyTagsParam } from '../tagsParam';

it('parses, sanitizes, and round-trips tag lists', () => {
  expect(parseTagsParam('europe72,betty,arena')).toEqual(['europe72', 'betty', 'arena']);
  expect(parseTagsParam('europe72,laser,,betty,betty')).toEqual(['europe72', 'betty']);
  expect(parseTagsParam('%E0%A4%A')).toEqual([]);          // malformed percent-encoding → no throw
  expect(parseTagsParam(undefined)).toEqual([]);
  expect(stringifyTagsParam(['europe72', 'betty'])).toBe('europe72,betty');
  expect(stringifyTagsParam([])).toBeUndefined();
});

it('is a dependency-free module — no catalog-derived exports leak in alongside the pure helpers', () => {
  expect(Object.keys(require('../tagsParam')).sort()).toEqual(['parseTagsParam', 'stringifyTagsParam']);
});
