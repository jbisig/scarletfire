import { formatBytes } from '../formatters';

describe('formatBytes', () => {
  it('formats bytes, KB, MB and GB with one decimal above KB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('2 KB');
    expect(formatBytes(142 * 1024 * 1024)).toBe('142.0 MB');
    expect(formatBytes(1.25 * 1024 * 1024 * 1024)).toBe('1.3 GB');
  });

  it('treats negative or NaN input as zero', () => {
    expect(formatBytes(-5)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });
});
