// Load .env files for scripts (tsx/ts-node) - but NOT in Edge Runtime or browser
// This ensures scripts can read DATABASE_URL and other env vars
// Check for real Node.js environment - avoid Edge Runtime
if (
  typeof process !== 'undefined' &&
  process.env.NEXT_RUNTIME !== 'edge' && // Skip in Edge Runtime
  !process.env.NEXT_RUNTIME // Skip if already in Next.js runtime (env vars already loaded)
) {
  try {
    // Only load dotenv in Node.js environment (not Edge Runtime)
    // Check for Node.js-specific APIs without calling them
    if (typeof require !== 'undefined' && typeof process.cwd !== 'undefined') {
      const dotenv = require('dotenv');
      // Use process.cwd() only if we're sure we're in Node.js
      const cwd = typeof process.cwd === 'function' ? process.cwd() : undefined;
      if (cwd) {
        dotenv.config({ path: '.env.development' });
        dotenv.config({ path: '.env', override: false });
      }
    }
  } catch (e) {
    // Silently fail - dotenv might not be available in some environments
  }
}

export type ConfigMap = Record<string, string>;

export const envConfigs = {
  app_url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  app_name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Subtitle TK',
  theme: process.env.NEXT_PUBLIC_THEME ?? 'default',
  appearance: process.env.NEXT_PUBLIC_APPEARANCE ?? 'system',
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en',
  database_url: process.env.DATABASE_URL ?? '',
  database_provider: process.env.DATABASE_PROVIDER ?? 'postgresql',
  db_singleton_enabled: process.env.DB_SINGLETON_ENABLED || 'false',
  auth_url: process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '',
  auth_secret: process.env.AUTH_SECRET ?? '', // openssl rand -base64 32
  neon_auth_url: process.env.NEXT_PUBLIC_NEON_AUTH_URL ?? '',
};
