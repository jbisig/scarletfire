import { FORMAT_LABELS, LINEAGE_LABELS, formatLabel, lineageLabel } from '../tags';

describe('tag labels', () => {
  it('labels every format', () => {
    expect(FORMAT_LABELS).toEqual({
      sbd: 'Soundboard',
      aud: 'Audience',
      matrix: 'Matrix',
      fm: 'FM Broadcast',
      unknown: 'Unknown',
    });
    expect(formatLabel('matrix')).toBe('Matrix');
    expect(formatLabel(undefined)).toBe('Unknown');
  });
  it('labels every lineage tag', () => {
    expect(LINEAGE_LABELS).toEqual({
      betty: 'Betty Board',
      miller: 'Charlie Miller',
      '16track': '16-Track',
      lowgen: 'Low Generation',
    });
    expect(lineageLabel('betty')).toBe('Betty Board');
  });
});
