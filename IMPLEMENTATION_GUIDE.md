# 字幕提取与翻译系统 - 实现指南

## ✅ 已完成的功能

### 1. 数据库架构
- ✅ 添加了 `invitation` 表（邀请系统）
- ✅ 已有 `task` 表（任务管理）
- ✅ 已有 `translation` 表（翻译记录）

### 2. 邀请系统 API
- ✅ `POST /api/invitations/create` - 创建邀请码
- ✅ `GET /api/invitations/verify/[code]` - 验证邀请码
- ✅ `POST /api/invitations/use` - 使用邀请码注册

### 3. 首页 UI 重新设计
- ✅ 主标题：AI powered subtitles tools for you
- ✅ 副标题：Subtitles extraction from Youtube and TikTok and video download from TikTok support 12 languages
- ✅ 链接输入框（自动识别 YouTube/TikTok）
- ✅ 提取字幕按钮（母语）
- ✅ 下载类型选择（TikTok 时显示：字幕/视频）
- ✅ 翻译语言选择（12种语言下拉菜单）
- ✅ 翻译按钮和结果展示

### 4. 字幕提取功能
- ✅ YouTube 字幕提取（通过 RapidAPI）
- ✅ TikTok 字幕提取（通过 RapidAPI）
- ✅ TikTok 视频下载（通过 RapidAPI）
- ✅ 自动识别平台类型

### 5. 翻译功能
- ✅ Google Translate API 集成
- ✅ 支持 12 种语言翻译
- ✅ SRT 文件格式翻译

## 📋 待完成的任务

### 1. 数据库迁移
需要运行数据库迁移以创建 `invitation` 表：

```bash
# 在项目根目录执行
pnpm db:push
```

或者在 Neon 数据库中手动执行 SQL：

```sql
CREATE TABLE IF NOT EXISTS invitation (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  inviter_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  invitee_email text,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp NOT NULL,
  used_at timestamp,
  used_by text REFERENCES "user"(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX idx_invitation_code ON invitation(code);
CREATE INDEX idx_invitation_inviter ON invitation(inviter_id);
CREATE INDEX idx_invitation_status ON invitation(status);
CREATE INDEX idx_invitation_expires ON invitation(expires_at);
```

### 2. 环境变量配置

在 Vercel 中设置以下环境变量：

```bash
# 数据库（Neon）
DATABASE_URL=postgresql://neondb_owner:npg_apJu93nTtYSw@ep-cold-heart-advkchzu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# RapidAPI（字幕提取）
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST_YOUTUBE=youtube-transcriptor.p.rapidapi.com
RAPIDAPI_HOST_TIKTOK=tiktok-download-video1.p.rapidapi.com

# Google Translate（翻译）
GOOGLE_TRANSLATE_KEY=your_google_translate_key

# Vercel Blob Storage（文件存储）
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# 应用配置
NEXT_PUBLIC_APP_URL=https://shipany-subtitle-youtube-tk.vercel.app
NEXT_PUBLIC_BASE_URL=https://shipany-subtitle-youtube-tk.vercel.app
```

### 3. 邀请系统 UI（可选）

如果需要在前端显示邀请功能，可以创建：

- `/settings/invitations` - 邀请码管理页面
- 注册页面集成邀请码验证

### 4. 多语言支持

首页目前是英文，如果需要支持多语言：

1. 更新 `src/config/locale/messages/[locale]/landing.json`
2. 在 `subtitle-client.tsx` 中使用 `useTranslations`

## 🚀 部署步骤

1. **配置环境变量**
   - 在 Vercel 项目设置中添加所有必需的环境变量

2. **运行数据库迁移**
   ```bash
   pnpm db:push
   ```

3. **导入数据库备份**（如果需要）
   - 使用之前导出的 `shipany-postgres-backup-noowner.sql`
   - 在 Neon Web 控制台执行 SQL

4. **部署到 Vercel**
   - 推送代码到 GitHub
   - Vercel 会自动部署

## 📝 API 使用示例

### 创建邀请码
```bash
POST /api/invitations/create
Authorization: Bearer <token>
Body: {
  "inviteeEmail": "user@example.com",
  "expiresInDays": 7
}
```

### 验证邀请码
```bash
GET /api/invitations/verify/ABC12345
```

### 使用邀请码注册
```bash
POST /api/invitations/use
Authorization: Bearer <token>
Body: {
  "code": "ABC12345"
}
```

## 🔧 故障排除

### 数据库连接问题
- 检查 `DATABASE_URL` 环境变量是否正确
- 确认 Neon 数据库已创建并运行

### API 调用失败
- 检查 RapidAPI 密钥是否有效
- 检查 Google Translate API 密钥是否有效
- 查看 Vercel 日志获取详细错误信息

### 文件上传失败
- 检查 `BLOB_READ_WRITE_TOKEN` 是否正确
- 确认 Vercel Blob Storage 已启用

## 📚 相关文档

- [架构设计文档](./ARCHITECTURE.md)
- [ShipAny 文档](https://shipany.ai/docs)




