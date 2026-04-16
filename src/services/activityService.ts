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
    throw new Error('not implemented');
  }
}

export const activityService = new ActivityService();
