'use client';

import { useEffect, useState } from 'react';
import { Check, Globe, Languages } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname as useNextPathname } from 'next/navigation';

import { useRouter } from '@/core/i18n/navigation';
import { routing } from '@/core/i18n/config';
import { localeNames } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
// ⚠️ REMOVED: 不再使用 cacheSet，完全依赖 URL 路径作为语言源

export function LocaleSelector({
  type = 'icon',
}: {
  type?: 'icon' | 'button';
}) {
  const currentLocale = useLocale();
  const router = useRouter();
  // 使用 next/navigation 的原生 usePathname 获取完整路径（包括 locale）
  // 例如：/en/admin/dashboard
  const currentPathname = useNextPathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSwitchLanguage = (value: string) => {
    console.log('Language switch requested:', { value, currentLocale, currentPathname });
    if (value !== currentLocale) {
      // ⚠️ CRITICAL FIX: 完全依赖 URL 路径，不设置任何 Cookie/localStorage
      // URL 路径是唯一的语言源，避免与 proxy.ts 和 LocaleDetector 冲突
      
      // 1. 提取不带 locale 的目标路径
      // 例如：如果 currentPathname 是 /en/admin/dashboard，提取出 /admin/dashboard
      // 如果 currentPathname 是 /en，提取出 /
      
      let pathWithoutLocale = '/';
      
      // 检查路径是否以任何支持的 locale 开头
      const parts = currentPathname.split('/').filter(Boolean);
      
      if (parts.length === 0 || currentPathname === '/') {
        // 根路径，保持为 '/'
        pathWithoutLocale = '/';
      } else if (routing.locales.includes(parts[0])) {
        // 路径以 locale 开头，例如 /en/admin/dashboard
        // 提取 locale 之后的部分
        if (parts.length > 1) {
          // 有路径部分，例如 /admin/dashboard
          pathWithoutLocale = '/' + parts.slice(1).join('/');
        } else {
          // 只有 locale，例如 /en
          pathWithoutLocale = '/';
        }
      } else {
        // 路径没有 locale 前缀（虽然 proxy.ts 应该防止了这种情况）
        // 直接使用当前路径
        pathWithoutLocale = currentPathname;
      }
      
      // 2. 构造新的目标 URL（带上新的 locale 和保留的路径）
      const newUrl = `/${value}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
      
      console.log('Language switch details:', {
        currentPathname,
        currentLocale,
        pathWithoutLocale,
        newLocale: value,
        newUrl,
      });
      
      try {
        // 3. 使用 next-intl 的 router.replace 进行导航
        // 传递不带 locale 的路径和新的 locale
        router.replace(pathWithoutLocale, {
          locale: value,
        });
        console.log('Language switch successful:', { value, pathWithoutLocale, newUrl });
      } catch (error) {
        console.error('Language switch error:', error);
        // 如果 router.replace 失败，尝试直接使用 window.location
        // 这是最后的备选方案
        window.location.href = newUrl;
      }
    } else {
      console.log('Language already selected:', value);
    }
  };

  // Return a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant={type === 'icon' ? 'ghost' : 'outline'}
        size={type === 'icon' ? 'icon' : 'sm'}
        className={
          type === 'icon' ? 'h-auto w-auto p-0' : 'hover:bg-primary/10'
        }
        disabled
      >
        {type === 'icon' ? (
          <Languages size={18} />
        ) : (
          <>
            <Globe size={16} />
            {localeNames[currentLocale]}
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {type === 'icon' ? (
          <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
            <Languages size={18} />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="hover:bg-primary/10">
            <Globe size={16} />
            {localeNames[currentLocale]}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.keys(localeNames).map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={(e) => {
              e.preventDefault();
              handleSwitchLanguage(locale);
            }}
            className="cursor-pointer"
          >
            <span>{localeNames[locale]}</span>
            {locale === currentLocale && (
              <Check size={16} className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
