import Constants from 'expo-constants';

/**
 * App configuration loaded from environment variables via app.config.js
 * In production: uses EAS secrets
 * In development: uses .env file
 */

// Try multiple sources for extra config (EAS builds can structure this differently)
const expoConfig = Constants.expoConfig;
const manifest = Constants.manifest;
const manifest2 = Constants.manifest2;

// Log available config sources for debugging
if (__DEV__) {
  console.log('Config sources available:', {
    hasExpoConfig: !!expoConfig,
    hasManifest: !!manifest,
    hasManifest2: !!manifest2,
    expoConfigExtra: expoConfig?.extra,
  });
}

const extra = expoConfig?.extra ?? manifest?.extra ?? manifest2?.extra ?? {};

// Helper to get a required config value
function getRequiredConfig(key: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    console.error(`Missing required config: ${key}. Set it in EAS secrets or .env file.`);
    console.error(`Available extra keys: ${Object.keys(extra).join(', ')}`);
    return '';
  }
  return value;
}

export const CONFIG = {
  // Supabase
  SUPABASE_URL: getRequiredConfig('SUPABASE_URL', extra?.supabaseUrl),
  SUPABASE_ANON_KEY: getRequiredConfig('SUPABASE_ANON_KEY', extra?.supabaseAnonKey),

  // Google OAuth
  GOOGLE_WEB_CLIENT_ID: getRequiredConfig('GOOGLE_WEB_CLIENT_ID', extra?.googleWebClientId),
  GOOGLE_IOS_CLIENT_ID: getRequiredConfig('GOOGLE_IOS_CLIENT_ID', extra?.googleIosClientId),
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
