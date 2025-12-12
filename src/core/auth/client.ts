/**
 * DEPRECATED: This file is no longer used.
 * All authentication now uses Neon Auth via @/lib/auth
 * 
 * This file is kept for reference but should not be imported anywhere.
 * If you see this file being imported, please update the import to use @/lib/auth instead.
 */

// Re-export from Neon Auth for backward compatibility (if needed)
export { authClient, signIn, signUp, signOut, useSession } from '@/lib/auth';

// Note: One Tap functionality is not available in Neon Auth
// If needed, implement using Neon Auth's OAuth providers
export function getAuthClient(_configs: Record<string, string>) {
  // Return Neon Auth client instead
  // Use dynamic import to avoid circular dependencies
  if (typeof window !== 'undefined') {
    // Client-side: return Neon Auth client
    const { authClient } = require('@/lib/auth');
    return authClient;
  }
  // Server-side: return null or handle differently
  return null;
}
