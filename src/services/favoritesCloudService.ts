import { authService } from './authService';
import { GratefulDeadShow } from '../types/show.types';

export interface FavoriteSong {
  trackId: string;
  trackTitle: string;
  showIdentifier: string;
  showDate: string;
  venue?: string;
  streamUrl: string;
  savedAt?: number; // Unix timestamp when saved
  deletedAt?: number; // Unix timestamp when soft-deleted (for sync conflict resolution)
}

class FavoritesCloudService {
  private get supabase() {
    return authService.getClient();
  }

  /**
   * Sync all favorites to cloud for a user
   * This is the primary method - pass the complete, already-updated lists
   * to avoid read-modify-write patterns
   */
  async syncFavorites(userId: string, shows: GratefulDeadShow[], songs: FavoriteSong[]): Promise<void> {
    // Ensure we have a valid session
    const { data: { session } } = await this.supabase.auth.getSession();

    if (!session) {
      return;
    }

    const { error } = await this.supabase
      .from('user_favorites')
      .upsert({
        user_id: userId,
        shows,
        songs,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Load favorites from cloud for a user
   */
  async loadFavorites(userId: string): Promise<{ shows: GratefulDeadShow[], songs: FavoriteSong[] }> {
    const { data, error } = await this.supabase
      .from('user_favorites')
      .select('shows, songs')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no record exists yet, return empty arrays
      if (error.code === 'PGRST116') {
        return { shows: [], songs: [] };
      }
      throw error;
    }

    return {
      shows: data?.shows || [],
      songs: data?.songs || [],
    };
  }
}

export const favoritesCloudService = new FavoritesCloudService();
