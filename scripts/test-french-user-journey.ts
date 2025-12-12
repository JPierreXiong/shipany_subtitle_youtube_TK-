/**
 * 法国用户完整旅程自动化测试
 * 测试从注册、登录、定价、提取、评论到付款的完整流程
 * 验证所有按钮和界面元素是否为法语
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  screenshots?: string[];
  frenchTexts?: string[];
  englishTexts?: string[];
}

interface TestReport {
  timestamp: string;
  locale: string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  results: TestResult[];
  summary: {
    frenchLocalization: {
      total: number;
      passed: number;
      failed: number;
    };
    userJourney: {
      total: number;
      passed: number;
      failed: number;
    };
  };
}

// 法语翻译对照表
const FRENCH_TEXTS = {
  signUp: ['S\'inscrire', 'Créer un compte', 'Email', 'Mot de passe', 'Continuer'],
  signIn: ['Se connecter', 'Connectez-vous à votre compte', 'Se connecter avec Email', 'Se connecter avec Google'],
  pricing: ['Tarifs', 'Commencer gratuitement', 'Mettre à niveau', 'Passer à Premium', 'Paiement à l\'usage', 'Mensuel'],
  extract: ['Entrez le lien YouTube ou TikTok', 'Extraire les sous-titres', 'Télécharger', 'Langue native', 'Langue de traduction'],
  testimonial: ['Commentaires', 'Soumettre', 'Message'],
  payment: ['Choisir le mode de paiement', 'Annuler', 'Continuer'],
  navigation: ['Tarifs', 'Commentaires', 'Se déconnecter', 'Facturation']
};

// 英语文本（不应该出现）
const ENGLISH_TEXTS = {
  signUp: ['Sign Up', 'Create an account', 'Email', 'Password', 'Continue'],
  signIn: ['Sign In', 'Sign in to your account', 'Sign in with Email', 'Sign in with Google'],
  pricing: ['Pricing', 'Get Started', 'Upgrade', 'Go Premium', 'Pay as you go', 'Monthly'],
  extract: ['Enter YouTube or TikTok Link', 'Extract Subtitles', 'Download', 'Native Language', 'Translation Language'],
  testimonial: ['Feedback', 'Submit', 'Message'],
  payment: ['Choose Payment Method', 'Cancel', 'Continue'],
  navigation: ['Pricing', 'Feedback', 'Sign Out', 'Billing']
};

class FrenchUserJourneyTest {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];
  private baseUrl: string;
  private screenshotsDir: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.screenshotsDir = path.join(process.cwd(), 'test-screenshots');
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  async init() {
    const headless = process.env.TEST_HEADLESS === 'true';
    this.browser = await chromium.launch({ headless });
    const context = await this.browser.newContext({
      locale: 'fr-FR',
      viewport: { width: 1920, height: 1080 }
    });
    this.page = await context.newPage();
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }

  async takeScreenshot(name: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    const filename = `${Date.now()}-${name}.png`;
    const filepath = path.join(this.screenshotsDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  async checkFrenchTexts(expectedTexts: string[], stepName: string): Promise<{ found: string[], missing: string[] }> {
    if (!this.page) throw new Error('Page not initialized');
    const pageContent = await this.page.content();
    const pageText = await this.page.textContent('body') || '';
    
    const found: string[] = [];
    const missing: string[] = [];

    for (const text of expectedTexts) {
      if (pageText.includes(text) || pageContent.includes(text)) {
        found.push(text);
      } else {
        missing.push(text);
      }
    }

    return { found, missing };
  }

  async checkEnglishTexts(englishTexts: string[], stepName: string): Promise<string[]> {
    if (!this.page) throw new Error('Page not initialized');
    const pageText = await this.page.textContent('body') || '';
    const found: string[] = [];

    for (const text of englishTexts) {
      if (pageText.includes(text)) {
        found.push(text);
      }
    }

    return found;
  }

  async recordResult(step: string, status: 'pass' | 'fail' | 'skip', message: string, screenshots?: string[], frenchTexts?: string[], englishTexts?: string[]) {
    this.results.push({
      step,
      status,
      message,
      screenshots,
      frenchTexts,
      englishTexts
    });
    console.log(`[${status.toUpperCase()}] ${step}: ${message}`);
  }

  // 步骤1: 访问首页并切换到法语
  async step1_VisitHomepageAndSwitchToFrench(): Promise<void> {
    const stepName = '1. 访问首页并切换到法语';
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.goto(`${this.baseUrl}/fr`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);
      
      const screenshot = await this.takeScreenshot('01-homepage-fr');
      
      // 检查URL是否包含 /fr
      const url = this.page.url();
      if (!url.includes('/fr')) {
        throw new Error(`URL should contain /fr, but got: ${url}`);
      }

      // 检查法语文本
      const { found, missing } = await this.checkFrenchTexts(FRENCH_TEXTS.navigation, stepName);
      const englishFound = await this.checkEnglishTexts(ENGLISH_TEXTS.navigation, stepName);

      if (missing.length === 0 && englishFound.length === 0) {
        await this.recordResult(stepName, 'pass', '成功切换到法语，导航菜单显示法语', [screenshot], found);
      } else {
        await this.recordResult(stepName, 'fail', `缺少法语文本: ${missing.join(', ')}; 发现英语文本: ${englishFound.join(', ')}`, [screenshot], found, englishFound);
      }
    } catch (error: any) {
      const screenshot = await this.takeScreenshot('01-error');
      await this.recordResult(stepName, 'fail', `错误: ${error.message}`, [screenshot]);
    }
  }

  // 步骤2: 访问注册页面
  async step2_VisitSignUpPage(): Promise<void> {
    const stepName = '2. 访问注册页面';
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      // 查找并点击注册按钮
      const signUpButton = await this.page.locator('text=S\'inscrire').first();
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
      } else {
        // 尝试其他可能的注册按钮文本
        const altSignUp = await this.page.locator('text=Créer un compte').first();
        if (await altSignUp.isVisible()) {
          await altSignUp.click();
        } else {
          // 直接导航到注册页面
          await this.page.goto(`${this.baseUrl}/fr/sign-up`, { waitUntil: 'networkidle' });
        }
      }
      
      await this.page.waitForTimeout(2000);
      const screenshot = await this.takeScreenshot('02-signup-page');

      // 检查注册页面的法语文本
      const { found, missing } = await this.checkFrenchTexts(FRENCH_TEXTS.signUp, stepName);
      const englishFound = await this.checkEnglishTexts(ENGLISH_TEXTS.signUp, stepName);

      if (missing.length === 0 && englishFound.length === 0) {
        await this.recordResult(stepName, 'pass', '注册页面正确显示法语', [screenshot], found);
      } else {
        await this.recordResult(stepName, 'fail', `缺少法语文本: ${missing.join(', ')}; 发现英语文本: ${englishFound.join(', ')}`, [screenshot], found, englishFound);
      }
    } catch (error: any) {
      const screenshot = await this.takeScreenshot('02-error');
      await this.recordResult(stepName, 'fail', `错误: ${error.message}`, [screenshot]);
    }
  }

  // 步骤3: 访问登录页面
  async step3_VisitSignInPage(): Promise<void> {
    const stepName = '3. 访问登录页面';
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.goto(`${this.baseUrl}/fr/sign-in`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);
      const screenshot = await this.takeScreenshot('03-signin-page');

      // 检查登录页面的法语文本
      const { found, missing } = await this.checkFrenchTexts(FRENCH_TEXTS.signIn, stepName);
      const englishFound = await this.checkEnglishTexts(ENGLISH_TEXTS.signIn, stepName);

      if (missing.length === 0 && englishFound.length === 0) {
        await this.recordResult(stepName, 'pass', '登录页面正确显示法语', [screenshot], found);
      } else {
        await this.recordResult(stepName, 'fail', `缺少法语文本: ${missing.join(', ')}; 发现英语文本: ${englishFound.join(', ')}`, [screenshot], found, englishFound);
      }
    } catch (error: any) {
      const screenshot = await this.takeScreenshot('03-error');
      await this.recordResult(stepName, 'fail', `错误: ${error.message}`, [screenshot]);
    }
  }

  // 步骤4: 访问定价页面
  async step4_VisitPricingPage(): Promise<void> {
    const stepName = '4. 访问定价页面';
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.goto(`${this.baseUrl}/fr/pricing`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);
      const screenshot = await this.takeScreenshot('04-pricing-page');

      // 检查定价页面的法语文本
      const { found, missing } = await this.checkFrenchTexts(FRENCH_TEXTS.pricing, stepName);
      const englishFound = await this.checkEnglishTexts(ENGLISH_TEXTS.pricing, stepName);

      if (missing.length === 0 && englishFound.length === 0) {
        await this.recordResult(stepName, 'pass', '定价页面正确显示法语', [screenshot], found);
      } else {
        await this.recordResult(stepName, 'fail', `缺少法语文本: ${missing.join(', ')}; 发现英语文本: ${englishFound.join(', ')}`, [screenshot], found, englishFound);
      }
    } catch (error: any) {
      const screenshot = await this.takeScreenshot('04-error');
      await this.recordResult(stepName, 'fail', `错误: ${error.message}`, [screenshot]);
    }
  }

  // 步骤5: 访问提取页面（字幕提取）
  async step5_VisitExtractPage(): Promise<void> {
    const stepName = '5. 访问字幕提取页面';
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.goto(`${this.baseUrl}/fr`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);
      const screenshot = await this.takeScreenshot('05-extract-page');

      // 检查提取页面的法语文本
      const { found, missing } = await this.checkFrenchTexts(FRENCH_TEXTS.extract, stepName);
      const englishFound = await this.checkEnglishTexts(ENGLISH_TEXTS.extract, stepName);

      if (missing.length === 0 && englishFound.length === 0) {
        await this.recordResult(stepName, 'pass', '提取页面正确显示法语', [screenshot], found);
      } else {
        await this.recordResult(stepName, 'fail', `缺少法语文本: ${missing.join(', ')}; 发现英语文本: ${englishFound.join(', ')}`, [screenshot], found, englishFound);
      }
    } catch (error: any) {
      const screenshot = await this.takeScreenshot('05-error');
      await this.recordResult(stepName, 'fail', `错误: ${error.message}`, [screenshot]);
    }
  }

  // 步骤6: 访问评论页面
  async step6_VisitTestimonialPage(): Promise<void> {
    const stepName = '6. 访问评论/反馈页面';
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.goto(`${this.baseUrl}/fr/feedback`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);
      const screenshot = await this.takeScreenshot('06-testimonial-page');

      // 检查评论页面的法语文本
      const { found, missing } = await this.checkFrenchTexts(FRENCH_TEXTS.testimonial, stepName);
      const englishFound = await this.checkEnglishTexts(ENGLISH_TEXTS.testimonial, stepName);

      if (missing.length === 0 && englishFound.length === 0) {
        await this.recordResult(stepName, 'pass', '评论页面正确显示法语', [screenshot], found);
      } else {
        await this.recordResult(stepName, 'fail', `缺少法语文本: ${missing.join(', ')}; 发现英语文本: ${englishFound.join(', ')}`, [screenshot], found, englishFound);
      }
    } catch (error: any) {
      const screenshot = await this.takeScreenshot('06-error');
      await this.recordResult(stepName, 'fail', `错误: ${error.message}`, [screenshot]);
    }
  }

  // 步骤7: 检查付款相关按钮
  async step7_CheckPaymentButtons(): Promise<void> {
    const stepName = '7. 检查付款相关按钮';
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      // 回到定价页面检查付款按钮
      await this.page.goto(`${this.baseUrl}/fr/pricing`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);
      const screenshot = await this.takeScreenshot('07-payment-buttons');

      // 检查付款相关的法语文本
      const { found, missing } = await this.checkFrenchTexts(FRENCH_TEXTS.payment, stepName);
      const englishFound = await this.checkEnglishTexts(ENGLISH_TEXTS.payment, stepName);

      if (missing.length === 0 && englishFound.length === 0) {
        await this.recordResult(stepName, 'pass', '付款按钮正确显示法语', [screenshot], found);
      } else {
        await this.recordResult(stepName, 'fail', `缺少法语文本: ${missing.join(', ')}; 发现英语文本: ${englishFound.join(', ')}`, [screenshot], found, englishFound);
      }
    } catch (error: any) {
      const screenshot = await this.takeScreenshot('07-error');
      await this.recordResult(stepName, 'fail', `错误: ${error.message}`, [screenshot]);
    }
  }

  // 生成测试报告
  generateReport(): TestReport {
    const passedSteps = this.results.filter(r => r.status === 'pass').length;
    const failedSteps = this.results.filter(r => r.status === 'fail').length;
    const skippedSteps = this.results.filter(r => r.status === 'skip').length;

    const frenchLocalizationResults = this.results.filter(r => r.frenchTexts || r.englishTexts);
    const frenchPassed = frenchLocalizationResults.filter(r => r.status === 'pass').length;
    const frenchFailed = frenchLocalizationResults.filter(r => r.status === 'fail').length;

    const userJourneyResults = this.results;
    const journeyPassed = userJourneyResults.filter(r => r.status === 'pass').length;
    const journeyFailed = userJourneyResults.filter(r => r.status === 'fail').length;

    return {
      timestamp: new Date().toISOString(),
      locale: 'fr',
      totalSteps: this.results.length,
      passedSteps,
      failedSteps,
      skippedSteps,
      results: this.results,
      summary: {
        frenchLocalization: {
          total: frenchLocalizationResults.length,
          passed: frenchPassed,
          failed: frenchFailed
        },
        userJourney: {
          total: userJourneyResults.length,
          passed: journeyPassed,
          failed: journeyFailed
        }
      }
    };
  }

  async saveReport(report: TestReport): Promise<string> {
    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `french-user-journey-test-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 同时生成 Markdown 格式的报告
    const markdownPath = path.join(reportDir, `french-user-journey-test-${timestamp}.md`);
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(markdownPath, markdown);

    return markdownPath;
  }

  generateMarkdownReport(report: TestReport): string {
    let md = `# 法国用户旅程测试报告\n\n`;
    md += `**测试时间**: ${new Date(report.timestamp).toLocaleString('zh-CN')}\n`;
    md += `**测试语言**: ${report.locale.toUpperCase()}\n\n`;
    
    md += `## 测试摘要\n\n`;
    md += `- **总步骤数**: ${report.totalSteps}\n`;
    md += `- **通过**: ${report.passedSteps} ✅\n`;
    md += `- **失败**: ${report.failedSteps} ❌\n`;
    md += `- **跳过**: ${report.skippedSteps} ⏭️\n\n`;
    
    md += `### 法语本地化测试\n\n`;
    md += `- **总数**: ${report.summary.frenchLocalization.total}\n`;
    md += `- **通过**: ${report.summary.frenchLocalization.passed} ✅\n`;
    md += `- **失败**: ${report.summary.frenchLocalization.failed} ❌\n\n`;
    
    md += `### 用户旅程测试\n\n`;
    md += `- **总数**: ${report.summary.userJourney.total}\n`;
    md += `- **通过**: ${report.summary.userJourney.passed} ✅\n`;
    md += `- **失败**: ${report.summary.userJourney.failed} ❌\n\n`;
    
    md += `## 详细测试结果\n\n`;
    
    report.results.forEach((result, index) => {
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      md += `### ${index + 1}. ${result.step} ${statusIcon}\n\n`;
      md += `**状态**: ${result.status}\n\n`;
      md += `**消息**: ${result.message}\n\n`;
      
      if (result.frenchTexts && result.frenchTexts.length > 0) {
        md += `**发现的法语文本**:\n`;
        result.frenchTexts.forEach(text => {
          md += `- ${text}\n`;
        });
        md += `\n`;
      }
      
      if (result.englishTexts && result.englishTexts.length > 0) {
        md += `**⚠️ 发现的英语文本（不应该出现）**:\n`;
        result.englishTexts.forEach(text => {
          md += `- ${text}\n`;
        });
        md += `\n`;
      }
      
      if (result.screenshots && result.screenshots.length > 0) {
        md += `**截图**:\n`;
        result.screenshots.forEach(screenshot => {
          const relativePath = path.relative(process.cwd(), screenshot);
          md += `- \`${relativePath}\`\n`;
        });
        md += `\n`;
      }
      
      md += `---\n\n`;
    });
    
    md += `## 总结\n\n`;
    const passRate = ((report.passedSteps / report.totalSteps) * 100).toFixed(2);
    md += `**总体通过率**: ${passRate}%\n\n`;
    
    if (report.failedSteps === 0) {
      md += `🎉 **所有测试通过！** 法国用户的完整旅程测试成功，所有按钮和界面元素都正确显示为法语。\n`;
    } else {
      md += `⚠️ **有 ${report.failedSteps} 个测试失败**，需要检查并修复相关问题。\n`;
    }
    
    return md;
  }

  async run(): Promise<string> {
    console.log('🚀 开始法国用户旅程测试...\n');
    
    try {
      await this.init();
      
      await this.step1_VisitHomepageAndSwitchToFrench();
      await this.step2_VisitSignUpPage();
      await this.step3_VisitSignInPage();
      await this.step4_VisitPricingPage();
      await this.step5_VisitExtractPage();
      await this.step6_VisitTestimonialPage();
      await this.step7_CheckPaymentButtons();
      
      const report = this.generateReport();
      const reportPath = await this.saveReport(report);
      
      console.log(`\n✅ 测试完成！报告已保存到: ${reportPath}`);
      
      return reportPath;
    } catch (error: any) {
      console.error('❌ 测试过程中发生错误:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// 主函数
async function main() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  console.log(`测试基础URL: ${baseUrl}\n`);
  
  const test = new FrenchUserJourneyTest(baseUrl);
  try {
    const reportPath = await test.run();
    console.log(`\n📊 查看测试报告: ${reportPath}`);
    process.exit(0);
  } catch (error: any) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

export { FrenchUserJourneyTest };

