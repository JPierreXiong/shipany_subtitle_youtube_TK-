import { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { getThemeLayout } from '@/core/theme';
import { LocaleDetector } from '@/shared/blocks/common';
import {
  Footer as FooterType,
  Header as HeaderType,
} from '@/shared/types/blocks/landing';

export default async function LandingLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    // load page data
    const t = await getTranslations('landing');

    // load layout component
    const Layout = await getThemeLayout('landing');

    // header and footer to display
    let header: HeaderType;
    let footer: FooterType;
    
    try {
      header = t.raw('header') as HeaderType;
    } catch (error) {
      console.error('Failed to load header:', error);
      // Fallback to default header structure
      header = {
        id: 'header',
        brand: { title: 'Subtitle TK', url: '/' },
        nav: { items: [] },
        buttons: [],
        user_nav: { show_name: true, show_credits: true, show_sign_out: true, items: [] },
        show_sign: true,
        show_theme: true,
        show_locale: true,
      } as HeaderType;
    }
    
    try {
      footer = t.raw('footer') as FooterType;
    } catch (error) {
      console.error('Failed to load footer:', error);
      // Fallback to default footer structure
      footer = {
        id: 'footer',
        brand: { title: 'Subtitle TK', description: '', url: '/' },
        nav: { items: [] },
        social: { items: [] },
        agreement: { items: [] },
        show_theme: true,
        show_locale: true,
      } as FooterType;
    }

    return (
      <Layout header={header} footer={footer}>
        <LocaleDetector />
        {children}
      </Layout>
    );
  } catch (error: any) {
    console.error('Landing layout error:', error);
    // Return a simple layout without header/footer to prevent crash
    return (
      <div className="min-h-screen">
        <LocaleDetector />
        {children}
      </div>
    );
  }
}
