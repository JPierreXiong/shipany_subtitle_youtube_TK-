import { NextRequest, NextResponse } from 'next/server';

import { routing } from './core/i18n/config';
import { getNeonSession } from './core/auth/neon-server';

// 定义需要登录检查的路径前缀 (不带 locale)
const PROTECTED_PATHS = ['/admin', '/settings', '/activity'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locales, defaultLocale } = routing;

  const parts = pathname.split('/').filter(Boolean);
  const localeFromPath = parts[0];
  const isLocaleValid = locales.includes(localeFromPath);

  // --- A. 核心路由处理：确保路径带有 Locale ---
  if (!isLocaleValid) {
    // 目标路径：将 /path 转换为 /en/path
    const targetPath = `/${defaultLocale}${pathname}`;
    const targetUrl = new URL(targetPath, request.url);

    // 强制重定向到带 locale 的路径
    // 这解决了 / 和 /fr 被重定向到 / 的问题
    return NextResponse.redirect(targetUrl, 307);
  }

  // --- B. 权限检查 (仅对 /locale/protected-path 生效) ---
  const locale = localeFromPath;
  const pathWithoutLocale = pathname.substring(locale.length + 1) || '/';

  const isProtectedPath = PROTECTED_PATHS.some(prefix =>
    pathWithoutLocale.startsWith(prefix) || pathWithoutLocale === prefix.slice(1)
  );

  if (isProtectedPath) {
    // Check Neon Auth session using request headers
    try {
      const session = await getNeonSession({
        headers: request.headers,
      });
      
      // Check if session exists and has user data
      const hasUser = session && (session as any).user;
      
      if (!hasUser) {
        // 重定向到 /locale/sign-in
        const signInUrl = new URL(`/${locale}/sign-in`, request.url);
        // 可选：设置 callbackUrl
        signInUrl.searchParams.set('callbackUrl', pathWithoutLocale + request.nextUrl.search);
        return NextResponse.redirect(signInUrl, 307);
      }
    } catch (error) {
      // If session check fails, redirect to sign-in
      console.error('Session check failed:', error);
      const signInUrl = new URL(`/${locale}/sign-in`, request.url);
      signInUrl.searchParams.set('callbackUrl', pathWithoutLocale + request.nextUrl.search);
      return NextResponse.redirect(signInUrl, 307);
    }
  }

  // --- C. 默认放行 ---
  // 路径合法，且无需 Session 重定向，放行。
  return NextResponse.next();
}

export const config = {
  // 匹配所有路径，除了 API 路由、静态文件、Next.js 内部文件等
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

