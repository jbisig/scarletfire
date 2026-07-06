import { useCallback, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useToast } from '../contexts/ToastContext';
import { archiveApi } from '../services/archiveApi';
import { logger } from '../utils/logger';

export interface UsePlaySavedSongResult {
  /** `${trackId}-${showIdentifier}` of the song currently being loaded, or null. Drives a row's spinner/`isLoading` prop — expected to change identity on every press. */
  loadingSongId: string | null;
  /** Fetches the show, finds the matching track by id, and loads it into the player. playSong's identity follows loadTrack's (re-created on playback-mode changes); stable enough for renderItem dep arrays in practice — full ref-stabilization is planned in the PlayerContext state/actions split. */
  playSong: (showIdentifier: string, trackId: string) => Promise<void>;
}

/**
 * Encapsulates the "play a saved song" flow duplicated across
 * FavoritesScreen and PublicProfileScreen: fetch the show detail, find the
 * track by id, hand it to the player, and surface an error toast if
 * anything fails — with a per-row loading id in between so the pressed
 * row can show a spinner.
 *
 * SongPerformancesScreen has a similar-looking press handler, but it
 * resolves the track by fuzzy slug/title match (`matchTrackBySlug`) rather
 * than by id, and falls back to navigating to ShowDetail on a miss or
 * error instead of toasting — different enough semantics that it isn't a
 * fit for this hook and is left as-is.
 */
export function usePlaySavedSong(): UsePlaySavedSongResult {
  const { loadTrack } = usePlayer();
  const { showToast } = useToast();
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);

  const playSong = useCallback(async (showIdentifier: string, trackId: string) => {
    try {
      setLoadingSongId(`${trackId}-${showIdentifier}`);

      // Fetch the show details to get all tracks
      const showDetail = await archiveApi.getShowDetail(showIdentifier);

      // Find the matching track
      const track = showDetail.tracks.find(t => t.id === trackId);

      if (track) {
        await loadTrack(track, showDetail, showDetail.tracks);
      }
    } catch (error) {
      logger.player.error('Failed to load song:', error);
      showToast("Couldn't load that song", 'error');
    } finally {
      setLoadingSongId(null);
    }
  }, [loadTrack, showToast]);

  return { loadingSongId, playSong };
}
