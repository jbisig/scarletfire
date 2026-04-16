import * as ImagePicker from 'expo-image-picker';
import { User } from '@supabase/supabase-js';
import { authService } from './authService';
import { followService } from './followService';
import { Alert } from 'react-native';
import { logger } from '../utils/logger';
import { GratefulDeadShow } from '../types/show.types';
import { FavoriteSong } from './favoritesCloudService';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  is_public: boolean;
  avatar_url: string | null;
  profile_setup_dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicProfileData {
  profile: UserProfile;
  avatarUrl: string | null;
  favorites: {
    shows: GratefulDeadShow[];
    songs: FavoriteSong[];
  };
  playCounts: Array<{ trackId: string; trackTitle: string; showIdentifier: string; showDate: string; count: number; lastPlayedAt: number; firstPlayedAt: number }>;
  followerCount: number;
  followingCount: number;
  viewerIsFollowing: boolean;
}

class ProfileService {
  /**
   * Get the avatar URL from user metadata
   * Handles both Google OAuth avatars and custom uploaded avatars
   */
  getAvatarUrl(user: User | null): string | null {
    if (!user) return null;

    // Check user_metadata for custom avatar first, then fall back to OAuth avatar
    const meta = user.user_metadata;
    if (meta?.avatar_url) return meta.avatar_url;
    if (meta?.picture) return meta.picture;

    // Fallback: check identity data (Google OAuth stores picture here too)
    const identity = user.identities?.[0]?.identity_data;
    if (identity?.avatar_url) return identity.avatar_url;
    if (identity?.picture) return identity.picture;

    return null;
  }

  /**
   * Upload an avatar image to Supabase Storage
   */
  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    const supabase = authService.getClient();

    // Create a unique filename using timestamp
    const timestamp = Date.now();
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar-${timestamp}.${fileExt}`;

    // Fetch the image and convert to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Convert blob to ArrayBuffer for Supabase upload
    const arrayBuffer = await new Response(blob).arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      logger.profile.error('Upload error:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Sync profiles.avatar_url so cross-user views pick it up.
    await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return urlData.publicUrl;
  }

  /**
   * Update user metadata with new avatar URL. Also syncs profiles.avatar_url
   * so cross-user surfaces (public profile, activity feed) can display it.
   */
  async updateAvatarUrl(url: string | null): Promise<void> {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: url },
    });

    if (error) {
      throw new Error(`Failed to update avatar: ${error.message}`);
    }

    if (userId) {
      await supabase
        .from('profiles')
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  }

  /**
   * Combined function: Pick image, upload, and update user metadata
   */
  async changeProfilePicture(userId: string): Promise<string | null> {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your profile picture.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const imageUri = result.assets[0].uri;

    try {
      // Upload to storage
      const publicUrl = await this.uploadAvatar(userId, imageUri);

      // Update user metadata
      await this.updateAvatarUrl(publicUrl);

      return publicUrl;
    } catch (error) {
      logger.profile.error('Error changing profile picture:', error);
      Alert.alert(
        'Upload Failed',
        'There was a problem uploading your profile picture. Please try again.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createProfile(userId: string, username: string): Promise<UserProfile> {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const metaAvatar = this.getAvatarUrl(userData?.user ?? null);
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username.toLowerCase(),
        avatar_url: metaAvatar,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Insert a fully-formed profile row from the onboarding flow. Sets the
   * dismissal timestamp so the prompt never fires for this user again.
   */
  async completeProfileOnboarding(
    userId: string,
    input: { username: string; displayName?: string },
  ): Promise<UserProfile> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: input.username.toLowerCase(),
        display_name: input.displayName?.trim() ? input.displayName.trim() : null,
        is_public: true,
        profile_setup_dismissed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUsername(userId: string, username: string): Promise<UserProfile> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    const supabase = authService.getClient();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName || null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }

  async setProfilePublic(userId: string, isPublic: boolean): Promise<void> {
    const supabase = authService.getClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return data === null;
  }

  /**
   * Look up a profile's id + display name by username, WITHOUT the is_public gate.
   * Used for universal-link features (e.g. shared collection URLs) where the
   * content is intended to be viewable regardless of profile visibility.
   * Do not use this to decide whether a profile is publicly listed — use
   * getPublicProfile for that.
   */
  async getProfileIdByUsername(
    username: string,
  ): Promise<{ id: string; username: string; display_name: string | null } | null> {
    const supabase = authService.getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    if (error || !data) return null;
    return data;
  }

  async getPublicProfile(username: string): Promise<PublicProfileData | null> {
    const supabase = authService.getClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (profileError || !profile) return null;

    // Allow the signed-in user to view their own profile even if private —
    // gives private users a way to reach their followers/following lists.
    if (!profile.is_public) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id !== profile.id) return null;
    }

    const [favResult, playResult, counts, viewerIsFollowing] = await Promise.all([
      supabase
        .from('user_favorites')
        .select('shows, songs')
        .eq('user_id', profile.id)
        .single(),
      supabase
        .from('user_play_counts')
        .select('play_counts')
        .eq('user_id', profile.id)
        .single(),
      followService.getFollowCounts(profile.id),
      followService.isFollowing(profile.id),
    ]);

    // Prefer profiles.avatar_url (covers OAuth + uploaded); fall back to
    // Storage bucket lookup for pre-migration uploaders who haven't re-uploaded.
    let avatarUrl: string | null = profile.avatar_url ?? null;
    if (!avatarUrl) {
      const { data: avatarFiles } = await supabase.storage
        .from('avatars')
        .list(profile.id, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
      if (avatarFiles && avatarFiles.length > 0) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${profile.id}/${avatarFiles[0].name}`);
        avatarUrl = urlData.publicUrl;
      }
    }

    const favorites = {
      shows: favResult.data?.shows || [],
      songs: favResult.data?.songs || [],
    };

    const playCounts = playResult.data?.play_counts || [];

    return {
      profile,
      avatarUrl,
      favorites,
      playCounts,
      followerCount: counts.followers,
      followingCount: counts.following,
      viewerIsFollowing,
    };
  }

  /**
   * Fetch a minimal profile by user ID — used for activity feed actor lookups.
   * Returns username, display_name, and avatarUrl without the is_public gate.
   */
  async getProfileById(
    id: string,
  ): Promise<{ username: string; display_name: string | null; avatarUrl: string | null } | null> {
    const supabase = authService.getClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', id)
      .maybeSingle();
    if (!profile) return null;

    // Prefer profiles.avatar_url; fall back to Storage bucket lookup for
    // pre-migration uploaders who haven't re-uploaded yet.
    let avatarUrl: string | null = profile.avatar_url ?? null;
    if (!avatarUrl) {
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(id, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
      if (files && files.length > 0) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(`${id}/${files[0].name}`);
        avatarUrl = data.publicUrl;
      }
    }

    return { username: profile.username, display_name: profile.display_name, avatarUrl };
  }

  /**
   * Remove the user's custom avatar
   */
  async removeAvatar(userId: string): Promise<void> {
    const supabase = authService.getClient();

    // List files in user's folder to find and delete them
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(userId);

    if (listError) {
      logger.profile.error('Error listing avatar files:', listError);
    }

    // Delete all avatar files for this user
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filePaths);

      if (deleteError) {
        logger.profile.error('Error deleting avatar files:', deleteError);
      }
    }

    // Clear avatar_url in user metadata
    await this.updateAvatarUrl(null);
  }
}

export const profileService = new ProfileService();
