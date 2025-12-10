import { redirect } from 'next/navigation';

import { defaultLocale } from '@/config/locale';

export default function RootPage() {
  // Redirect bare domain to default locale landing.
  redirect(`/${defaultLocale}`);
}

