import { assignShareBackgrounds, shareBackgroundIndexForId } from '../../../components/share/shareBackgrounds';

describe('assignShareBackgrounds', () => {
  it('never repeats an artwork within any six neighbouring cards', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `gd19${70 + (i % 9)}-0${(i % 8) + 1}-1${i % 9}.sbd.${i}`);
    const out = assignShareBackgrounds(ids);
    expect(out).toHaveLength(ids.length);
    for (let i = 0; i < out.length; i++) {
      const window = out.slice(Math.max(0, i - 5), i);
      expect(window).not.toContain(out[i]);
      expect(out[i]).toBeGreaterThanOrEqual(1);
      expect(out[i]).toBeLessThanOrEqual(6);
    }
  });

  it("keeps each show's own artwork when it doesn't collide with a neighbour", () => {
    const ids = ['a', 'b', 'c'];
    const preferred = ids.map(shareBackgroundIndexForId);
    const out = assignShareBackgrounds(ids);
    preferred.forEach((p, i) => {
      if (!preferred.slice(0, i).includes(p)) expect(out[i]).toBe(p);
    });
  });

  it('steps a colliding card to the next free artwork', () => {
    // Same id twice → same preferred index; the second must move on.
    const out = assignShareBackgrounds(['x', 'x']);
    expect(out[0]).not.toBe(out[1]);
    expect(out[1]).toBe((out[0] % 6) + 1);
  });
});
