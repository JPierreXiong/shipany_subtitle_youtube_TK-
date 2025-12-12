'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { AccountView, RedirectToSignIn, SignedIn } from '@neondatabase/neon-js/auth/react/ui';
import { useSession } from '@/lib/auth';
import { useRouter } from '@/core/i18n/navigation';

/**
 * Account management page
 * Uses Neon Auth's built-in AccountView component for account management UI
 */
export default function AccountPage() {
  const params = useParams();
  const pathname = params.pathname as string;
  const sessionResult = useSession();
  const router = useRouter();
  const isLoading = sessionResult?.isLoading ?? false;
  const session = sessionResult?.data?.session;

  // Redirect to sign-in if not authenticated (client-side check)
  useEffect(() => {
    if (!isLoading && !session?.user) {
      const locale = params.locale as string || 'en';
      router.push(`/${locale}/sign-in?callbackUrl=/account/${pathname}`);
    }
  }, [session, isLoading, router, params.locale, pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in redirect if not authenticated
  if (!session?.user) {
    return <RedirectToSignIn />;
  }

  // Show account view for authenticated users
  return (
    <SignedIn>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <AccountView pathname={pathname} />
      </div>
    </SignedIn>
  );
}

