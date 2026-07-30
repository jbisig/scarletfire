import { buildRadioPool } from '../radioPool';
import { TIER_1_SONG_PERFORMANCES } from '../../data/songPerformanceRatings';
import { setPerformanceUserRating, resetStoreForTests } from '../../services/userRatingsStore';

beforeEach(() => resetStoreForTests());

it('with no overrides, pool equals the system tier-1 list', () => {
  expect(buildRadioPool()).toHaveLength(TIER_1_SONG_PERFORMANCES.length);
});

it('downgrading a system tier-1 performance removes it from the pool', () => {
  const victim = TIER_1_SONG_PERFORMANCES[0];
  setPerformanceUserRating(victim.songTitle, victim.showDate, 1);
  const pool = buildRadioPool();
  expect(pool).toHaveLength(TIER_1_SONG_PERFORMANCES.length - 1);
  expect(pool.find(p => p.songTitle === victim.songTitle && p.showDate === victim.showDate)).toBeUndefined();
});

it('a user 3-star rating with an identifier joins the pool as tier 1', () => {
  setPerformanceUserRating('My Sleeper Jam', '1980-05-01', 3, 'gd1980-05-01.sbd');
  const pool = buildRadioPool();
  const added = pool.find(p => p.songTitle === 'My Sleeper Jam');
  expect(added).toBeDefined();
  expect(added!.tier).toBe(1);
  expect(added!.showIdentifier).toBe('gd1980-05-01.sbd');
});

it('a user 3-star rating WITHOUT an identifier is excluded (cannot resolve audio)', () => {
  setPerformanceUserRating('Mystery Jam', '1980-05-02', 3);
  expect(buildRadioPool().find(p => p.songTitle === 'Mystery Jam')).toBeUndefined();
});

it('re-rating a system tier-1 as 3 stars does not duplicate it', () => {
  const perf = TIER_1_SONG_PERFORMANCES[0];
  setPerformanceUserRating(perf.songTitle, perf.showDate, 3, perf.showIdentifier);
  expect(buildRadioPool()).toHaveLength(TIER_1_SONG_PERFORMANCES.length);
});
