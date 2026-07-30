import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
// Bare specifier resolves to RatingTray.native.tsx under jest's native-first
// moduleSuffixes; the @gorhom/bottom-sheet mock in setup.ts renders children
// straight through, so the tray body is queryable like any view.
import { RatingTray } from '../../components/rating/RatingTray';
import { UserRatingsProvider } from '../../contexts/UserRatingsContext';
import { resetStoreForTests, getActiveShowRating, setShowUserRating, setPerformanceUserRating } from '../../services/userRatingsStore';
import type { RatingItem } from '../../contexts/RatingOverlayContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ state: { isAuthenticated: false, user: null, isLoading: false } }),
}));
jest.mock('../../hooks/useSyncErrorToast', () => ({ useSyncErrorToast: () => jest.fn() }));
jest.mock('../../services/userRatingsCloudService', () => ({
  userRatingsCloudService: {
    loadRatings: jest.fn().mockResolvedValue({ shows: {}, performances: {} }),
    syncRatings: jest.fn().mockResolvedValue(undefined),
  },
}));

const SHOW_ITEM = { kind: 'show', date: '1977-05-08', venue: 'Barton Hall', location: 'Ithaca, NY' } as const;

const render = async (item: RatingItem | null, onClose = jest.fn()) => {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(
      <UserRatingsProvider>
        <RatingTray item={item} onClose={onClose} />
      </UserRatingsProvider>
    );
  });
  return { tree, onClose };
};

// UserRatingsProvider persists to (mocked) AsyncStorage on every store change
// and reloads from it on mount. The async-storage mock's backing data isn't
// cleared between tests automatically (only resetStoreForTests() clears the
// in-memory store), so a rating saved via one test's provider mount would
// otherwise leak into the next test's fresh provider on its load effect.
beforeEach(async () => {
  resetStoreForTests();
  await AsyncStorage.clear();
});

it('renders nothing when item is null', async () => {
  const { tree } = await render(null);
  expect(tree.root.findAllByProps({ testID: 'rating-overlay' })).toHaveLength(0);
});

// The picker pre-fills the community rating in RED when the user hasn't
// rated; tapping replaces it with the user's rating in gold.
const redFilledStars = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(Ionicons)
    .filter(i => i.props.name === 'star' && i.props.color === COLORS.accent).length;

it('pre-fills the picker red with the community rating for a system-rated show', async () => {
  const { tree } = await render(SHOW_ITEM);
  // Cornell '77 is tier 1 → 3 red stars pre-filled
  expect(redFilledStars(tree)).toBe(3);
});

// Real fixture: rated in the baked catalog (songs.generated.ts) but not in
// the HeadyVersion-derived songPerformanceRatings data. Confirms the overlay
// uses ratingResolver's catalog-fallback-aware helper (resolveSystemPerformanceStars)
// rather than reading getSongPerformanceRating directly, so this row matches
// what ShowDetail's track rows would show for the same performance.
const CATALOG_ONLY_PERFORMANCE = {
  kind: 'performance',
  songTitle: 'China Cat Sunflower > I Know You Rider',
  date: '1979-12-26',
  venue: 'Oakland Auditorium Arena',
} as const;

it('pre-fills the picker for a performance rated only in the baked catalog', async () => {
  const { tree } = await render(CATALOG_ONLY_PERFORMANCE);
  expect(redFilledStars(tree)).toBeGreaterThan(0);
});

// Store commits are deferred one tick behind the optimistic UI update
// (see useRatingTrayState) — flush the macrotask before asserting.
const flushDeferredCommit = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

it('selecting stars saves the user rating', async () => {
  const { tree } = await render(SHOW_ITEM);
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: 'Rate 1 star' }).props.onPress();
  });
  await flushDeferredCommit();
  expect(getActiveShowRating('1977-05-08')!.stars).toBe(1);
});

it('reset button appears only with an override and tombstones it', async () => {
  const { tree: before } = await render(SHOW_ITEM);
  expect(before.root.findAllByProps({ testID: 'reset-rating-button' })).toHaveLength(0);

  setShowUserRating('1977-05-08', 2);
  const { tree } = await render(SHOW_ITEM);
  const resets = tree.root.findAllByProps({ testID: 'reset-rating-button' });
  expect(resets.length).toBeGreaterThan(0);
  // Label names the community rating it resets to (Cornell '77 = 3 stars)
  expect(resets[0].props.accessibilityLabel).toBe('Reset to community rating (3 stars)');
  await act(async () => { resets[0].props.onPress(); });
  await flushDeferredCommit();
  expect(getActiveShowRating('1977-05-08')).toBeNull();
});

it('performance trays use the identical reset-label format as show trays', async () => {
  // Playing In The Band 1972-08-27 is a system tier-1 performance (3 stars).
  const PERF_ITEM = {
    kind: 'performance',
    songTitle: 'Playing In The Band',
    date: '1972-08-27',
    venue: 'Veneta, OR',
  } as const;
  setPerformanceUserRating('Playing In The Band', '1972-08-27', 1);
  const { tree } = await render(PERF_ITEM);
  const resets = tree.root.findAllByProps({ testID: 'reset-rating-button' });
  expect(resets[0].props.accessibilityLabel).toBe('Reset to community rating (3 stars)');
});

it('user rating shows gold and replaces the red community pre-fill', async () => {
  setShowUserRating('1977-05-08', 1);
  const { tree } = await render(SHOW_ITEM);
  expect(redFilledStars(tree)).toBe(0);
  const goldFilled = tree.root
    .findAllByType(Ionicons)
    .filter(i => i.props.name === 'star' && i.props.color === COLORS.userRating).length;
  expect(goldFilled).toBe(1);
});
