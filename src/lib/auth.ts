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
// useAuthData gets authClient from context (provided by NeonAuthUIProvider)
// It should be called without parameters as it reads from Context
export function useSession() {
  // useAuthData reads authClient from NeonAuthUIProvider context
  // Do not pass authClient as parameter - it will get it from context automatically
  const authData = useAuthData();
  
  // Handle different return formats from useAuthData
  if (!authData) {
    return {
      data: null,
      isLoading: true,
    };
  }
  
  // authData may have session directly or in data.session
  const session = authData.session || authData.data?.session;
  
  return {
    data: session ? { session } : null,
    isLoading: authData.isLoading ?? false,
  };
}

