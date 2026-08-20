import {
  resolveRecording,
  describeFallback,
  parseSourceConstraint,
  stringifySourceConstraint,
  ResolveContext,
} from '../recordingResolver';
import type { RecordingVersion } from '../../types/show.types';

const v = (identifier: string, over: Partial<RecordingVersion> = {}): RecordingVersion => ({
  identifier, format: 'sbd', lineage: [], downloads: 1000, ...over,
});

// 5/8/77-ish: a very popular matrix, a Betty soundboard, a plain soundboard, an audience tape.
const MATRIX = v('mtx', { format: 'matrix', downloads: 1_500_000, avgRating: 4.8, numReviews: 299 });
const BETTY = v('betty', { format: 'sbd', lineage: ['betty', 'lowgen'], downloads: 145_000, avgRating: 4.7, numReviews: 36 });
const SBD = v('sbd', { format: 'sbd', downloads: 90_000 });
const AUD = v('aud', { format: 'aud', downloads: 540_000, avgRating: 4.7, numReviews: 116 });
const SHOW = [MATRIX, BETTY, SBD, AUD];

const ctx = (over: Partial<ResolveContext> = {}): ResolveContext => ({ preference: 'popular', ...over });

describe('resolveRecording precedence', () => {
  it('returns null for a show with no recordings', () => {
    expect(resolveRecording([], ctx())).toBeNull();
  });

  it('popular = unconstrained ranker (the most-downloaded, well-reviewed matrix wins)', () => {
    expect(resolveRecording(SHOW, ctx())).toEqual({ identifier: 'mtx', via: 'popular' });
  });

  it('a user pin wins over everything when it is still in the catalog', () => {
    expect(resolveRecording(SHOW, ctx({ userPinIdentifier: 'sbd', sessionConstraint: { format: 'aud' }, preference: 'matrix' })))
      .toEqual({ identifier: 'sbd', via: 'user-pin' });
  });

  it('a stale pin (identifier gone) is ignored, not an error', () => {
    expect(resolveRecording(SHOW, ctx({ userPinIdentifier: 'vanished', preference: 'aud' })))
      .toEqual({ identifier: 'aud', via: 'preference' });
  });

  it('the session constraint beats the global preference', () => {
    expect(resolveRecording(SHOW, ctx({ preference: 'aud', sessionConstraint: { lineage: ['betty'] } })))
      .toEqual({ identifier: 'betty', via: 'filter' });
  });

  it('the global preference constrains by format and ranks within it', () => {
    expect(resolveRecording(SHOW, ctx({ preference: 'sbd' }))).toEqual({ identifier: 'betty', via: 'preference' });
  });

  it('an editorial pin wins only when it is among the candidates', () => {
    expect(resolveRecording(SHOW, ctx({ editorialPinIdentifier: 'sbd' }))).toEqual({ identifier: 'sbd', via: 'editorial' });
    expect(resolveRecording(SHOW, ctx({ editorialPinIdentifier: 'sbd', preference: 'aud' }))).toEqual({ identifier: 'aud', via: 'preference' });
    expect(resolveRecording(SHOW, ctx({ editorialPinIdentifier: 'betty', sessionConstraint: { format: 'sbd' } })))
      .toEqual({ identifier: 'betty', via: 'editorial' });
  });

  it('multiple lineage tags in a constraint must all be present', () => {
    expect(resolveRecording(SHOW, ctx({ sessionConstraint: { lineage: ['betty', 'lowgen'] } }))?.identifier).toBe('betty');
  });

  it('an empty constraint object is no constraint', () => {
    expect(resolveRecording(SHOW, ctx({ sessionConstraint: {} }))).toEqual({ identifier: 'mtx', via: 'popular' });
  });
});

describe('fallback ladder', () => {
  const NO_MATRIX = [BETTY, SBD, AUD];

  it('preference with no match relaxes format and says so', () => {
    expect(resolveRecording(NO_MATRIX, ctx({ preference: 'matrix' }))).toEqual({
      identifier: 'betty',
      via: 'preference',
      fallback: { requested: ['matrix'], relaxed: ['matrix'] },
    });
  });

  it('drops quality modifiers first, then lineage identity, then format', () => {
    // requested: betty + lowgen + 16track soundboard. Only a plain Betty sbd exists (no 16track).
    const show = [v('betty', { lineage: ['betty'] }), AUD];
    expect(resolveRecording(show, ctx({ sessionConstraint: { format: 'sbd', lineage: ['betty', '16track', 'lowgen'] } }))).toEqual({
      identifier: 'betty', via: 'filter',
      fallback: { requested: ['sbd', 'betty', '16track', 'lowgen'], relaxed: ['16track', 'lowgen'] },
    });
    // No Betty at all: identity dropped too.
    expect(resolveRecording([SBD, AUD], ctx({ sessionConstraint: { format: 'sbd', lineage: ['betty'] } }))).toEqual({
      identifier: 'sbd', via: 'filter', fallback: { requested: ['sbd', 'betty'], relaxed: ['betty'] },
    });
    // No soundboard at all: format dropped last.
    expect(resolveRecording([AUD], ctx({ sessionConstraint: { format: 'sbd', lineage: ['betty'] } }))).toEqual({
      identifier: 'aud', via: 'filter', fallback: { requested: ['sbd', 'betty'], relaxed: ['sbd', 'betty'] },
    });
  });

  it('an editorial pin can still win at a relaxed rung', () => {
    expect(resolveRecording(NO_MATRIX, ctx({ preference: 'matrix', editorialPinIdentifier: 'sbd' }))).toEqual({
      identifier: 'sbd', via: 'editorial', fallback: { requested: ['matrix'], relaxed: ['matrix'] },
    });
  });
});

describe('describeFallback', () => {
  it('names what was asked for and what is playing', () => {
    expect(describeFallback({ requested: ['matrix'], relaxed: ['matrix'] }, BETTY))
      .toBe('No matrix from this night — playing the Betty Board soundboard instead.');
    expect(describeFallback({ requested: ['sbd', 'betty'], relaxed: ['sbd', 'betty'] }, AUD))
      .toBe('No Betty Board soundboard from this night — playing the audience recording instead.');
    expect(describeFallback({ requested: ['fm'], relaxed: ['fm'] }, v('u', { format: 'unknown' })))
      .toBe('No FM broadcast from this night — playing the recording instead.');
  });
});

describe('constraint serialization', () => {
  it('round-trips format and lineage as comma-separated tag ids', () => {
    expect(stringifySourceConstraint({ format: 'sbd', lineage: ['betty', 'lowgen'] })).toBe('sbd,betty,lowgen');
    expect(parseSourceConstraint('sbd,betty,lowgen')).toEqual({ format: 'sbd', lineage: ['betty', 'lowgen'] });
    expect(parseSourceConstraint('matrix')).toEqual({ format: 'matrix' });
    expect(parseSourceConstraint('betty')).toEqual({ lineage: ['betty'] });
  });

  it('ignores junk and yields undefined for nothing', () => {
    expect(parseSourceConstraint(undefined)).toBeUndefined();
    expect(parseSourceConstraint('')).toBeUndefined();
    expect(parseSourceConstraint('laser,unknown')).toBeUndefined();
    expect(parseSourceConstraint('aud,laser')).toEqual({ format: 'aud' });
    expect(stringifySourceConstraint(undefined)).toBeUndefined();
    expect(stringifySourceConstraint({})).toBeUndefined();
  });
});
