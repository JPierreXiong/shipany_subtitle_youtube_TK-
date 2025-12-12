# 支付配置说明 / Payment Setup Guide

## 问题 / Problem

如果遇到错误 `no payment provider configured`，需要在数据库中配置支付提供者。

If you encounter the error `no payment provider configured`, you need to configure the payment provider in the database.

## 解决方案 / Solutions

### 方法 1：通过管理后台配置（推荐）/ Method 1: Configure via Admin Panel (Recommended)

1. 登录管理后台 / Login to admin panel
   - 访问 `/admin/settings/payment` 或 `/en/admin/settings/payment`
   - Visit `/admin/settings/payment` or `/en/admin/settings/payment`

2. 配置以下设置 / Configure the following settings:
   - **Default Payment Provider**: 选择 `Creem`
   - **Creem Enabled**: 开启 / Turn ON
   - **Creem Environment**: 选择 `sandbox`（测试）或 `production`（生产）
   - **Creem API Key**: 输入你的 Creem API Key（从 https://www.creem.io/dashboard 获取）
   - **Creem Signing Secret**: 输入你的 Creem Signing Secret（从 https://www.creem.io/dashboard 获取）

3. 点击保存 / Click Save

### 方法 2：通过 SQL 脚本配置 / Method 2: Configure via SQL Script

1. 编辑 `scripts/init-payment-config.sql` 文件
   - 替换 `YOUR_CREEM_API_KEY` 为你的实际 Creem API Key
   - 替换 `YOUR_CREEM_SIGNING_SECRET` 为你的实际 Creem Signing Secret

2. 运行 SQL 脚本 / Run the SQL script:
   ```bash
   # 使用 psql 连接 Neon 数据库
   psql "postgresql://neondb_owner:npg_apJu93nTtYSw@ep-cold-heart-advkchzu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f scripts/init-payment-config.sql
   ```

### 方法 3：手动 SQL 插入 / Method 3: Manual SQL Insert

连接到数据库后，执行以下 SQL：

```sql
-- 设置默认支付提供者为 Creem
INSERT INTO config (name, value) 
VALUES ('default_payment_provider', 'creem')
ON CONFLICT (name) DO UPDATE SET value = 'creem';

-- 启用 Creem
INSERT INTO config (name, value) 
VALUES ('creem_enabled', 'true')
ON CONFLICT (name) DO UPDATE SET value = 'true';

-- 设置环境（sandbox 或 production）
INSERT INTO config (name, value) 
VALUES ('creem_environment', 'sandbox')
ON CONFLICT (name) DO UPDATE SET value = 'sandbox';

-- 设置 API Key（替换为你的实际值）
INSERT INTO config (name, value) 
VALUES ('creem_api_key', '你的_CREEM_API_KEY')
ON CONFLICT (name) DO UPDATE SET value = '你的_CREEM_API_KEY';

-- 设置 Signing Secret（替换为你的实际值）
INSERT INTO config (name, value) 
VALUES ('creem_signing_secret', '你的_CREEM_SIGNING_SECRET')
ON CONFLICT (name) DO UPDATE SET value = '你的_CREEM_SIGNING_SECRET';
```

## 获取 Creem 凭证 / Get Creem Credentials

1. 访问 https://www.creem.io/dashboard
2. 登录你的账户
3. 在设置中找到 API Key 和 Signing Secret
4. 复制这些值并配置到数据库中

## 验证配置 / Verify Configuration

配置完成后，可以通过以下方式验证：

1. 访问 `/admin/settings/payment` 页面，检查配置是否正确显示
2. 尝试进行一次支付测试（使用 sandbox 环境）
3. 检查服务器日志，确认没有配置错误

## 注意事项 / Notes

- **Sandbox vs Production**: 
  - `sandbox` 环境用于测试，不会产生真实交易
  - `production` 环境用于生产环境，会产生真实交易
  - 建议先在 `sandbox` 环境测试

- **产品价格**: 
  - 当前配置的产品价格：
    - $12.9 USD: `prod_7c1FZHQeCCFczvNU5dYWEj`
    - $59.9 USD: `prod_1pM4Co56OhCMC7EkwMjVf`
    - $129.90 USD: `prod_55OLI8OQq1I048Jn8IPYuN`
    - $599 USD: `prod_67wmwvV2gVSBnblWES0uuN`
  - 如果你需要添加 $19.9 的产品，需要在 Creem 后台创建新产品，然后更新配置

- **Webhook 配置**: 
  - 确保在 Creem 后台配置了 Webhook URL: `https://your-domain.com/api/payment/creem-webhook`
  - Webhook Secret 必须与数据库中的 `creem_signing_secret` 一致

## 故障排除 / Troubleshooting

如果配置后仍然出现错误：

1. 检查数据库连接是否正常
2. 确认配置值是否正确（特别是 API Key 和 Signing Secret）
3. 检查 `creem_enabled` 是否为 `'true'`（字符串，不是布尔值）
4. 确认 `default_payment_provider` 设置为 `'creem'`
5. 查看服务器日志获取详细错误信息





