import { redirect } from 'next/navigation';
import { defaultLocale } from '@/config/locale';

export default function SignUpRedirectPage() {
  redirect(`/${defaultLocale}/sign-up`);
}





