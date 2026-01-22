import { createClient, Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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

    // Try both possible response structures
    const idToken = userInfo.idToken || userInfo.data?.idToken;

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
   * Sign out the current user
   */
  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get the currently signed-in user
   */
  getCurrentUser(): User | null {
    return this.supabase.auth.getSession().then(({ data }) => data.session?.user ?? null) as any;
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
