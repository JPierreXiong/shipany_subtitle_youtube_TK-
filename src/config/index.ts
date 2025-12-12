// Load .env files for scripts (tsx/ts-node) - but NOT in Edge Runtime or browser
// This ensures scripts can read DATABASE_URL and other env vars
// Check for real Node.js environment - avoid Edge Runtime completely
const isEdgeRuntime = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
const isNextRuntime = typeof process !== 'undefined' && process.env.NEXT_RUNTIME;

if (!isEdgeRuntime && !isNextRuntime && typeof process !== 'undefined') {
  try {
    // Only load dotenv in Node.js environment (not Edge Runtime or browser)
    // Use dynamic import to avoid bundling dotenv in Edge Runtime
    if (typeof require !== 'undefined') {
      const dotenv = require('dotenv');
      // dotenv.config uses process.cwd() internally, but only in Node.js context
      // This code path is skipped in Edge Runtime due to the check above
      dotenv.config({ path: '.env.development' });
      dotenv.config({ path: '.env', override: false });
    }
  } catch (e) {
    // Silently fail - dotenv might not be available in some environments
  }
}

export type ConfigMap = Record<string, string>;

export const envConfigs = {
  // App URL - should be HTTPS in production (e.g., https://www.subtitletk.app)
  // Falls back to http://localhost:3000 for local development
  app_url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  app_name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Subtitle TK',
  theme: process.env.NEXT_PUBLIC_THEME ?? 'default',
  appearance: process.env.NEXT_PUBLIC_APPEARANCE ?? 'system',
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en',
  // Database connection URL for Neon PostgreSQL
  // Format: postgresql://user:password@host:port/database?sslmode=require
  database_url: process.env.DATABASE_URL ?? '',
  database_provider: process.env.DATABASE_PROVIDER ?? 'postgresql',
  db_singleton_enabled: process.env.DB_SINGLETON_ENABLED || 'false',
  // App base URL - used for building absolute URLs (e.g., callback URLs)
  // Should be HTTPS in production: https://www.subtitletk.app
  // Falls back to http://localhost:3000 for local development
  auth_url: process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  auth_secret: process.env.AUTH_SECRET ?? '', // openssl rand -base64 32
  // Neon Auth API URL - points to Neon Auth service endpoint
  // This is used by server-side code to connect to Neon Auth service
  // Client-side code uses /api/auth relative path which proxies to this URL
  neon_auth_url: process.env.NEXT_PUBLIC_NEON_AUTH_URL ?? '',
};
