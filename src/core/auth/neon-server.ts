import { cookies, headers } from 'next/headers';
import { createAuthClient } from '@neondatabase/neon-js/auth';

import { envConfigs } from '@/config';

// Server-side Neon Auth client factory
function getServerAuthClient() {
  const neonAuthUrl = envConfigs.neon_auth_url || process.env.NEXT_PUBLIC_NEON_AUTH_URL || '';
  
  if (!neonAuthUrl) {
    console.error('NEXT_PUBLIC_NEON_AUTH_URL is not set');
    return null;
  }
  
  // createAuthClient requires the URL as parameter
  return createAuthClient(neonAuthUrl);
}

/**
 * Get session from Neon Auth (server-side)
 * For middleware, we need to create a client with request headers
 */
export async function getNeonSession(request?: {
  headers: Headers | Record<string, string>;
}) {
  try {
    const neonAuthUrl = envConfigs.neon_auth_url || process.env.NEXT_PUBLIC_NEON_AUTH_URL || '';
    
    if (!neonAuthUrl) {
      console.error('Neon Auth URL not configured - check NEXT_PUBLIC_NEON_AUTH_URL');
      return null;
    }

    if (request) {
      // For middleware - create a client and pass headers via fetchOptions
      const headersObj = request.headers instanceof Headers 
        ? Object.fromEntries(request.headers.entries())
        : request.headers;
      
      // Create a client with URL
      const tempClient = createAuthClient(neonAuthUrl);
      
      // Use fetchOptions to pass headers
      const session = await tempClient.getSession({
        fetchOptions: {
          headers: headersObj,
        },
      });
      return session;
    } else {
      // For API routes - create client and get session
      const client = getServerAuthClient();
      if (!client) {
        console.error('Neon Auth client not initialized - check NEXT_PUBLIC_NEON_AUTH_URL');
        return null;
      }
      
      // getSession() automatically reads from cookies in server environment
      const session = await client.getSession();
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

