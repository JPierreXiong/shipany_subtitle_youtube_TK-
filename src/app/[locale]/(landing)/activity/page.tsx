import { getTranslations } from 'next-intl/server';

import { Empty } from '@/shared/blocks/common';
import { PanelCard } from '@/shared/blocks/panel';
import { getUserInfo } from '@/shared/models/user';
import { getTaskStatistics } from '@/shared/models/task';

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getUserInfo();
  
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations('activity');
  const stats = await getTaskStatistics(user.id);

  const pendingCount = stats.pending + stats.processing;
  const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const failureRate = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;
  const completionRate = stats.total > 0 ? Math.round(((stats.completed + stats.failed) / stats.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Overview Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PanelCard title={t('stats.total')} className="max-w-md">
          <div className="space-y-2">
            <div className="text-primary text-4xl font-bold">{stats.total.toLocaleString()}</div>
            <div className="text-muted-foreground text-sm">{t('stats.total_description')}</div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active: {pendingCount}</span>
                <span>Completed: {completionRate}%</span>
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard title={t('stats.completed')} className="max-w-md">
          <div className="space-y-2">
            <div className="text-green-600 dark:text-green-400 text-4xl font-bold">
              {stats.completed.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">{t('stats.completed_description')}</div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-green-600">{successRate}%</span>
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard title={t('stats.failed')} className="max-w-md">
          <div className="space-y-2">
            <div className="text-red-600 dark:text-red-400 text-4xl font-bold">
              {stats.failed.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">{t('stats.failed_description')}</div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${failureRate}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-red-600">{failureRate}%</span>
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard title={t('stats.in_progress')} className="max-w-md">
          <div className="space-y-2">
            <div className="text-blue-600 dark:text-blue-400 text-4xl font-bold">
              {pendingCount.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">{t('stats.in_progress_description')}</div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Pending: {stats.pending}</span>
                <span>Processing: {stats.processing}</span>
              </div>
            </div>
          </div>
        </PanelCard>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PanelCard title={t('stats.downloadable_files')} className="max-w-md">
          <div className="space-y-3">
            <div className="text-purple-600 dark:text-purple-400 text-4xl font-bold">
              {stats.downloadCount.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">{t('stats.downloadable_files_description')}</div>
            {stats.completed > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  {Math.round((stats.downloadCount / stats.completed) * 100)}% of completed tasks have downloadable files
                </div>
              </div>
            )}
          </div>
        </PanelCard>

        <PanelCard title={t('stats.storage_used')} className="max-w-md">
          <div className="space-y-3">
            <div className="text-orange-600 dark:text-orange-400 text-4xl font-bold">
              {stats.totalStorageMB.toLocaleString()} <span className="text-xl">MB</span>
            </div>
            <div className="text-muted-foreground text-sm">{t('stats.storage_used_description')}</div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Average: {stats.completed > 0 ? (stats.totalStorageMB / stats.completed).toFixed(2) : 0} MB per file
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard title={t('stats.usage_rate')} className="max-w-md">
          <div className="space-y-4">
            <div className="text-indigo-600 dark:text-indigo-400 text-4xl font-bold">
              {completionRate}%
            </div>
            <div className="space-y-2">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full transition-all duration-500 ${
                    completionRate >= 80
                      ? 'bg-green-500'
                      : completionRate >= 50
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">Success</div>
                  <div className="font-semibold text-green-600">{successRate}%</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Failed</div>
                  <div className="font-semibold text-red-600">{failureRate}%</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Pending</div>
                  <div className="font-semibold text-blue-600">
                    {stats.total > 0 ? Math.round((pendingCount / stats.total) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
            <div className="text-muted-foreground text-sm">{t('stats.usage_rate_description')}</div>
          </div>
        </PanelCard>
      </div>

      {/* Summary Card */}
      <PanelCard title="Usage Summary" className="max-w-full">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
            <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.completed} successful out of {stats.total} total
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
            <div className="text-sm text-muted-foreground mb-1">Downloadable Files</div>
            <div className="text-2xl font-bold text-blue-600">{stats.downloadCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Ready for download
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
            <div className="text-sm text-muted-foreground mb-1">Storage Used</div>
            <div className="text-2xl font-bold text-orange-600">{stats.totalStorageMB} MB</div>
            <div className="text-xs text-muted-foreground mt-1">
              Estimated storage space
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
            <div className="text-sm text-muted-foreground mb-1">Overall Completion</div>
            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Tasks completed or failed
            </div>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
