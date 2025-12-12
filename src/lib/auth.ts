'use client';

import { createAuthClient } from '@neondatabase/neon-js/auth';
import { useAuthData } from '@neondatabase/neon-js/auth/react';

import { envConfigs } from '@/config';

// Initialize Neon Auth client for Next.js
// Note: In Next.js, we use process.env.NEXT_PUBLIC_* for client-side env vars
const neonAuthUrl = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_NEON_AUTH_URL || envConfigs.neon_auth_url)
  : envConfigs.neon_auth_url || process.env.NEXT_PUBLIC_NEON_AUTH_URL || '';

export const authClient = createAuthClient(neonAuthUrl);

// Export auth methods (Neon Auth client methods)
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;

// Use useAuthData hook which provides session data
// useAuthData expects { queryFn, cacheKey, staleTime } parameters
// We use queryFn to fetch session data from authClient
export function useSession() {
  // Use queryFn approach: this is what TypeScript expects
  const authData = useAuthData({
    queryFn: async () => {
      try {
        // Get session from authClient
        const session = await authClient.getSession();
        return { 
          data: session, 
          error: null 
        };
      } catch (err: any) {
        return { 
          data: null, 
          error: err 
        };
      }
    },
    cacheKey: 'neon-session-data',
  });
  
  // Handle different return formats from useAuthData
  if (!authData) {
    return {
      data: null,
      isLoading: true,
    };
  }
  
  // authData structure: { data: { data: session }, error, isLoading }
  // Extract session from nested data structure
  const session = authData.data?.data || authData.data || authData.session;
  
  return {
    data: session ? { session } : null,
    isLoading: authData.isLoading ?? false,
  };
}

