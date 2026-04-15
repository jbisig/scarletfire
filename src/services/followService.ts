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

  async getFollowCounts(userId: string): Promise<FollowCounts> { throw new Error('not implemented'); }
  async getFollowers(userId: string): Promise<FollowUser[]> { throw new Error('not implemented'); }
  async getFollowing(userId: string): Promise<FollowUser[]> { throw new Error('not implemented'); }
  async isFollowing(targetUserId: string): Promise<boolean> { throw new Error('not implemented'); }
}

export const followService = new FollowService();
