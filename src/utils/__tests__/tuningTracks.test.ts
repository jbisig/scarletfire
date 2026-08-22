import { isTuningTrack, queueWithoutTuning } from '../tuningTracks';

/**
 * Every title below is a real Archive.org taper label from the catalog. The
 * negative cases matter more than the positive ones: a false positive silently
 * skips music the listener wanted.
 */
describe('isTuningTrack', () => {
  it('matches the plain forms, which are most of them', () => {
    // "tuning" alone accounts for 756 of the ~1,000 tuning tracks in the catalog.
    for (const title of ['Tuning', 'tuning', 'Tune up', 'Tune-up', 'Tunings']) {
      expect([title, isTuningTrack(title)]).toEqual([title, true]);
    }
  });

  it('matches tuning run together with crowd noise and stage chatter', () => {
    for (const title of [
      'crowd/tuning',
      'tuning/crowd',
      'crowd and tuning',
      'crowd & tuning',
      'tuning & intro',
      'tuning/banter',
      'introduction and tuning',
      'tuning / stage banter',
      'tuning and noodling',
      'instrument change/tuning',
      'broken string/tuning',
      'tuning/false start',
      'announcements + tune up',
      'talk and tunings',
      'phil tuning',
      'tuning, noodling, ect',
    ]) {
      expect([title, isTuningTrack(title)]).toEqual([title, true]);
    }
  });

  it('sees through the taper formatting around it', () => {
    for (const title of [
      'Set 2: crowd noise/tuning >',
      'tuning :15',
      'tuning/crowd (to end of reel)',
      'tuning ->',
    ]) {
      expect([title, isTuningTrack(title)]).toEqual([title, true]);
    }
  });

  it('leaves a track alone when a performance is bundled with the tuning', () => {
    for (const title of [
      'Tuning > Bertha >',
      'tuning/Franklin\'s Tower',
      'tunings > Passenger',
      'Sugar Magnolia tuning',
      'Miles tuning > Johnny B. Goode',
      'Spanish Jam tuning',
      'tuning -> Spoonful Jam',
      'tuning/neat lil jerry jam >',
      'tuning/jam',
      'some bits of Lazy Lightning and some tuning and banter',
    ]) {
      expect([title, isTuningTrack(title)]).toEqual([title, false]);
    }
  });

  it('keeps the snippets the band clowns through while tuning', () => {
    // The whole reason someone collects these tapes.
    for (const title of [
      'Beer Barrel Polka tuning',
      'Twilight Zone theme tuning',
      "Addam's Family tuning",
      'Mexican Hat Dance tuning',
      'Happy Birthday tuning ->',
      'Stars & Stripes tuning',
      'tico tico/tuning',
      'Take a step back/tuning',
      // A single occurrence, and "spacey" describes something being played.
      // Not worth loosening the vocabulary to catch.
      'spacey tuning->',
    ]) {
      expect([title, isTuningTrack(title)]).toEqual([title, false]);
    }
  });

  it('ignores ordinary songs, including ones with "tune" in the name', () => {
    for (const title of [
      'Scarlet Begonias',
      'Dark Star',
      "Merl's Tune",
      'Muddy Waters tune',
      'Blues tune',
      'Playing in the Band',
      '',
    ]) {
      expect([title, isTuningTrack(title)]).toEqual([title, false]);
    }
  });

  it('tolerates a missing title', () => {
    expect(isTuningTrack(undefined)).toBe(false);
    expect(isTuningTrack(null)).toBe(false);
  });
});

describe('queueWithoutTuning', () => {
  const tracks = [
    { id: 'a', title: 'Tuning' },
    { id: 'b', title: 'Bertha' },
    { id: 'c', title: 'crowd/tuning' },
    { id: 'd', title: 'Jack Straw' },
    { id: 'e', title: 'Tuning > Bertha >' },
  ];

  it('hands back the whole show when the setting is off', () => {
    expect(queueWithoutTuning(tracks, tracks[1], false)).toEqual(tracks);
  });

  it('drops the tuning, keeping tracks that contain music', () => {
    expect(queueWithoutTuning(tracks, tracks[1], true).map((t) => t.id))
      .toEqual(['b', 'd', 'e']);
  });

  it('keeps a tuning track the listener asked for by name', () => {
    expect(queueWithoutTuning(tracks, tracks[0], true).map((t) => t.id))
      .toEqual(['a', 'b', 'd', 'e']);
  });

  it('leaves a show that is nothing but tuning alone, rather than emptying the queue', () => {
    const allTuning = [{ id: 'x', title: 'Tuning' }, { id: 'y', title: 'Tune up' }];
    expect(queueWithoutTuning(allTuning, { id: 'z', title: 'Tuning' }, true)).toEqual(allTuning);
  });

  it('does not mutate the playlist it was given', () => {
    const original = [...tracks];
    queueWithoutTuning(tracks, tracks[1], true);
    expect(tracks).toEqual(original);
  });
});
