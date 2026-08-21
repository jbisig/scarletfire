import { authService } from './authService';
import type { UserRatings } from './userRatingsStore';
import { SUPABASE_TABLES } from '../constants/registry';

class UserRatingsCloudService {
  private get supabase() {
    return authService.getClient();
  }

  /** Upsert the complete ratings blob for a user. No-op when logged out. */
  async syncRatings(userId: string, ratings: UserRatings): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) return;

    const { error } = await this.supabase
      .from(SUPABASE_TABLES.USER_RATINGS)
      .upsert({
        user_id: userId,
        shows: ratings.shows,
        performances: ratings.performances,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }

  /** Load ratings from cloud; empty ratings if the user has no row yet. */
  async loadRatings(userId: string): Promise<UserRatings> {
    const { data, error } = await this.supabase
      .from(SUPABASE_TABLES.USER_RATINGS)
      .select('shows, performances')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { shows: {}, performances: {} };
      }
      throw error;
    }

    return {
      shows: data?.shows || {},
      performances: data?.performances || {},
    };
  }
}

export const userRatingsCloudService = new UserRatingsCloudService();
