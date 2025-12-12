import moment from 'moment';
import { getTranslations } from 'next-intl/server';

import { Empty } from '@/shared/blocks/common';
import { FormCard } from '@/shared/blocks/form';
import { PanelCard } from '@/shared/blocks/panel';
import { getUserInfo, UpdateUser, updateUser } from '@/shared/models/user';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { getTaskStatistics } from '@/shared/models/task';
import { Form as FormType } from '@/shared/types/blocks/form';

export default async function ProfilePage() {
  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations('settings.profile');
  const currentSubscription = await getCurrentSubscription(user.id);
  const taskStats = await getTaskStatistics(user.id);

  const form: FormType = {
    fields: [
      {
        name: 'email',
        title: t('fields.email'),
        type: 'email',
        attributes: { disabled: true },
      },
      { name: 'name', title: t('fields.name'), type: 'text' },
      {
        name: 'image',
        title: t('fields.avatar'),
        type: 'upload_image',
        metadata: {
          max: 1,
        },
      },
    ],
    data: user,
    passby: {
      user: user,
    },
    submit: {
      handler: async (data: FormData, passby: any) => {
        'use server';

        const { user } = passby;
        if (!user) {
          throw new Error('no auth');
        }

        const name = data.get('name') as string;
        if (!name?.trim()) {
          throw new Error('name is required');
        }

        const image = data.get('image');
        console.log('image', image, typeof image);

        const updatedUser: UpdateUser = {
          name: name.trim(),
          image: image as string,
        };

        await updateUser(user.id, updatedUser);

        return {
          status: 'success',
          message: 'Profile updated',
          redirect_url: '/settings/profile',
        };
      },
      button: {
        title: t('edit.buttons.submit'),
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* User Information Panel */}
      <PanelCard
        title={t('info.title')}
        className="max-w-2xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-muted-foreground text-sm">{t('info.customer_id')}</div>
            <div className="text-foreground mt-1 font-semibold">
              {user.customerId || t('info.not_assigned')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">{t('info.email')}</div>
            <div className="text-foreground mt-1">{user.email}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">{t('info.member_since')}</div>
            <div className="text-foreground mt-1 font-semibold">
              {moment(user.createdAt).format('YYYY-MM-DD HH:mm')}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              {moment(user.createdAt).fromNow()}
            </div>
          </div>
          {user.subscriptionExpiresAt && (
            <div>
              <div className="text-muted-foreground text-sm">{t('info.subscription_expires')}</div>
              <div className="text-foreground mt-1">
                {moment(user.subscriptionExpiresAt).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
          )}
          <div>
            <div className="text-muted-foreground text-sm">{t('info.current_plan')}</div>
            <div className="text-primary mt-1 font-semibold text-lg">
              {currentSubscription?.planName || t('info.no_plan')}
            </div>
            {currentSubscription && (
              <div className="text-muted-foreground mt-1 text-xs">
                {currentSubscription.status === 'active' ? 'Active' : currentSubscription.status}
              </div>
            )}
          </div>
          {user.referrerId && (
            <div>
              <div className="text-muted-foreground text-sm">{t('info.referred_by')}</div>
              <div className="text-foreground mt-1">{user.referrerId}</div>
            </div>
          )}
        </div>
      </PanelCard>

      {/* Usage Statistics Panel */}
      <PanelCard
        title={t('stats.title')}
        className="max-w-2xl"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-muted-foreground text-sm mb-2">{t('stats.total_tasks')}</div>
            <div className="text-primary text-3xl font-bold">{taskStats.total}</div>
            <div className="text-muted-foreground mt-1 text-xs">Total usage</div>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="text-muted-foreground text-sm mb-2">{t('stats.completed_tasks')}</div>
            <div className="text-green-600 dark:text-green-400 text-3xl font-bold">{taskStats.completed}</div>
            <div className="text-muted-foreground mt-1 text-xs">
              {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% success rate
            </div>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="text-muted-foreground text-sm mb-2">{t('stats.failed_tasks')}</div>
            <div className="text-red-600 dark:text-red-400 text-3xl font-bold">{taskStats.failed}</div>
            <div className="text-muted-foreground mt-1 text-xs">
              {taskStats.total > 0 ? Math.round((taskStats.failed / taskStats.total) * 100) : 0}% failure rate
            </div>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="text-muted-foreground text-sm mb-2">{t('stats.download_count')}</div>
            <div className="text-blue-600 dark:text-blue-400 text-3xl font-bold">{taskStats.downloadCount}</div>
            <div className="text-muted-foreground mt-1 text-xs">Files available</div>
          </div>
        </div>
      </PanelCard>

      {/* Profile Edit Form */}
      <FormCard
        title={t('edit.title')}
        description={t('edit.description')}
        form={form}
      />
    </div>
  );
}
