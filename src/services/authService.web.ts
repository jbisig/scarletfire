import { createClient, Session, User } from '@supabase/supabase-js';
import { supabaseStorage } from './supabaseStorage';
import { CONFIG } from '../constants/config';
import { logger } from '../utils/logger';

class AuthService {
  private supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      storage: supabaseStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Enable for web OAuth redirects
    },
  });

  async signUpWithEmail(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from signup');
    return data.user;
  }

  async loginWithEmail(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from login');
    return data.user;
  }

  async loginWithGoogle(): Promise<User> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    // OAuth redirects — user will be authenticated on return
    // Return a placeholder; the auth state listener will pick up the session
    throw new Error('Redirecting to Google...');
  }

  async loginWithApple(): Promise<User> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    throw new Error('Redirecting to Apple...');
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      const { data: files } = await this.supabase.storage
        .from('avatars')
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        await this.supabase.storage.from('avatars').remove(filePaths);
      }
    } catch (storageError) {
      logger.auth.warn('Error deleting avatar files:', storageError);
    }

    const { error: rpcError } = await this.supabase.rpc('delete_user');
    if (rpcError) {
      logger.auth.error('Error deleting user:', rpcError);
      throw new Error('Failed to delete account. Please contact support.');
    }

    await this.supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.user ?? null;
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async resetPasswordForEmail(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  onAuthStateChanged(callback: (user: User | null) => void, onPasswordRecovery?: () => void) {
    this.getSession().then((session) => {
      callback(session?.user ?? null);
    });

    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && onPasswordRecovery) {
        onPasswordRecovery();
      }
      callback(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  getClient() {
    return this.supabase;
  }
}

export const authService = new AuthService();
