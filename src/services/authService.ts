import { createClient, Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabaseStorage } from './supabaseStorage';

// Supabase configuration
const SUPABASE_URL = 'https://fftvyuykqbixzupxzlmo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdHZ5dXlrcWJpeHp1cHh6bG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjU5MjAsImV4cCI6MjA4NDI0MTkyMH0.bphD6T5CxMNWVT5D8_sy9Ti9IpDhBwYMvTa4dP8qawY';

// Track if Google Sign-In has been configured
let isGoogleSignInConfigured = false;

function ensureGoogleSignInConfigured() {
  if (!isGoogleSignInConfigured) {
    GoogleSignin.configure({
      webClientId: '836998999272-i744r408o0aoqd7r63rfo9j4c2vl6kpr.apps.googleusercontent.com',
      iosClientId: '836998999272-7uijb9j3amrvgvg1g7o8p34pdo0olouk.apps.googleusercontent.com',
    });
    isGoogleSignInConfigured = true;
  }
}

class AuthService {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    console.log('Attempting signup with email:', email);
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    console.log('Signup response:', {
      hasUser: !!data.user,
      hasSession: !!data.session,
      error: error?.message,
    });

    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
    if (!data.user) throw new Error('No user returned from signup');

    console.log('Signup successful, user ID:', data.user.id);
    console.log('Session after signup:', data.session ? 'exists' : 'missing');

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

    console.log('Login successful, session:', data.session ? 'created' : 'missing');

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

    console.log('Google Sign-In response:', {
      hasIdToken: !!userInfo.idToken,
      hasDataIdToken: !!userInfo.data?.idToken,
      user: userInfo.user?.email,
    });

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
      console.error('Supabase Google Sign-In error:', error);
      throw error;
    }
    if (!data.user) throw new Error('No user returned from Google login');

    console.log('Google Sign-In successful, user ID:', data.user.id);
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
    console.log('Getting session...');
    const { data } = await this.supabase.auth.getSession();
    console.log('Session retrieved:', {
      hasSession: !!data.session,
      userId: data.session?.user?.id,
    });
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
