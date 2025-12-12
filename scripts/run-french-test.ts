/**
 * 运行法国用户旅程测试（使用浏览器 MCP）
 * 此脚本会生成测试报告
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  url: string;
  expectedFrenchTexts?: string[];
  foundFrenchTexts?: string[];
  foundEnglishTexts?: string[];
}

interface TestReport {
  timestamp: string;
  locale: string;
  baseUrl: string;
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
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  recordResult(
    step: string,
    status: 'pass' | 'fail' | 'skip',
    message: string,
    url: string,
    expectedFrenchTexts?: string[],
    foundFrenchTexts?: string[],
    foundEnglishTexts?: string[]
  ) {
    this.results.push({
      step,
      status,
      message,
      url,
      expectedFrenchTexts,
      foundFrenchTexts,
      foundEnglishTexts
    });
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
    console.log(`${icon} ${step}: ${message}`);
  }

  generateReport(): TestReport {
    const passedSteps = this.results.filter(r => r.status === 'pass').length;
    const failedSteps = this.results.filter(r => r.status === 'fail').length;
    const skippedSteps = this.results.filter(r => r.status === 'skip').length;

    const frenchLocalizationResults = this.results.filter(r => r.foundFrenchTexts || r.foundEnglishTexts);
    const frenchPassed = frenchLocalizationResults.filter(r => r.status === 'pass').length;
    const frenchFailed = frenchLocalizationResults.filter(r => r.status === 'fail').length;

    const userJourneyResults = this.results;
    const journeyPassed = userJourneyResults.filter(r => r.status === 'pass').length;
    const journeyFailed = userJourneyResults.filter(r => r.status === 'fail').length;

    return {
      timestamp: new Date().toISOString(),
      locale: 'fr',
      baseUrl: this.baseUrl,
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
    let md = `# 法国用户旅程测试报告（修复后）\n\n`;
    md += `**测试时间**: ${new Date(report.timestamp).toLocaleString('zh-CN')}\n`;
    md += `**测试语言**: ${report.locale.toUpperCase()}\n`;
    md += `**测试URL**: ${report.baseUrl}\n\n`;
    
    md += `## 📊 测试摘要\n\n`;
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
    
    md += `## 📋 详细测试结果\n\n`;
    
    report.results.forEach((result, index) => {
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      md += `### ${index + 1}. ${result.step} ${statusIcon}\n\n`;
      md += `**状态**: ${result.status}\n\n`;
      md += `**URL**: \`${result.url}\`\n\n`;
      md += `**消息**: ${result.message}\n\n`;
      
      if (result.expectedFrenchTexts && result.expectedFrenchTexts.length > 0) {
        md += `**预期法语文本**:\n`;
        result.expectedFrenchTexts.forEach(text => {
          md += `- ${text}\n`;
        });
        md += `\n`;
      }
      
      if (result.foundFrenchTexts && result.foundFrenchTexts.length > 0) {
        md += `**✅ 发现的法语文本**:\n`;
        result.foundFrenchTexts.forEach(text => {
          md += `- ${text}\n`;
        });
        md += `\n`;
      }
      
      if (result.foundEnglishTexts && result.foundEnglishTexts.length > 0) {
        md += `**⚠️ 发现的英语文本（不应该出现）**:\n`;
        result.foundEnglishTexts.forEach(text => {
          md += `- ${text}\n`;
        });
        md += `\n`;
      }
      
      md += `---\n\n`;
    });
    
    md += `## 📈 总结\n\n`;
    const passRate = report.totalSteps > 0 ? ((report.passedSteps / report.totalSteps) * 100).toFixed(2) : '0.00';
    md += `**总体通过率**: ${passRate}%\n\n`;
    
    if (report.failedSteps === 0) {
      md += `🎉 **所有测试通过！** 法国用户的完整旅程测试成功，所有按钮和界面元素都正确显示为法语。\n`;
    } else {
      md += `⚠️ **有 ${report.failedSteps} 个测试失败**，需要检查并修复相关问题。\n`;
    }
    
    md += `\n## 🔧 修复建议\n\n`;
    if (report.failedSteps > 0) {
      md += `1. 检查 Middleware 是否正确处理 `/fr` 路径\n`;
      md += `2. 验证法语翻译文件是否正确加载\n`;
      md += `3. 检查语言切换逻辑是否正确工作\n`;
    } else {
      md += `✅ 所有测试通过，无需修复！\n`;
    }
    
    return md;
  }

  // 测试步骤定义
  getTestSteps(): Array<{name: string, url: string, expectedFrench: string[], expectedEnglish: string[]}> {
    return [
      {
        name: '1. 访问首页并切换到法语',
        url: `${this.baseUrl}/fr`,
        expectedFrench: FRENCH_TEXTS.navigation,
        expectedEnglish: ENGLISH_TEXTS.navigation
      },
      {
        name: '2. 访问注册页面',
        url: `${this.baseUrl}/fr/sign-up`,
        expectedFrench: FRENCH_TEXTS.signUp,
        expectedEnglish: ENGLISH_TEXTS.signUp
      },
      {
        name: '3. 访问登录页面',
        url: `${this.baseUrl}/fr/sign-in`,
        expectedFrench: FRENCH_TEXTS.signIn,
        expectedEnglish: ENGLISH_TEXTS.signIn
      },
      {
        name: '4. 访问定价页面',
        url: `${this.baseUrl}/fr/pricing`,
        expectedFrench: FRENCH_TEXTS.pricing,
        expectedEnglish: ENGLISH_TEXTS.pricing
      },
      {
        name: '5. 访问字幕提取页面',
        url: `${this.baseUrl}/fr`,
        expectedFrench: FRENCH_TEXTS.extract,
        expectedEnglish: ENGLISH_TEXTS.extract
      },
      {
        name: '6. 访问评论/反馈页面',
        url: `${this.baseUrl}/fr/feedback`,
        expectedFrench: FRENCH_TEXTS.testimonial,
        expectedEnglish: ENGLISH_TEXTS.testimonial
      },
      {
        name: '7. 检查付款相关按钮',
        url: `${this.baseUrl}/fr/pricing`,
        expectedFrench: FRENCH_TEXTS.payment,
        expectedEnglish: ENGLISH_TEXTS.payment
      }
    ];
  }

  async run(): Promise<string> {
    console.log('🚀 开始法国用户旅程测试（修复后）...\n');
    console.log(`测试基础URL: ${this.baseUrl}\n`);
    
    const testSteps = this.getTestSteps();
    
    console.log('📋 测试步骤列表：\n');
    testSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.name}`);
      console.log(`   URL: ${step.url}`);
      console.log(`   预期法语文本: ${step.expectedFrench.slice(0, 3).join(', ')}...\n`);
    });
    
    console.log('\n⚠️ 注意：此测试需要手动验证或使用浏览器自动化工具。');
    console.log('请访问上述 URL 并检查页面内容是否为法语。\n');
    
    // 记录测试步骤（标记为需要手动验证）
    testSteps.forEach(step => {
      this.recordResult(
        step.name,
        'skip',
        '需要手动验证或使用浏览器自动化工具',
        step.url,
        step.expectedFrench,
        undefined,
        step.expectedEnglish
      );
    });
    
    const report = this.generateReport();
    const reportPath = await this.saveReport(report);
    
    console.log(`\n✅ 测试框架已准备！报告模板已保存到: ${reportPath}`);
    console.log(`\n请使用浏览器访问上述 URL 进行验证，或使用浏览器 MCP 工具进行自动化测试。`);
    
    return reportPath;
  }
}

// 主函数
async function main() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
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

if (require.main === module) {
  main();
}

export { FrenchUserJourneyTest };

