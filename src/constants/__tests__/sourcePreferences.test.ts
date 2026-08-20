import {
  DEFAULT_SOURCE_PREFERENCE,
  SOURCE_PREFERENCE_OPTIONS,
  sourcePreferenceLabel,
} from '../sourcePreferences';
import { sourceTagLabel, isSourceTagId } from '../tags';
import { STORAGE_KEYS, SUPABASE_TABLES } from '../registry';

describe('source preference constants', () => {
  it('defaults to Most Popular and lists the five options in spec order', () => {
    expect(DEFAULT_SOURCE_PREFERENCE).toBe('popular');
    expect(SOURCE_PREFERENCE_OPTIONS.map(o => o.value)).toEqual(['popular', 'sbd', 'aud', 'matrix', 'fm']);
    expect(SOURCE_PREFERENCE_OPTIONS.map(o => o.label)).toEqual([
      'Most Popular', 'Soundboard', 'Audience', 'Matrix', 'FM Broadcast',
    ]);
    SOURCE_PREFERENCE_OPTIONS.forEach(o => expect(o.description.length).toBeGreaterThan(10));
  });

  it('labels a preference', () => {
    expect(sourcePreferenceLabel('matrix')).toBe('Matrix');
    expect(sourcePreferenceLabel('popular')).toBe('Most Popular');
  });

  it('labels source tag ids from the format/lineage tables and validates ids', () => {
    expect(sourceTagLabel('sbd')).toBe('Soundboard');
    expect(sourceTagLabel('betty')).toBe('Betty Board');
    expect(isSourceTagId('matrix')).toBe(true);
    expect(isSourceTagId('lowgen')).toBe(true);
    expect(isSourceTagId('unknown')).toBe(false);
    expect(isSourceTagId('nope')).toBe(false);
  });

  it('registers the storage key and table name', () => {
    expect(STORAGE_KEYS.SOURCE_PREFS).toBe('@source_prefs');
    expect(SUPABASE_TABLES.USER_PREFERENCES).toBe('user_preferences');
  });
});
