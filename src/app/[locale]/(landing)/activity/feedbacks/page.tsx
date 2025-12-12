import { getTranslations } from 'next-intl/server';

import { Empty } from '@/shared/blocks/common';
import { TableCard } from '@/shared/blocks/table';
import { getUserInfo } from '@/shared/models/user';
import { getTasks, getTasksCount } from '@/shared/models/task';
import { Tab } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function FeedbacksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: number; pageSize?: number; status?: string }>;
}) {
  const { page: pageNum, pageSize, status } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 20;

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations('activity');

  const total = await getTasksCount({
    userId: user.id,
    status,
  });

  const tasks = await getTasks({
    userId: user.id,
    status,
    page,
    limit,
  });

  const table: Table = {
    title: t('feedbacks.title'),
    columns: [
      {
        name: 'platform',
        title: t('feedbacks.fields.platform'),
        type: 'label',
      },
      {
        name: 'status',
        title: t('feedbacks.fields.status'),
        type: 'label',
        metadata: { variant: 'outline' },
      },
      {
        name: 'serviceType',
        title: t('feedbacks.fields.service_type'),
        type: 'label',
        placeholder: '-',
      },
      {
        name: 'videoTitle',
        title: t('feedbacks.fields.video_title'),
        placeholder: '-',
      },
      {
        name: 'videoAuthor',
        title: t('feedbacks.fields.video_author'),
        placeholder: '-',
      },
      {
        title: t('feedbacks.fields.stats'),
        callback: (item) => {
          const stats = [];
          if (item.viewCount) stats.push(`Views: ${item.viewCount}`);
          if (item.likeCount) stats.push(`Likes: ${item.likeCount}`);
          if (item.shareCount) stats.push(`Shares: ${item.shareCount}`);
          return stats.length > 0 ? <div className="text-sm">{stats.join(', ')}</div> : '-';
        },
      },
      {
        name: 'createdAt',
        title: t('feedbacks.fields.created_at'),
        type: 'time',
      },
      {
        name: 'action',
        title: t('feedbacks.fields.action'),
        type: 'dropdown',
        callback: (item) => {
          const actions = [];
          if (item.originalSrtUrl) {
            actions.push({
              title: t('feedbacks.actions.download_srt'),
              url: item.originalSrtUrl,
              target: '_blank',
              icon: 'Download',
            });
          }
          if (item.videoUrl) {
            actions.push({
              title: t('feedbacks.actions.download_video'),
              url: item.videoUrl,
              target: '_blank',
              icon: 'Video',
            });
          }
          return actions;
        },
      },
    ],
    data: tasks,
    emptyMessage: t('feedbacks.empty_message'),
    pagination: {
      total,
      page,
      limit,
    },
  };

  const tabs: Tab[] = [
    {
      title: t('feedbacks.tabs.all'),
      name: 'all',
      url: '/activity/feedbacks',
      is_active: !status || status === 'all',
    },
    {
      title: t('feedbacks.tabs.completed'),
      name: 'completed',
      url: '/activity/feedbacks?status=completed',
      is_active: status === 'completed',
    },
    {
      title: t('feedbacks.tabs.failed'),
      name: 'failed',
      url: '/activity/feedbacks?status=failed',
      is_active: status === 'failed',
    },
    {
      title: t('feedbacks.tabs.pending'),
      name: 'pending',
      url: '/activity/feedbacks?status=pending',
      is_active: status === 'pending',
    },
  ];

  return (
    <div className="space-y-8">
      <TableCard title={t('feedbacks.title')} tabs={tabs} table={table} />
    </div>
  );
}
