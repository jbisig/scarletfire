import { GratefulDeadShow } from '../types/show.types';

/**
 * The full ShowDetail nav-param bundle — matches RootStackParamList['ShowDetail']
 * (minus the screen-local `trackTitle` param, which callers add separately
 * when relevant). Deliberately not typed against RootStackParamList itself:
 * importing from '../navigation/AppNavigator' here would risk an import
 * cycle, since every screen that needs this helper is itself imported by
 * AppNavigator.
 */
export interface ShowDetailParams {
  identifier: string;
  venue?: string;
  date: string;
  location?: string;
  classicTier?: 1 | 2 | 3;
}

/**
 * Build the ShowDetail nav-param bundle from a show. Canonical factory for
 * the bundle that used to be hand-built at 8+ navigate/push call sites —
 * see Task 18. Two of those sites (CollectionDetailScreen, PublicProfileScreen)
 * used to omit fields (classicTier, or location + classicTier) even though
 * they had a full show object on hand, which degraded ShowDetail's
 * first-paint header (star rating / location flashing in late). Always
 * returning the full bundle here means callers can't accidentally regress
 * that again.
 */
export function showDetailParams(show: GratefulDeadShow): ShowDetailParams {
  return {
    identifier: show.primaryIdentifier,
    venue: show.venue,
    date: show.date,
    location: show.location,
    classicTier: show.classicTier,
  };
}
