import { rankRecordings, scoreRecordings, RANK_WEIGHTS } from '../recordingRanker';
import type { RecordingVersion } from '../../types/show.types';

const v = (identifier: string, over: Partial<RecordingVersion> = {}): RecordingVersion => ({
  identifier, format: 'sbd', lineage: [], downloads: 1000, ...over,
});

describe('rankRecordings', () => {
  it('prefers more downloads when everything else is equal', () => {
    const out = rankRecordings([v('low', { downloads: 10 }), v('high', { downloads: 100000 })]);
    expect(out.map(x => x.identifier)).toEqual(['high', 'low']);
  });

  it('shrinks a single 5-star review toward the prior so forty 4.6-star reviews win', () => {
    const out = rankRecordings([
      v('one-review', { avgRating: 5, numReviews: 1 }),
      v('forty-reviews', { avgRating: 4.6, numReviews: 40 }),
    ]);
    expect(out[0].identifier).toBe('forty-reviews');
  });

  it('treats a missing rating as zero reviews (prior mean) rather than zero stars', () => {
    const [scored] = scoreRecordings([v('unrated')]);
    const ratingPart = (RANK_WEIGHTS.PRIOR_MEAN / 5) * RANK_WEIGHTS.RATING;
    expect(scored.score).toBeCloseTo(RANK_WEIGHTS.POP + ratingPart, 6);
  });

  it('caps the lineage bonus at LINEAGE_CAP', () => {
    const [capped, exact] = scoreRecordings([
      v('capped', { lineage: ['betty', 'miller', '16track', 'lowgen'] }),
      v('exact', { lineage: ['betty', 'miller'] }),
    ]);
    expect(capped.score).toBeCloseTo(exact.score, 6);
    expect(capped.score - scoreRecordings([v('plain')])[0].score).toBeCloseTo(RANK_WEIGHTS.LINEAGE_CAP, 6);
  });

  it('lets lineage outrank a modest download gap but not a huge one', () => {
    const modest = rankRecordings([v('betty', { lineage: ['betty'], downloads: 5000 }), v('plain', { downloads: 8000 })]);
    expect(modest[0].identifier).toBe('betty');
    const huge = rankRecordings([v('betty', { lineage: ['betty'], downloads: 50 }), v('plain', { downloads: 500000 })]);
    expect(huge[0].identifier).toBe('plain');
  });

  it('scores pop as 0 for every recording when no recording has downloads', () => {
    const scored = scoreRecordings([v('a', { downloads: 0 }), v('b', { downloads: undefined })]);
    scored.forEach(s => expect(s.score).toBeCloseTo((RANK_WEIGHTS.PRIOR_MEAN / 5) * RANK_WEIGHTS.RATING, 6));
  });

  it('breaks exact ties by downloads desc then identifier asc, and does not mutate the input', () => {
    const input = [v('b', { downloads: 0 }), v('a', { downloads: 0 })];
    const out = rankRecordings(input);
    expect(out.map(x => x.identifier)).toEqual(['a', 'b']);
    expect(input.map(x => x.identifier)).toEqual(['b', 'a']);
  });
});
