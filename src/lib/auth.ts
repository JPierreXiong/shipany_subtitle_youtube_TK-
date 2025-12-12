'use client';

import { createAuthClient } from '@neondatabase/neon-js/auth';
import { useAuthData } from '@neondatabase/neon-js/auth/react';

import { envConfigs } from '@/config';

// Initialize Neon Auth client for Next.js
// Note: For client-side, we use our Next.js API route as the base URL
// The API route will proxy requests to the actual Neon Auth service
// This allows us to handle CORS, cookies, and other Next.js-specific features
const getClientAuthUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use relative path to our Next.js API route
    // This will automatically use the current domain (e.g., https://www.subtitletk.app/api/auth)
    return '/api/auth';
  }
  // Server-side: use the actual Neon Auth service URL
  return process.env.NEXT_PUBLIC_NEON_AUTH_URL || envConfigs.neon_auth_url || '';
};

const neonAuthUrl = getClientAuthUrl();

export const authClient = createAuthClient(neonAuthUrl);

// Export auth methods (Neon Auth client methods)
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;

// Type definition for authData with flexible structure
// This allows us to safely access session data from different possible structures
type AuthDataWithSession = {
  data?: { data?: any } | any;
  session?: any;
  isLoading?: boolean;
  error?: any;
};

// Use useAuthData hook which provides session data
// useAuthData expects { queryFn, cacheKey, staleTime } parameters
// We use queryFn to fetch session data from authClient
export function useSession() {
  // Use queryFn approach: this is what TypeScript expects
  const authDataRaw = useAuthData({
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
  if (!authDataRaw) {
    return {
      data: null,
      isLoading: true,
    };
  }
  
  // 1. Type assertion: allow TypeScript to access all possible properties
  const authData = authDataRaw as AuthDataWithSession;
  
  // 2. Precise destructuring: extract session from nested data structure
  // Handle different possible structures:
  // - authData.data?.data (nested structure from queryFn)
  // - authData.data (direct data)
  // - authData.session (direct session property)
  const session = authData.data?.data || authData.data || authData.session;
  
  // 3. Check if we have valid session data
  if (!session) {
    return {
      data: null,
      isLoading: authData.isLoading ?? false,
    };
  }
  
  // 4. Return standardized session structure
  return {
    data: { session },
    isLoading: authData.isLoading ?? false,
  };
}

