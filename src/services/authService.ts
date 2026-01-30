import { createClient, Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabaseStorage } from './supabaseStorage';
import { CONFIG } from '../constants/config';

// Track if Google Sign-In has been configured
let isGoogleSignInConfigured = false;

function ensureGoogleSignInConfigured() {
  if (!isGoogleSignInConfigured) {
    GoogleSignin.configure({
      webClientId: CONFIG.GOOGLE_WEB_CLIENT_ID,
      iosClientId: CONFIG.GOOGLE_IOS_CLIENT_ID,
    });
    isGoogleSignInConfigured = true;
  }
}

class AuthService {
  private supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      storage: supabaseStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  /**
   * Create a new user account with email and password
   */
  async signUpWithEmail(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
    if (!data.user) throw new Error('No user returned from signup');

    return data.user;
  }

  /**
   * Sign in with email and password
   */
  async loginWithEmail(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from login');

    return data.user;
  }

  /**
   * Sign in with Google
   */
  async loginWithGoogle(): Promise<User> {
    // Configure Google Sign-In on first use
    ensureGoogleSignInConfigured();

    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    // Try both possible response structures (types vary between library versions)
    const idToken = (userInfo as { idToken?: string }).idToken || (userInfo as { data?: { idToken?: string } }).data?.idToken;

    if (!idToken) {
      throw new Error('No ID token present');
    }

    const { data, error } = await this.supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      throw error;
    }
    if (!data.user) throw new Error('No user returned from Google login');

    return data.user;
  }

  /**
   * Sign in with Apple (iOS only)
   */
  async loginWithApple(): Promise<User> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Sign-In is not available on this device');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('No identity token returned from Apple');
    }

    const { data, error } = await this.supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from Apple login');

    return data.user;
  }

  /**
   * Sign out the current user
   */
  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Delete the current user's account and all associated data
   * Requires the delete_user() function to be set up in Supabase
   * See: supabase/delete_user_function.sql
   */
  async deleteAccount(userId: string): Promise<void> {
    // First, delete user's avatar files from storage
    try {
      const { data: files } = await this.supabase.storage
        .from('avatars')
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        await this.supabase.storage
          .from('avatars')
          .remove(filePaths);
      }
    } catch (storageError) {
      console.log('Error deleting avatar files:', storageError);
      // Continue with account deletion even if avatar deletion fails
    }

    // Delete the user via the database function
    // This function must be created in Supabase SQL Editor
    const { error: rpcError } = await this.supabase.rpc('delete_user');

    if (rpcError) {
      console.error('Error deleting user:', rpcError);
      throw new Error('Failed to delete account. Please contact support.');
    }

    // Sign out the user (session cleanup)
    await this.supabase.auth.signOut();
  }

  /**
   * Get the currently signed-in user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.user ?? null;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    // Get initial session
    this.getSession().then((session) => {
      callback(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Expose supabase client for database operations
   */
  getClient() {
    return this.supabase;
  }
}

export const authService = new AuthService();
