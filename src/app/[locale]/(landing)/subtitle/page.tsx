import { setRequestLocale } from 'next-intl/server';

import SubtitleClient from './subtitle-client';

export default async function SubtitlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SubtitleClient />;
}


















