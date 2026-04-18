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
  actor_username: string;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
}

const activityLogger = logger.create('activity');

// Day-bucket unique index on (actor_id, event_type, target_id, date_trunc('day', created_at))
// lets Postgres dedupe on insert via ON CONFLICT DO NOTHING.
const DEDUPE_CONFLICT_TARGET =
  'actor_id,event_type,target_id,date_trunc(\'day\'::text, created_at)';

class ActivityService {
  private isPublicCache: { userId: string; value: boolean } | null = null;
  private unsubscribeAuth: (() => void) | null = null;

  constructor() {
    // Invalidate cache on auth state changes (sign-in / sign-out / user-switch).
    if (typeof authService.onAuthStateChanged === 'function') {
      this.unsubscribeAuth = authService.onAuthStateChanged(() => {
        this.isPublicCache = null;
      });
    }
  }

  /**
   * Test-only: reset the is_public cache between test cases and re-subscribe
   * to auth state changes so the test can capture the callback. Not called in prod.
   */
  __resetCacheForTest(): void {
    this.isPublicCache = null;
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
    if (typeof authService.onAuthStateChanged === 'function') {
      this.unsubscribeAuth = authService.onAuthStateChanged(() => {
        this.isPublicCache = null;
      });
    }
  }

  private async ensureIsPublic(userId: string): Promise<boolean> {
    if (this.isPublicCache && this.isPublicCache.userId === userId) {
      return this.isPublicCache.value;
    }
    const supabase = authService.getClient();
    const { data } = await supabase
      .from('profiles')
      .select('is_public')
      .eq('id', userId)
      .single();
    const value = Boolean(data?.is_public);
    this.isPublicCache = { userId, value };
    return value;
  }

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

      const isPublic = await this.ensureIsPublic(me);
      if (!isPublic) return;

      const { error } = await supabase
        .from('activity_events')
        .upsert(
          {
            actor_id: me,
            event_type: type,
            target_type: targetType,
            target_id: targetId,
            metadata,
          },
          { onConflict: DEDUPE_CONFLICT_TARGET, ignoreDuplicates: true },
        );
      if (error) {
        // 23505 = unique_violation: duplicate event in the dedupe window. Expected.
        // With ignoreDuplicates: true supabase-js returns { data: null, error: null }
        // on conflict, so this branch is rarely reached — kept as defense in depth.
        if ((error as any).code !== '23505') {
          activityLogger.error('emitEvent upsert failed', error);
        }
      }
    } catch (err) {
      activityLogger.error('emitEvent error', err);
    }
  }
}

export const activityService = new ActivityService();
