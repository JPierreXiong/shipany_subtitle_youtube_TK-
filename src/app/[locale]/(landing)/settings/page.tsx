import { redirect } from 'next/navigation';
import { defaultLocale } from '@/config/locale';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const targetLocale = locale || defaultLocale;
  
  redirect(`/${targetLocale}/settings/profile`);
}
