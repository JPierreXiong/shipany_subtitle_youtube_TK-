import { redirect } from 'next/navigation';
import { defaultLocale } from '@/config/locale';

export default function SignInRedirectPage() {
  redirect(`/${defaultLocale}/sign-in`);
}





