import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { getLocalPage } from '@/shared/models/post';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const t = await getTranslations('common.metadata');

  const { locale, slug } = await params;

  // Prevent locale codes from being used as slugs in metadata
  const { locales } = await import('@/config/locale');
  if (locales.includes(slug)) {
    return {
      title: t('title'),
      description: t('description'),
    };
  }

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/${slug}`
      : `${envConfigs.app_url}/${slug}`;

  const page = await getLocalPage({ slug, locale });
  if (!page) {
    return {
      title: `${slug} | ${t('title')}`,
      description: t('description'),
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  return {
    title: `${page.title} | ${t('title')}`,
    description: page.description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Prevent locale codes from being used as slugs
  // If slug is a valid locale, redirect to the locale root
  const { locales } = await import('@/config/locale');
  if (locales.includes(slug)) {
    return notFound();
  }

  // Get the page from pagesSource
  const page = await getLocalPage({ slug, locale });
  if (!page) {
    return notFound();
  }

  const Page = await getThemePage('page-detail');

  return <Page locale={locale} post={page} />;
}
