import { PlayCount } from '../contexts/PlayCountsContext';
import { authService } from './authService';

class PlayCountsCloudService {
  private get supabase() {
    return authService.getClient();
  }

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

  async incrementPlayCount(
    userId: string,
    trackTitle: string,
    showIdentifier: string,
    showDate: string
  ): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) return;

    // Fetch current counts
    const currentCounts = await this.loadPlayCounts(userId);

    // Find or create the count entry
    const existingIndex = currentCounts.findIndex(
      pc => pc.trackTitle === trackTitle && pc.showIdentifier === showIdentifier
    );

    const now = Date.now();
    let updatedCounts: PlayCount[];

    if (existingIndex >= 0) {
      updatedCounts = [...currentCounts];
      updatedCounts[existingIndex] = {
        ...updatedCounts[existingIndex],
        count: updatedCounts[existingIndex].count + 1,
        lastPlayedAt: now,
      };
    } else {
      updatedCounts = [
        ...currentCounts,
        {
          trackTitle,
          showIdentifier,
          showDate,
          count: 1,
          firstPlayedAt: now,
          lastPlayedAt: now,
        },
      ];
    }

    // Save back
    await this.syncPlayCounts(userId, updatedCounts);
  }
}

export const playCountsCloudService = new PlayCountsCloudService();
