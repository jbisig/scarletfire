// src/services/activityService.ts
import { authService } from './authService';
import { logger } from '../utils/logger';

export type ActivityEventType =
  | 'listened_show'
  | 'favorited_show'
  | 'created_collection'
  | 'saved_collection'
  | 'followed_user';

export type ActivityTargetType = 'show' | 'collection' | 'user';

export interface ActivityEvent {
  id: string;
  actor_id: string;
  event_type: ActivityEventType;
  target_type: ActivityTargetType;
  target_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  source: 'following' | 'public';
}

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

class ActivityService {
  async emitEvent(
    type: ActivityEventType,
    targetType: ActivityTargetType,
    targetId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    try {
      const supabase = authService.getClient();
      const { data: userData } = await supabase.auth.getUser();
      const me = userData?.user?.id;
      if (!me) return;

      // Privacy gate: skip emission if profile is not public.
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_public')
        .eq('id', me)
        .single();
      if (!profile || !profile.is_public) return;

      // Dedupe: skip if same (actor, type, target) exists in last 24h.
      const cutoff = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
      const { data: recent } = await supabase
        .from('activity_events')
        .select('id')
        .eq('actor_id', me)
        .eq('event_type', type)
        .eq('target_id', targetId)
        .gte('created_at', cutoff)
        .limit(1);
      if (recent && recent.length > 0) return;

      const { error } = await supabase
        .from('activity_events')
        .insert({
          actor_id: me,
          event_type: type,
          target_type: targetType,
          target_id: targetId,
          metadata,
        });
      if (error) {
        logger.create('activity').error('emitEvent insert failed', error);
      }
    } catch (err) {
      logger.create('activity').error('emitEvent error', err);
    }
  }
}

export const activityService = new ActivityService();
