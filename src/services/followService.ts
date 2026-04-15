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
  async followUser(targetUserId: string): Promise<void> { throw new Error('not implemented'); }
  async unfollowUser(targetUserId: string): Promise<void> { throw new Error('not implemented'); }
  async removeFollower(followerUserId: string): Promise<void> { throw new Error('not implemented'); }
  async getFollowCounts(userId: string): Promise<FollowCounts> { throw new Error('not implemented'); }
  async getFollowers(userId: string): Promise<FollowUser[]> { throw new Error('not implemented'); }
  async getFollowing(userId: string): Promise<FollowUser[]> { throw new Error('not implemented'); }
  async isFollowing(targetUserId: string): Promise<boolean> { throw new Error('not implemented'); }
}

export const followService = new FollowService();
