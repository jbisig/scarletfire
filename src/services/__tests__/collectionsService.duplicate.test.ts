import { duplicateCollectionName } from '../../utils/collectionsLibrary';

describe('duplicateCollectionName', () => {
  it('appends " (Copy)" when original has no copy suffix', () => {
    expect(duplicateCollectionName('Best 77 Shows')).toBe('Best 77 Shows (Copy)');
  });

  it('appends " (Copy)" even if the name already ends with "(Copy)"', () => {
    // No special casing — duplicating a duplicate is fine.
    expect(duplicateCollectionName('Best 77 Shows (Copy)')).toBe(
      'Best 77 Shows (Copy) (Copy)',
    );
  });

  it('trims trailing whitespace before appending', () => {
    expect(duplicateCollectionName('Best 77 Shows   ')).toBe('Best 77 Shows (Copy)');
  });
});
