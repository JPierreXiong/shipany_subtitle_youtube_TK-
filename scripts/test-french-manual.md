# 法国用户旅程手动测试指南

## 🧪 测试步骤

请按照以下步骤手动测试法国用户的完整旅程：

### 步骤 1: 访问首页并切换到法语

**URL**: `http://localhost:3000/fr`

**预期结果**:
- ✅ URL 应该保持为 `/fr`（不被重定向）
- ✅ 导航菜单显示：`Tarifs`, `Commentaires`
- ✅ 语言选择器显示：`Français` 或 `FR`
- ❌ 不应该看到：`Pricing`, `Feedback`, `English`

**检查点**:
- [ ] URL 正确显示 `/fr`
- [ ] 导航菜单是法语
- [ ] 页面主要内容是法语

---

### 步骤 2: 访问注册页面

**URL**: `http://localhost:3000/fr/sign-up`

**预期结果**:
- ✅ 页面标题显示：`S'inscrire` 或 `Créer un compte`
- ✅ 表单标签显示：`Email`, `Mot de passe`
- ✅ 按钮显示：`Continuer`
- ❌ 不应该看到：`Sign Up`, `Create an account`, `Continue`

**检查点**:
- [ ] 页面标题是法语
- [ ] 表单字段标签是法语
- [ ] 按钮文本是法语

---

### 步骤 3: 访问登录页面

**URL**: `http://localhost:3000/fr/sign-in`

**预期结果**:
- ✅ 页面标题显示：`Se connecter`
- ✅ 描述显示：`Connectez-vous à votre compte`
- ✅ 按钮显示：`Se connecter avec Email`, `Se connecter avec Google`
- ❌ 不应该看到：`Sign In`, `Sign in to your account`

**检查点**:
- [ ] 页面标题是法语
- [ ] 描述文本是法语
- [ ] 登录按钮是法语

---

### 步骤 4: 访问定价页面

**URL**: `http://localhost:3000/fr/pricing`

**预期结果**:
- ✅ 页面标题显示：`Tarifs`
- ✅ 按钮显示：`Commencer gratuitement`, `Mettre à niveau`, `Passer à Premium`
- ✅ 标签显示：`Paiement à l'usage`, `Mensuel`
- ❌ 不应该看到：`Pricing`, `Get Started`, `Upgrade`, `Monthly`

**检查点**:
- [ ] 页面标题是法语
- [ ] 所有按钮是法语
- [ ] 定价计划标签是法语

---

### 步骤 5: 访问字幕提取页面

**URL**: `http://localhost:3000/fr`

**预期结果**:
- ✅ 输入框标签显示：`Entrez le lien YouTube ou TikTok`
- ✅ 下拉菜单显示：`Langue native`, `Langue de traduction`
- ✅ 按钮显示：`Extraire les sous-titres / Télécharger`
- ❌ 不应该看到：`Enter YouTube or TikTok Link`, `Extract Subtitles`

**检查点**:
- [ ] 输入框标签是法语
- [ ] 下拉菜单标签是法语
- [ ] 提取按钮是法语

---

### 步骤 6: 访问评论/反馈页面

**URL**: `http://localhost:3000/fr/feedback`

**预期结果**:
- ✅ 页面标题显示：`Commentaires`
- ✅ 表单按钮显示：`Soumettre`
- ✅ 输入框占位符是法语
- ❌ 不应该看到：`Feedback`, `Submit`

**检查点**:
- [ ] 页面标题是法语
- [ ] 表单按钮是法语
- [ ] 表单字段是法语

---

### 步骤 7: 检查付款相关按钮

**URL**: `http://localhost:3000/fr/pricing`

**操作**: 点击任意定价计划的按钮，查看付款模态框

**预期结果**:
- ✅ 模态框标题显示：`Choisir le mode de paiement`
- ✅ 按钮显示：`Annuler`, `Continuer`
- ❌ 不应该看到：`Choose Payment Method`, `Cancel`, `Continue`

**检查点**:
- [ ] 付款模态框标题是法语
- [ ] 所有按钮是法语

---

## 📊 测试结果记录

请在测试完成后填写以下信息：

### 测试时间
- 日期: ___________
- 时间: ___________

### 测试结果

| 步骤 | URL | 状态 | 法语文本 | 英语文本 | 备注 |
|------|-----|------|----------|----------|------|
| 1 | `/fr` | ⬜ Pass ⬜ Fail | ⬜ 是 ⬜ 否 | ⬜ 是 ⬜ 否 | |
| 2 | `/fr/sign-up` | ⬜ Pass ⬜ Fail | ⬜ 是 ⬜ 否 | ⬜ 是 ⬜ 否 | |
| 3 | `/fr/sign-in` | ⬜ Pass ⬜ Fail | ⬜ 是 ⬜ 否 | ⬜ 是 ⬜ 否 | |
| 4 | `/fr/pricing` | ⬜ Pass ⬜ Fail | ⬜ 是 ⬜ 否 | ⬜ 是 ⬜ 否 | |
| 5 | `/fr` | ⬜ Pass ⬜ Fail | ⬜ 是 ⬜ 否 | ⬜ 是 ⬜ 否 | |
| 6 | `/fr/feedback` | ⬜ Pass ⬜ Fail | ⬜ 是 ⬜ 否 | ⬜ 是 ⬜ 否 | |
| 7 | `/fr/pricing` (付款) | ⬜ Pass ⬜ Fail | ⬜ 是 ⬜ 否 | ⬜ 是 ⬜ 否 | |

### 总体评估

- **通过率**: _____%
- **主要问题**: 
  - 
  - 
  - 

### 截图

请为每个失败的步骤截图，保存到 `test-screenshots/` 目录。

---

## 🔍 故障排除

### 如果 URL `/fr` 被重定向

1. 检查 Middleware 日志
2. 验证 `src/middleware.ts` 中的路由逻辑
3. 检查浏览器控制台是否有错误

### 如果页面显示英语文本

1. 检查服务器控制台日志，查看消息加载情况
2. 验证 `src/config/locale/messages/fr/` 目录下的文件
3. 检查 `src/app/[locale]/layout.tsx` 中的 `getMessages()` 调用

### 如果语言切换不工作

1. 检查浏览器控制台的语言切换日志
2. 验证 `src/shared/blocks/common/locale-selector.tsx` 中的逻辑
3. 检查 URL 是否正确更新

---

**测试完成后，请将结果保存到 `test-reports/` 目录。**

