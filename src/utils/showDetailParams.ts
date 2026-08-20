import { GratefulDeadShow } from '../types/show.types';
import { resolveShowIdentifier } from '../services/sourceSelection';
import { SourceConstraint, stringifySourceConstraint } from '../services/recordingResolver';

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
  /** Serialized SourceConstraint (see recordingResolver) — honoured for this visit only. */
  sourceConstraint?: string;
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
 * The identifier is the user's preferred recording for the show, not `primaryIdentifier`.
 */
export function showDetailParams(
  show: GratefulDeadShow,
  opts: { sourceConstraint?: SourceConstraint } = {},
): ShowDetailParams {
  return {
    identifier: resolveShowIdentifier(show, opts.sourceConstraint),
    venue: show.venue,
    date: show.date,
    location: show.location,
    classicTier: show.classicTier,
    sourceConstraint: stringifySourceConstraint(opts.sourceConstraint),
  };
}
