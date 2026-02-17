import * as ImagePicker from 'expo-image-picker';
import { User } from '@supabase/supabase-js';
import { authService } from './authService';
import { Alert } from 'react-native';
import { logger } from '../utils/logger';

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

    return urlData.publicUrl;
  }

  /**
   * Update user metadata with new avatar URL
   */
  async updateAvatarUrl(url: string | null): Promise<void> {
    const supabase = authService.getClient();

    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: url },
    });

    if (error) {
      throw new Error(`Failed to update avatar: ${error.message}`);
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
