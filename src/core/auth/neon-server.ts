import { cookies, headers } from 'next/headers';
import { createAuthClient } from '@neondatabase/neon-js/auth';

import { envConfigs } from '@/config';

// Server-side Neon Auth client
// Note: createAuthClient from @neondatabase/neon-js/auth works on both client and server
const neonAuthUrl = envConfigs.neon_auth_url || process.env.NEXT_PUBLIC_NEON_AUTH_URL || '';

export const serverAuthClient = neonAuthUrl ? createAuthClient(neonAuthUrl) : null;

/**
 * Get session from Neon Auth (server-side)
 * For use in middleware, we need to pass request headers directly
 */
export async function getNeonSession(request?: {
  headers: Headers | Record<string, string>;
}) {
  try {
    if (!serverAuthClient) {
      console.error('Neon Auth client not initialized - check NEXT_PUBLIC_NEON_AUTH_URL');
      return null;
    }

    if (request) {
      // For middleware - use request headers directly
      const headersObj = request.headers instanceof Headers 
        ? Object.fromEntries(request.headers.entries())
        : request.headers;
      
      const session = await serverAuthClient.getSession({
        headers: headersObj,
      });
      return session;
    } else {
      // For API routes - use Next.js cookies
      const cookieStore = await cookies();
      const headersList = await headers();
      const session = await serverAuthClient.getSession({
        headers: {
          cookie: cookieStore.toString(),
          ...Object.fromEntries(headersList.entries()),
        },
      });
      return session;
    }
  } catch (error) {
    console.error('Failed to get Neon session:', error);
    return null;
  }
}

/**
 * Get current user from Neon Auth session (server-side)
 */
export async function getNeonUser() {
  const session = await getNeonSession();
  // Handle different session response formats
  if (!session) {
    return null;
  }
  
  // Session might be in different formats
  const user = (session as any).user || (session as any).data?.user || null;
  return user;
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getNeonSession();
  return !!session?.user;
}

