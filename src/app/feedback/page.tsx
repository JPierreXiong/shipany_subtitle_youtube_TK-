import { redirect } from 'next/navigation';
import { defaultLocale } from '@/config/locale';

export default function FeedbackRedirectPage() {
  redirect(`/${defaultLocale}/feedback`);
}


