import { slugifyName, nextAvailableSlug } from '../collectionsSlug';

describe('slugifyName', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugifyName('My Best 77 Shows')).toBe('my-best-77-shows');
  });

  it('strips special characters', () => {
    expect(slugifyName("Dark Star's Greatest!")).toBe('dark-stars-greatest');
  });

  it('collapses multiple hyphens and trims them', () => {
    expect(slugifyName('  --Foo   Bar-- ')).toBe('foo-bar');
  });

  it('falls back to "collection" when name is empty after stripping', () => {
    expect(slugifyName('!!!')).toBe('collection');
  });
});

describe('nextAvailableSlug', () => {
  it('returns the base slug when not taken', () => {
    expect(nextAvailableSlug('my-list', new Set())).toBe('my-list');
  });

  it('appends -2 on first collision', () => {
    expect(nextAvailableSlug('my-list', new Set(['my-list']))).toBe('my-list-2');
  });

  it('increments until unused', () => {
    const taken = new Set(['x', 'x-2', 'x-3']);
    expect(nextAvailableSlug('x', taken)).toBe('x-4');
  });
});
