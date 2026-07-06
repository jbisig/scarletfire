import { Track, ShowDetail } from '../types/show.types';
import { FavoriteSong } from '../contexts/FavoritesContext';
import { getVenueFromShow } from './formatters';

/**
 * Build a FavoriteSong from a track + the show it belongs to. Canonical
 * factory for the shape that used to be hand-built at five separate call
 * sites (ShowDetailScreen, FullPlayer x2, web/PlayerBar, FavoritesScreen) —
 * see Task 18. Always derives `venue` via getVenueFromShow (title-derived,
 * falling back to the raw venue field) rather than using show.venue
 * directly, so favorited songs get the same venue name shown everywhere
 * else in the app.
 */
export function toFavoriteSong(track: Track, show: ShowDetail): FavoriteSong {
  return {
    trackId: track.id,
    trackTitle: track.title,
    showIdentifier: show.identifier,
    showDate: show.date,
    venue: getVenueFromShow(show),
    streamUrl: track.streamUrl,
  };
}
