'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { signUp } from '@/lib/auth';
import { Link } from '@/core/i18n/navigation';
import { defaultLocale } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

import { SocialProviders } from './social-providers';

export function SignUp({
  configs,
  callbackUrl = '/',
}: {
  configs: Record<string, string>;
  callbackUrl: string;
}) {
  const router = useRouter();
  const t = useTranslations('common.sign');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referrerId, setReferrerId] = useState('');
  const [loading, setLoading] = useState(false);

  const isGoogleAuthEnabled = configs.google_auth_enabled === 'true';
  const isGithubAuthEnabled = configs.github_auth_enabled === 'true';
  const isEmailAuthEnabled =
    configs.email_auth_enabled !== 'false' ||
    (!isGoogleAuthEnabled && !isGithubAuthEnabled); // no social providers enabled, auto enable email auth

  if (callbackUrl) {
    const locale = useLocale();
    if (
      locale !== defaultLocale &&
      callbackUrl.startsWith('/') &&
      !callbackUrl.startsWith(`/${locale}`)
    ) {
      callbackUrl = `/${locale}${callbackUrl}`;
    }
  }

  const reportAffiliate = ({
    userEmail,
    stripeCustomerId,
  }: {
    userEmail: string;
    stripeCustomerId?: string;
  }) => {
    if (typeof window === 'undefined' || !configs) {
      return;
    }

    const windowObject = window as any;

    if (configs.affonso_enabled === 'true' && windowObject.Affonso) {
      windowObject.Affonso.signup(userEmail);
    }

    if (configs.promotekit_enabled === 'true' && windowObject.promotekit) {
      windowObject.promotekit.refer(userEmail, stripeCustomerId);
    }
  };

  const handleSignUp = async () => {
    if (loading) {
      return;
    }

    if (!email || !password || !name) {
      toast.error('Email, password and name are required');
      return;
    }

    // Client-side validation
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }

    await signUp.email(
      {
        email: email.trim(),
        password,
        name: name.trim(),
      },
      {
        onRequest: (_ctx: any) => {
          setLoading(true);
        },
        onResponse: (_ctx: any) => {
          setLoading(false);
        },
        onSuccess: async (_ctx: any) => {
          // report affiliate
          reportAffiliate({ userEmail: email });
          
          // Wait a bit for session to be established
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Generate customer ID (non-blocking, don't fail if it errors)
          fetch('/api/users/generate-customer-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }).catch((e) => {
            console.error('Failed to generate customer ID:', e);
            // Don't show error to user, this is a background operation
          });
          
          // Apply referral if provided (non-blocking)
          if (referrerId) {
            fetch('/api/users/apply-referral', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referrerCustomerId: referrerId }),
            }).catch((e) => {
              console.error('Failed to apply referral:', e);
              // Don't show error to user, this is a background operation
            });
          }
          
          // Redirect immediately, don't wait for background operations
          router.push(callbackUrl);
        },
        onError: (e: any) => {
          // Better error handling for 422 and other errors
          let errorMessage = 'Sign up failed';
          
          if (e?.error?.message) {
            errorMessage = e.error.message;
          } else if (e?.error?.code === 'VALIDATION_ERROR') {
            errorMessage = 'Validation failed. Please check your input.';
          } else if (e?.error?.code === 'EMAIL_ALREADY_EXISTS') {
            errorMessage = 'This email is already registered. Please sign in instead.';
          } else if (e?.status === 422) {
            errorMessage = 'Invalid input. Please check your email and password (minimum 8 characters).';
          } else if (e?.response) {
            try {
              const errorData = e.response;
              if (errorData?.message) {
                errorMessage = errorData.message;
              }
            } catch {
              // Ignore JSON parse errors
            }
          }
          
          console.error('Sign up error:', e);
          toast.error(errorMessage);
          setLoading(false);
        },
      }
    );
  };

  return (
    <Card className="mx-auto w-full md:max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          <h1>{t('sign_up_title')}</h1>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <h2>{t('sign_up_description')}</h2>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {isEmailAuthEnabled && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">{t('name_title')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('name_placeholder')}
                  required
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  value={name}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t('email_title')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  value={email}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{t('password_title')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('password_placeholder')}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="referrerId">Referrer ID (Optional)</Label>
                <Input
                  id="referrerId"
                  type="text"
                  placeholder="Enter referrer customer ID (e.g., 251212345)"
                  value={referrerId}
                  onChange={(e) => setReferrerId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  If you were referred by someone, enter their customer ID to get 7 days free
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                onClick={handleSignUp}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <p>{t('sign_up_title')}</p>
                )}
              </Button>
            </>
          )}

          <SocialProviders
            configs={configs}
            callbackUrl={callbackUrl || '/'}
            loading={loading}
            setLoading={setLoading}
          />
        </div>
      </CardContent>
      {isEmailAuthEnabled && (
        <CardFooter>
          <div className="flex w-full justify-center border-t py-4">
            <p className="text-center text-xs text-neutral-500">
              {t('already_have_account')}
              <Link href="/sign-in" className="underline">
                <span className="cursor-pointer dark:text-white/70">
                  {t('sign_in_title')}
                </span>
              </Link>
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
