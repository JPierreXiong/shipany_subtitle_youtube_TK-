import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { routing } from '@/core/i18n/config';

// 定义需要登录检查的路径前缀 (不带 locale)
const PROTECTED_PATHS = ['/admin', '/settings', '/activity'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 快速检查：如果不是需要认证的路径，直接放行（性能优化）
  // 这样可以避免对普通页面（/en, /fr, /es, /pt）进行不必要的计算
  const needsAuth = PROTECTED_PATHS.some(prefix => pathname.includes(prefix));

  if (!needsAuth) {
    // 普通页面直接放行，不进行任何计算
    return NextResponse.next();
  }

  // 只有需要认证的路径才进行 locale 提取和 session 检查
  const parts = pathname.split('/').filter(Boolean);
  const locale = routing.locales.includes(parts[0]) ? parts[0] : routing.defaultLocale;
  const pathWithoutLocale = pathname.startsWith(`/${locale}`)
    ? pathname.slice(locale.length + 1) || '/'
    : pathname;

  // 检查是否为受保护的路径
  const isProtectedPath = PROTECTED_PATHS.some(prefix => 
    pathWithoutLocale.startsWith(prefix) || pathWithoutLocale === prefix.slice(1)
  );

  // 仅在受保护路径下，执行登录检查
  if (isProtectedPath) {
    const session = getSessionCookie(request);

    if (!session) {
      // 重定向到 sign-in 页面
      const signInUrl = new URL(`/${locale}/sign-in`, request.url);
      // 设置回调 URL，以便登录后跳转回原来的页面
      signInUrl.searchParams.set('callbackUrl', pathWithoutLocale + request.nextUrl.search);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

// middleware matcher
export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
