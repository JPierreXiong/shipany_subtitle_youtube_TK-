import { redirect } from 'next/navigation';

import { defaultLocale } from '@/config/locale';

export default function PricingRedirect() {
  redirect(`/${defaultLocale}/pricing`);
}

