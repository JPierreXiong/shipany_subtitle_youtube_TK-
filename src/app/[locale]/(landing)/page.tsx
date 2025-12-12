import { setRequestLocale } from 'next-intl/server';

import SubtitleClient from './subtitle/subtitle-client';

// Force dynamic rendering - this page uses client components with interactive features
export const dynamic = 'force-dynamic';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Display subtitle extraction page directly at /en (or any locale root)
  return <SubtitleClient />;
}
