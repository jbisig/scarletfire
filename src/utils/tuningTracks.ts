/**
 * Recognises tracks that are only the band tuning up, so playback can roll past
 * them when the user has asked it to.
 *
 * Archive.org taper labels are free text, and across the 42,792 track titles in
 * the catalog roughly 1,000 of them are tuning in 91 different spellings —
 * "Tuning", "Tune up", "crowd/tuning", "tuning & intro", "Set 2: crowd
 * noise/tuning >".
 *
 * Matching those with a pattern is the wrong way round, because the dangerous
 * cases are the ones where a real performance sits next to the word: "Tuning >
 * Bertha", "Sugar Magnolia tuning", "Miles tuning > Johnny B. Goode". So this
 * works subtractively instead — strip the filler away and see whether anything
 * is left. If something is, the track has music in it and is left alone.
 *
 * That deliberately keeps the tracks where the band clowns through a
 * recognisable snippet while tuning — "Beer Barrel Polka tuning", "Twilight
 * Zone theme tuning", "Addam's Family tuning" — which are the opposite of
 * filler to anyone who cares enough to turn this setting on.
 */

/**
 * Everything a track can consist of and still be worth skipping. Ordered
 * longest-first so "crowd noise" is consumed before "crowd" and "introduction"
 * before "intro", which would otherwise leave "duction" behind and save the
 * track from being matched.
 */
const FILLER_PHRASES: readonly string[] = [
  'instrument change', 'stage banter', 'crowd chatter', 'crowd noise',
  'stage talk', 'false start', 'broken string', 'encore break', 'goofing off',
  'announcements', 'introduction', 'announcement', 'announcers', 'set break',
  'dead air', 'announcer', 'noodling', 'chatting', 'applause', 'audience',
  'chatter', 'silence', 'banter', 'talking', 'ditties', 'tune-up', 'tune up',
  'tuneup', 'tunings', 'pre-encore', 'crowd', 'intro', 'pause', 'noise',
  'tuning', 'encore', 'tunes', 'talk', 'tune', 'ect', 'etc',
  // Taper labels routinely name whoever is doing the tuning.
  'garcia', 'mickey', 'brent', 'bobby', 'donna', 'billy', 'jerry', 'keith',
  'weir', 'lesh', 'phil', 'band', 'bob',
];

/** Left over once the filler is gone, and still not music. */
const CONNECTIVES = /\b(and|with|some|bits|of|the|a|an|to|from|for|in|out|up|down|explains|then)\b/g;

const MENTIONS_TUNING = /tun(e|ing)/;

/**
 * Is this track nothing but tuning, crowd noise and stage chatter?
 *
 * Returns false for anything containing an actual performance, however the
 * taper ran it together with the tuning.
 */
export function isTuningTrack(title: string | undefined | null): boolean {
  let text = String(title ?? '').toLowerCase();
  if (!MENTIONS_TUNING.test(text)) return false;

  text = text
    .replace(/\([^)]*\)/g, ' ')              // "(to end of reel)"
    .replace(/["'‘’“”]/g, ' ')
    .replace(/^set\s*\d+\s*[:.]?\s*/, ' ')   // "Set 2: crowd noise/tuning"
    .replace(/[:;]\s*\d+\s*$/, ' ')          // "tuning :15"
    .replace(/\s*(->|-->|>|→)\s*/g, ' / ');

  for (const phrase of FILLER_PHRASES) {
    text = text.split(phrase).join(' ');
  }

  return text.replace(CONNECTIVES, ' ').replace(/[^a-z0-9]/g, '').length === 0;
}

/**
 * The queue to hand the player: the same tracks, minus the tuning, when the
 * user has asked for that.
 *
 * Filtering the queue rather than intercepting each skip means every way of
 * advancing reads the same list — auto-advance at the end of a track, the next
 * and previous buttons, and the lock-screen controls.
 *
 * `requested` always survives. The setting automates skipping; it does not
 * forbid playing a tuning track you asked for by name. The show's track list is
 * untouched, so the recording's real contents stay visible.
 */
export function queueWithoutTuning<T extends { id: string; title?: string }>(
  playlist: readonly T[],
  requested: T,
  skipTuning: boolean,
): T[] {
  if (!skipTuning) return [...playlist];
  const kept = playlist.filter((t) => t.id === requested.id || !isTuningTrack(t.title));
  // A show that is nothing but tuning would otherwise leave an empty queue.
  return kept.length > 0 ? kept : [...playlist];
}
