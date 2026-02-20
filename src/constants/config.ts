import Constants from 'expo-constants';
import { logger } from '../utils/logger';

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
logger.config.debug('Config sources available:', {
  hasExpoConfig: !!expoConfig,
  hasManifest: !!manifest,
  hasManifest2: !!manifest2,
  extraKeys: Object.keys(expoConfig?.extra ?? {}),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extra = expoConfig?.extra ?? (manifest as any)?.extra ?? (manifest2 as any)?.extra ?? {};

// Helper to get a required config value
function getRequiredConfig(key: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    logger.config.error(`Missing required config: ${key}. Set it in EAS secrets or .env file.`);
    logger.config.error(`Available extra keys: ${Object.keys(extra).join(', ')}`);
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

/**
 * Validate that required config is present.
 * In development: throws an error to catch missing config early
 * In production: logs error but allows app to continue (may have partial functionality)
 */
export function validateConfig(): void {
  const required: (keyof typeof CONFIG)[] = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !CONFIG[key]);

  if (missing.length > 0) {
    const errorMessage = `Missing required configuration: ${missing.join(', ')}. ` +
      'Please set these values in your .env file or EAS secrets.';

    logger.config.error(errorMessage);
    logger.config.error('Available config keys:', Object.keys(extra).join(', ') || '(none)');

    if (__DEV__) {
      // In development, throw to make missing config obvious
      throw new Error(errorMessage);
    }
    // In production, continue with degraded functionality (auth features won't work)
  }
}
