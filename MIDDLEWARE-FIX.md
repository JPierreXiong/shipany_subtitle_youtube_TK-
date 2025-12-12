# Middleware 无限重定向循环修复

## 🚨 问题描述

遇到 `ERR_TOO_MANY_REDIRECTS` 错误，浏览器显示"该网页无法正常运作 localhost 将您重定向的次数过多"。

## 🔍 根本原因

1. **`createMiddleware` 与自定义逻辑冲突**：`next-intl` 的 `createMiddleware` 在处理 `localePrefix: 'never'` 时，可能与自定义的重定向逻辑产生冲突，导致循环重定向。

2. **重定向循环场景**：
   - `/` → `/en` → `/` (循环)
   - `/fr` → `/` → `/en` → `/fr` (循环)

## ✅ 解决方案

完全移除 `createMiddleware`，使用自定义的 middleware 逻辑，确保：
- 路径必须包含有效的 locale 前缀
- 根路径 `/` 重定向到 `/${defaultLocale}`
- 无效路径（如 `/admin`）重定向到 `/${defaultLocale}/admin`
- 有效 locale 路径（如 `/fr`）直接放行
- 受保护路径进行 session 检查

## 📝 修复内容

### 1. 移除 `createMiddleware`

**修复前** (`src/middleware.ts`):
```typescript
import createMiddleware from 'next-intl/middleware';
const intlMiddleware = createMiddleware(routing);
// ... 使用 intlMiddleware(request)
```

**修复后** (`src/middleware.ts`):
```typescript
// ✅ 完全移除 createMiddleware
// ✅ 使用自定义路由逻辑
```

### 2. 自定义 Middleware 逻辑

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { routing } from './core/i18n/config';

const PROTECTED_PATHS = ['/admin', '/settings', '/activity'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locales, defaultLocale } = routing;

  const parts = pathname.split('/').filter(Boolean);
  const localeFromPath = parts[0];
  const isLocaleValid = locales.includes(localeFromPath);

  // --- A. 核心路由处理：确保路径带有 Locale ---
  if (!isLocaleValid) {
    const targetPath = `/${defaultLocale}${pathname}`;
    const targetUrl = new URL(targetPath, request.url);
    return NextResponse.redirect(targetUrl, 307);
  }

  // --- B. 权限检查 ---
  const locale = localeFromPath;
  const pathWithoutLocale = pathname.substring(locale.length + 1) || '/';

  const isProtectedPath = PROTECTED_PATHS.some(prefix => 
    pathWithoutLocale.startsWith(prefix) || pathWithoutLocale === prefix.slice(1)
  );

  if (isProtectedPath) {
    const session = getSessionCookie(request);
    if (!session) {
      const signInUrl = new URL(`/${locale}/sign-in`, request.url);
      signInUrl.searchParams.set('callbackUrl', pathWithoutLocale + request.nextUrl.search);
      return NextResponse.redirect(signInUrl, 307);
    }
  }

  // --- C. 默认放行 ---
  return NextResponse.next();
}
```

### 3. 确认 `next.config.mjs` 配置

✅ `next-intl` 插件已正确配置：
```javascript
const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/core/i18n/request.ts',
});
```

## 🎯 关键修复点

1. **移除 `createMiddleware`**：避免与自定义逻辑冲突
2. **统一路由处理**：所有路径都通过自定义 middleware 处理
3. **防止循环重定向**：
   - 只对无效路径（缺少 locale）进行重定向
   - 有效 locale 路径直接放行
   - 受保护路径检查 session，未登录才重定向

## 📋 测试验证

### 测试场景：

1. **根路径测试**：
   - 访问 `http://localhost:3000/` → 应重定向到 `http://localhost:3000/en`
   - ✅ 不应出现循环重定向

2. **法语路径测试**：
   - 访问 `http://localhost:3000/fr` → 应直接加载法语页面
   - ✅ 不应重定向到 `/` 或 `/en`

3. **无效路径测试**：
   - 访问 `http://localhost:3000/admin` → 应重定向到 `http://localhost:3000/en/admin`
   - ✅ 不应出现循环重定向

4. **受保护路径测试**：
   - 访问 `http://localhost:3000/en/admin`（未登录）→ 应重定向到 `http://localhost:3000/en/sign-in`
   - ✅ 不应出现循环重定向

## ⚠️ 注意事项

1. **`next-intl` 插件仍然需要**：`next.config.mjs` 中的 `withNextIntl` 插件仍然需要，它负责处理 App Router 的编译和消息加载。

2. **`localePrefix: 'never'` 的含义**：
   - 默认语言（en）的 URL 不显示前缀（如 `/` 而不是 `/en`）
   - 但路由结构仍然需要 `[locale]` 段
   - 因此 middleware 需要将 `/` 重定向到 `/en`

3. **Session 检查**：确保 `getSessionCookie` 函数正确导入和使用。

## 🔄 后续步骤

1. ✅ 清除浏览器缓存和 Cookie
2. ✅ 重启开发服务器
3. ✅ 测试所有路由场景
4. ✅ 验证语言切换功能

修复完成！现在 middleware 应该能够正确处理所有路由，不再出现无限重定向循环。

