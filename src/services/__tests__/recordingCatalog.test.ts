jest.mock('../../data/recordingOverrides', () => ({
  tagFixes: {
    'gd1977-05-08.sbd.hicks.4982.sbeok.shnf': { format: 'matrix', lineage: ['betty'] },
  },
  editorialPins: {},
}));

import { applyTagFixes, getCatalogVersions, resetCatalogCacheForTests } from '../recordingCatalog';
import { findShowByDate } from '../../utils/showLookup';
import type { RecordingVersion } from '../../types/show.types';

beforeEach(() => resetCatalogCacheForTests());

describe('applyTagFixes', () => {
  it('overlays only the fixed fields and leaves other versions untouched', () => {
    const fixed: RecordingVersion = { identifier: 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf', format: 'sbd', lineage: [], downloads: 5 };
    const other: RecordingVersion = { identifier: 'gd1977-05-08.other', format: 'aud', lineage: ['lowgen'] };
    expect(applyTagFixes(fixed)).toEqual({ ...fixed, format: 'matrix', lineage: ['betty'] });
    expect(applyTagFixes(other)).toBe(other);
  });
});

describe('getCatalogVersions', () => {
  it('returns every recording for a show in catalog order, with fixes applied', () => {
    const show = findShowByDate('1977-05-08')!;
    const versions = getCatalogVersions('1977-05-08');
    expect(versions.map(v => v.identifier)).toEqual(show.versions.map(v => v.identifier));
    expect(versions.length).toBeGreaterThan(5); // the old 5-recording cap is gone
    const hicks = versions.find(v => v.identifier === 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf');
    if (hicks) expect(hicks.format).toBe('matrix'); // only asserts when that item exists in the catalog
  });

  it('accepts a full ISO timestamp', () => {
    expect(getCatalogVersions('1977-05-08T00:00:00Z')).toEqual(getCatalogVersions('1977-05-08'));
  });

  it('memoizes per date', () => {
    expect(getCatalogVersions('1977-05-08')).toBe(getCatalogVersions('1977-05-08'));
  });

  it('returns [] for a date with no show', () => {
    expect(getCatalogVersions('2050-01-01')).toEqual([]);
  });
});
