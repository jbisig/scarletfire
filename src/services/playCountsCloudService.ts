import { PlayCount } from '../contexts/PlayCountsContext';
import { authService } from './authService';

class PlayCountsCloudService {
  private get supabase() {
    return authService.getClient();
  }

  /**
   * Sync all play counts to cloud for a user
   * Pass the complete, already-updated list to avoid read-modify-write patterns
   */
  async syncPlayCounts(userId: string, playCounts: PlayCount[]): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) return;

    const { error } = await this.supabase
      .from('user_play_counts')
      .upsert({
        user_id: userId,
        play_counts: playCounts,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async loadPlayCounts(userId: string): Promise<PlayCount[]> {
    const { data, error } = await this.supabase
      .from('user_play_counts')
      .select('play_counts')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      return [];  // No record yet
    }
    if (error) throw error;

    return data?.play_counts || [];
  }
}

export const playCountsCloudService = new PlayCountsCloudService();
