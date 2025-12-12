'use client';

import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';

import '@neondatabase/neon-js/ui/css';

import { authClient } from '@/lib/auth';

export function NeonAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NeonAuthUIProvider emailOTP authClient={authClient}>
      {children}
    </NeonAuthUIProvider>
  );
}


