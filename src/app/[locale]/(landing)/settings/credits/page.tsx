import { getTranslations } from 'next-intl/server';

import { Empty } from '@/shared/blocks/common';
import { PanelCard } from '@/shared/blocks/panel';
import { TestimonialsList } from '@/shared/blocks/testimonials-list';
import {
  getRemainingCredits,
  getCreditUsageStats,
} from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';

export default async function CreditsPage() {
  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations('settings.credits');

  const remainingCredits = await getRemainingCredits(user.id);
  const creditStats = await getCreditUsageStats(user.id);

  return (
    <div className="space-y-8">
      <PanelCard
        title={t('view.title')}
        buttons={[
          {
            title: t('view.buttons.purchase'),
            url: '/pricing',
            target: '_blank',
            icon: 'Coins',
          },
        ]}
        className="max-w-md"
      >
        <div className="space-y-6">
          {/* Remaining Credits */}
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="text-muted-foreground text-sm mb-2">{t('view.remaining')}</div>
            <div className="text-primary text-5xl font-bold">
              {remainingCredits.toLocaleString()}
            </div>
            <div className="text-muted-foreground mt-2 text-sm">Credits</div>
          </div>
          
          {/* Usage Statistics */}
          {creditStats.totalGranted > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">{t('view.usage')}</span>
                <span className="text-2xl font-bold text-primary">
                  {creditStats.usagePercentage}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full transition-all duration-500 ${
                      creditStats.usagePercentage >= 90
                        ? 'bg-red-500'
                        : creditStats.usagePercentage >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${creditStats.usagePercentage}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground">{t('view.used')}</div>
                    <div className="font-semibold text-foreground">
                      {creditStats.totalConsumed.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">{t('view.remaining')}</div>
                    <div className="font-semibold text-green-600">
                      {creditStats.remaining.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">{t('view.total')}</div>
                    <div className="font-semibold text-foreground">
                      {creditStats.totalGranted.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-muted-foreground text-sm">
                {t('view.no_credits') || 'No credits history'}
              </div>
            </div>
          )}
        </div>
      </PanelCard>
      
      {/* Customer Testimonials */}
      <div className="w-full">
        <TestimonialsList limit={20} />
      </div>
    </div>
  );
}
