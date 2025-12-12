'use client';

import { useParams } from 'next/navigation';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

/**
 * Neon Auth page handler
 * Uses Neon Auth's built-in AuthView component for authentication UI
 */
export default function AuthPage() {
  const params = useParams();
  const pathname = params.pathname as string;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <AuthView pathname={pathname} />
    </div>
  );
}

