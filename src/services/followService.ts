import { authService } from './authService';
import { logger } from '../utils/logger';

export interface FollowUser {
  id: string;
  username: string;
  display_name: string | null;
  avatarUrl: string | null;
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

  async getFollowers(userId: string): Promise<FollowUser[]> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('user_follows')
      .select('follower:profiles!user_follows_follower_id_fkey(id, username, display_name, is_public)')
      .eq('following_id', userId);
    if (error) throw error;
    const rows = (data ?? []).map((r: any) => r.follower).filter((p: any) => p && p.is_public);
    return Promise.all(rows.map(async (p: any) => ({
      id: p.id, username: p.username, display_name: p.display_name,
      avatarUrl: await this.resolveAvatarUrl(p.id),
    })));
  }

  async getFollowing(userId: string): Promise<FollowUser[]> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('user_follows')
      .select('following:profiles!user_follows_following_id_fkey(id, username, display_name, is_public)')
      .eq('follower_id', userId);
    if (error) throw error;
    const rows = (data ?? []).map((r: any) => r.following).filter((p: any) => p && p.is_public);
    return Promise.all(rows.map(async (p: any) => ({
      id: p.id, username: p.username, display_name: p.display_name,
      avatarUrl: await this.resolveAvatarUrl(p.id),
    })));
  }
}

export const followService = new FollowService();
