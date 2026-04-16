import { authService } from './authService';
import { logger } from '../utils/logger';
import { activityService } from './activityService';

export interface FollowUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

class FollowService {
  private async currentUserId(): Promise<string> {
    const supabase = authService.getClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw new Error('Must be signed in');
    return data.user.id;
  }

  async followUser(targetUserId: string): Promise<void> {
    const me = await this.currentUserId();
    const supabase = authService.getClient();
    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: me, following_id: targetUserId });
    if (error) throw error;

    // Look up the target's public status + display info for the event metadata.
    const { data: target } = await supabase
      .from('profiles')
      .select('is_public, username, display_name')
      .eq('id', targetUserId)
      .single();

    if (target?.is_public) {
      await activityService.emitEvent('followed_user', 'user', targetUserId, {
        username: target.username,
        display_name: target.display_name,
      });
    }
  }

  async unfollowUser(targetUserId: string): Promise<void> {
    const me = await this.currentUserId();
    const supabase = authService.getClient();
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .match({ follower_id: me, following_id: targetUserId });
    if (error) throw error;
  }

  async removeFollower(followerUserId: string): Promise<void> {
    const me = await this.currentUserId();
    const supabase = authService.getClient();
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .match({ follower_id: followerUserId, following_id: me });
    if (error) throw error;
  }

  async getFollowCounts(userId: string): Promise<FollowCounts> {
    const supabase = authService.getClient();
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return { followers: followersRes.count ?? 0, following: followingRes.count ?? 0 };
  }

  async isFollowing(targetUserId: string): Promise<boolean> {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const me = userData?.user?.id;
    if (!me) return false;
    const { data, error } = await supabase
      .from('user_follows')
      .select('follower_id')
      .match({ follower_id: me, following_id: targetUserId })
      .maybeSingle();
    if (error) return false;
    return data !== null;
  }

  private async resolveAvatarUrl(userId: string): Promise<string | null> {
    const supabase = authService.getClient();
    const { data: files } = await supabase.storage
      .from('avatars')
      .list(userId, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
    if (!files || files.length === 0) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(`${userId}/${files[0].name}`);
    return data.publicUrl || null;
  }

  private async hydrateUsers(userIds: string[]): Promise<FollowUser[]> {
    if (userIds.length === 0) return [];
    const supabase = authService.getClient();
    // profiles RLS returns only rows where is_public = true, so any id
    // not returned here is a private user we still want to list as a
    // placeholder.
    const { data: publicProfiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);
    const byId = new Map<string, { username: string; display_name: string | null }>();
    for (const p of publicProfiles ?? []) {
      byId.set(p.id, { username: p.username, display_name: p.display_name });
    }
    return Promise.all(userIds.map(async (id) => {
      const pub = byId.get(id);
      if (!pub) {
        return { id, username: null, display_name: null, avatarUrl: null, isPrivate: true };
      }
      return {
        id,
        username: pub.username,
        display_name: pub.display_name,
        avatarUrl: await this.resolveAvatarUrl(id),
        isPrivate: false,
      };
    }));
  }

  async getFollowers(userId: string): Promise<FollowUser[]> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('user_follows')
      .select('follower_id, created_at')
      .eq('following_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const ids = (data ?? []).map((r: any) => r.follower_id);
    return this.hydrateUsers(ids);
  }

  async getFollowing(userId: string): Promise<FollowUser[]> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id, created_at')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const ids = (data ?? []).map((r: any) => r.following_id);
    return this.hydrateUsers(ids);
  }
}

export const followService = new FollowService();
