import { authService } from './authService';
import { SUPABASE_TABLES } from '../constants/registry';
import { normalizeSourcePrefs, SourcePrefs } from './sourcePrefsStore';

class UserPreferencesCloudService {
  private get supabase() {
    return authService.getClient();
  }

  /** Whole-blob upsert; the row is the unit of sync (merge happens client-side). */
  async syncPrefs(userId: string, prefs: SourcePrefs): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) return;

    const { error } = await this.supabase
      .from(SUPABASE_TABLES.USER_PREFERENCES)
      .upsert({
        user_id: userId,
        prefs: {
          preference: prefs.preference,
          preferenceSetAt: prefs.preferenceSetAt,
          nudgeAnswers: prefs.nudgeAnswers,
        },
        pins: prefs.pins,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;
  }

  async loadPrefs(userId: string): Promise<SourcePrefs> {
    const { data, error } = await this.supabase
      .from(SUPABASE_TABLES.USER_PREFERENCES)
      .select('prefs, pins')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return normalizeSourcePrefs(null);
      throw error;
    }

    return normalizeSourcePrefs({ ...(data?.prefs ?? {}), pins: data?.pins ?? {} });
  }
}

export const userPreferencesCloudService = new UserPreferencesCloudService();
