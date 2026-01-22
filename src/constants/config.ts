import Constants from 'expo-constants';

/**
 * App configuration loaded from environment variables via app.config.js
 * In development, falls back to default values
 * In production, uses EAS secrets
 */

// Default values for development/fallback
const DEFAULTS = {
  SUPABASE_URL: 'https://fftvyuykqbixzupxzlmo.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdHZ5dXlrcWJpeHp1cHh6bG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjU5MjAsImV4cCI6MjA4NDI0MTkyMH0.bphD6T5CxMNWVT5D8_sy9Ti9IpDhBwYMvTa4dP8qawY',
  GOOGLE_WEB_CLIENT_ID: '836998999272-i744r408o0aoqd7r63rfo9j4c2vl6kpr.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: '836998999272-7uijb9j3amrvgvg1g7o8p34pdo0olouk.apps.googleusercontent.com',
};

const extra = Constants.expoConfig?.extra;

export const CONFIG = {
  // Supabase
  SUPABASE_URL: extra?.supabaseUrl || DEFAULTS.SUPABASE_URL,
  SUPABASE_ANON_KEY: extra?.supabaseAnonKey || DEFAULTS.SUPABASE_ANON_KEY,

  // Google OAuth
  GOOGLE_WEB_CLIENT_ID: extra?.googleWebClientId || DEFAULTS.GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID: extra?.googleIosClientId || DEFAULTS.GOOGLE_IOS_CLIENT_ID,
} as const;

// Validate that required config is present
export function validateConfig(): boolean {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !CONFIG[key as keyof typeof CONFIG]);

  if (missing.length > 0) {
    console.error('Missing required configuration:', missing);
    return false;
  }

  return true;
}
