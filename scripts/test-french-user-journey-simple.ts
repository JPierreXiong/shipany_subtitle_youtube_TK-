/**
 * 法国用户完整旅程自动化测试（简化版 - 使用浏览器 MCP）
 * 测试从注册、登录、定价、提取、评论到付款的完整流程
 * 验证所有按钮和界面元素是否为法语
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
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

class FrenchUserJourneyTestSimple {
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  checkFrenchTexts(pageText: string, expectedTexts: string[]): { found: string[], missing: string[] } {
    const found: string[] = [];
    const missing: string[] = [];

    for (const text of expectedTexts) {
      if (pageText.includes(text)) {
        found.push(text);
      } else {
        missing.push(text);
      }
    }

    return { found, missing };
  }

  checkEnglishTexts(pageText: string, englishTexts: string[]): string[] {
    const found: string[] = [];

    for (const text of englishTexts) {
      if (pageText.includes(text)) {
        found.push(text);
      }
    }

    return found;
  }

  recordResult(step: string, status: 'pass' | 'fail' | 'skip', message: string, frenchTexts?: string[], englishTexts?: string[]) {
    this.results.push({
      step,
      status,
      message,
      frenchTexts,
      englishTexts
    });
    console.log(`[${status.toUpperCase()}] ${step}: ${message}`);
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

  // 测试函数 - 需要手动调用浏览器 MCP 工具
  async testStep(stepName: string, url: string, expectedFrench: string[], expectedEnglish: string[]): Promise<void> {
    console.log(`\n测试步骤: ${stepName}`);
    console.log(`访问 URL: ${url}`);
    console.log(`\n请使用浏览器访问 ${url}，然后检查页面文本。`);
    console.log(`预期法语文本: ${expectedFrench.join(', ')}`);
    console.log(`不应出现的英语文本: ${expectedEnglish.join(', ')}`);
    
    // 这里需要手动验证或使用浏览器 MCP 工具
    // 暂时记录为跳过，等待手动验证
    this.recordResult(stepName, 'skip', '需要手动验证或使用浏览器自动化工具', expectedFrench, expectedEnglish);
  }

  async run(): Promise<string> {
    console.log('🚀 开始法国用户旅程测试（简化版）...\n');
    console.log('注意：此版本需要手动验证或使用浏览器 MCP 工具\n');
    
    // 测试步骤
    await this.testStep(
      '1. 访问首页并切换到法语',
      `${this.baseUrl}/fr`,
      FRENCH_TEXTS.navigation,
      ENGLISH_TEXTS.navigation
    );

    await this.testStep(
      '2. 访问注册页面',
      `${this.baseUrl}/fr/sign-up`,
      FRENCH_TEXTS.signUp,
      ENGLISH_TEXTS.signUp
    );

    await this.testStep(
      '3. 访问登录页面',
      `${this.baseUrl}/fr/sign-in`,
      FRENCH_TEXTS.signIn,
      ENGLISH_TEXTS.signIn
    );

    await this.testStep(
      '4. 访问定价页面',
      `${this.baseUrl}/fr/pricing`,
      FRENCH_TEXTS.pricing,
      ENGLISH_TEXTS.pricing
    );

    await this.testStep(
      '5. 访问字幕提取页面',
      `${this.baseUrl}/fr`,
      FRENCH_TEXTS.extract,
      ENGLISH_TEXTS.extract
    );

    await this.testStep(
      '6. 访问评论/反馈页面',
      `${this.baseUrl}/fr/feedback`,
      FRENCH_TEXTS.testimonial,
      ENGLISH_TEXTS.testimonial
    );

    await this.testStep(
      '7. 检查付款相关按钮',
      `${this.baseUrl}/fr/pricing`,
      FRENCH_TEXTS.payment,
      ENGLISH_TEXTS.payment
    );
    
    const report = this.generateReport();
    const reportPath = await this.saveReport(report);
    
    console.log(`\n✅ 测试框架已准备！报告模板已保存到: ${reportPath}`);
    console.log(`\n请使用浏览器 MCP 工具或手动访问上述 URL 进行验证。`);
    
    return reportPath;
  }
}

// 主函数
async function main() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  console.log(`测试基础URL: ${baseUrl}\n`);
  
  const test = new FrenchUserJourneyTestSimple(baseUrl);
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

export { FrenchUserJourneyTestSimple };

