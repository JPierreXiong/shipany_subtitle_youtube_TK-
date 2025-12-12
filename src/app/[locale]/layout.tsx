import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { routing } from '@/core/i18n/config';
import { ThemeProvider } from '@/core/theme/provider';
import { Toaster } from '@/shared/components/ui/sonner';
import { AppContextProvider } from '@/shared/contexts/app';
import { getMetadata } from '@/shared/lib/seo';

export const generateMetadata = getMetadata();

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // ⚠️ CRITICAL FIX: 显式加载消息并传递给 NextIntlClientProvider
  // 这确保多语言消息正确加载和显示
  // getMessages() 会自动使用 setRequestLocale 设置的 locale
  let messages;
  try {
    messages = await getMessages();
    // 确保 messages 不为 null 或 undefined
    if (!messages || typeof messages !== 'object') {
      console.warn(`⚠️ Messages loaded but invalid for locale: ${locale}, using empty object`);
      messages = {};
    } else {
      // 检查消息是否包含内容
      const messageKeys = Object.keys(messages);
      if (messageKeys.length === 0) {
        console.warn(`⚠️ Messages object is empty for locale: ${locale}`);
      } else {
        console.log(`✅ Successfully loaded ${messageKeys.length} message keys for locale: ${locale}`);
        // 调试：显示前几个键
        console.log(`   Sample keys: ${messageKeys.slice(0, 5).join(', ')}`);
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to load messages for locale: ${locale}`, error);
    console.error(`   Error details:`, error?.message || error);
    // 如果加载失败，使用空对象（next-intl 会回退到默认语言）
    messages = {};
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <AppContextProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AppContextProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
