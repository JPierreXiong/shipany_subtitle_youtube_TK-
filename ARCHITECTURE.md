# 字幕提取与翻译系统 - 架构设计文档

## 📋 项目概述

基于 ShipAny 模板构建的 YouTube/TikTok 字幕提取与翻译 SaaS 平台。

### 核心功能
1. **字幕提取**：支持 YouTube 和 TikTok 视频字幕提取，生成 .srt 文件
2. **多语言翻译**：集成 Google Translate API，支持 12 种语言
3. **视频下载**：支持 TikTok 短视频下载（不保证去水印）
4. **邀请系统**：用户邀请注册功能

## 🏗️ 系统架构

### 技术栈
- **前端**：Next.js 14 (App Router) + React + TypeScript + TailwindCSS
- **后端**：Next.js API Routes
- **数据库**：Neon PostgreSQL (Serverless)
- **认证**：Better Auth
- **存储**：Vercel Blob Storage
- **第三方 API**：
  - RapidAPI (字幕提取)
  - Google Translate API (翻译)

### 数据库设计

#### 核心表结构
1. **user** - 用户表（已有）
2. **task** - 任务表（已有）
3. **translation** - 翻译表（已有）
4. **invitation** - 邀请表（新增）

#### 邀请表设计
```sql
invitation (
  id: text (PK)
  code: text (unique) - 邀请码
  inviter_id: text (FK -> user.id) - 邀请人ID
  invitee_email: text - 被邀请人邮箱（可选）
  status: text - pending/used/expired
  expires_at: timestamp - 过期时间
  used_at: timestamp - 使用时间
  used_by: text (FK -> user.id) - 使用人ID
  created_at: timestamp
  updated_at: timestamp
)
```

## 🔄 业务流程

### 1. 字幕提取流程
```
用户输入链接 
  → 识别平台（YouTube/TikTok）
  → 创建任务（task表）
  → 调用 RapidAPI 提取字幕
  → 保存 .srt 文件到 Blob Storage
  → 更新任务状态
  → 返回下载链接
```

### 2. 翻译流程
```
用户选择目标语言
  → 创建翻译任务（translation表）
  → 读取原始 .srt 文件
  → 调用 Google Translate API
  → 生成翻译后的 .srt 文件
  → 保存到 Blob Storage
  → 返回下载链接
```

### 3. 视频下载流程（TikTok）
```
用户输入 TikTok 链接
  → 创建下载任务
  → 调用 RapidAPI 获取视频URL
  → 下载视频到 Blob Storage
  → 返回下载链接
```

### 4. 邀请流程
```
管理员/用户生成邀请码
  → 创建邀请记录（invitation表）
  → 发送邀请链接（邮件/分享）
  → 用户注册时输入邀请码
  → 验证邀请码有效性
  → 标记邀请码为已使用
  → 完成注册
```

## 📁 文件结构

```
src/
├── app/
│   ├── [locale]/
│   │   └── (landing)/
│   │       ├── page.tsx              # 首页（需要重新设计）
│   │       └── subtitle/
│   │           ├── page.tsx          # 字幕提取页面
│   │           └── subtitle-client.tsx
│   └── api/
│       ├── tasks/
│       │   ├── extract/route.ts      # 提取字幕API
│       │   ├── translate/route.ts     # 翻译API
│       │   └── status/[id]/route.ts  # 任务状态API
│       └── invitations/
│           ├── create/route.ts       # 创建邀请码
│           ├── verify/route.ts       └── config/
     └── db/
         └── schema.ts                 # 数据库表定义
```

## 🔐 API 端点设计

### 字幕提取
- `POST /api/tasks/extract`
  - Body: `{ url, platform, lang? }`
  - Response: `{ id, status }`

### 翻译
- `POST /api/tasks/translate`
  - Body: `{ taskId, targetLanguage }`
  - Response: `{ id, status }`

### 任务状态
- `GET /api/tasks/status/[id]`
  - Response: `{ task, translations }`

### 邀请系统
- `POST /api/invitations/create` - 创建邀请码
- `GET /api/invitations/verify/[code]` - 验证邀请码
- `POST /api/invitations/use` - 使用邀请码注册

## 🌍 支持的语言

1. English (en)
2. 中文简体 (zh-CN)
3. Español (es)
4. Français (fr)
5. Deutsch (de)
6. 日本語 (ja)
7. 한국어 (ko)
8. Русский (ru)
9. Italiano (it)
10. Português (pt)
11. العربية (ar)
12. हिन्दी (hi)

## 🚀 部署配置

### 环境变量（Neon 数据库）
```bash
DATABASE_URL=postgresql://neondb_owner:npg_apJu93nTtYSw@ep-cold-heart-advkchzu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 必需的环境变量
- `RAPIDAPI_KEY` - RapidAPI 密钥
- `GOOGLE_TRANSLATE_KEY` - Google Translate API 密钥
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage Token
- `AUTH_SECRET` - 认证密钥

## 📝 下一步实现计划

1. ✅ 数据库架构设计
2. ⏳ 实现邀请系统
3. ⏳ 优化首页 UI
4. ⏳ 完善字幕提取功能
5. ⏳ 集成 Google Translate
6. ⏳ 实现 TikTok 视频下载
7. ⏳ 测试和部署




