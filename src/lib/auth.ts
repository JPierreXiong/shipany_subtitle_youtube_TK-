'use client';

import { createAuthClient } from '@neondatabase/neon-js/auth';
import { useSession as useNeonSession } from '@neondatabase/neon-js/auth/react';

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
export const useSession = useNeonSession;

